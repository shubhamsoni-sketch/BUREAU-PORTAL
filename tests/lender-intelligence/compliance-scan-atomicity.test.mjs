import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(
  new URL(
    '../../supabase/migrations/20260912220000_lender_intelligence_foundation.sql',
    import.meta.url
  ),
  'utf8'
);
const route = readFileSync(
  new URL('../../src/app/api/admin-lender-intelligence/sla-scan/route.ts', import.meta.url),
  'utf8'
);

test('scheduled compliance scans are atomic, serialized, and durably evidenced', () => {
  const workflow = migration.match(
    /create or replace function public\.run_lender_compliance_scan\(\)([\s\S]*?)\n\$\$;/i
  )?.[1];
  assert.ok(workflow, 'atomic compliance scan workflow must exist');
  assert.match(
    workflow,
    /pg_advisory_xact_lock\(hashtextextended\('lender-compliance-scan', 0\)\)/i
  );
  assert.match(workflow, /refresh_lender_data_quality_issues\(\)/i);
  assert.match(workflow, /refresh_partner_commission_issues\(\)/i);
  assert.match(workflow, /insert into public\.lender_compliance_scan_runs/i);
  assert.match(
    migration,
    /alter table public\.lender_compliance_scan_runs enable row level security/i
  );
  assert.match(
    migration,
    /revoke all on table public\.lender_compliance_scan_runs from anon, authenticated, service_role/i
  );
  assert.match(route, /rpc\('run_lender_compliance_scan'\)/i);
  assert.doesNotMatch(route, /Promise\.all/i);
});
