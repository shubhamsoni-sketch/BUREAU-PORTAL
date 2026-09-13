import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  hasLenderIntelligenceCapability,
  requireLenderIntelligenceCapability,
} from '../../src/lib/lender-intelligence/access.ts';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const access = read('../../src/lib/lender-intelligence/access.ts');
const operations = read('../../src/app/api/admin-lender-intelligence/operations/route.ts');
const intelligence = read('../../src/app/api/admin-lender-intelligence/route.ts');
const catalog = read('../../src/app/api/admin-lender-intelligence/catalog/route.ts');
const documents = read('../../src/app/api/admin-lender-intelligence/documents/route.ts');
const compliance = read('../../src/app/api/admin-lender-intelligence/compliance/route.ts');
const workspace = read(
  '../../src/app/admin-lender-intelligence/components/LenderOnboardingWorkspace.tsx'
);
const exportsRoute = read('../../src/app/api/admin-lender-intelligence/export/route.ts');
const invoices = read('../../src/app/api/admin-lender-intelligence/invoices/[id]/route.ts');
const migration = read(
  '../../supabase/migrations/20260912220000_lender_intelligence_foundation.sql'
);
const adminAuth = read('../../src/lib/supabase/admin.ts');

test('LI capabilities trust only server-owned app metadata and fail closed', () => {
  assert.match(access, /user\.app_metadata\?\.lender_intelligence_permissions/);
  assert.doesNotMatch(access, /user_metadata/);
  assert.match(access, /if \(!Array\.isArray\(configured\)\) return false/);
  assert.match(access, /permissions\.has\('\*'\) \|\| permissions\.has\(capability\)/);
});

test('LI capability evaluator enforces exact grants and wildcard at runtime', () => {
  const user = (appMetadata = {}, userMetadata = {}) => ({
    app_metadata: appMetadata,
    user_metadata: userMetadata,
  });
  assert.equal(hasLenderIntelligenceCapability(user(), 'finance.read'), false);
  assert.equal(
    hasLenderIntelligenceCapability(
      user({}, { lender_intelligence_permissions: ['*'] }),
      'finance.read'
    ),
    false
  );
  assert.equal(
    hasLenderIntelligenceCapability(
      user({ lender_intelligence_permissions: 'finance.read' }),
      'finance.read'
    ),
    false
  );
  assert.equal(
    hasLenderIntelligenceCapability(
      user({ lender_intelligence_permissions: ['finance.read'] }),
      'finance.read'
    ),
    true
  );
  assert.equal(
    hasLenderIntelligenceCapability(
      user({ lender_intelligence_permissions: ['finance.read'] }),
      'finance.manage'
    ),
    false
  );
  assert.equal(
    hasLenderIntelligenceCapability(
      user({ lender_intelligence_permissions: ['*'] }),
      'compliance.manage'
    ),
    true
  );
  assert.deepEqual(requireLenderIntelligenceCapability(user(), 'policy.manage'), {
    error: 'Lender Intelligence permission required: policy.manage',
    status: 403,
  });
  assert.equal(
    requireLenderIntelligenceCapability(
      user({ lender_intelligence_permissions: ['policy.manage'] }),
      'policy.manage'
    ),
    null
  );
});

test('base admin authorization never trusts client-editable user metadata', () => {
  const requireAdmin = adminAuth.match(/export async function requireAdmin[\s\S]*?\n}/)?.[0] || '';
  assert.match(requireAdmin, /user\.app_metadata\?\.role === 'admin'/);
  assert.doesNotMatch(requireAdmin, /user\.user_metadata/);
  assert.match(requireAdmin, /from\('user_profiles'\)/);
});

test('admin LI routes enforce purpose-specific capabilities', () => {
  assert.match(intelligence, /'intelligence\.read'/);
  assert.doesNotMatch(
    intelligence,
    /requireLenderIntelligenceCapability\(auth\.user, 'catalog\.read'\)/
  );
  assert.match(operations, /'finance\.read'/);
  assert.match(operations, /action === 'review_exception'[\s\S]*?'routing\.review'/);
  assert.match(operations, /action === 'refresh_data_quality'[\s\S]*?'compliance\.manage'/);
  assert.match(operations, /'finance\.manage'/);
  assert.match(catalog, /'catalog\.read'/);
  assert.match(
    catalog,
    /action === 'manage_data_quality_issue' \? 'compliance\.manage' : 'policy\.manage'/
  );
  assert.match(documents, /'compliance\.read'/);
  assert.match(documents, /'policy\.manage'/);
  assert.match(exportsRoute, /'compliance\.read'/);
  assert.match(
    exportsRoute,
    /financeDatasets\.has\(dataset\) \? 'finance\.read' : 'compliance\.read'/
  );
  assert.match(invoices, /'finance\.read'/);
});

test('compliance evidence has a dedicated read boundary without catalog or finance leakage', () => {
  assert.match(compliance, /'compliance\.read'/);
  assert.match(compliance, /from\('lender_data_quality_issues'\)/);
  assert.match(compliance, /from\('lender_policy_documents'\)/);
  assert.match(compliance, /from\('lender_compliance_scan_runs'\)/);
  assert.doesNotMatch(compliance, /actor_email|storage_path|lender_commercial_versions/);
});

test('catalog read boundary excludes compliance evidence', () => {
  const catalogRead =
    catalog.match(/export async function GET[\s\S]*?\n}\n\nexport async function POST/)?.[0] || '';
  assert.match(catalogRead, /'catalog\.read'/);
  assert.doesNotMatch(
    catalogRead,
    /lender_data_quality_issues|lender_policy_documents|lender_intelligence_audit_logs|actor_email/
  );
  assert.match(
    workspace,
    /authFetch\('\/api\/admin-lender-intelligence\/compliance', \{ cache: 'no-store' \}\)/
  );
});

test('migration explicitly bootstraps existing admins without trusting user metadata at runtime', () => {
  assert.match(migration, /lender_intelligence_permissions/);
  assert.match(migration, /jsonb_build_array\('\*'\)/);
  assert.match(migration, /raw_app_meta_data->>'role'='admin'/);
  assert.match(migration, /from public\.user_profiles profile/);
  const bootstrap =
    migration.match(/update auth\.users[\s\S]*?lender_intelligence_permissions'\);/)?.[0] || '';
  assert.doesNotMatch(bootstrap, /raw_user_meta_data->>'role'/);
});
