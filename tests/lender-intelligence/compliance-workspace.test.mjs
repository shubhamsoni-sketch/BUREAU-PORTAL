import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workspace = readFileSync(
  new URL(
    '../../src/app/admin-lender-intelligence/components/LenderComplianceWorkspace.tsx',
    import.meta.url
  ),
  'utf8'
);
const sidebar = readFileSync(
  new URL('../../src/components/AdminSidebar.tsx', import.meta.url),
  'utf8'
);
const intelligenceWorkspace = readFileSync(
  new URL(
    '../../src/app/admin-lender-intelligence/components/LenderIntelligenceWorkspace.tsx',
    import.meta.url
  ),
  'utf8'
);

test('scoped compliance workspace exposes evidence and governed issue custody', () => {
  assert.match(workspace, /\/api\/admin-lender-intelligence\/compliance/);
  assert.match(workspace, /dataQualityIssues/);
  assert.match(workspace, /scanRuns/);
  assert.match(workspace, /Last scheduled scan/);
  assert.match(workspace, /Scheduled scan history/);
  assert.match(workspace, /scanRuns\.map/);
  assert.match(workspace, /Minimized audit register/);
  assert.match(workspace, /auditLogs\.map/);
  assert.doesNotMatch(workspace, /actor_email|storage_path/);
  assert.match(workspace, /manage_data_quality_issue/);
  for (const action of ['claim', 'resolve', 'accept', 'reopen']) {
    assert.match(workspace, new RegExp(`'${action}'`));
  }
  assert.match(workspace, /\/api\/admin-lender-intelligence\/documents\?id=/);
  assert.match(workspace, /const viewer = window\.open\('', '_blank'\)/);
  assert.match(workspace, /viewer\.opener = null/);
  assert.match(workspace, /viewer\.location\.replace\(body\.data\.signedUrl\)/);
  assert.match(workspace, /viewer\.close\(\)/);
  assert.ok(
    workspace.indexOf("window.open('', '_blank')") <
      workspace.indexOf('authFetch(\n        `/api/admin-lender-intelligence/documents'),
    'viewer must be created synchronously before the signed URL request'
  );
});

test('compliance workspace is directly discoverable without entering finance', () => {
  assert.match(
    sidebar,
    /label: 'Compliance Evidence'[\s\S]*?\/admin-lender-intelligence\/compliance/
  );
  assert.match(intelligenceWorkspace, /label: 'Compliance Evidence'/);
  assert.match(intelligenceWorkspace, /href: '\/admin-lender-intelligence\/compliance'/);
});
