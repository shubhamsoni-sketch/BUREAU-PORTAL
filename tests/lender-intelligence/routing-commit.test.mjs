import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const eligibilityRoute = readFileSync(
  new URL('../../src/app/api/crm/eligibility-check/route.ts', import.meta.url),
  'utf8'
);
const serverSource = readFileSync(
  new URL('../../src/lib/lender-intelligence/server.ts', import.meta.url),
  'utf8'
);
const routingRoute = readFileSync(
  new URL('../../src/app/api/crm/lender-routing/route.ts', import.meta.url),
  'utf8'
);
const operationsRoute = readFileSync(
  new URL('../../src/app/api/admin-lender-intelligence/operations/route.ts', import.meta.url),
  'utf8'
);
const auditSource = readFileSync(
  new URL('../../src/lib/lender-intelligence/audit.ts', import.meta.url),
  'utf8'
);
const documentsRoute = readFileSync(
  new URL('../../src/app/api/admin-lender-intelligence/documents/route.ts', import.meta.url),
  'utf8'
);
const catalogRoute = readFileSync(
  new URL('../../src/app/api/admin-lender-intelligence/catalog/route.ts', import.meta.url),
  'utf8'
);
const eligibilityUi = readFileSync(
  new URL(
    '../../src/app/crm/eligibility-check/components/EligibilityCheckContent.tsx',
    import.meta.url
  ),
  'utf8'
);
const reportUi = readFileSync(
  new URL(
    '../../src/app/crm/eligibility-report/components/EligibilityReportContent.tsx',
    import.meta.url
  ),
  'utf8'
);
const leadsRoute = readFileSync(
  new URL('../../src/app/api/crm/leads/route.ts', import.meta.url),
  'utf8'
);
const applicationTrackingUi = readFileSync(
  new URL(
    '../../src/app/crm/loan-application-tracking/components/LoanApplicationContent.tsx',
    import.meta.url
  ),
  'utf8'
);
const applicationDetailUi = readFileSync(
  new URL(
    '../../src/app/crm/loan-application-tracking/components/ApplicationDetailPanel.tsx',
    import.meta.url
  ),
  'utf8'
);

test('eligibility requires explicit consent instead of silently asserting it', () => {
  assert.match(eligibilityRoute, /body\.consent !== true/i);
  assert.match(eligibilityRoute, /ELIGIBILITY_CONSENT_VERSION/i);
  assert.match(eligibilityRoute, /consent_source:\s*'operator_attestation'/i);
  assert.match(eligibilityRoute, /consent_captured_by:\s*scope\.userId/i);
  assert.doesNotMatch(eligibilityUi, /consent:\s*true/i);
  assert.match(eligibilityUi, /checked=\{consentConfirmed\}/i);
  assert.match(eligibilityUi, /explicitly authorized profile verification/i);
});

test('CRM exposes the governed consent withdrawal lifecycle', () => {
  const action =
    eligibilityRoute.match(
      /if \(body\.action === 'withdraw_eligibility_consent'\)[\s\S]*?\n    \}/i
    )?.[0] || '';
  assert.match(action, /rpc\('withdraw_lender_eligibility_consent'/i);
  assert.match(action, /p_actor_user_id:\s*scope\.userId/i);
  assert.match(reportUi, /Record consent withdrawal/i);
  assert.match(reportUi, /withdraw_eligibility_consent/i);
  assert.match(reportUi, /new routing blocked/i);
});

test('eligibility recommendations use governed routing registration', () => {
  const save =
    serverSource.match(/export async function saveRoutingDecision[\s\S]*?\n\}/i)?.[0] || '';
  assert.match(save, /rpc\('register_lender_routing_decision'/i);
  assert.doesNotMatch(save, /\.from\('lender_routing_decisions'\)\.insert/i);
});

test('recommendations exclude lenders whose KYC or agreement is no longer current', () => {
  const matcher =
    serverSource.match(/export async function matchPublishedPrograms[\s\S]*?\n\}/i)?.[0] || '';
  assert.match(matcher, /\.eq\('onboarding_status', 'active'\)/i);
  assert.match(matcher, /\.eq\('kyc_status', 'verified'\)/i);
  assert.match(matcher, /\.eq\('agreement_status', 'signed'\)/i);
  assert.match(matcher, /agreement_expires_at\.is\.null,agreement_expires_at\.gt\.\$\{now\}/i);
});

test('recommendations surface real-time daily capacity exhaustion', () => {
  const matcher =
    serverSource.match(/export async function matchPublishedPrograms[\s\S]*?\n\}/i)?.[0] || '';
  assert.match(matcher, /daily_submission_limit/i);
  assert.match(matcher, /rpc\('get_lender_program_daily_capacity_usage'/i);
  assert.match(matcher, /p_actor_user_id:\s*scope\.userId/i);
  assert.match(matcher, /dailyCapacity\.get\(row\.id\)\?\.exhausted/i);
  assert.match(matcher, /\? 'paused'/i);
});

