import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const onboarding = readFileSync(
  new URL(
    '../../src/app/admin-lender-intelligence/components/LenderOnboardingWorkspace.tsx',
    import.meta.url
  ),
  'utf8'
);

test('onboarding opens a secure viewer synchronously and closes it on access failure', () => {
  const handler = onboarding.match(/const openDocument = async[\s\S]*?\n  };/)?.[0] || '';
  assert.match(handler, /const viewer = window\.open\('', '_blank'\)/);
  assert.match(handler, /viewer\.opener = null/);
  assert.match(handler, /viewer\.location\.replace\(json\.data\.signedUrl\)/);
  assert.match(handler, /viewer\.close\(\)/);
  assert.ok(handler.indexOf('window.open') < handler.indexOf('await authFetch'));
});
