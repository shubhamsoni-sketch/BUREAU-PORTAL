import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  hasLenderIntelligenceClientPermission,
  lenderIntelligenceBackPath,
} from '../../src/lib/lender-intelligence/client-access.ts';

const auth = readFileSync(new URL('../../src/context/AuthContext.tsx', import.meta.url), 'utf8');
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
const financeWorkspace = readFileSync(
  new URL(
    '../../src/app/admin-lender-intelligence/components/LenderFinanceWorkspace.tsx',
    import.meta.url
  ),
  'utf8'
);
const complianceWorkspace = readFileSync(
  new URL(
    '../../src/app/admin-lender-intelligence/components/LenderComplianceWorkspace.tsx',
    import.meta.url
  ),
  'utf8'
);
const onboardingWorkspace = readFileSync(
  new URL(
    '../../src/app/admin-lender-intelligence/components/LenderOnboardingWorkspace.tsx',
    import.meta.url
  ),
  'utf8'
);

test('trusted LI permissions flow into UX navigation without replacing server authorization', () => {
  assert.match(auth, /lenderIntelligencePermissions\?: string\[\]/);
  assert.match(auth, /supabaseUser\.app_metadata\?\.lender_intelligence_permissions/);
  assert.doesNotMatch(auth, /user_metadata\?\.lender_intelligence_permissions/);
  for (const permission of [
    'intelligence.read',
    'catalog.read',
    'finance.read',
    'compliance.read',
  ]) {
    assert.match(sidebar, new RegExp(`'${permission.replace('.', '\\.')}'`));
  }
  assert.match(sidebar, /lenderPermissions\.has\('\*'\)/);
  assert.match(sidebar, /lenderPermissions\.has\(required\)/);
  assert.match(sidebar, /visibleNavGroups\.map/);
});

test('internal LI navigation follows exact read permissions', () => {
  const catalogUser = { lenderIntelligencePermissions: ['catalog.read'] };
  const superAdmin = { lenderIntelligencePermissions: ['*'] };
  assert.equal(hasLenderIntelligenceClientPermission(catalogUser, 'catalog.read'), true);
  assert.equal(hasLenderIntelligenceClientPermission(catalogUser, 'finance.read'), false);
  assert.equal(hasLenderIntelligenceClientPermission(superAdmin, 'compliance.read'), true);
  assert.equal(lenderIntelligenceBackPath(catalogUser), '/admin-dashboard');
  assert.equal(lenderIntelligenceBackPath(superAdmin), '/admin-lender-intelligence');
  assert.match(intelligenceWorkspace, /visibleNavigation\.map/);
  assert.match(intelligenceWorkspace, /item\.permission/);
  assert.match(
    financeWorkspace,
    /const canReadCompliance = hasLenderIntelligenceClientPermission\(user, 'compliance\.read'\)/
  );
  assert.match(complianceWorkspace, /lenderIntelligenceBackPath\(user\)/);
});

test('finance-read workspace survives catalog denial and hides compliance-only exports', () => {
  assert.match(financeWorkspace, /catalogResponse\.status !== 403/);
  assert.match(
    financeWorkspace,
    /const catalogData = catalogResponse\.ok && catalog\.success \? catalog\.data : \{\}/
  );
  assert.match(financeWorkspace, /setCommercials\(operations\.data\.commercials \|\| \[\]\)/);
  assert.match(
    financeWorkspace,
    /\{canReadCompliance && \([\s\S]*?downloadRegister\('compliance'\)[\s\S]*?downloadRegister\('audit'\)/
  );
});

test('finance workspace separates read, finance mutation, and routing review capabilities', () => {
  assert.match(
    financeWorkspace,
    /const canManageFinance = hasLenderIntelligenceClientPermission\(user, 'finance\.manage'\)/
  );
  assert.match(
    financeWorkspace,
    /const canReviewRouting = hasLenderIntelligenceClientPermission\(user, 'routing\.review'\)/
  );
  assert.match(financeWorkspace, /Read-only finance access/);
  assert.match(financeWorkspace, /capability: 'finance\.manage' \| 'routing\.review'/);
  assert.match(financeWorkspace, /This action requires the \$\{capability\} permission/);
  assert.match(financeWorkspace, /'routing\.review'\s*\n\s*\);/);
  assert.match(financeWorkspace, /data-read-action/);
  assert.match(financeWorkspace, /data-routing-action/);
  assert.match(
    financeWorkspace,
    /busy \|\| !canReviewRouting \|\| item\.requested_by === user\?\.id/
  );
});

test('catalog and compliance workspaces keep read access separate from lifecycle management', () => {
  assert.match(onboardingWorkspace, /'policy\.manage'/);
  assert.match(onboardingWorkspace, /'compliance\.manage'/);
  assert.match(onboardingWorkspace, /Read-only catalog access/);
  assert.match(onboardingWorkspace, /data-read-action/);
  assert.match(onboardingWorkspace, /data-compliance-action/);
  assert.match(onboardingWorkspace, /disabled=\{saving \|\| !canManageCompliance\}/);
  assert.match(complianceWorkspace, /'compliance\.manage'/);
  assert.match(complianceWorkspace, /Read-only compliance access/);
  assert.match(complianceWorkspace, /disabled=\{busy \|\| !canManageCompliance\}/);
});

test('maker-checker queues disable self-review using server-returned actor identity', () => {
  assert.match(onboardingWorkspace, /submitted_by\?: string \| null/);
  assert.match(onboardingWorkspace, /document\.created_by === user\?\.id/);
  assert.match(onboardingWorkspace, /policy\.submitted_by === user\?\.id/);
  assert.match(onboardingWorkspace, /An independent checker must publish this policy/);
  for (const actorField of ['item.submitted_by === user?.id', 'item.requested_by === user?.id']) {
    assert.match(financeWorkspace, new RegExp(actorField.replaceAll('?', '\\?')));
  }
  for (const workflow of [
    'beneficiary',
    'commission',
    'payment',
    'recovery',
    'exception',
    'commercial',
  ]) {
    assert.match(financeWorkspace, new RegExp(`independent checker must .*${workflow}`));
  }
});
