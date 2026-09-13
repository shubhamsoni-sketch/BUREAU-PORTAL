import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migrationUrl = new URL(
  '../../supabase/migrations/20260912220000_lender_intelligence_foundation.sql',
  import.meta.url
);
const migration = readFileSync(migrationUrl, 'utf8');

function tableDeclarations() {
  return [
    ...migration.matchAll(/create table if not exists public\.([a-z0-9_]+)\s*\(([\s\S]*?)\n\);/gi),
  ].map((match) => ({ name: match[1], body: match[2], offset: match.index }));
}

test('migration table declarations have no duplicate columns', () => {
  for (const table of tableDeclarations()) {
    const columns = table.body.split('\n').flatMap((line) => {
      const trimmed = line.trim();
      if (!trimmed || /^(check|unique|primary|foreign|constraint)\b/i.test(trimmed)) return [];
      return trimmed.match(/^([a-z_][a-z0-9_]*)\s+/i)?.[1] || [];
    });
    assert.equal(new Set(columns).size, columns.length, `duplicate column in ${table.name}`);
  }
});

test('new lender tables reference only previously declared lender tables', () => {
  const tables = tableDeclarations();
  const positions = new Map(tables.map((table) => [table.name, table.offset]));
  for (const table of tables) {
    for (const reference of table.body.matchAll(/references public\.([a-z0-9_]+)/gi)) {
      const referencedTable = reference[1];
      if (!referencedTable.startsWith('lender_') || !positions.has(referencedTable)) continue;
      assert.ok(
        positions.get(referencedTable) < table.offset,
        `${table.name} references later table ${referencedTable}`
      );
    }
  }
});

test('critical finance tables have RLS and service-role policies', () => {
  for (const table of [
    'lender_invoice_sequences',
    'lender_invoices',
    'lender_invoice_payments',
    'lender_invoice_payment_allocations',
    'lender_invoice_adjustments',
    'lender_reconciliation_items',
    'lender_clawbacks',
  ]) {
    assert.match(
      migration,
      new RegExp(`alter table public\\.${table} enable row level security`, 'i')
    );
    assert.match(migration, new RegExp(`create policy [^\\n]+ on public\\.${table} `, 'i'));
  }
});

test('critical transactional functions are private and granted only to service role', () => {
  for (const signature of [
    'create_lender_invoice\\(uuid, uuid, text, uuid\\[\\], timestamptz, uuid\\)',
    'raise_lender_invoice\\(uuid, uuid\\)',
    'set_manual_lender_payout\\(uuid, numeric, text, uuid\\)',
    'record_lender_invoice_payment\\(uuid, numeric, text, uuid, text\\)',
    'resolve_lender_reconciliation\\(uuid, text, numeric, text, uuid\\)',
    'activate_lender_commercial\\(uuid, uuid, timestamptz\\)',
    'transition_lender_application\\(uuid, text, text, text, jsonb, text, text, text, numeric, numeric, numeric, integer, uuid, timestamptz\\)',
    'commit_lender_selection\\(uuid, text, jsonb, uuid, uuid, integer, text, text, text, uuid, uuid, timestamptz\\)',
    'reroute_crm_application\\(uuid, text, jsonb, uuid, uuid, text, text, integer, text, text, text, uuid, uuid, timestamptz\\)',
    'cancel_lender_invoice\\(uuid, text, uuid\\)',
    'manage_lender_data_quality_issue\\(uuid, text, text, uuid\\)',
    'review_lender_policy_document\\(uuid, text, text, uuid\\)',
    'register_lender_routing_decision\\(uuid, text, text, text, jsonb, jsonb, uuid\\)',
    'request_lender_routing_exception\\(uuid, uuid, uuid, text, text, uuid\\)',
    'review_lender_routing_exception\\(uuid, text, text, uuid\\)',
    'register_lender_clawback\\(uuid, text, text, timestamptz, uuid\\)',
    'resolve_lender_clawback\\(uuid, text, text, text, uuid\\)',
    'register_lender_intelligence_audit\\(uuid, uuid, text, text, text, text, text, jsonb\\)',
    'register_lender_policy_document\\(uuid, uuid, uuid, text, text, text, text, text, timestamptz, uuid\\)',
    'set_lender_program_operating_status\\(uuid, text, text, uuid\\)',
    'set_lender_program_daily_capacity\\(uuid, integer, text, uuid\\)',
    'get_lender_program_daily_capacity_usage\\(uuid\\[\\], timestamptz, uuid\\)',
    'save_lender_master\\(jsonb, uuid\\)',
    'save_lender_program\\(jsonb, uuid\\)',
    'create_lender_policy_draft\\(uuid, text, text, text, text, timestamptz, uuid\\)',
    'submit_lender_policy\\(uuid, uuid\\)',
    'create_lender_commercial_draft\\(jsonb, uuid\\)',
    'save_lender_rejection_reason\\(uuid, uuid, text, text, text, text, boolean, integer, uuid\\)',
    'terminate_lender_commercial\\(uuid, text, uuid, timestamptz\\)',
    'retire_lender_policy\\(uuid, text, uuid, timestamptz\\)',
    'discard_lender_policy_draft\\(uuid, text, uuid\\)',
    'discard_lender_commercial_draft\\(uuid, text, uuid\\)',
    'bulk_import_lender_programs\\(jsonb, uuid\\)',
    'require_lender_intelligence_actor\\(uuid\\)',
    'refresh_lender_data_quality_issues_as_actor\\(uuid\\)',
    'withdraw_lender_eligibility_consent\\(uuid, text, text, uuid\\)',
  ]) {
    assert.match(
      migration,
      new RegExp(`revoke all on function public\\.${signature} from public`, 'i')
    );
    assert.match(
      migration,
      new RegExp(`grant execute on function public\\.${signature} to service_role`, 'i')
    );
  }
});

