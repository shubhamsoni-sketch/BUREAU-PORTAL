import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const route = readFileSync(
  new URL('../../src/app/api/admin-lender-intelligence/export/route.ts', import.meta.url),
  'utf8'
);
const workspace = readFileSync(
  new URL(
    '../../src/app/admin-lender-intelligence/components/LenderFinanceWorkspace.tsx',
    import.meta.url
  ),
  'utf8'
);

test('compliance exports are admin-only, bounded, no-store, and fail closed on audit', () => {
  assert.match(route, /requireAdmin\(bearerToken\(request\)\)/i);
  assert.match(route, /const MAX_DAYS = 90/i);
  assert.match(route, /const MAX_ROWS = 5000/i);
  assert.match(route, /\.limit\(MAX_ROWS\)/i);
  assert.match(route, /await logLenderIntelligenceAudit[\s\S]*?action: `export_\$\{dataset\}`/i);
  assert.ok(
    route.indexOf('await logLenderIntelligenceAudit') <
      route.indexOf('return new NextResponse(`\\uFEFF${content}`'),
    'audit must commit before export bytes are returned'
  );
  assert.match(route, /'cache-control': 'no-store, max-age=0'/i);
  assert.match(route, /'x-content-type-options': 'nosniff'/i);
  assert.match(route, /freeTextIncluded: false/i);
});

test('CSV export neutralizes spreadsheet formulas and exposes explicit register controls', () => {
  assert.match(route, /\/\^\[=\+\\-@\\t\\r\]\//i);
  assert.match(route, /text\.replace\(\/"\/g, '""'\)/i);
  assert.match(workspace, /downloadRegister\('compliance'\)/i);
  assert.match(workspace, /downloadRegister\('audit'\)/i);
  assert.match(workspace, /downloadRegister\('lender-reconciliation'\)/i);
  assert.match(workspace, /downloadRegister\('lender-invoices'\)/i);
  assert.match(workspace, /downloadRegister\('partner-payables'\)/i);
  assert.match(workspace, /downloadRegister\('partner-payment-requests'\)/i);
  assert.match(workspace, /downloadRegister\('partner-recoveries'\)/i);
  assert.match(workspace, /Audited \$\{dataset\} register exported/i);
});

test('lender receivable exports reconcile source, invoice, payment, and open balances without borrower PII', () => {
  assert.match(route, /dataset === 'lender-reconciliation'/i);
  assert.match(route, /from\('lender_reconciliation_items'\)/i);
  assert.match(
    route,
    /lender_outcomes!inner\(lender_id,program_id,disbursed_amount,disbursed_at\)/i
  );
  assert.match(route, /dataset === 'lender-invoices'/i);
  assert.match(route, /from\('lender_invoices'\)/i);
  assert.match(
    route,
    /Number\(row\.total_amount\)\s*-\s*Number\(row\.paid_amount\)\s*-\s*Number\(row\.adjustment_amount\)/i
  );
  assert.match(
    route,
    /dataset\.startsWith\('partner-'\)\s*\?\s*'partner_commissions'\s*:\s*'invoicing'/i
  );
  assert.doesNotMatch(route, /customer_name|borrower_name|row\.variance_reason/i);
});

test('partner finance exports are bounded, partner-scopeable, and omit narrative and full credentials', () => {
  assert.match(
    route,
    /const financeDatasets\s*=\s*new Set\(\[\s*'lender-reconciliation',\s*'lender-invoices',\s*'partner-payables',\s*'partner-payment-requests',\s*'partner-recoveries',?\s*\]\)/i
  );
  assert.match(route, /financeDatasets\.has\(dataset\) \? 'finance\.read' : 'compliance\.read'/i);
  assert.match(route, /dataset === 'partner-payables'/i);
  assert.match(route, /from\('partner_commission_items'\)/i);
  assert.match(route, /beneficiary\.accountNumberLast4/i);
  assert.match(route, /beneficiary\.beneficiaryReference/i);
  assert.match(route, /from\('partner_commission_payment_requests'\)/i);
  assert.match(route, /from\('partner_commission_recoveries'\)/i);
  assert.match(route, /dataset === 'partner-payment-requests'/i);
  assert.match(route, /\.eq\('partner_commission_items\.partner_id', partnerId\)/i);
  assert.doesNotMatch(route, /row\.request_note/i);
  assert.doesNotMatch(route, /row\.review_note/i);
  assert.doesNotMatch(route, /beneficiary\.accountNumber(?!Last4)/i);
  assert.match(route, /piiIncluded: false/i);
});

test('compliance register export excludes issue free text and resolution narratives', () => {
  const compliance =
    route.match(/if \(dataset === 'audit'\)[\s\S]*?await logLenderIntelligenceAudit/i)?.[0] || '';
  assert.doesNotMatch(compliance, /row\.detail/i);
  assert.doesNotMatch(compliance, /row\.resolution_note/i);
  assert.doesNotMatch(compliance, /'detail'/i);
  assert.doesNotMatch(compliance, /'resolution_note'/i);
});

test('audit register export minimizes staff identity and free-text fields', () => {
  const auditBranch = route.match(
    /if \(dataset === 'audit'\)([\s\S]*?)else if \(dataset === 'compliance'\)/i
  )?.[1];
  assert.ok(auditBranch, 'audit export branch must remain explicit');
  assert.match(auditBranch, /actor_user_id/);
  assert.doesNotMatch(auditBranch, /actor_email|row\.summary|'summary'/i);
});
