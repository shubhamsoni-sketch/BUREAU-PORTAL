import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const middleware = readFileSync(new URL('../../src/middleware.ts', import.meta.url), 'utf8');

test('all lender intelligence data surfaces are private and non-cacheable', () => {
  assert.match(middleware, /startsWith\('\/admin-lender-intelligence'\)/);
  assert.match(middleware, /startsWith\('\/api\/admin-lender-intelligence'\)/);
  assert.match(middleware, /=== '\/api\/crm\/lender-routing'/);
  assert.match(middleware, /Cache-Control', 'private, no-store, max-age=0, must-revalidate'/);
  assert.match(middleware, /Pragma', 'no-cache'/);
  assert.match(middleware, /X-Content-Type-Options', 'nosniff'/);
  assert.match(middleware, /Referrer-Policy', 'no-referrer'/);
});
