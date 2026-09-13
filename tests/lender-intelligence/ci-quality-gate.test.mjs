import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync(
  new URL('../../.github/workflows/lender-intelligence-quality.yml', import.meta.url),
  'utf8'
);
const packageJson = readFileSync(new URL('../../package.json', import.meta.url), 'utf8');
const nextConfig = readFileSync(new URL('../../next.config.mjs', import.meta.url), 'utf8');
const eslintConfig = readFileSync(new URL('../../eslint.config.mjs', import.meta.url), 'utf8');
const runtimeVerifier = readFileSync(
  new URL('../../scripts/verify-lender-intelligence-runtime.mjs', import.meta.url),
  'utf8'
);

test('Lender Intelligence CI gate runs locked tests, types, and production build', () => {
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /push:[\s\S]*branches: \[main\]/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.equal((workflow.match(/docs\/LENDER_INTELLIGENCE_OPERATIONS\.md/g) || []).length, 2);
  assert.equal((workflow.match(/docs\/LENDER_INTELLIGENCE_RELEASE_EVIDENCE\.md/g) || []).length, 2);
  assert.equal((workflow.match(/docs\/tasks\/lender-intelligence-\*\.md/g) || []).length, 2);
  assert.equal((workflow.match(/WORKLOG\.md/g) || []).length, 2);
  assert.equal((workflow.match(/PROJECT_HANDOFF\.md/g) || []).length, 2);
  assert.equal((workflow.match(/\.env\.example/g) || []).length, 2);
  assert.equal((workflow.match(/vercel\.json/g) || []).length, 2);
  assert.match(workflow, /permissions:[\s\S]*contents: read/);
  assert.match(workflow, /timeout-minutes: 20/);
  assert.match(workflow, /uses: actions\/checkout@v4/);
  assert.match(workflow, /uses: actions\/setup-node@v4/);
  assert.match(workflow, /node-version: 22/);
  assert.match(packageJson, /"node": ">=22\.6\.0 <25"/);
  assert.match(workflow, /run: npm ci/);
  assert.match(workflow, /run: npm audit --audit-level=low/);
  assert.match(workflow, /run: npm run test:lender-intelligence/);
  assert.match(workflow, /run: npm run verify:lender-intelligence-migration-syntax/);
  assert.match(workflow, /run: npm run verify:lender-intelligence-migration-execution/);
  assert.match(workflow, /run: npm run type-check/);
  assert.match(workflow, /run: npm run lint:lender-intelligence/);
  assert.match(packageJson, /"lint:lender-intelligence": "[^"]*--max-warnings=0"/);
  assert.doesNotMatch(packageJson, /ESLINT_USE_FLAT_CONFIG=false/);
  assert.match(eslintConfig, /new FlatCompat/);
  assert.match(eslintConfig, /next\/core-web-vitals/);
  assert.match(workflow, /run: npm run build/);
  assert.match(workflow, /run: npm run verify:lender-intelligence-runtime/);
  assert.doesNotMatch(workflow, /SUPABASE_SERVICE_ROLE_KEY:\s*\$\{\{/);
});

test('Next output tracing is pinned to this application root', () => {
  assert.match(nextConfig, /fileURLToPath\(new URL\('\.', import\.meta\.url\)\)/);
  assert.match(nextConfig, /outputFileTracingRoot:\s*projectRoot/);
});

test('production builds fail closed on type errors and do not publish browser source maps', () => {
  assert.match(nextConfig, /ignoreBuildErrors:\s*false/);
  assert.match(nextConfig, /productionBrowserSourceMaps:\s*false/);
  assert.doesNotMatch(nextConfig, /ignoreBuildErrors:\s*true/);
});

test('production start command serves the built application instead of a development server', () => {
  const manifest = JSON.parse(packageJson);
  assert.equal(manifest.scripts.start, 'next start -p 4028');
  assert.doesNotMatch(manifest.scripts.start, /next dev/);
});

test('production runtime gate checks protected response controls and authentication denial', () => {
  assert.match(runtimeVerifier, /\/admin-lender-intelligence/);
  assert.match(runtimeVerifier, /\/api\/admin-lender-intelligence/);
  assert.match(runtimeVerifier, /api\.status !== 401/);
  assert.match(runtimeVerifier, /cache-control/);
  assert.match(runtimeVerifier, /no-store/);
  assert.match(runtimeVerifier, /referrer-policy/);
  assert.match(runtimeVerifier, /x-content-type-options/);
  assert.match(runtimeVerifier, /server\.kill\('SIGTERM'\)/);
});
