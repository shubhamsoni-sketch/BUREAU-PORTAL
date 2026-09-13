import { readFile } from 'node:fs/promises';
import { parse } from 'pgsql-parser';

const migrationUrl = new URL(
  '../supabase/migrations/20260912220000_lender_intelligence_foundation.sql',
  import.meta.url
);

try {
  const sql = await readFile(migrationUrl, 'utf8');
  const result = await parse(sql);
  const statementCount = Array.isArray(result?.stmts) ? result.stmts.length : 0;
  if (statementCount < 400) {
    throw new Error(`Unexpected migration statement count: ${statementCount}`);
  }
  console.log(
    `Lender Intelligence migration SQL parsed successfully (${statementCount} statements).`
  );
} catch (error) {
  console.error(
    `Lender Intelligence migration SQL is invalid: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exitCode = 1;
}
