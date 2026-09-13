import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const packageJson = readFileSync(new URL('../../package.json', import.meta.url), 'utf8');
const nextConfig = readFileSync(new URL('../../next.config.mjs', import.meta.url), 'utf8');
const eslintConfig = readFileSync(new URL('../../eslint.config.mjs', import.meta.url), 'utf8');
const runtimeVerifier = readFileSync(
  new URL('../../scripts/verify-lender-intelligence-runtime.mjs', import.meta.url),
  'utf8'
);

test('Lender Intelligence quality commands cover tests, types, lint, migration, build and runtime', () => {
  const manifest = JSON.parse(packageJson);
  assert.match(packageJson, /"node": ">=22\.6\.0 <25"/);
  assert.ok(manifest.scripts['test:lender-intelligence']);
  assert.ok(manifest.scripts['verify:lender-intelligence-migration-syntax']);
  assert.ok(manifest.scripts['verify:lender-intelligence-migration-execution']);
  assert.ok(manifest.scripts['verify:lender-intelligence-runtime']);
  assert.ok(manifest.scripts['type-check']);
  assert.ok(manifest.scripts['build']);
  assert.match(packageJson, /"lint:lender-intelligence": "[^"]*--max-warnings=0"/);
  assert.doesNotMatch(packageJson, /ESLINT_USE_FLAT_CONFIG=false/);
  assert.match(eslintConfig, /new FlatCompat/);
  assert.match(eslintConfig, /next\/core-web-vitals/);
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
