import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(
  new URL(
    '../../src/app/crm/loan-application-tracking/components/LoanApplicationContent.tsx',
    import.meta.url
  ),
  'utf8'
);

test('File Process never substitutes demo applications for live operational state', () => {
  assert.doesNotMatch(source, /MOCK_APPS|app-001|Ramesh Gupta|HDFC Bank/);
  assert.match(source, /const nextApps = liveApps/);
});

test('File Process distinguishes loading, empty, and failed data states', () => {
  assert.match(source, /if \(!response\.ok\) throw new Error/);
  assert.match(source, /setLoadingApplications\(true\)/);
  assert.match(source, /finally[\s\S]*setLoadingApplications\(false\)/);
  assert.match(source, /role="alert"/);
  assert.match(source, /File Process data could not be loaded/);
  assert.match(source, /Applications are unavailable\. Retry after the data service recovers\./);
  assert.match(source, /Loading lender applications…/);
});

test('New File starts the governed eligibility journey', () => {
  assert.match(
    source,
    /<Link[\s\S]*?href="\/crm\/eligibility-check"[\s\S]*?New File[\s\S]*?<\/Link>/
  );
});
