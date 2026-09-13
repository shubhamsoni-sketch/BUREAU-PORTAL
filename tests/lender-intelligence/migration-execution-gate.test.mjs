import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const verifier = readFileSync(
  new URL('../../scripts/verify-lender-intelligence-migration-execution.mjs', import.meta.url),
  'utf8'
);

test('embedded migration gate executes every parsed statement without skip controls', () => {
  assert.match(verifier, /new PGlite\(\)/);
  assert.match(verifier, /for \(const \[index, statement\] of parsed\.stmts\.entries\(\)\)/);
  assert.match(verifier, /await db\.exec\(`\$\{sqlBuffer\.subarray/);
  assert.doesNotMatch(verifier, /SKIP_STATEMENT|continue;/i);
});

test('embedded migration gate verifies schema and governed behavior', () => {
  assert.match(verifier, /verify_lender_intelligence_schema/);
  assert.match(verifier, /value\.ready !== true/);
  assert.match(verifier, /lender_intelligence_permissions/);
  assert.match(verifier, /require_lender_intelligence_actor/);
  assert.match(verifier, /save_lender_master/);
  assert.match(verifier, /save_lender_program/);
  assert.match(verifier, /create_lender_policy_draft/);
  assert.match(verifier, /replace_lender_policy_rules/);
  assert.match(verifier, /submit_lender_policy/);
  assert.match(verifier, /Policy maker self-publication rejection/);
  assert.match(verifier, /publish_lender_policy/);
  assert.match(verifier, /published\.approved_by !== '10000000-0000-4000-8000-000000000002'/);
  assert.match(verifier, /onboarding_status !== 'draft'/);
  assert.match(verifier, /lender_intelligence_audit_logs/);
  assert.match(verifier, /Routing without consent rejection/);
  assert.match(verifier, /register_lender_routing_decision/);
  assert.match(verifier, /commit_lender_selection/);
  assert.match(verifier, /stageCount\.rows\[0\]\?\.count !== 1/);
  assert.match(verifier, /Governed application direct lifecycle mutation rejection/);
  assert.match(verifier, /set role service_role/);
  assert.match(verifier, /permission denied/i);
});

test('embedded journey covers lifecycle progression and the complete lender money path', () => {
  assert.match(verifier, /Commercial maker self-activation rejection/);
  assert.match(verifier, /'case_sent_to_lender','sanctioned'/);
  assert.match(verifier, /'sanctioned','disbursed'/);
  assert.match(verifier, /Number\(money\.expected_amount\) !== 4000/);
  assert.match(verifier, /Number\(money\.tax_amount\) !== 720/);
  assert.match(verifier, /create_lender_invoice/);
  assert.match(verifier, /raise_lender_invoice/);
  assert.match(verifier, /record_lender_invoice_payment/);
  assert.match(verifier, /Idempotent invoice payment created a duplicate receipt/);
});

test('embedded journey covers partner payable materialization and maker-checker settlement', () => {
  assert.match(verifier, /create_partner_payout_profile_draft/);
  assert.match(verifier, /Payout profile maker self-verification rejection/);
  assert.match(verifier, /create_partner_commission_draft/);
  assert.match(verifier, /Partner commission maker self-activation rejection/);
  assert.match(verifier, /Number\(partnerPayable\.net_payable\) !== 2260/);
  assert.match(verifier, /request_partner_commission_payment/);
  assert.match(verifier, /Partner payment maker self-approval rejection/);
  assert.match(verifier, /review_partner_commission_payment/);
  assert.match(verifier, /Partner maker-checker settlement failed/);
});

test('embedded journey covers lender clawback and paid-capped partner recovery', () => {
  assert.match(verifier, /register_lender_clawback/);
  assert.match(verifier, /Number\(clawback\.amount\) !== 4000/);
  assert.match(verifier, /resolve_lender_clawback/);
  assert.match(verifier, /Partner recovery paid-cap rejection/);
  assert.match(verifier, /register_partner_commission_recovery/);
  assert.match(verifier, /Partner recovery maker self-resolution rejection/);
  assert.match(verifier, /resolve_partner_commission_recovery/);
  assert.match(verifier, /Partner recovery resolution failed/);
});

test('embedded journey covers compliance scanning and evidence-preserving issue lifecycle', () => {
  assert.match(verifier, /register_lender_policy_document/);
  assert.match(verifier, /refresh_lender_data_quality_issues_as_actor/);
  assert.match(verifier, /document-expiry:/);
  assert.match(verifier, /manage_lender_data_quality_issue/);
  assert.match(verifier, /Compliance scan did not preserve claimed ownership/);
  assert.match(verifier, /Renewal risk accepted until scheduled lender review/);
  assert.match(verifier, /Compliance scan did not preserve accepted-risk evidence/);
});

test('embedded journey covers canonical rejection outcomes and immutability', () => {
  assert.match(verifier, /Unknown canonical rejection reason denial/);
  assert.match(verifier, /MADE_UP_REASON/);
  assert.match(verifier, /BUREAU_POLICY/);
  assert.match(verifier, /rejection_event_count !== 1/);
  assert.match(verifier, /Canonical rejection outcome failed/);
  assert.match(verifier, /Immutable rejection outcome mutation denial/);
});

test('embedded journey proves service-role RPC execution and critical direct-DML denial', () => {
  assert.match(verifier, /set role service_role/);
  assert.match(verifier, /Service role could not execute the governed schema-health RPC/);
  assert.match(verifier, /refresh_lender_data_quality_issues_as_actor/);
  for (const denial of [
    'Service-role direct lender insert denial',
    'Service-role direct application evidence insert denial',
    'Service-role direct reconciliation mutation denial',
    'Service-role direct audit insert denial',
    'Service-role direct partner payable mutation denial',
  ])
    assert.match(verifier, new RegExp(denial));
  assert.match(verifier, /reset role/);
});