test('bulk import uses the canonical lender and program workflows with database-side guards', () => {
  const definitions = [
    ...migration.matchAll(
      /create or replace function public\.bulk_import_lender_programs\([\s\S]*?\n\$\$;/gi
    ),
  ];
  const bulkImport = definitions.at(-1)?.[0] || '';
  assert.match(bulkImport, /perform public\.require_lender_intelligence_actor\(p_user_id\)/i);
  assert.match(bulkImport, /jsonb_array_length\(p_rows\) > 500/i);
  assert.match(bulkImport, /octet_length\(p_rows::text\) > 2097152/i);
  assert.match(
    bulkImport,
    /group by upper\(btrim\(row->>'programCode'\)\).*having count\(\*\) > 1/is
  );
  assert.match(bulkImport, /from public\.lender_master[\s\S]*?for update/i);
  assert.match(bulkImport, /public\.save_lender_master\(/i);
  assert.match(bulkImport, /existing_program\.status <> 'draft'/i);
  assert.match(bulkImport, /public\.save_lender_program\(/i);
  assert.match(
    bulkImport,
    /public\.register_lender_intelligence_audit\([\s\S]*?'bulk_import_lender_programs'/i
  );
});

test('document review enforces independent reviewer and rejection evidence', () => {
  const review =
    migration.match(
      /create or replace function public\.review_lender_policy_document\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(review, /target\.created_by = p_reviewer_user_id/i);
  assert.match(review, /p_decision = 'rejected'.*length\(btrim\(p_note\)\) < 5/is);
  assert.match(review, /target\.review_status <> 'pending'/i);
  assert.match(review, /require_lender_intelligence_actor\(p_reviewer_user_id\)/i);
  assert.match(review, /register_lender_intelligence_audit\([\s\S]*?'document_' \|\| p_decision/i);
});

test('policy document bytes, ownership, and completed review evidence are immutable', () => {
  const guard =
    migration.match(
      /create or replace function public\.protect_lender_policy_document\(\)[\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(migration, /lender_policy_documents_checksum_sha256[\s\S]*?\^\[0-9a-f\]\{64\}\$/i);
  assert.match(guard, /new\.storage_path is distinct from old\.storage_path/i);
  assert.match(guard, /new\.checksum is distinct from old\.checksum/i);
  assert.match(guard, /new\.verified_by = old\.created_by/i);
  assert.match(guard, /old\.review_status = 'verified' and new\.review_status = 'expired'/i);
  assert.match(guard, /old\.expires_at > now\(\)/i);
  assert.match(guard, /Policy document evidence cannot be deleted/i);
  assert.match(
    migration,
    /before update or delete on public\.lender_policy_documents[\s\S]*?protect_lender_policy_document\(\)/i
  );
});

test('database activation guards enforce lender and program readiness on every write path', () => {
  const lenderGuard =
    migration.match(
      /create or replace function public\.enforce_lender_operating_readiness\(\)[\s\S]*?\n\$\$;/i
    )?.[0] || '';
  const programGuard =
    migration.match(
      /create or replace function public\.enforce_lender_program_readiness\(\)[\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(lenderGuard, /new\.onboarding_status = 'active'/i);
  assert.match(lenderGuard, /new\.kyc_status <> 'verified'/i);
  assert.match(lenderGuard, /new\.agreement_status <> 'signed'/i);
  assert.match(lenderGuard, /new\.agreement_expires_at <= now\(\)/i);
  assert.match(
    migration,
    /before insert or update of onboarding_status, kyc_status, agreement_status, agreement_expires_at[\s\S]*?execute function public\.enforce_lender_operating_readiness\(\)/i
  );
  assert.match(programGuard, /lender\.onboarding_status = 'active'/i);
  assert.match(programGuard, /policy\.status = 'published'/i);
  assert.match(programGuard, /policy\.effective_from <= now\(\)/i);
  assert.match(programGuard, /policy\.effective_to is null or policy\.effective_to > now\(\)/i);
  assert.match(
    migration,
    /before insert or update of status, lender_id on public\.lender_programs[\s\S]*?execute function public\.enforce_lender_program_readiness\(\)/i
  );
  assert.ok(
    migration.indexOf('create table if not exists public.lender_policy_versions') <
      migration.indexOf('create or replace function public.enforce_lender_program_readiness()')
  );
});

test('initial lender selection atomically binds decision, application, stage, and approved exception', () => {
  const commit =
    migration.match(
      /create or replace function public\.commit_lender_selection\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(commit, /eligibility_report_id = p_eligibility_report_id[\s\S]*?for update/i);
  assert.match(commit, /require_lender_intelligence_actor\(p_actor_user_id\)/i);
  assert.match(commit, /jsonb_typeof\(p_application\) <> 'object'/i);
  assert.match(commit, /octet_length\(p_application::text\) > 1048576/i);
  assert.match(commit, /Application lead does not match routing evidence/i);
  assert.match(commit, /Selection cannot predate routing evidence/i);
  assert.match(commit, /decision\.application_id is not null/i);
  assert.match(commit, /jsonb_array_elements\(decision\.result_snapshot\)/i);
  assert.match(commit, /Selected rank does not match routing evidence/i);
  assert.match(commit, /matchStatus' <> 'eligible'/i);
  assert.match(commit, /program\.capacity_status <> 'paused'/i);
  assert.match(commit, /lender\.kyc_status = 'verified'/i);
  assert.match(commit, /lender\.agreement_status = 'signed'/i);
  assert.match(
    commit,
    /lender\.agreement_expires_at is null or lender\.agreement_expires_at > now\(\)/i
  );
  assert.match(commit, /policy\.id = nullif\(snapshot_result->>'policyVersionId', ''\)::uuid/i);
  assert.match(commit, /Routing policy evidence is no longer current; run eligibility again/i);
  assert.match(
    commit,
    /policy_version_id = nullif\(snapshot_result->>'policyVersionId', ''\)::uuid/i
  );
  assert.match(commit, /lower\(lender\.display_name\) = lower\(lender_name_value\)/i);
  assert.match(commit, /exception_record\.status <> 'approved'/i);
  assert.match(commit, /exception_record\.reviewed_at <= now\(\) - interval '24 hours'/i);
  assert.match(commit, /insert into public\.crm_lender_applications/i);
  assert.match(commit, /update public\.lender_routing_decisions/i);
  assert.match(commit, /insert into public\.application_stage_events/i);
  assert.match(commit, /update public\.lender_routing_exceptions set status = 'used'/i);
  assert.match(commit, /register_lender_intelligence_audit\([\s\S]*?'commit_lender_selection'/i);
  assert.match(commit, /p_occurred_at, p_occurred_at/i);
});

test('lender rerouting preserves the source decision and atomically creates governed evidence', () => {
  const reroute =
    migration.match(
      /create or replace function public\.reroute_crm_application\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(
    reroute,
    /where id = p_previous_application_id and partner_id = p_partner_id[\s\S]*?for update/i
  );
  assert.match(reroute, /require_lender_intelligence_actor\(p_actor_user_id\)/i);
  assert.match(reroute, /jsonb_typeof\(p_new_application\) <> 'object'/i);
  assert.match(reroute, /octet_length\(p_new_application::text\) > 1048576/i);
  assert.match(reroute, /Reroute application lead does not match the source application/i);
  assert.match(reroute, /Routing decision lead does not match the source application/i);
  assert.match(reroute, /eligibility_report_id = p_eligibility_report_id[\s\S]*?for update/i);
  assert.match(reroute, /jsonb_array_elements\(source_decision\.result_snapshot\)/i);
  assert.match(reroute, /Reroute rank does not match routing evidence/i);
  assert.match(reroute, /matchStatus' <> 'eligible'/i);
  assert.match(reroute, /program\.status = 'active' and program\.capacity_status <> 'paused'/i);
  assert.match(reroute, /lender\.kyc_status = 'verified'/i);
  assert.match(reroute, /lender\.agreement_status = 'signed'/i);
  assert.match(
    reroute,
    /lender\.agreement_expires_at is null or lender\.agreement_expires_at > now\(\)/i
  );
  assert.match(reroute, /policy\.id = nullif\(snapshot_result->>'policyVersionId', ''\)::uuid/i);
  assert.match(reroute, /Reroute policy evidence is no longer current; run eligibility again/i);
  assert.match(reroute, /routing_decision_id = source_decision\.id/i);
  assert.match(reroute, /exception_record\.status <> 'approved'/i);
  assert.match(reroute, /exception_record\.reviewed_at <= now\(\) - interval '24 hours'/i);
  assert.match(reroute, /insert into public\.lender_routing_decisions/i);
  assert.match(reroute, /source_decision\.engine_version, source_decision\.input_snapshot/i);
  assert.match(reroute, /source_decision\.result_snapshot, p_new_lender_id/i);
  assert.doesNotMatch(reroute, /update public\.lender_routing_decisions/i);
  assert.equal((reroute.match(/insert into public\.application_stage_events/gi) || []).length, 1);
  assert.match(reroute, /update public\.lender_routing_exceptions set status = 'used'/i);
  assert.match(
    reroute,
    /register_lender_intelligence_audit\([\s\S]*?'reroute_lender_application'/i
  );
  assert.match(reroute, /p_occurred_at, p_occurred_at/i);
});

test('routing exceptions are evidence-bound, independently reviewed, and one-time', () => {
  const guard =
    migration.match(
      /create or replace function public\.protect_lender_routing_exception\(\)[\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(guard, /decision\.application_id is not null/i);
  assert.match(guard, /jsonb_array_elements\(decision\.result_snapshot\)/i);
  assert.match(guard, /value->>'policyVersionId' = new\.policy_version_id::text/i);
  assert.match(guard, /Exception request does not match immutable routing evidence/i);
  assert.match(guard, /new\.reviewed_by = old\.requested_by/i);
  assert.match(guard, /lender\.kyc_status = 'verified'/i);
  assert.match(guard, /lender\.agreement_status = 'signed'/i);
  assert.match(guard, /old\.status = 'approved' and new\.status = 'expired'/i);
  assert.match(guard, /old\.reviewed_at <= now\(\) - interval '24 hours'/i);
  assert.match(guard, /policy\.status = 'published'/i);
  assert.match(guard, /Exception evidence is stale or lender program is not operational/i);
  assert.match(guard, /old\.status = 'approved' and new\.status = 'used'/i);
  assert.match(guard, /Routing exception history cannot be deleted/i);
  assert.match(
    migration,
    /before insert or update or delete on public\.lender_routing_exceptions[\s\S]*?protect_lender_routing_exception/i
  );
});

test('stage and outcome inserts are bound to canonical application evidence', () => {
  const stageGuard =
    migration.match(
      /create or replace function public\.validate_application_stage_event\(\)[\s\S]*?\n\$\$;/i
    )?.[0] || '';
  const outcomeGuard =
    migration.match(
      /create or replace function public\.validate_lender_outcome_evidence\(\)[\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(stageGuard, /application\.partner_id is distinct from new\.partner_id/i);
  assert.match(stageGuard, /application\.status <> new\.to_stage/i);
  assert.match(stageGuard, /new\.occurred_at > now\(\) \+ interval '5 minutes'/i);
  assert.match(stageGuard, /new\.from_stage is distinct from latest_event\.to_stage/i);
  assert.match(stageGuard, /decision\.selected_lender_id is distinct from new\.lender_id/i);
  assert.match(stageGuard, /decision\.selected_program_id is distinct from new\.program_id/i);
  assert.match(outcomeGuard, /application\.status <> required_stage/i);
  assert.match(
    outcomeGuard,
    /event\.to_stage = required_stage and event\.occurred_at = evidence_time/i
  );
  assert.match(outcomeGuard, /Approved outcome requires a positive sanctioned amount/i);
  assert.match(outcomeGuard, /Disbursed outcome requires a positive disbursed amount/i);
  assert.match(outcomeGuard, /Rejected outcome requires active canonical reason evidence/i);
  assert.match(
    migration,
    /before insert on public\.application_stage_events[\s\S]*?validate_application_stage_event/i
  );
  assert.match(
    migration,
    /before insert on public\.lender_outcomes[\s\S]*?validate_lender_outcome_evidence/i
  );
});

test('reconciliation inserts recalculate immutable commercial evidence', () => {
  const guard =
    migration.match(
      /create or replace function public\.validate_lender_reconciliation_insert\(\)[\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(guard, /outcome\.outcome <> 'disbursed'/i);
  assert.match(guard, /New reconciliation item cannot start invoiced or paid/i);
  assert.match(guard, /Missing commercial coverage must start as zero-value unbilled/i);
  assert.match(guard, /commercial\.lender_id is distinct from outcome\.lender_id/i);
  assert.match(guard, /commercial\.program_id is distinct from outcome\.program_id/i);
  assert.match(guard, /commercial\.effective_from > outcome\.disbursed_at/i);
  assert.match(guard, /commercial\.payout_basis = 'percentage'/i);
  assert.match(guard, /jsonb_array_elements\(commercial\.payout_slab\)/i);
  assert.match(guard, /commercial\.tax_terms->>'reverseCharge'/i);
  assert.match(
    guard,
    /Reconciliation amount, tax, or readiness does not match immutable commercial terms/i
  );
  assert.match(
    migration,
    /before insert on public\.lender_reconciliation_items[\s\S]*?validate_lender_reconciliation_insert/i
  );
});

test('invoice receipts conserve exact payment allocations and reconciliation identity', () => {
  const allocation =
    migration.match(
      /create or replace function public\.validate_invoice_payment_allocation\(\)[\s\S]*?\n\$\$;/i
    )?.[0] || '';
  const conservation =
    migration.match(
      /create or replace function public\.enforce_payment_allocation_conservation\(\)[\s\S]*?\n\$\$;/i
    )?.[0] || '';
  const reconciliation =
    migration.match(
      /create or replace function public\.protect_lender_reconciliation_update\(\)[\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(allocation, /item\.invoice_id is distinct from payment\.invoice_id/i);
  assert.match(allocation, /new\.amount > item\.invoiced_amount - item\.received_amount/i);
  assert.match(allocation, /already_allocated \+ new\.amount > payment\.amount/i);
  assert.match(conservation, /allocated_amount <> receipt_amount/i);
  assert.match(conservation, /Every invoice receipt must be fully allocated exactly once/i);
  assert.match(
    migration,
    /after insert on public\.lender_invoice_payments deferrable initially deferred/i
  );
  assert.match(reconciliation, /Reconciliation source identity is immutable/i);
  assert.match(reconciliation, /commercial\.payout_basis <> 'custom'/i);
  assert.match(reconciliation, /new\.tax_amount <> expected_tax/i);
  assert.match(reconciliation, /new\.received_amount <> allocated_amount/i);
  assert.match(reconciliation, /Reconciliation history cannot be deleted/i);
  assert.match(reconciliation, /Invalid reconciliation lifecycle transition/i);
  assert.match(
    reconciliation,
    /Invoice attachment requires an invoice-ready item and exact line total/i
  );
  assert.match(reconciliation, /Only an unpaid invoiced item can be released by cancellation/i);
  assert.match(
    reconciliation,
    /Invoiced line value is immutable while invoice attachment is unchanged/i
  );
  assert.match(reconciliation, /Reconciliation receipts cannot decrease/i);
  assert.match(reconciliation, /Part-paid reconciliation requires an exact open invoice balance/i);
  assert.match(reconciliation, /Paid reconciliation requires settled receipt evidence/i);
});

test('application transitions require governed routing evidence and canonical rejection taxonomy', () => {
  const transition =
    migration.match(
      /create or replace function public\.transition_lender_application\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(
    transition,
    /decision\.id is null or decision\.selected_lender_id is null or decision\.selected_program_id is null/i
  );
  assert.match(
    transition,
    /A bound lender routing decision is required before application progression/i
  );
  assert.match(transition, /from public\.lender_rejection_reasons reason/i);
  assert.match(transition, /upper\(reason\.code\) = upper\(btrim\(p_reason_code\)\)/i);
  assert.match(transition, /reason\.active = true/i);
  assert.match(transition, /reason\.partner_id = p_partner_id or reason\.partner_id is null/i);
  assert.match(transition, /order by \(reason\.partner_id = p_partner_id\) desc/i);
  assert.match(transition, /An active canonical rejection reason is required/i);
  assert.match(transition, /then canonical_rejection_code end/i);
  assert.match(transition, /on conflict \(application_id, outcome\) do nothing/i);
  assert.match(transition, /Application outcome already exists and is immutable/i);
  assert.match(transition, /A canonical sanctioned outcome is required before disbursal/i);
  assert.match(transition, /Application outcome amounts cannot contain sub-paise precision/i);
  assert.match(transition, /Disbursed amount cannot exceed the sanctioned amount/i);
  assert.match(transition, /Sanctioned outcome requires a positive approved ROI/i);
  assert.match(transition, /Sanctioned outcome requires a positive approved tenure/i);
  assert.match(transition, /Canonical sanction terms are incomplete/i);
  assert.match(transition, /approved_outcome\.sanctioned_amount/i);
  assert.match(transition, /approved_outcome\.approved_roi/i);
  assert.match(transition, /approved_outcome\.approved_tenure_months/i);
  assert.match(transition, /No active commercial version covered the disbursal timestamp/i);
  assert.match(transition, /Custom payout requires reviewed manual valuation/i);
  assert.match(transition, /Commercial terms did not produce a payable amount/i);
});

test('decision and evidence ledgers are immutable at the database boundary', () => {
  const decisionGuard =
    migration.match(
      /create or replace function public\.protect_lender_routing_decision\(\)[\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(decisionGuard, /old\.application_id is null/i);
  assert.match(decisionGuard, /new\.application_id is not null/i);
  assert.match(decisionGuard, /new\.selected_lender_id is not null/i);
  assert.match(decisionGuard, /to_jsonb\(new\) - array/i);
  assert.match(
    decisionGuard,
    /Lender routing decisions are immutable after their one-time application binding/i
  );
  assert.match(
    migration,
    /before update or delete on public\.lender_routing_decisions[\s\S]*?protect_lender_routing_decision/i
  );
  for (const table of [
    'application_stage_events',
    'lender_outcomes',
    'lender_invoice_payments',
    'lender_invoice_payment_allocations',
    'lender_invoice_adjustments',
    'lender_intelligence_audit_logs',
  ]) {
    assert.match(
      migration,
      new RegExp(
        `before update or delete on public\\.${table}[\\s\\S]*?reject_lender_append_only_mutation`,
        'i'
      )
    );
  }
});

test('reviewed policy and commercial versions are structurally immutable', () => {
  const ruleGuard =
    migration.match(
      /create or replace function public\.protect_lender_policy_rule\(\)[\s\S]*?\n\$\$;/i
    )?.[0] || '';
  const policyGuard =
    migration.match(
      /create or replace function public\.protect_lender_policy_version\(\)[\s\S]*?\n\$\$;/i
    )?.[0] || '';
  const commercialGuard =
    migration.match(
      /create or replace function public\.protect_lender_commercial_version\(\)[\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(ruleGuard, /old_parent_status is distinct from 'draft'/i);
  assert.match(ruleGuard, /new_parent_status is distinct from 'draft'/i);
  assert.match(ruleGuard, /Policy rules can be changed only while their version is draft/i);
  assert.match(policyGuard, /Policy version history cannot be deleted/i);
  assert.match(
    policyGuard,
    /old\.status = 'draft' and new\.status in \('draft', 'in_review', 'rejected'\)/i
  );
  assert.match(policyGuard, /new\.program_id = old\.program_id and new\.version = old\.version/i);
  assert.match(policyGuard, /old\.status = 'in_review' and new\.status = 'published'/i);
  assert.match(policyGuard, /new\.effective_from is not null and new\.effective_from <= now\(\)/i);
  assert.match(policyGuard, /old\.status = 'in_review' and new\.status = 'rejected'/i);
  assert.match(policyGuard, /old\.status = 'published' and new\.status = 'retired'/i);
  assert.match(policyGuard, /Reviewed policy content is immutable/i);
  assert.match(commercialGuard, /Commercial version history cannot be deleted/i);
  assert.match(commercialGuard, /new\.partner_id is not distinct from old\.partner_id/i);
  assert.match(commercialGuard, /new\.lender_id = old\.lender_id/i);
  assert.match(commercialGuard, /old\.status = 'in_review' and new\.status = 'active'/i);
  assert.match(
    commercialGuard,
    /new\.effective_from is not null and new\.effective_from <= now\(\)/i
  );
  assert.match(commercialGuard, /old\.status = 'in_review' and new\.status = 'rejected'/i);
  assert.match(
    commercialGuard,
    /old\.status = 'active' and new\.status in \('expired', 'terminated'\)/i
  );
  assert.match(commercialGuard, /Reviewed commercial economics are immutable/i);
  assert.match(
    migration,
    /before insert or update or delete on public\.lender_policy_rules[\s\S]*?protect_lender_policy_rule/i
  );
});

test('active lender programs retain current policy and shutdown dependencies', () => {
  const policyDependency =
    migration.match(
      /create or replace function public\.enforce_active_program_policy_dependency\(\)[\s\S]*?\n\$\$;/i
    )?.[0] || '';
  const lenderShutdown =
    migration.match(
      /create or replace function public\.enforce_lender_program_shutdown_order\(\)[\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(policyDependency, /status = 'active'/i);
  assert.match(policyDependency, /policy\.status = 'published'/i);
  assert.match(policyDependency, /policy\.effective_from <= now\(\)/i);
  assert.match(policyDependency, /Active program must retain a current published policy/i);
  assert.match(
    migration,
    /create constraint trigger trg_active_program_policy_dependency[\s\S]*?deferrable initially deferred/i
  );
  assert.match(
    lenderShutdown,
    /old\.onboarding_status = 'active' and new\.onboarding_status <> 'active'/i
  );
  assert.match(lenderShutdown, /lender_id = old\.id and status = 'active'/i);
  assert.match(lenderShutdown, /Pause or retire active lender programs before lender shutdown/i);
});

test('lender shutdown is atomic, terminal, and preserves governed identity', () => {
  const operating =
    migration.match(
      /create or replace function public\.set_lender_operating_status\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  const identity =
    migration.match(
      /create or replace function public\.protect_lender_master_identity\(\)[\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(operating, /target\.onboarding_status = 'offboarded'.*p_status <> 'offboarded'/is);
  assert.ok(
    operating.indexOf('update public.lender_programs') <
      operating.indexOf('update public.lender_master set onboarding_status')
  );
  assert.match(operating, /when status = 'active' then 'paused'/i);
  assert.match(identity, /new\.partner_id is distinct from old\.partner_id/i);
  assert.match(identity, /new\.lender_code is distinct from old\.lender_code/i);
  assert.match(identity, /old\.onboarding_status in \('active', 'paused', 'offboarded'\)/i);
  assert.match(identity, /old\.onboarding_status = 'offboarded'/i);
  assert.match(
    migration,
    /before update on public\.lender_master[\s\S]*?protect_lender_master_identity\(\)/i
  );
});

test('lender onboarding, KYC, and agreement lifecycles reject backward or terminal revival', () => {
  const guard =
    migration.match(
      /create or replace function public\.protect_lender_master_identity\(\)[\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(
    guard,
    /old\.onboarding_status = 'draft' and new\.onboarding_status = 'due_diligence'/i
  );
  assert.match(guard, /old\.onboarding_status = 'due_diligence'.*'agreement_pending', 'active'/is);
  assert.match(guard, /Invalid lender onboarding lifecycle transition/i);
  assert.match(guard, /old\.kyc_status = 'verified' and new\.kyc_status = 'expired'/i);
  assert.match(guard, /old\.kyc_status in \('rejected', 'expired'\).*'in_review', 'verified'/is);
  assert.match(guard, /Invalid lender KYC lifecycle transition/i);
  assert.match(guard, /old\.agreement_status = 'signed'.*'expired', 'terminated'/is);
  assert.match(guard, /old\.agreement_status = 'expired'.*'in_review', 'signed', 'terminated'/is);
  assert.match(guard, /Invalid or terminal lender agreement lifecycle transition/i);
  assert.doesNotMatch(guard, /old\.agreement_status = 'terminated'/i);
});

test('lender master writes are private, validated, and row-locked', () => {
  const save =
    migration.match(
      /create or replace function public\.save_lender_master\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(save, /jsonb_typeof\(p_lender\) <> 'object'/i);
  assert.match(save, /candidate\.lender_code !~ '\^\[A-Z0-9\]/i);
  assert.match(save, /jsonb_typeof\(coalesce\(candidate\.metadata/i);
  assert.match(save, /New lenders must begin in draft with pending KYC and agreement/i);
  assert.match(save, /candidate\.finance_email !~ /i);
  assert.match(save, /candidate\.gstin !~ '\^\[0-9\]\{2\}/i);
  assert.match(save, /billing_address = candidate\.billing_address/i);
  assert.match(
    migration,
    /Active lender requires verified KYC, current agreement, and complete billing identity/i
  );
  assert.match(save, /'draft', 'pending',\s*'pending'/i);
  assert.match(save, /where id = candidate\.id for update/i);
  assert.match(save, /updated_by = p_user_id/i);
  assert.match(
    migration,
    /revoke insert, update, delete, truncate on public\.lender_master from public, anon, authenticated, service_role/i
  );
});

test('program master writes are private, draft-only, tenant-bound, and row-locked', () => {
  const save =
    migration.match(
      /create or replace function public\.save_lender_program\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(save, /candidate\.program_code !~ '\^\[A-Z0-9\]/i);
  assert.match(
    save,
    /lender\.partner_id is not null and candidate\.partner_id is distinct from lender\.partner_id/i
  );
  assert.match(save, /coalesce\(candidate\.status, 'draft'\) <> 'draft'/i);
  assert.match(save, /Program numeric ranges are invalid/i);
  assert.match(save, /candidate\.daily_submission_limit not between 1 and 1000000/i);
  assert.match(save, /daily_submission_limit = candidate\.daily_submission_limit/i);
  assert.match(save, /cardinality\(coalesce\(candidate\.cities/i);
  assert.match(save, /where id = candidate\.id for update/i);
  assert.match(save, /target\.status <> 'draft'/i);
  assert.match(
    migration,
    /revoke insert, update, delete, truncate on public\.lender_programs from public, anon, authenticated, service_role/i
  );
});

test('daily program capacity is concurrency-safe at selection and reroute commit', () => {
  const selection =
    migration.match(
      /create or replace function public\.commit_lender_selection\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  const reroute =
    migration.match(
      /create or replace function public\.reroute_crm_application\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(
    migration,
    /daily_submission_limit integer check \(daily_submission_limit between 1 and 1000000\)/i
  );
  for (const workflow of [selection, reroute]) {
    assert.match(workflow, /pg_advisory_xact_lock\(hashtextextended\(/i);
    assert.match(workflow, /from public\.application_stage_events/i);
    assert.match(workflow, /occurred_at at time zone 'Asia\/Kolkata'/i);
    assert.match(workflow, /submissions_today >= program_daily_limit/i);
    assert.match(workflow, /Program daily submission capacity is exhausted/i);
  }
});

test('daily capacity changes use an audited row-locking operational workflow', () => {
  const workflow =
    migration.match(
      /create or replace function public\.set_lender_program_daily_capacity\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(workflow, /pg_advisory_xact_lock\(hashtextextended\(/i);
  assert.match(workflow, /where id = p_program_id for update/i);
  assert.match(workflow, /target\.status = 'retired'/i);
  assert.match(workflow, /daily_submission_limit = p_daily_submission_limit/i);
  assert.match(
    workflow,
    /register_lender_intelligence_audit\([\s\S]*?'set_program_daily_capacity'/i
  );
});

test('daily capacity usage is database-aggregated without API row-limit undercounting', () => {
  const workflow =
    migration.match(
      /create or replace function public\.get_lender_program_daily_capacity_usage\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(workflow, /require_lender_intelligence_actor\(p_actor_user_id\)/i);
  assert.match(workflow, /cardinality\(p_program_ids\) > 500/i);
  assert.match(workflow, /count\(event\.id\)::bigint/i);
  assert.match(workflow, /event\.to_stage = 'case_sent_to_lender'/i);
  assert.match(workflow, /event\.occurred_at at time zone 'Asia\/Kolkata'/i);
  assert.match(workflow, /count\(event\.id\) >= program\.daily_submission_limit/i);
});

test('lender and program master/status mutations commit atomic audit evidence', () => {
  for (const [name, action] of [
    ['save_lender_master', 'upsert_lender'],
    ['save_lender_program', 'upsert_program'],
    ['set_lender_operating_status', "'set_lender_' || p_status"],
    ['set_lender_program_operating_status', 'set_program_operating_status'],
  ]) {
    const workflow =
      migration.match(
        new RegExp(`create or replace function public\\.${name}\\([\\s\\S]*?\\n\\$\\$;`, 'i')
      )?.[0] || '';
    assert.match(workflow, /register_lender_intelligence_audit\(/i);
    assert.match(workflow, new RegExp(action.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
  const lenderSave =
    migration.match(
      /create or replace function public\.save_lender_master\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  const programSave =
    migration.match(
      /create or replace function public\.save_lender_program\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.equal((lenderSave.match(/'upsert_lender'/g) || []).length, 2);
  assert.equal((programSave.match(/'upsert_program'/g) || []).length, 2);
});

test('policy drafting and submission are serialized evidence-bound workflows', () => {
  const create =
    migration.match(
      /create or replace function public\.create_lender_policy_draft\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  const submit =
    migration.match(
      /create or replace function public\.submit_lender_policy\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(create, /from public\.lender_programs where id = p_program_id for update/i);
  assert.match(create, /status in \('draft', 'in_review'\)/i);
  assert.match(create, /coalesce\(max\(version\), 0\) \+ 1/i);
  assert.match(create, /p_source_checksum !~ '\^\[0-9a-f\]\{64\}\$'/i);
  assert.match(submit, /where id = p_policy_version_id for update/i);
  assert.match(submit, /target\.status <> 'draft'/i);
  assert.match(submit, /where policy_version_id = target\.id and enabled/i);
  assert.match(submit, /document\.review_status = 'verified'/i);
  assert.match(
    migration,
    /revoke insert, update, delete, truncate on public\.lender_policy_versions from public, anon, authenticated, service_role/i
  );
  assert.match(
    migration,
    /revoke insert, update, delete, truncate on public\.lender_policy_rules from public, anon, authenticated, service_role/i
  );
});

test('commercial drafting is serialized, tenant-bound, validated, and RPC-only', () => {
  const create =
    migration.match(
      /create or replace function public\.create_lender_commercial_draft\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(create, /from public\.lender_master where id = candidate\.lender_id for update/i);
  assert.match(create, /program\.lender_id <> candidate\.lender_id/i);
  assert.match(create, /candidate\.partner_id is distinct from lender\.partner_id/i);
  assert.match(create, /public\.valid_lender_payout_slabs\(candidate\.payout_slab\)/i);
  assert.match(create, /tax_rate not between 0 and 100/i);
  assert.match(create, /clawback_window not between 0 and 3650/i);
  assert.match(create, /status in \('draft', 'in_review'\)/i);
  assert.match(create, /coalesce\(max\(version\), 0\) \+ 1/i);
  assert.match(
    migration,
    /revoke insert, update, delete, truncate on public\.lender_commercial_versions from public, anon, authenticated, service_role/i
  );
});

test('rejection taxonomy has immutable identity and governed lifecycle writes', () => {
  const save =
    migration.match(
      /create or replace function public\.save_lender_rejection_reason\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(save, /normalized_code !~ '\^\[A-Z0-9\]/i);
  assert.match(save, /where id = p_reason_id for update/i);
  assert.match(
    save,
    /target\.partner_id is distinct from p_partner_id or target\.code <> normalized_code/i
  );
  assert.match(save, /global OTHER fallback reason must remain active/i);
  assert.match(save, /updated_by = p_user_id/i);
  assert.equal((save.match(/'save_rejection_reason'/g) || []).length, 2);
  assert.match(
    migration,
    /revoke insert, update, delete, truncate on public\.lender_rejection_reasons from public, anon, authenticated, service_role/i
  );
});

test('active commercial termination is locked, evidenced, and time-bounded', () => {
  const terminate =
    migration.match(
      /create or replace function public\.terminate_lender_commercial\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(terminate, /length\(btrim\(coalesce\(p_reason, ''\)\)\) not between 5 and 1000/i);
  assert.match(terminate, /where id = p_commercial_version_id for update/i);
  assert.match(terminate, /target\.status <> 'active'/i);
  assert.match(terminate, /p_terminated_at < target\.effective_from/i);
  assert.match(terminate, /status = 'terminated', effective_to = p_terminated_at/i);
});

test('published policy retirement preserves active-program readiness', () => {
  const retire =
    migration.match(
      /create or replace function public\.retire_lender_policy\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(retire, /where id = p_policy_version_id for update/i);
  assert.match(retire, /from public\.lender_programs where id = target\.program_id for update/i);
  assert.match(retire, /program\.status = 'active'/i);
  assert.match(retire, /Pause or retire the lender program before retiring/i);
  assert.match(retire, /status = 'retired', effective_to = p_retired_at/i);
});

test('stale policy and commercial drafts can be discarded without deleting history', () => {
  const policy =
    migration.match(
      /create or replace function public\.discard_lender_policy_draft\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  const commercial =
    migration.match(
      /create or replace function public\.discard_lender_commercial_draft\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  for (const workflow of [policy, commercial]) {
    assert.match(workflow, /for update/i);
    assert.match(workflow, /target\.status <> 'draft'/i);
    assert.match(workflow, /status = 'rejected'/i);
    assert.match(workflow, /Draft discarded:/i);
    assert.doesNotMatch(workflow, /delete from/i);
  }
  const policyGuard =
    migration.match(
      /create or replace function public\.protect_lender_policy_version\(\)[\s\S]*?\n\$\$;/i
    )?.[0] || '';
  const commercialGuard =
    migration.match(
      /create or replace function public\.protect_lender_commercial_version\(\)[\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(policyGuard, /new\.status in \('draft', 'in_review', 'rejected'\)/i);
  assert.match(commercialGuard, /new\.status in \('draft', 'in_review', 'rejected'\)/i);
});

test('document-sourced policy publication requires current verified checksum evidence', () => {
  const publish =
    migration.match(
      /create or replace function public\.publish_lender_policy\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(publish, /target\.source_type = 'lender_document'/i);
  assert.match(publish, /document\.review_status = 'verified'/i);
  assert.match(publish, /target\.source_checksum is null or not exists/i);
  assert.match(publish, /document\.checksum = target\.source_checksum/i);
  assert.match(publish, /document\.expires_at > p_effective_from/i);
});

test('database rejects malformed commercial payout values and slabs', () => {
  const validator =
    migration.match(
      /create or replace function public\.valid_lender_payout_slabs\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(validator, /jsonb_array_length\(p_slabs\) = 0/i);
  assert.match(validator, /current_min <= prior_max/i);
  assert.match(validator, /open_ended_seen/i);
  assert.match(validator, /current_value > 100/i);
  const commercialTable =
    migration.match(
      /create table if not exists public\.lender_commercial_versions \([\s\S]*?\n\);/i
    )?.[0] || '';
  assert.match(
    commercialTable,
    /payout_basis = 'percentage' and payout_value > 0 and payout_value <= 100/i
  );
  assert.match(commercialTable, /public\.valid_lender_payout_slabs\(payout_slab\)/i);
});

test('invoice creation locks reconciliation items before eligibility aggregation', () => {
  const createInvoice =
    migration.match(
      /create or replace function public\.create_lender_invoice\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  const lockPosition = createInvoice.search(
    /from public\.lender_reconciliation_items item[\s\S]*?for update/i
  );
  const aggregatePosition = createInvoice.search(
    /select count\(\*\), coalesce\(sum\(item\.expected_amount\)/i
  );
  assert.ok(lockPosition >= 0, 'invoice function must lock source reconciliation rows');
  assert.ok(
    aggregatePosition > lockPosition,
    'invoice eligibility aggregation must happen after the lock'
  );
  assert.match(createInvoice, /item_count <> array_length\(p_item_ids, 1\)/i);
  assert.match(createInvoice, /subtotal_value \+ tax_value <= 0/i);
  assert.match(createInvoice, /p_due_at is not null and p_due_at <= now\(\)/i);
  assert.match(createInvoice, /p_direction <> 'receivable'/i);
  assert.match(createInvoice, /Lender payout reconciliation can create receivable invoices only/i);
  assert.match(createInvoice, /coalesce\(p_due_at, now\(\) \+ interval '15 days'\)/i);
  assert.match(createInvoice, /insert into public\.lender_invoice_sequences/i);
  assert.match(createInvoice, /on conflict \(fiscal_year\) do update/i);
  assert.match(createInvoice, /lender_invoice_sequences\.last_number \+ 1/i);
  assert.match(
    createInvoice,
    /'LND' \|\| fiscal_year_value \|\| '-' \|\| lpad\(sequence_value::text, 6, '0'\)/i
  );
  assert.match(createInvoice, /register_lender_intelligence_audit\([\s\S]*?'create_invoice'/i);
  assert.ok(
    createInvoice.indexOf('update public.lender_reconciliation_items') <
      createInvoice.indexOf("'create_invoice'")
  );
  assert.doesNotMatch(createInvoice, /md5|gen_random_uuid/i);
});

test('invoice creation freezes issuer and recipient tax identity snapshots', () => {
  const create =
    migration.match(
      /create or replace function public\.create_lender_invoice\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  const guard =
    migration.match(
      /create or replace function public\.protect_lender_invoice_update\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(create, /jsonb_build_object\('legalName', lender\.legal_name/i);
  assert.match(create, /'billingAddress', lender\.billing_address/i);
  assert.match(create, /'gstin', lender\.gstin/i);
  assert.match(create, /'financeEmail', lender\.finance_email/i);
  assert.match(create, /from public\.invoice_settings settings/i);
  assert.match(create, /recipient_snapshot, issuer_snapshot/i);
  assert.match(create, /'billingSnapshotVersion', 1/i);
  assert.match(guard, /new\.recipient_snapshot is distinct from old\.recipient_snapshot/i);
  assert.match(guard, /new\.issuer_snapshot is distinct from old\.issuer_snapshot/i);
});

test('invoice raising is a locked governed transition with due-date and source-item guards', () => {
  const raiseInvoice =
    migration.match(
      /create or replace function public\.raise_lender_invoice\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(raiseInvoice, /where id = p_invoice_id for update/i);
  assert.match(raiseInvoice, /target\.status <> 'draft'/i);
  assert.match(raiseInvoice, /target\.total_amount <= 0/i);
  assert.match(raiseInvoice, /target\.due_at is null or target\.due_at <= now\(\)/i);
  assert.match(raiseInvoice, /item\.invoice_id = target\.id and item\.status = 'invoiced'/i);
  assert.match(raiseInvoice, /status = 'raised', issued_at = now\(\)/i);
  assert.match(raiseInvoice, /register_lender_intelligence_audit\([\s\S]*?'raise_invoice'/i);
});

test('invoice cancellation releases items and appends audit evidence atomically', () => {
  const cancel =
    migration.match(
      /create or replace function public\.cancel_lender_invoice\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(cancel, /update public\.lender_reconciliation_items[\s\S]*?invoice_id = null/i);
  assert.match(cancel, /status = 'cancelled'/i);
  assert.match(cancel, /register_lender_intelligence_audit\([\s\S]*?'cancel_invoice'/i);
  assert.ok(
    cancel.indexOf('update public.lender_reconciliation_items') < cancel.indexOf("'cancel_invoice'")
  );
  assert.ok(cancel.indexOf("status = 'cancelled'") < cancel.indexOf("'cancel_invoice'"));
});

test('invoice payment posting is locked, replay-safe, precision-safe, and supports partial settlement', () => {
  const payment =
    migration.match(
      /create or replace function public\.record_lender_invoice_payment\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(payment, /where id = p_invoice_id for update/i);
  assert.match(payment, /p_amount <> round\(p_amount, 2\)/i);
  assert.match(payment, /idempotency_key = p_idempotency_key/i);
  assert.match(payment, /different payment details/i);
  assert.match(
    payment,
    /p_amount > target\.total_amount - target\.adjustment_amount - target\.paid_amount/i
  );
  assert.match(payment, /then 'paid' else 'part_paid'/i);
  assert.match(payment, /returning id into payment_id_value/i);
  assert.match(payment, /status in \('invoiced', 'part_paid'\)/i);
  assert.match(payment, /order by item\.id[\s\S]*?for update/i);
  assert.match(
    payment,
    /least\(remaining_amount, item_record\.invoiced_amount - item_record\.received_amount\)/i
  );
  assert.match(payment, /insert into public\.lender_invoice_payment_allocations/i);
  assert.match(payment, /received_amount = received_amount \+ allocation_amount/i);
  assert.match(payment, /register_lender_intelligence_audit\([\s\S]*?'record_payment'/i);
  assert.ok(
    payment.indexOf('return target;\n  end if;') < payment.indexOf("'record_payment'"),
    'idempotent replay must return before appending a second audit event'
  );
  assert.match(payment, /Payment cannot be fully allocated to invoice items/i);
  assert.doesNotMatch(payment, /item\.invoiced_amount \* \(new_paid/i);
});

test('invoice headers are conserved against immutable finance ledgers', () => {
  const guard =
    migration.match(
      /create or replace function public\.protect_lender_invoice_update\(\)[\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(
    migration,
    /constraint lender_invoices_total_matches_components[\s\S]*?total_amount = subtotal \+ tax_amount/i
  );
  assert.match(guard, /Invoice identity, source totals, and due date are immutable/i);
  assert.match(guard, /Invalid lender invoice lifecycle transition/i);
  assert.match(guard, /new\.paid_amount <> payment_total/i);
  assert.match(guard, /new\.adjustment_amount <> adjustment_total/i);
  assert.match(guard, /Invoice issuance timestamp is immutable after raising/i);
  assert.match(guard, /Invoice payment reference requires new immutable receipt evidence/i);
  assert.match(guard, /Part-paid invoice requires a genuine open balance/i);
  assert.match(guard, /Paid invoice requires exact settlement evidence/i);
  assert.match(guard, /Cancelled invoice requires zero ledger activity and reason evidence/i);
  assert.match(
    migration,
    /before update or delete on public\.lender_invoices[\s\S]*?protect_lender_invoice_update/i
  );
  const reconciliation =
    migration.match(
      /create or replace function public\.resolve_lender_reconciliation\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(reconciliation, /other\.status = 'disputed' and other\.id <> target\.id/i);
  for (const action of [
    'reconciliation_disputed',
    'reconciliation_paid',
    'reconciliation_invoiced',
    'reconciliation_written_off',
  ]) {
    assert.match(
      reconciliation,
      new RegExp(`register_lender_intelligence_audit\\([\\s\\S]*?'${action}'`, 'i')
    );
  }
});

test('invoice and settlement writes are RPC-only even for service-role clients', () => {
  for (const table of [
    'lender_invoices',
    'lender_invoice_sequences',
    'lender_invoice_payments',
    'lender_invoice_payment_allocations',
    'lender_invoice_adjustments',
  ]) {
    assert.match(
      migration,
      new RegExp(
        `revoke insert, update, delete, truncate on public\\.${table} from public, anon, authenticated, service_role`,
        'i'
      )
    );
    assert.match(migration, new RegExp(`grant select on public\\.${table} to service_role`, 'i'));
  }
});

test('finance workflows require canonical authenticated operational provenance', () => {
  const expectations = [
    'create_lender_invoice',
    'raise_lender_invoice',
    'set_manual_lender_payout',
    'record_lender_invoice_payment',
    'resolve_lender_reconciliation',
    'cancel_lender_invoice',
  ];
  const verifier =
    migration.match(
      /create or replace function public\.require_lender_intelligence_actor\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(verifier, /p_user_id is null or not exists.*auth\.users/is);
  for (const name of expectations) {
    const definitions = [
      ...migration.matchAll(
        new RegExp(`create or replace function public\\.${name}\\([\\s\\S]*?\\n\\$\\$;`, 'gi')
      ),
    ];
    const workflow = definitions.at(-1)?.[0] || '';
    assert.match(
      workflow,
      /perform public\.require_lender_intelligence_actor\(p_user_id\)/i,
      `${name} must verify its actor`
    );
  }
});

test('commercial review workflows require canonical maker and checker identities', () => {
  for (const [name, parameter] of [
    ['submit_lender_commercial', 'p_maker_user_id'],
    ['reject_lender_commercial', 'p_checker_user_id'],
    ['activate_lender_commercial', 'p_checker_user_id'],
  ]) {
    const workflow =
      migration.match(
        new RegExp(`create or replace function public\\.${name}\\([\\s\\S]*?\\n\\$\\$;`, 'i')
      )?.[0] || '';
    assert.match(
      workflow,
      new RegExp(`perform public\\.require_lender_intelligence_actor\\(${parameter}\\)`, 'i')
    );
  }
});

test('the principal policy lifecycle commits immutable audit evidence atomically', () => {
  for (const [name, action] of [
    ['create_lender_policy_draft', 'create_policy_draft'],
    ['submit_lender_policy', 'submit_policy'],
    ['reject_lender_policy', 'reject_policy'],
    ['publish_lender_policy', 'publish_policy'],
    ['retire_lender_policy', 'retire_policy'],
    ['discard_lender_policy_draft', 'discard_policy_draft'],
  ]) {
    const workflow =
      migration.match(
        new RegExp(`create or replace function public\\.${name}\\([\\s\\S]*?\\n\\$\\$;`, 'i')
      )?.[0] || '';
    assert.match(
      workflow,
      new RegExp(`register_lender_intelligence_audit\\([\\s\\S]*?'${action}'`, 'i')
    );
  }
});

test('policy restoration and rule replacement commit content with atomic audit evidence', () => {
  const restoration =
    migration.match(
      /create or replace function public\.create_lender_policy_restoration\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  const replacement =
    migration.match(
      /create or replace function public\.replace_lender_policy_rules\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(restoration, /get diagnostics copied_rule_count = row_count/i);
  assert.match(
    restoration,
    /register_lender_intelligence_audit\([\s\S]*?'create_policy_restoration'/i
  );
  assert.match(restoration, /'copiedRuleCount', copied_rule_count/i);
  assert.match(replacement, /select \* into policy[\s\S]*?for update/i);
  assert.match(replacement, /register_lender_intelligence_audit\([\s\S]*?'replace_policy_rules'/i);
  assert.match(replacement, /'ruleCount', jsonb_array_length\(p_rules\)/i);
});

test('the complete commercial lifecycle commits immutable audit evidence atomically', () => {
  for (const [name, action] of [
    ['create_lender_commercial_draft', 'create_commercial_draft'],
    ['submit_lender_commercial', 'submit_commercial'],
    ['reject_lender_commercial', 'reject_commercial'],
    ['activate_lender_commercial', 'activate_commercial'],
    ['terminate_lender_commercial', 'terminate_commercial'],
    ['discard_lender_commercial_draft', 'discard_commercial_draft'],
  ]) {
    const workflow =
      migration.match(
        new RegExp(`create or replace function public\\.${name}\\([\\s\\S]*?\\n\\$\\$;`, 'i')
      )?.[0] || '';
    assert.match(
      workflow,
      new RegExp(`register_lender_intelligence_audit\\([\\s\\S]*?'${action}'`, 'i')
    );
  }
});

test('policy routing onboarding compliance document and clawback workflows verify canonical actors', () => {
  const expectations = [
    ['commit_lender_selection', 'p_actor_user_id'],
    ['reroute_crm_application', 'p_actor_user_id'],
    ['transition_lender_application', 'p_actor_user_id'],
    ['replace_lender_policy_rules', 'p_user_id'],
    ['manage_lender_data_quality_issue', 'p_user_id'],
    ['set_lender_operating_status', 'p_user_id'],
    ['create_lender_policy_restoration', 'p_maker_user_id'],
    ['reject_lender_policy', 'p_checker_user_id'],
    ['publish_lender_policy', 'p_checker_user_id'],
    ['register_lender_routing_decision', 'p_actor_user_id'],
    ['request_lender_routing_exception', 'p_requester_user_id'],
    ['review_lender_routing_exception', 'p_reviewer_user_id'],
    ['register_lender_clawback', 'p_user_id'],
    ['resolve_lender_clawback', 'p_user_id'],
    ['register_lender_policy_document', 'p_user_id'],
    ['set_lender_program_operating_status', 'p_user_id'],
    ['set_lender_program_daily_capacity', 'p_user_id'],
    ['get_lender_program_daily_capacity_usage', 'p_actor_user_id'],
    ['save_lender_master', 'p_user_id'],
    ['save_lender_program', 'p_user_id'],
    ['bulk_import_lender_programs', 'p_user_id'],
    ['create_lender_policy_draft', 'p_maker_user_id'],
    ['submit_lender_policy', 'p_maker_user_id'],
    ['create_lender_commercial_draft', 'p_maker_user_id'],
    ['save_lender_rejection_reason', 'p_user_id'],
    ['terminate_lender_commercial', 'p_user_id'],
    ['retire_lender_policy', 'p_user_id'],
    ['discard_lender_policy_draft', 'p_user_id'],
    ['discard_lender_commercial_draft', 'p_user_id'],
  ];
  for (const [name, parameter] of expectations) {
    const definitions = [
      ...migration.matchAll(
        new RegExp(`create or replace function public\\.${name}\\([\\s\\S]*?\\n\\$\\$;`, 'gi')
      ),
    ];
    const workflow = definitions.at(-1)?.[0] || '';
    assert.match(
      workflow,
      new RegExp(`perform public\\.require_lender_intelligence_actor\\(${parameter}\\)`, 'i'),
      `${name} must verify its actor`
    );
  }
});

test('manual compliance scan binds canonical actor and audit in one database transaction', () => {
  const workflow =
    migration.match(
      /create or replace function public\.refresh_lender_data_quality_issues_as_actor\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(workflow, /require_lender_intelligence_actor\(p_user_id\)/i);
  assert.match(workflow, /refresh_lender_data_quality_issues\(\)/i);
  assert.match(workflow, /register_lender_intelligence_audit\([\s\S]*?'refresh_data_quality'/i);
});

test('routing recommendation registration is idempotent, evidence-bound, and RPC-only', () => {
  const register =
    migration.match(
      /create or replace function public\.register_lender_routing_decision\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(register, /report\.partner_id = p_partner_id/i);
  assert.match(register, /report\.lead_id = p_lead_id/i);
  assert.match(register, /jsonb_typeof\(p_input_snapshot\) <> 'object'/i);
  assert.match(register, /jsonb_typeof\(p_result_snapshot\) <> 'array'/i);
  assert.match(register, /octet_length\(p_input_snapshot::text\) > 1048576/i);
  assert.match(register, /octet_length\(p_result_snapshot::text\) > 2097152/i);
  assert.match(register, /jsonb_array_length\(p_result_snapshot\) > 500/i);
  assert.match(register, /Eligibility report already has different routing evidence/i);
  assert.match(
    register,
    /register_lender_intelligence_audit\([\s\S]*?'register_routing_decision'/i
  );
  assert.match(migration, /idx_lender_routing_one_report_snapshot[\s\S]*?application_id is null/i);
  assert.match(
    migration,
    /revoke insert, update, delete, truncate on public\.lender_routing_decisions from public, anon, authenticated, service_role/i
  );
});

test('consent evidence is immutable and required across routing and submission boundaries', () => {
  const register =
    migration.match(
      /create or replace function public\.register_lender_routing_decision\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  const selection =
    migration.match(
      /create or replace function public\.commit_lender_selection\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  const reroute =
    migration.match(
      /create or replace function public\.reroute_crm_application\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(migration, /add column if not exists consent_given boolean not null default false/i);
  assert.match(migration, /crm_eligibility_reports_consent_evidence_check/i);
  assert.match(migration, /create trigger protect_crm_eligibility_consent_mutation/i);
  assert.match(migration, /Eligibility consent evidence is immutable/i);
  assert.match(migration, /foreign key \(consent_captured_by\) references auth\.users\(id\)/i);
  for (const workflow of [register, selection, reroute]) {
    assert.match(workflow, /report\.consent_given and report\.consent_at is not null/i);
    assert.match(
      workflow,
      /report\.consent_version is not null and report\.consent_purpose is not null/i
    );
    assert.match(workflow, /report\.consent_captured_by is not null/i);
  }
});

test('consent withdrawal is append-only, actor-bound, audited, and blocks routing', () => {
  const withdrawal =
    migration.match(
      /create or replace function public\.withdraw_lender_eligibility_consent\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(withdrawal, /require_lender_intelligence_actor\(p_actor_user_id\)/i);
  assert.match(withdrawal, /from public\.crm_eligibility_reports[\s\S]*?for update/i);
  assert.match(withdrawal, /insert into public\.lender_consent_withdrawals/i);
  assert.match(
    withdrawal,
    /register_lender_intelligence_audit\([\s\S]*?'withdraw_eligibility_consent'/i
  );
  assert.match(
    migration,
    /revoke insert, update, delete, truncate on public\.lender_consent_withdrawals from public, anon, authenticated, service_role/i
  );
  assert.equal(
    (
      migration.match(
        /not exists \(select 1 from public\.lender_consent_withdrawals withdrawal/g
      ) || []
    ).length,
    3
  );
});

test('routing exception request and review writes are locked behind governed RPCs', () => {
  const request =
    migration.match(
      /create or replace function public\.request_lender_routing_exception\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  const review =
    migration.match(
      /create or replace function public\.review_lender_routing_exception\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(
    request,
    /where id = p_routing_decision_id and partner_id = p_partner_id for update/i
  );
  assert.match(request, /decision\.application_id is not null/i);
  assert.match(request, /jsonb_array_elements\(decision\.result_snapshot\)/i);
  assert.match(
    request,
    /set status = 'expired'[\s\S]*?reviewed_at <= now\(\) - interval '24 hours'/i
  );
  assert.match(request, /'expiredPriorApprovals', expired_prior/i);
  assert.match(request, /status in \('pending', 'approved'\)/i);
  assert.match(review, /where id = p_exception_id for update/i);
  assert.match(review, /target\.requested_by = p_reviewer_user_id/i);
  assert.match(request, /register_lender_intelligence_audit\([\s\S]*?'request_exception'/i);
  assert.match(review, /register_lender_intelligence_audit\([\s\S]*?p_decision \|\| '_exception'/i);
  assert.match(
    migration,
    /revoke insert, update, delete, truncate on public\.lender_routing_exceptions from public, anon, authenticated, service_role/i
  );
});

test('application stage and outcome evidence can only be written by governed database workflows', () => {
  for (const table of ['application_stage_events', 'lender_outcomes']) {
    assert.match(
      migration,
      new RegExp(
        `revoke insert, update, delete, truncate on public\\.${table} from public, anon, authenticated, service_role`,
        'i'
      )
    );
    assert.match(migration, new RegExp(`grant select on public\\.${table} to service_role`, 'i'));
  }
  const transition =
    migration.match(
      /create or replace function public\.transition_lender_application\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(transition, /update public\.crm_lender_applications set status = p_to_stage/i);
  assert.match(transition, /insert into public\.application_stage_events/i);
  assert.match(transition, /insert into public\.lender_outcomes/i);
  assert.match(transition, /octet_length\(p_status_history::text\) > 1048576/i);
  assert.match(transition, /p_occurred_at > now\(\) \+ interval '5 minutes'/i);
  assert.match(transition, /p_occurred_at < application\.created_at/i);
  assert.match(transition, /p_approved_roi, 0\) > 100/i);
  assert.match(transition, /p_approved_tenure_months, 0\) > 1200/i);
  assert.match(transition, /register_lender_intelligence_audit\([\s\S]*?'application_transition'/i);
});

test('governed CRM applications cannot bypass immutable identity or lifecycle evidence', () => {
  const guard =
    migration.match(
      /create or replace function public\.protect_governed_crm_application\(\)[\s\S]*?\n\$\$;/i
    )?.[0] || '';
  const selection =
    migration.match(
      /create or replace function public\.commit_lender_selection\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  const reroute =
    migration.match(
      /create or replace function public\.reroute_crm_application\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  const transition =
    migration.match(
      /create or replace function public\.transition_lender_application\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(guard, /from public\.lender_routing_decisions/i);
  assert.match(guard, /from public\.application_stage_events/i);
  assert.match(guard, /from public\.lender_outcomes/i);
  assert.match(guard, /from public\.lender_reconciliation_items/i);
  assert.match(guard, /Governed lender application evidence cannot be deleted/i);
  for (const field of [
    'partner_id',
    'lead_id',
    'customer_name',
    'mobile',
    'lender_name',
    'product',
    'loan_amount',
    'created_by',
    'created_at',
  ]) {
    assert.match(guard, new RegExp(`new\\.${field} is distinct from old\\.${field}`, 'i'));
  }
  for (const field of ['status', 'status_history', 'lender_history', 'rejection_reason']) {
    assert.match(guard, new RegExp(`new\\.${field} is distinct from old\\.${field}`, 'i'));
  }
  assert.match(
    reroute,
    /set_config\('app\.li_governed_application_write', 'on', true\)[\s\S]*?update public\.crm_lender_applications/i
  );
  assert.match(
    transition,
    /set_config\('app\.li_governed_application_write', 'on', true\)[\s\S]*?update public\.crm_lender_applications/i
  );
  assert.doesNotMatch(selection, /set_config\('app\.li_governed_application_write'/i);
  assert.match(
    migration,
    /create trigger protect_governed_crm_application_mutation[\s\S]*?before update or delete on public\.crm_lender_applications/i
  );
});

test('similar-profile performance is anonymized, sample-gated, and descriptive only', () => {
  const profile =
    migration.match(
      /create or replace function public\.get_lender_profile_performance\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(profile, /'score_band'::text as dimension/i);
  assert.match(profile, /'income_band'/i);
  assert.match(profile, /'loan_band'/i);
  assert.match(profile, /'employment'/i);
  assert.match(profile, /terminal >= greatest\(p_min_sample, 1\)/i);
  assert.match(profile, /'mode', 'descriptive_only'/i);
  assert.match(profile, /'fallback', 'deterministic_policy_routing'/i);
  assert.doesNotMatch(profile, /name|mobile|email|pan|bureau/i);
  assert.match(
    migration,
    /revoke all on function public\.get_lender_profile_performance\(timestamptz, timestamptz, integer\) from public/i
  );
});

test('payout reconciliation ledger is service-client read-only and workflow-owned', () => {
  assert.match(
    migration,
    /revoke insert, update, delete, truncate on public\.lender_reconciliation_items from public, anon, authenticated, service_role/i
  );
  assert.match(migration, /grant select on public\.lender_reconciliation_items to service_role/i);
  for (const functionName of [
    'transition_lender_application',
    'set_manual_lender_payout',
    'create_lender_invoice',
    'record_lender_invoice_payment',
    'resolve_lender_reconciliation',
    'cancel_lender_invoice',
  ]) {
    const workflow =
      migration.match(
        new RegExp(
          `create or replace function public\\.${functionName}\\([\\s\\S]*?\\n\\$\\$;`,
          'i'
        )
      )?.[0] || '';
    assert.match(
      workflow,
      /security definer/i,
      `${functionName} must retain owner-authorized ledger writes`
    );
  }
});

test('clawbacks are recalculated, row-locked, and RPC-only', () => {
  const register =
    migration.match(
      /create or replace function public\.register_lender_clawback\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  const resolve =
    migration.match(
      /create or replace function public\.resolve_lender_clawback\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(register, /where id = p_reconciliation_item_id for update/i);
  assert.match(register, /item\.status <> 'paid'/i);
  assert.match(register, /Clawback requires a paid payout/i);
  assert.match(register, /commercial\.clawback_terms->>'windowDays'/i);
  assert.match(
    register,
    /recoverable_payout := least\(item\.expected_amount, item\.received_amount\)/i
  );
  assert.match(register, /when 'full' then recoverable_payout/i);
  assert.match(
    register,
    /when 'percentage' then least\(recoverable_payout, recoverable_payout \* term_value \/ 100\)/i
  );
  assert.match(register, /when 'fixed' then least\(recoverable_payout, term_value\)/i);
  assert.match(register, /register_lender_intelligence_audit\([\s\S]*?'register_clawback'/i);
  const resolveWorkflow =
    migration.match(
      /create or replace function public\.resolve_lender_clawback\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(resolveWorkflow, /p_status = 'recovered'.*p_recovery_reference/is);
  assert.match(
    resolveWorkflow,
    /recovered_amount = case when p_status = 'recovered' then amount/is
  );
  assert.match(resolveWorkflow, /recovery_reference = case when p_status = 'recovered'/is);
  assert.match(
    resolveWorkflow,
    /register_lender_intelligence_audit\([\s\S]*?'resolve_clawback_' \|\| p_status/i
  );
  assert.match(
    migration,
    /new\.status = 'recovered'.*new\.recovered_amount is distinct from new\.amount/is
  );
  assert.match(resolve, /where id = p_clawback_id for update/i);
  assert.match(resolve, /target\.status <> 'open'/i);
  assert.match(
    migration,
    /revoke insert, update, delete, truncate on public\.lender_clawbacks from public, anon, authenticated, service_role/i
  );
});

test('compliance findings are scanner-owned and lifecycle-managed only', () => {
  assert.match(
    migration,
    /revoke insert, update, delete, truncate on public\.lender_data_quality_issues from public, anon, authenticated, service_role/i
  );
  assert.match(migration, /grant select on public\.lender_data_quality_issues to service_role/i);
  for (const functionName of [
    'refresh_lender_data_quality_issues',
    'manage_lender_data_quality_issue',
  ]) {
    const workflow =
      migration.match(
        new RegExp(
          `create or replace function public\\.${functionName}\\([\\s\\S]*?\\n\\$\\$;`,
          'i'
        )
      )?.[0] || '';
    assert.match(workflow, /security definer/i);
  }
  const lifecycle =
    migration.match(
      /create or replace function public\.manage_lender_data_quality_issue\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(lifecycle, /where id = p_issue_id for update/i);
  assert.match(lifecycle, /p_action = 'claim'/i);
  assert.match(lifecycle, /p_action in \('resolve', 'accept'\)/i);
  assert.match(lifecycle, /p_action = 'reopen'/i);
  assert.match(lifecycle, /Invalid compliance issue action/i);
  assert.match(lifecycle, /previous_status := target\.status/i);
  assert.match(
    lifecycle,
    /register_lender_intelligence_audit\([\s\S]*?'data_quality_' \|\| p_action/i
  );
});

test('audit writes use canonical actor identity and a private bounded RPC', () => {
  const audit =
    migration.match(
      /create or replace function public\.register_lender_intelligence_audit\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(audit, /from auth\.users where id = p_actor_user_id/i);
  assert.match(
    audit,
    /p_module not in \('onboarding', 'policy', 'routing', 'outcomes', 'commercials', 'partner_commissions', 'invoicing', 'compliance'\)/i
  );
  assert.match(audit, /octet_length\(coalesce\(p_metadata, '\{\}'::jsonb\)::text\) > 65536/i);
  assert.match(
    migration,
    /revoke insert, update, delete, truncate on public\.lender_intelligence_audit_logs from public, anon, authenticated, service_role/i
  );
  assert.match(
    migration,
    /grant select on public\.lender_intelligence_audit_logs to service_role/i
  );
});

test('private policy document metadata is relationship-bound and RPC-only', () => {
  const register =
    migration.match(
      /create or replace function public\.register_lender_policy_document\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(register, /program\.lender_id = p_lender_id/i);
  assert.match(register, /policy_record\.program_id <> p_program_id/i);
  assert.match(register, /p_storage_path not like \(p_lender_id::text \|\| '\/%'\)/i);
  assert.match(register, /p_checksum !~ '\^\[0-9a-f\]\{64\}\$'/i);
  assert.match(register, /p_expires_at <= now\(\)/i);
  assert.match(register, /update public\.lender_policy_versions set source_checksum = p_checksum/i);
  assert.match(register, /register_lender_intelligence_audit\([\s\S]*?'upload_document'/i);
  assert.match(
    migration,
    /revoke insert, update, delete, truncate on public\.lender_policy_documents from public, anon, authenticated, service_role/i
  );
});

test('program lifecycle is row-locked, terminal-aware, and freezes governed content', () => {
  const guard =
    migration.match(
      /create or replace function public\.protect_lender_program_master\(\)[\s\S]*?\n\$\$;/i
    )?.[0] || '';
  const operating =
    migration.match(
      /create or replace function public\.set_lender_program_operating_status\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(guard, /Program ownership and provenance are immutable/i);
  assert.match(guard, /old\.status <> 'draft'/i);
  assert.match(guard, /Governed program content is immutable outside draft/i);
  assert.match(guard, /old\.status = 'retired' and new\.status <> 'retired'/i);
  assert.match(guard, /Invalid lender program lifecycle transition/i);
  assert.match(operating, /where id = p_program_id for update/i);
  assert.match(
    migration,
    /before update on public\.lender_programs[\s\S]*?protect_lender_program_master\(\)/i
  );
});

test('manual custom payouts require evidence and become invoice-ready under a row lock', () => {
  const manualPayout =
    migration.match(
      /create or replace function public\.set_manual_lender_payout\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(manualPayout, /where id = p_item_id for update/i);
  assert.match(manualPayout, /p_amount <= 0/i);
  assert.match(manualPayout, /length\(btrim\(coalesce\(p_reason, ''\)\)\) < 5/i);
  assert.match(manualPayout, /target\.status <> 'unbilled'/i);
  assert.match(manualPayout, /commercial\.payout_basis <> 'custom'/i);
  assert.match(manualPayout, /tax_terms->>'reverseCharge'/i);
  assert.match(manualPayout, /status = 'invoice_ready'/i);
  assert.match(manualPayout, /register_lender_intelligence_audit\([\s\S]*?'set_manual_payout'/i);
});

test('partner commissions use a separate governed payable ledger', () => {
  for (const table of [
    'partner_payout_profile_versions',
    'partner_commission_versions',
    'partner_commission_items',
    'partner_commission_payments',
    'partner_commission_payment_requests',
  ]) {
    assert.match(migration, new RegExp(`create table if not exists public\\.${table}`, 'i'));
  }
  assert.match(migration, /partner_commission_items[\s\S]*outcome_id uuid not null unique/i);
  assert.match(
    migration,
    /payout_profile_version_id uuid not null references public\.partner_payout_profile_versions/i
  );
  assert.match(migration, /beneficiary_snapshot jsonb not null/i);
  assert.match(migration, /net_payable = gross_commission \+ tax_amount - withholding_amount/i);
  assert.match(
    migration,
    /create trigger materialize_partner_commission_after_outcome[\s\S]*after insert on public\.lender_outcomes/i
  );
  const materialize =
    migration.match(
      /create or replace function public\.materialize_partner_commission\(\)[\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(materialize, /new\.outcome <> 'disbursed'/i);
  assert.match(
    materialize,
    /payout_event_at := coalesce\(new\.disbursed_at, new\.decided_at\)[\s\S]*v\.status='active'[\s\S]*v\.effective_from <= payout_event_at/i
  );
  assert.match(materialize, /terms_snapshot/i);
  const review =
    migration.match(
      /create or replace function public\.review_partner_commission\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(review, /Maker and checker must be different admins/i);
  assert.match(
    review,
    /A verified partner payout profile is required before commission activation/i
  );
  assert.match(review, /set_config\('app\.li_partner_commission_write','on',true\)/i);
  const payment =
    migration.match(
      /create or replace function public\.record_partner_commission_payment\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(payment, /Idempotency key conflicts with existing payment/i);
  assert.match(payment, /target\.paid_amount\+p_amount>target\.net_payable/i);
  assert.match(payment, /register_lender_intelligence_audit[\s\S]*record_commission_payment/i);
  const requestPayment =
    migration.match(
      /create or replace function public\.request_partner_commission_payment\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(requestPayment, /Resolve the existing payment request for this payable first/i);
  const reviewPayment =
    migration.match(
      /create or replace function public\.review_partner_commission_payment\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(reviewPayment, /Payment maker and checker must be different admins/i);
  assert.match(reviewPayment, /request_record\.amount>item\.net_payable/i);
  assert.match(reviewPayment, /public\.record_partner_commission_payment/i);
  const terminate =
    migration.match(
      /create or replace function public\.terminate_partner_commission\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(terminate, /Only a currently active commission can be terminated/i);
  assert.match(terminate, /register_lender_intelligence_audit[\s\S]*terminate_commission/i);
  const manage =
    migration.match(
      /create or replace function public\.manage_partner_commission_item\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(manage, /p_action in \('hold','dispute'\)/i);
  assert.match(manage, /p_action='release'/i);
  assert.match(manage, /p_action='write_off'/i);
  const scan =
    migration.match(
      /create or replace function public\.refresh_partner_commission_issues\(\)[\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(scan, /partner_payable_overdue/i);
  assert.match(scan, /item\.due_at<now\(\)/i);
  const profile =
    migration.match(
      /create or replace function public\.create_partner_payout_profile_draft\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(profile, /pan_last4/i);
  assert.match(profile, /account_number_last4/i);
  assert.doesNotMatch(profile, /account_number[^_]/i);
  const profileReview =
    migration.match(
      /create or replace function public\.review_partner_payout_profile\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(profileReview, /Maker and checker must be different admins/i);
  assert.match(
    migration,
    /revoke all on table public\.partner_payout_profile_versions,public\.partner_commission_versions,public\.partner_commission_items,public\.partner_commission_payments,public\.partner_commission_payment_requests from anon,authenticated,service_role/i
  );
  const commissionGrants =
    migration.match(
      /grant execute on function public\.create_partner_payout_profile_draft[\s\S]*?to service_role;/i
    )?.[0] || '';
  assert.doesNotMatch(commissionGrants, /record_partner_commission_payment/);
});

test('partner commission materialization uses the canonical disbursal timestamp', () => {
  const materialize =
    migration.match(
      /create or replace function public\.materialize_partner_commission\(\)[\s\S]*?end; \$\$;/i
    )?.[0] || '';
  assert.match(materialize, /payout_event_at := coalesce\(new\.disbursed_at, new\.decided_at\)/i);
  assert.match(materialize, /v\.effective_from <= payout_event_at/i);
  assert.match(materialize, /payout_event_at\+make_interval\(days=>terms\.payment_terms_days\)/i);
  assert.doesNotMatch(materialize, /v\.effective_from <= new\.decided_at/i);
});

test('partner commission recoveries are paid-capped, maker-checker, audited and immutable', () => {
  assert.match(migration, /create table if not exists public\.partner_commission_recoveries/i);
  assert.match(
    migration,
    /alter table public\.partner_commission_recoveries enable row level security/i
  );
  const register =
    migration.match(
      /create or replace function public\.register_partner_commission_recovery\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(register, /where id=p_item_id for update/i);
  assert.match(register, /item\.paid_amount<=0/i);
  assert.match(register, /status in \('open','disputed','recovered'\)/i);
  assert.match(register, /committed\+p_amount>item\.paid_amount/i);
  assert.match(register, /register_lender_intelligence_audit[\s\S]*?'register_partner_recovery'/i);
  const resolve =
    migration.match(
      /create or replace function public\.resolve_partner_commission_recovery\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(resolve, /where id=p_recovery_id for update/i);
  assert.match(resolve, /target\.requested_by=p_user_id/i);
  assert.match(resolve, /p_status not in \('disputed','recovered','waived'\)/i);
  assert.match(resolve, /Collection reference is required/i);
  assert.match(resolve, /register_lender_intelligence_audit[\s\S]*?'resolve_partner_recovery_'/i);
  assert.match(
    migration,
    /protect_partner_commission_recoveries_direct_write[\s\S]*?on public\.partner_commission_recoveries/i
  );
  assert.match(
    migration,
    /revoke all on table public\.partner_commission_recoveries from anon,authenticated,service_role/i
  );
});

test('migration function bodies have balanced dollar quotes', () => {
  assert.equal((migration.match(/\$\$/g) || []).length % 2, 0);
});

test('schema health manifest covers critical tables functions and triggers', () => {
  const health =
    migration.match(
      /create or replace function public\.verify_lender_intelligence_schema\(\)[\s\S]*?\n\$\$;/i
    )?.[0] || '';
  for (const relation of [
    'lender_master',
    'lender_routing_decisions',
    'lender_invoices',
    'partner_payout_profile_versions',
    'partner_commission_items',
    'lender_intelligence_audit_logs',
  ])
    assert.ok(health.includes(`('${relation}')`));
  for (const fn of [
    'save_lender_master',
    'commit_lender_selection',
    'transition_lender_application',
    'record_lender_invoice_payment',
    'record_partner_commission_payment',
  ])
    assert.ok(health.includes(`('${fn}')`));
  for (const [trigger, relation] of [
    ['protect_governed_crm_application_mutation', 'crm_lender_applications'],
    ['trg_append_only_lender_outcomes', 'lender_outcomes'],
    ['materialize_partner_commission_after_outcome', 'lender_outcomes'],
  ])
    assert.ok(health.includes(`('${trigger}','${relation}')`));
  assert.match(
    health,
    /'ready',jsonb_array_length\(missing_relations\.value\)=0[\s\S]*jsonb_array_length\(missing_rls\.value\)=0[\s\S]*jsonb_array_length\(unsafe_privileges\.value\)=0/i
  );
  assert.match(health, /join pg_class c on c\.oid=t\.tgrelid[\s\S]*c\.relname=r\.relation_name/i);
  assert.match(
    migration,
    /revoke all on function public\.verify_lender_intelligence_schema\(\) from public/i
  );
  assert.match(
    migration,
    /grant execute on function public\.verify_lender_intelligence_schema\(\) to service_role/i
  );
});

test('readiness scans preserve claimed ownership and accepted-risk decisions', () => {
  const scan =
    migration.match(
      /create or replace function public\.refresh_lender_data_quality_issues\(\)([\s\S]*?)revoke all on function public\.refresh_lender_data_quality_issues/i
    )?.[1] || '';
  assert.match(scan, /where source = 'system' and status = 'open'/i);
  assert.match(scan, /status in \('in_progress', 'accepted'\)/i);
  assert.match(scan, /status = 'accepted' then lender_data_quality_issues\.resolution_note/i);
  assert.match(scan, /'invoice_overdue'/i);
  assert.match(scan, /invoice\.status in \('raised', 'part_paid', 'disputed'\)/i);
  assert.match(
    scan,
    /invoice\.total_amount - invoice\.adjustment_amount - invoice\.paid_amount > 0/i
  );
  assert.match(scan, /'payout_not_ready'/i);
  assert.match(scan, /item\.commercial_version_id is null then 'critical'/i);
  assert.match(scan, /outcome\.outcome = 'disbursed'/i);
  assert.match(scan, /item\.status = 'unbilled'/i);
  assert.match(scan, /interval '30 days'.*'critical'/is);
  assert.match(scan, /'lender-invoice-overdue:' \|\| invoice\.id::text/i);
});

test('system SLA findings use application identity instead of borrower PII', () => {
  const refresh =
    migration.match(
      /create or replace function public\.refresh_lender_data_quality_issues\(\)[\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(refresh, /'Application ' \|\| application\.id \|\| ' is delayed at '/i);
  assert.doesNotMatch(refresh, /application\.customer_name \|\| ' is delayed/i);
});
