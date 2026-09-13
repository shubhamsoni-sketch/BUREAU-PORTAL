import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const operations = readFileSync(
  new URL('../../src/app/api/admin-lender-intelligence/operations/route.ts', import.meta.url),
  'utf8'
);
const workspace = readFileSync(
  new URL(
    '../../src/app/admin-lender-intelligence/components/LenderFinanceWorkspace.tsx',
    import.meta.url
  ),
  'utf8'
);

test('commercial draft creation uses the governed database workflow', () => {
  const create =
    operations.match(
      /if \(action === 'create_commercial_draft'\)[\s\S]*?if \(action === 'submit_commercial'\)/
    )?.[0] || '';
  assert.match(create, /rpc\('create_lender_commercial_draft'/);
  assert.match(create, /p_maker_user_id: auth\.user\.id/);
  assert.doesNotMatch(create, /\.from\('lender_commercial_versions'\)[\s\S]*?\.insert/);
});

test('commercial termination is available through the governed API and finance UI', () => {
  const terminate =
    operations.match(
      /if \(action === 'terminate_commercial'\)[\s\S]*?return NextResponse\.json\(\{ success: true, data \}\);/
    )?.[0] || '';
  assert.match(terminate, /rpc\('terminate_lender_commercial'/);
  assert.match(terminate, /p_reason: reason/);
  assert.match(terminate, /p_user_id: auth\.user\.id/);
  assert.doesNotMatch(terminate, /logLenderIntelligenceAudit/);
  assert.match(workspace, /terminateCommercial/);
  assert.match(workspace, />\s*Terminate\s*</);
});

test('commercial drafts can be discarded through an audited workflow', () => {
  assert.match(operations, /rpc\('discard_lender_commercial_draft'/);
  assert.match(workspace, /discardCommercialDraft/);
  assert.match(workspace, />\s*Discard\s*</);
});

test('commercial lifecycle APIs rely only on their atomic database audits', () => {
  const actions = [
    'create_commercial_draft',
    'submit_commercial',
    'reject_commercial',
    'activate_commercial',
    'terminate_commercial',
    'discard_commercial_draft',
  ];
  for (let index = 0; index < actions.length; index += 1) {
    const start = operations.indexOf(`if (action === '${actions[index]}')`);
    const end =
      index + 1 < actions.length
        ? operations.indexOf(`if (action === '${actions[index + 1]}')`, start)
        : operations.indexOf("if (action === 'create_invoice')", start);
    const workflow = operations.slice(start, end);
    assert.ok(start >= 0 && end > start, `${actions[index]} API branch must exist`);
    assert.match(workflow, /\.rpc\(/);
    assert.doesNotMatch(workflow, /logLenderIntelligenceAudit/);
  }
  const submitStart = operations.indexOf("if (action === 'submit_commercial')");
  const submitEnd = operations.indexOf("if (action === 'reject_commercial')", submitStart);
  assert.doesNotMatch(
    operations.slice(submitStart, submitEnd),
    /\.from\('lender_commercial_versions'\)/
  );
});

test('clawback action is exposed only for actually paid reconciliation items', () => {
  assert.match(workspace, /item\.status === 'paid'\s*&&\s*\(/);
  assert.doesNotMatch(workspace, /\['paid', 'written_off'\]\.includes\(item\.status\)/);
});

test('manual compliance refresh uses its actor-bound atomic workflow', () => {
  const refresh =
    operations.match(
      /if \(action === 'refresh_data_quality'\)[\s\S]*?return NextResponse\.json/i
    )?.[0] || '';
  assert.match(refresh, /rpc\('refresh_lender_data_quality_issues_as_actor'/);
  assert.match(refresh, /p_user_id:\s*auth\.user\.id/);
  assert.doesNotMatch(refresh, /logLenderIntelligenceAudit/);
});

test('invoice payment posting relies on its atomic database audit', () => {
  const payment =
    operations.match(/if \(action === 'record_payment'\)[\s\S]*?return NextResponse\.json/i)?.[0] ||
    '';
  assert.match(payment, /rpc\('record_lender_invoice_payment'/);
  assert.doesNotMatch(payment, /logLenderIntelligenceAudit/);
});

test('invoice creation relies on its atomic database audit', () => {
  const create =
    operations.match(/if \(action === 'create_invoice'\)[\s\S]*?return NextResponse\.json/i)?.[0] ||
    '';
  assert.match(create, /rpc\('create_lender_invoice'/);
  assert.match(create, /p_direction:\s*'receivable'/i);
  assert.doesNotMatch(create, /body\.direction/i);
  assert.doesNotMatch(create, /logLenderIntelligenceAudit/);
});

test('invoice raising relies on its atomic database audit', () => {
  const raise =
    operations.match(/if \(action === 'raise_invoice'\)[\s\S]*?return NextResponse\.json/i)?.[0] ||
    '';
  assert.match(raise, /rpc\('raise_lender_invoice'/);
  assert.doesNotMatch(raise, /logLenderIntelligenceAudit/);
});

test('invoice cancellation relies on its atomic database audit', () => {
  const cancel =
    operations.match(/if \(action === 'cancel_invoice'\)[\s\S]*?return NextResponse\.json/i)?.[0] ||
    '';
  assert.match(cancel, /rpc\('cancel_lender_invoice'/);
  assert.doesNotMatch(cancel, /logLenderIntelligenceAudit/);
});

test('manual payout valuation relies on its atomic database audit', () => {
  const payout =
    operations.match(
      /if \(action === 'set_manual_payout'\)[\s\S]*?return NextResponse\.json/i
    )?.[0] || '';
  assert.match(payout, /rpc\('set_manual_lender_payout'/);
  assert.doesNotMatch(payout, /logLenderIntelligenceAudit/);
});

test('reconciliation resolution relies on its locked atomic database audit', () => {
  const resolution =
    operations.match(
      /if \(action === 'update_reconciliation'\)[\s\S]*?return NextResponse\.json/i
    )?.[0] || '';
  assert.match(resolution, /rpc\('resolve_lender_reconciliation'/);
  assert.doesNotMatch(resolution, /\.from\('lender_reconciliation_items'\)/);
  assert.doesNotMatch(resolution, /logLenderIntelligenceAudit/);
});

test('partner commission API exposes governed contract and payment workflows', () => {
  assert.match(operations, /from\('partner_commission_versions'\)/);
  assert.match(operations, /from\('partner_payout_profile_versions'\)/);
  assert.match(operations, /from\('partner_commission_items'\)/);
  assert.match(operations, /from\('partner_commission_payments'\)/);
  assert.match(operations, /if \(action === 'create_partner_commission_draft'\)/);
  assert.match(operations, /rpc\('create_partner_commission_draft'/);
  assert.match(operations, /rpc\('create_partner_payout_profile_draft'/);
  assert.match(operations, /rpc\('review_partner_payout_profile'/);
  assert.match(operations, /if \(action === 'review_partner_commission'\)/);
  assert.match(operations, /rpc\('review_partner_commission'/);
  assert.match(operations, /if \(action === 'request_partner_commission_payment'\)/);
  assert.match(operations, /rpc\('request_partner_commission_payment'/);
  assert.match(operations, /if \(action === 'review_partner_commission_payment'\)/);
  assert.match(operations, /rpc\('review_partner_commission_payment'/);
  assert.doesNotMatch(operations, /rpc\('record_partner_commission_payment'/);
  assert.match(operations, /rpc\('terminate_partner_commission'/);
  assert.match(operations, /rpc\('manage_partner_commission_item'/);
  assert.match(operations, /rpc\('refresh_partner_commission_issues'/);
  assert.match(workspace, /terminatePartnerCommission/);
  assert.match(workspace, /managePartnerPayable/);
  assert.match(workspace, /createPayoutProfile/);
  assert.match(workspace, /advancePayoutProfile/);
  assert.match(workspace, /reviewPartnerPayment/);
});

test('partner commission recovery is separately governed from lender clawbacks', () => {
  assert.match(operations, /from\('partner_commission_recoveries'\)/);
  assert.match(operations, /if \(action === 'register_partner_commission_recovery'\)/);
  assert.match(operations, /rpc\('register_partner_commission_recovery'/);
  assert.match(operations, /if \(action === 'resolve_partner_commission_recovery'\)/);
  assert.match(operations, /rpc\('resolve_partner_commission_recovery'/);
  assert.doesNotMatch(operations, /from\('partner_commission_recoveries'\)\s*\.insert/i);
  assert.match(workspace, /Partner commission recovery register/i);
  assert.match(workspace, /registerPartnerRecovery/i);
  assert.match(workspace, /resolvePartnerRecovery/i);
});
