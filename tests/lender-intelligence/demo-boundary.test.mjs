import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const route = readFileSync(
  new URL('../../src/app/api/crm/eligibility-check/route.ts', import.meta.url),
  'utf8'
);

test('demo eligibility seeding can never run in a production runtime', () => {
  const seed =
    route.match(
      /if \(body\.action === 'seed_demo_eligibility'\)[\s\S]*?if \(body\.action === 'submit_to_lender'\)/
    )?.[0] || '';
  assert.match(seed, /process\.env\.NODE_ENV === 'production'/);
  assert.match(seed, /process\.env\.CRM_ALLOW_DEMO_SEED !== 'true'/);
  assert.match(seed, /Demo seed is disabled in production/);
  assert.ok(
    seed.indexOf("process.env.NODE_ENV === 'production'") <
      seed.indexOf('const supabase = createAdminClient()')
  );
});
