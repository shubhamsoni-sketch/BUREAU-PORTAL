import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const verifier = readFileSync(
  new URL('../../scripts/verify-lender-intelligence-rollout.mjs', import.meta.url),
  'utf8'
);
const mutationVerifier = readFileSync(
  new URL('../../scripts/verify-lender-intelligence-mutation-authorization.mjs', import.meta.url),
  'utf8'
);
const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
);
const rolloutVerifierUrl = new URL(
  '../../scripts/verify-lender-intelligence-rollout.mjs',
  import.meta.url
);
const mutationVerifierUrl = new URL(
  '../../scripts/verify-lender-intelligence-mutation-authorization.mjs',
  import.meta.url
);

test('rollout verifier is authenticated, bounded, read-only, and checks all admin surfaces', () => {
  assert.equal(
    packageJson.scripts['verify:lender-intelligence-rollout'],
    'node scripts/verify-lender-intelligence-rollout.mjs'
  );
  assert.match(verifier, /LENDER_INTELLIGENCE_ADMIN_BEARER_TOKEN/);
  for (const role of ['RESTRICTED', 'INTELLIGENCE', 'CATALOG', 'FINANCE', 'COMPLIANCE']) {
    assert.match(verifier, new RegExp(`LENDER_INTELLIGENCE_${role}_BEARER_TOKEN`));
  }
  assert.match(verifier, /authorization:\s*`Bearer \$\{bearerToken\}`/);
  assert.match(verifier, /AbortController/);
  assert.match(verifier, /15_000/);
  assert.match(verifier, /cache:\s*'no-store'/);
  assert.match(verifier, /redirect:\s*'error'/);
  assert.match(verifier, /Bearer \$\{bearerToken\}invalid/);
  assert.match(verifier, /\[401, 403\]\.includes\(response\.status\)/);
  assert.match(verifier, /rawBody\.includes\(bearerToken\)/);
  assert.match(verifier, /private\.\*no-store/);
  assert.match(verifier, /referrer-policy/);
  assert.match(verifier, /x-content-type-options/);
  assert.match(verifier, /content-type/);
  assert.match(verifier, /invalid application response envelope/);
  assert.match(verifier, /assertProtectedResponseHeaders\(response, check\.name\)/);
  assert.match(verifier, /Math\.abs\(Date\.now\(\) - generatedAt\) < 10 \* 60_000/);
  for (const key of [
    'reconciliation',
    'payments',
    'adjustments',
    'exceptions',
    'partnerPayoutProfiles',
    'partnerCommissionVersions',
    'partnerCommissionItems',
    'partnerCommissionPayments',
    'partnerCommissionPaymentRequests',
    'partnerCommissionRecoveries',
    'dataQualityIssues',
    'scanRuns',
  ])
    assert.ok(verifier.includes(`'${key}'`));
  assert.match(verifier, /schemaHealth\?\.ready === true/);
  assert.match(verifier, /missingRelations/);
  assert.match(verifier, /missingFunctions/);
  assert.match(verifier, /missingTriggers/);
  assert.match(verifier, /missingRls/);
  assert.match(verifier, /unsafePrivileges/);
  for (const path of [
    '/api/admin-lender-intelligence/catalog',
    '/api/admin-lender-intelligence/operations',
    '/api/admin-lender-intelligence/compliance',
    '/api/admin-lender-intelligence',
  ]) {
    assert.ok(verifier.includes(path));
  }
  assert.doesNotMatch(verifier, /method:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/i);
  assert.doesNotMatch(verifier, /console\.(?:log|error)\([^\n]*bearerToken/);
});

test('rollout verifier can prove the scoped read-permission matrix with real accounts', () => {
  assert.match(
    verifier,
    /configuredRoleTokens\.length\s*>\s*0\s*&&\s*configuredRoleTokens\.length\s*!==\s*Object\.keys\(roleTokens\)\.length/
  );
  assert.match(verifier, /Provide all five scoped Lender Intelligence bearer tokens or none/);
  assert.match(verifier, /role: 'restricted'[\s\S]*expected: 403/);
  assert.match(
    verifier,
    /role: 'intelligence',[\s\S]*\/admin-lender-intelligence'[\s\S]*expected: 200/
  );
  assert.match(verifier, /role: 'intelligence',[\s\S]*\/catalog'[\s\S]*expected: 403/);
  assert.match(verifier, /role: 'catalog',[\s\S]*\/catalog'[\s\S]*expected: 200/);
  assert.match(verifier, /role: 'catalog',[\s\S]*\/admin-lender-intelligence'[\s\S]*expected: 403/);
  assert.match(verifier, /role: 'catalog',[\s\S]*\/operations'[\s\S]*expected: 403/);
  assert.match(verifier, /role: 'finance',[\s\S]*\/operations'[\s\S]*expected: 200/);
  assert.match(verifier, /role: 'finance',[\s\S]*\/catalog'[\s\S]*expected: 403/);
  assert.match(verifier, /role: 'compliance',[\s\S]*\/documents'[\s\S]*expected: 400/);
  assert.match(verifier, /role: 'compliance',[\s\S]*\/compliance'[\s\S]*expected: 200/);
  assert.match(verifier, /rawBody\.includes\(token\)/);
});

test('mutation authorization verifier proves manage grants without changing production data', () => {
  assert.equal(
    packageJson.scripts['verify:lender-intelligence-mutation-authorization'],
    'node scripts/verify-lender-intelligence-mutation-authorization.mjs'
  );
  for (const role of [
    'POLICY_MANAGER',
    'FINANCE_MANAGER',
    'COMPLIANCE_MANAGER',
    'ROUTING_REVIEWER',
  ]) {
    assert.match(mutationVerifier, new RegExp(`LENDER_INTELLIGENCE_${role}_BEARER_TOKEN`));
  }
  assert.equal((mutationVerifier.match(/expected: 403/g) || []).length, 4);
  assert.equal((mutationVerifier.match(/expected: 400/g) || []).length, 4);
  assert.match(mutationVerifier, /action: '__authorization_probe__'/);
  assert.match(mutationVerifier, /action: 'manage_data_quality_issue'/);
  assert.match(mutationVerifier, /action: 'review_exception'/);
  assert.match(mutationVerifier, /method: 'POST'/);
  assert.match(mutationVerifier, /AbortController/);
  assert.match(mutationVerifier, /rawBody\.includes\(probe\.token\)/);
  assert.match(mutationVerifier, /assertProtectedJsonResponse\(response, body, probe\.name\)/);
  assert.match(mutationVerifier, /expected a structured application error response/);
  assert.match(mutationVerifier, /application\\\/json/);
  assert.doesNotMatch(mutationVerifier, /console\.(?:log|error)\([^\n]*probe\.token/);
});

test('live verifiers refuse to send bearer credentials over non-loopback HTTP', () => {
  const token = 'x'.repeat(32);
  const rollout = spawnSync(process.execPath, [fileURLToPath(rolloutVerifierUrl)], {
    env: {
      ...process.env,
      LENDER_INTELLIGENCE_BASE_URL: 'http://example.com',
      LENDER_INTELLIGENCE_ADMIN_BEARER_TOKEN: token,
    },
    encoding: 'utf8',
  });
  assert.equal(rollout.status, 2);
  assert.match(rollout.stderr, /must be an HTTPS origin/);

  const mutation = spawnSync(process.execPath, [fileURLToPath(mutationVerifierUrl)], {
    env: {
      ...process.env,
      LENDER_INTELLIGENCE_BASE_URL: 'http://example.com',
      LENDER_INTELLIGENCE_CATALOG_BEARER_TOKEN: token,
      LENDER_INTELLIGENCE_POLICY_MANAGER_BEARER_TOKEN: token,
      LENDER_INTELLIGENCE_FINANCE_BEARER_TOKEN: token,
      LENDER_INTELLIGENCE_FINANCE_MANAGER_BEARER_TOKEN: token,
      LENDER_INTELLIGENCE_COMPLIANCE_BEARER_TOKEN: token,
      LENDER_INTELLIGENCE_COMPLIANCE_MANAGER_BEARER_TOKEN: token,
      LENDER_INTELLIGENCE_RESTRICTED_BEARER_TOKEN: token,
      LENDER_INTELLIGENCE_ROUTING_REVIEWER_BEARER_TOKEN: token,
    },
    encoding: 'utf8',
  });
  assert.equal(mutation.status, 2);
  assert.match(mutation.stderr, /must be an HTTPS origin/);
});