test('routing decision persistence and application transitions are atomically audited', () => {
  const migration = readFileSync(
    new URL(
      '../../supabase/migrations/20260912220000_lender_intelligence_foundation.sql',
      import.meta.url
    ),
    'utf8'
  );
  const routing =
    migration.match(
      /create or replace function public\.register_lender_routing_decision\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  const transition =
    migration.match(
      /create or replace function public\.transition_lender_application\([\s\S]*?\n\$\$;/i
    )?.[0] || '';
  assert.match(
    routing,
    /return existing_decision;[\s\S]*?insert into public\.lender_routing_decisions/i
  );
  assert.match(routing, /register_lender_intelligence_audit\([\s\S]*?'register_routing_decision'/i);
  assert.match(routing, /'resultCount', jsonb_array_length\(created_decision\.result_snapshot\)/i);
  assert.match(transition, /register_lender_intelligence_audit\([\s\S]*?'application_transition'/i);
  assert.match(transition, /'commercialVersionId', commercial\.id/i);
  assert.match(transition, /'expectedPayout', payout/i);
});

test('application transition API rejects oversized or impossible outcome inputs before RPC', () => {
  const transition =
    eligibilityRoute.match(
      /if \(body\.action === 'update_application_status'\)[\s\S]*?if \(body\.action === 'add_application_note'\)/i
    )?.[0] || '';
  assert.match(transition, /note\.length > 2000/i);
  assert.match(transition, /rejectionReasonCode\.length > 50/i);
  assert.match(transition, /\.every\(\s*Number\.isFinite\s*\)/i);
  assert.match(transition, /approvedRoi > 100/i);
  assert.match(transition, /approvedTenureMonths > 1200/i);
  assert.match(transition, /1_000_000_000_000/i);
  assert.match(transition, /Application outcome amounts cannot contain sub-paise precision/i);
  assert.match(transition, /body\.sanctionedAmount, body\.disbursedAmount/i);
  assert.match(transition, /!\/\^\\d\+\(\?:\\\.\\d\{1,2\}\)\?\$\//i);
  assert.match(transition, /Record a canonical sanction before disbursal/i);
  assert.match(transition, /from\('lender_routing_decisions'\)/i);
  assert.match(transition, /A bound lender decision is required before disbursal/i);
  assert.match(transition, /\.eq\('lender_id', boundDecision\.selected_lender_id\)/i);
  assert.match(transition, /\.eq\('program_id', boundDecision\.selected_program_id\)/i);
  assert.match(transition, /Disbursed amount cannot exceed the sanctioned amount/i);
  assert.match(transition, /Approved ROI must be greater than zero/i);
  assert.match(transition, /Approved tenure must be a positive whole number of months/i);
  assert.match(applicationTrackingUi, /Approved annual ROI \(%\)/i);
  assert.match(applicationTrackingUi, /Approved tenure \(months\)/i);
  assert.match(applicationTrackingUi, /Number\.isInteger\(approvedTenureMonths\)/i);
});

test('application rejection capture uses the live scoped canonical taxonomy', () => {
  assert.match(leadsRoute, /from\('lender_rejection_reasons'\)/);
  assert.match(leadsRoute, /\.eq\('active', true\)/);
  assert.match(leadsRoute, /partner_id\.is\.null,partner_id\.eq\.\$\{scope\.partnerId\}/);
  assert.match(leadsRoute, /if \(!items\.has\(reason\.code\)\)/);
  assert.match(leadsRoute, /rejectionReasons,/);
  assert.match(applicationTrackingUi, /setRejectionReasons/);
  assert.match(applicationTrackingUi, /Select a valid active rejection reason/);
  assert.doesNotMatch(applicationTrackingUi, /rejectionReasonCode:\s*'OTHER'/);
  assert.match(applicationDetailUi, /rejectionReasons\.length/);
  assert.match(applicationDetailUi, /rejectionReasons\.some/);
  assert.doesNotMatch(applicationDetailUi, /FALLBACK_REJECTION_REASONS/);
  assert.match(applicationDetailUi, /disabled=\{!rejectionCode \|\| !rejectionDetail\.trim\(\)\}/);
});

test('admin intelligence exposes sample-suppressed similar-profile evidence', () => {
  const adminRoute = readFileSync(
    new URL('../../src/app/api/admin-lender-intelligence/route.ts', import.meta.url),
    'utf8'
  );
  const workspace = readFileSync(
    new URL(
      '../../src/app/admin-lender-intelligence/components/LenderIntelligenceWorkspace.tsx',
      import.meta.url
    ),
    'utf8'
  );
  assert.match(adminRoute, /rpc\('get_lender_profile_performance'/i);
  assert.match(adminRoute, /profilePerformance:/i);
  assert.match(workspace, /Similar-profile performance/i);
  assert.match(workspace, /deterministic\s+policy routing\s+remains authoritative/i);
  assert.match(workspace, /rateValue\(row\.approvalRate\)/i);
});

test('exception request and maker-checker review use governed RPCs', () => {
  assert.match(routingRoute, /rpc\('request_lender_routing_exception'/i);
  assert.doesNotMatch(routingRoute, /from\('lender_routing_exceptions'\)\.insert/i);
  assert.doesNotMatch(routingRoute, /logLenderIntelligenceAudit/i);
  const review =
    operationsRoute.match(
      /if \(action === 'review_exception'\)[\s\S]*?return NextResponse\.json\(\{ success: true, data \}\);/i
    )?.[0] || '';
  assert.match(review, /rpc\('review_lender_routing_exception'/i);
  assert.doesNotMatch(review, /from\('lender_routing_exceptions'\)[\s\S]*?\.update/i);
  assert.doesNotMatch(review, /logLenderIntelligenceAudit/i);
});

test('clawback registration and resolution use governed RPCs', () => {
  assert.match(operationsRoute, /rpc\('register_lender_clawback'/i);
  assert.match(operationsRoute, /rpc\('resolve_lender_clawback'/i);
  assert.match(operationsRoute, /p_recovery_reference:\s*status === 'recovered'/i);
  assert.doesNotMatch(operationsRoute, /from\('lender_clawbacks'\)\s*\.insert/i);
  assert.doesNotMatch(operationsRoute, /from\('lender_clawbacks'\)\s*\.update/i);
  const register =
    operationsRoute.match(
      /if \(action === 'register_clawback'\)[\s\S]*?return NextResponse\.json/i
    )?.[0] || '';
  const resolve =
    operationsRoute.match(
      /if \(action === 'resolve_clawback'\)[\s\S]*?return NextResponse\.json/i
    )?.[0] || '';
  assert.doesNotMatch(register, /logLenderIntelligenceAudit/);
  assert.doesNotMatch(resolve, /logLenderIntelligenceAudit/);
});

test('lender intelligence audit helper cannot directly insert ledger rows', () => {
  assert.match(auditSource, /rpc\('register_lender_intelligence_audit'/i);
  assert.doesNotMatch(auditSource, /from\('lender_intelligence_audit_logs'\)\.insert/i);
});

test('private document upload registers metadata through its governed RPC', () => {
  assert.match(documentsRoute, /hasValidLenderDocumentSignature\(bytes, file\.type\)/i);
  assert.match(documentsRoute, /File contents do not match the declared document type/i);
  assert.match(documentsRoute, /rpc\('register_lender_policy_document'/i);
  const upload = documentsRoute.match(/export async function POST[\s\S]*$/i)?.[0] || '';
  assert.doesNotMatch(upload, /logLenderIntelligenceAudit/i);
  assert.doesNotMatch(documentsRoute, /from\('lender_policy_documents'\)\.insert/i);
  assert.doesNotMatch(
    documentsRoute,
    /from\('lender_policy_versions'\)\.update\(\{ source_checksum:/i
  );
});

test('program operating status uses its row-locking lifecycle RPC', () => {
  const action =
    catalogRoute.match(
      /if \(action === 'set_program_operating_status'\)[\s\S]*?return NextResponse\.json\(\{ success: true, data \}\);/i
    )?.[0] || '';
  assert.match(action, /rpc\('set_lender_program_operating_status'/i);
  assert.doesNotMatch(action, /from\('lender_programs'\)[\s\S]*?\.update/i);
});

test('persisted initial program selection uses the atomic selection RPC and skips legacy writes', () => {
  const selection =
    eligibilityRoute.match(
      /if \(body\.action === 'submit_to_lender'\)[\s\S]*?if \(body\.action === 'update_application_status'\)/
    )?.[0] || '';
  assert.match(selection, /rpc\('commit_lender_selection'/);
  assert.match(selection, /rpc\('reroute_crm_application'/);
  assert.match(selection, /p_eligibility_report_id: eligibilityReport\.id/);
  assert.match(selection, /p_decision_type: decisionType/);
  assert.match(selection, /p_exception_id: approvedExceptionId \|\| null/);
  assert.match(selection, /usedAtomicReroute = true/);
  assert.match(selection, /p_exception_id: approvedExceptionId \|\| null/);
  assert.match(selection, /usedAtomicSelection = true/);
  assert.match(selection, /!usedAtomicReroute && !usedAtomicSelection/);
  assert.doesNotMatch(selection, /selectedProgramId && !usedAtomicSelection && !usedAtomicReroute/);
  assert.doesNotMatch(
    selection,
    /approvedExceptionId && !usedAtomicSelection && !usedAtomicReroute/
  );
});

test('application evidence has no direct-write fallback outside governed RPCs', () => {
  for (const source of [eligibilityRoute, serverSource]) {
    assert.doesNotMatch(source, /from\('lender_routing_decisions'\)[\s\S]{0,240}\.update\(/);
    assert.doesNotMatch(source, /from\('lender_routing_exceptions'\)[\s\S]{0,240}\.update\(/);
    assert.doesNotMatch(source, /from\('application_stage_events'\)[\s\S]{0,120}\.insert\(/);
    assert.doesNotMatch(source, /from\('lender_outcomes'\)[\s\S]{0,120}\.upsert\(/);
    assert.doesNotMatch(source, /from\('lender_reconciliation_items'\)[\s\S]{0,120}\.upsert\(/);
  }
  assert.match(eligibilityRoute, /idempotent: true/);
});
