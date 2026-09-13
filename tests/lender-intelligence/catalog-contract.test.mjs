import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = readFileSync(
  new URL('../../src/app/api/admin-lender-intelligence/catalog/route.ts', import.meta.url),
  'utf8'
);
const workspace = readFileSync(
  new URL(
    '../../src/app/admin-lender-intelligence/components/LenderOnboardingWorkspace.tsx',
    import.meta.url
  ),
  'utf8'
);

test('lender onboarding uses the governed database workflow', () => {
  const upsert =
    catalog.match(
      /if \(action === 'upsert_lender'\)[\s\S]*?if \(action === 'upsert_program'\)/
    )?.[0] || '';
  assert.match(upsert, /rpc\('save_lender_master'/);
  assert.match(upsert, /p_user_id: auth\.user\.id/);
  assert.doesNotMatch(upsert, /\.from\('lender_master'\)\s*\.upsert/);
});

test('program master upsert is draft-only and cannot move governed records across lenders', () => {
  const upsert =
    catalog.match(
      /if \(action === 'upsert_program'\)[\s\S]*?if \(action === 'set_lender_status'\)/
    )?.[0] || '';
  assert.match(upsert, /data\.status !== 'draft'/);
  assert.match(upsert, /Only draft programs can be edited/);
  assert.match(upsert, /data\.lender_id !== lenderId/);
  assert.match(upsert, /status: 'draft'/);
  assert.doesNotMatch(upsert, /status: text\(program\.status\)/);
  assert.match(upsert, /rpc\('save_lender_program'/);
  assert.doesNotMatch(upsert, /\.from\('lender_programs'\)\s*\.upsert/);
});

test('program daily capacity is configurable through its governed RPC', () => {
  const action =
    catalog.match(
      /if \(action === 'set_program_daily_capacity'\)[\s\S]*?return NextResponse\.json\(\{ success: true, data \}\);/i
    )?.[0] || '';
  assert.match(action, /rpc\('set_lender_program_daily_capacity'/i);
  assert.match(action, /p_daily_submission_limit:\s*dailySubmissionLimit/i);
  assert.match(action, /p_reason:\s*reason/i);
  assert.match(workspace, /Set daily cap/i);
  assert.match(workspace, /daily_submission_limit/i);
  assert.match(catalog, /rpc\('get_lender_program_daily_capacity_usage'/i);
  assert.match(workspace, /submissions_remaining/i);
});

test('lender and program master/status APIs rely on atomic database audits', () => {
  for (const [action, nextAction] of [
    ['upsert_lender', 'upsert_program'],
    ['upsert_program', 'set_lender_status'],
    ['set_lender_status', 'set_program_operating_status'],
    ['set_program_operating_status', 'create_policy_draft'],
  ]) {
    const start = catalog.indexOf(`if (action === '${action}')`);
    const end = catalog.indexOf(`if (action === '${nextAction}')`, start);
    const workflow = catalog.slice(start, end);
    assert.ok(start >= 0 && end > start, `${action} API branch must exist`);
    assert.match(workflow, /\.rpc\(/);
    assert.doesNotMatch(workflow, /logLenderIntelligenceAudit/);
  }
  const operatingStart = catalog.indexOf("if (action === 'set_program_operating_status')");
  const operatingEnd = catalog.indexOf("if (action === 'create_policy_draft')", operatingStart);
  const operating = catalog.slice(operatingStart, operatingEnd);
  assert.doesNotMatch(operating, /\.from\('lender_programs'\)/);
  assert.doesNotMatch(operating, /\.from\('lender_policy_versions'\)/);
});

test('policy draft creation and submission use governed database workflows', () => {
  const create =
    catalog.match(
      /if \(action === 'create_policy_draft'\)[\s\S]*?if \(action === 'create_policy_restoration'\)/
    )?.[0] || '';
  const submit =
    catalog.match(
      /if \(action === 'submit_policy'\)[\s\S]*?if \(action === 'publish_policy'\)/
    )?.[0] || '';
  assert.match(create, /rpc\('create_lender_policy_draft'/);
  assert.doesNotMatch(create, /\.from\('lender_policy_versions'\)[\s\S]*?\.insert/);
  assert.match(submit, /rpc\('submit_lender_policy'/);
  assert.doesNotMatch(submit, /\.from\('lender_policy_versions'\)[\s\S]*?\.update/);
});

test('policy lifecycle APIs rely on their atomic database audits', () => {
  const actions = [
    'create_policy_draft',
    'submit_policy',
    'publish_policy',
    'reject_policy',
    'retire_policy',
    'discard_policy_draft',
  ];
  const nextActions = {
    create_policy_draft: 'create_policy_restoration',
    submit_policy: 'publish_policy',
    publish_policy: 'reject_policy',
    reject_policy: 'retire_policy',
    retire_policy: 'discard_policy_draft',
  };
  for (const action of actions) {
    const start = catalog.indexOf(`if (action === '${action}')`);
    const end =
      action === 'discard_policy_draft'
        ? catalog.indexOf("return errorResponse('Unsupported action')", start)
        : catalog.indexOf(`if (action === '${nextActions[action]}')`, start);
    const workflow = catalog.slice(start, end);
    assert.ok(start >= 0 && end > start, `${action} API branch must exist`);
    assert.match(workflow, /\.rpc\(/);
    assert.doesNotMatch(workflow, /logLenderIntelligenceAudit/);
  }
  const submitStart = catalog.indexOf("if (action === 'submit_policy')");
  const submitEnd = catalog.indexOf("if (action === 'publish_policy')", submitStart);
  assert.doesNotMatch(catalog.slice(submitStart, submitEnd), /\.from\('lender_policy_versions'\)/);
});

test('policy restoration and rule replacement rely on atomic database audits', () => {
  const restoration =
    catalog.match(
      /if \(action === 'create_policy_restoration'\)[\s\S]*?if \(action === 'replace_policy_rules'\)/
    )?.[0] || '';
  const rules =
    catalog.match(
      /if \(action === 'replace_policy_rules'\)[\s\S]*?if \(action === 'submit_policy'\)/
    )?.[0] || '';
  assert.match(restoration, /rpc\('create_lender_policy_restoration'/);
  assert.doesNotMatch(restoration, /logLenderIntelligenceAudit/);
  assert.match(rules, /rpc\('replace_lender_policy_rules'/);
  assert.doesNotMatch(rules, /\.from\('lender_policy_versions'\)/);
  assert.doesNotMatch(rules, /logLenderIntelligenceAudit/);
});

test('canonical rejection taxonomy is listed and saved through its workflow', () => {
  assert.match(catalog, /rejectionReasons: rejectionReasons\.data \|\| \[\]/);
  const save =
    catalog.match(
      /if \(action === 'save_rejection_reason'\)[\s\S]*?return NextResponse\.json\(\{ success: true, data \}\);/
    )?.[0] || '';
  assert.match(save, /rpc\('save_lender_rejection_reason'/);
  assert.match(save, /p_user_id: auth\.user\.id/);
  assert.doesNotMatch(save, /logLenderIntelligenceAudit/);
  assert.doesNotMatch(
    save,
    /\.from\('lender_rejection_reasons'\)[\s\S]*?\.(insert|update|upsert|delete)/
  );
});

test('private document review relies on its atomic database audit', () => {
  const review =
    catalog.match(
      /if \(action === 'review_policy_document'\)[\s\S]*?if \(action === 'manage_data_quality_issue'\)/
    )?.[0] || '';
  assert.match(review, /rpc\('review_lender_policy_document'/);
  assert.match(review, /p_reviewer_user_id: auth\.user\.id/);
  assert.doesNotMatch(review, /logLenderIntelligenceAudit/);
});

test('data-quality issue lifecycle relies on its atomic database audit', () => {
  const manage =
    catalog.match(
      /if \(action === 'manage_data_quality_issue'\)[\s\S]*?if \(action === 'preview_bulk_import'/
    )?.[0] || '';
  assert.match(manage, /rpc\('manage_lender_data_quality_issue'/);
  assert.match(manage, /p_user_id: auth\.user\.id/);
  assert.doesNotMatch(manage, /logLenderIntelligenceAudit/);
});

test('admin workspace exposes rejection taxonomy creation, editing, and deactivation', () => {
  assert.match(workspace, /Rejection taxonomy/);
  assert.match(workspace, /Canonical reason register/);
  assert.match(workspace, /action: 'save_rejection_reason'/);
  assert.match(workspace, /editRejectionReason/);
  assert.match(workspace, /checked=\{reasonForm\.active\}/);
});

test('published policy retirement is governed and blocked while its program is active', () => {
  const retire =
    catalog.match(
      /if \(action === 'retire_policy'\)[\s\S]*?return NextResponse\.json\(\{ success: true, data \}\);/
    )?.[0] || '';
  assert.match(retire, /rpc\('retire_lender_policy'/);
  assert.match(retire, /p_reason: reason/);
  assert.match(retire, /p_user_id: auth\.user\.id/);
  assert.doesNotMatch(retire, /logLenderIntelligenceAudit/);
  assert.match(workspace, /retirePolicy/);
  assert.match(workspace, /program\?\.status === 'active'/);
  assert.match(workspace, /Retire policy/);
});

test('policy drafts can be discarded through an audited workflow', () => {
  assert.match(catalog, /rpc\('discard_lender_policy_draft'/);
  assert.match(workspace, /discardPolicyDraft/);
  assert.match(workspace, /Discard draft/);
});
