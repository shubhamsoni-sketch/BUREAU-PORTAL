import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const template = readFileSync(
  new URL('../../src/lib/lender-intelligence/invoice-pdf.ts', import.meta.url),
  'utf8'
);
const route = readFileSync(
  new URL('../../src/app/api/admin-lender-intelligence/invoices/[id]/route.ts', import.meta.url),
  'utf8'
);

test('lender invoice artifact is admin-only, no-store, audited, and line-item backed', () => {
  assert.match(route, /requireAdmin\(bearerToken\(request\)\)/);
  assert.match(route, /lender_reconciliation_items/);
  assert.match(route, /lender_invoice_payment_allocations/);
  assert.match(route, /lender_invoice_payments!inner\(invoice_id,reference,recorded_at\)/);
  assert.match(route, /paymentAllocationCount: input\.allocations\.length/);
  assert.match(route, /\.eq\('invoice_id', id\)/);
  assert.match(route, /action: 'download_invoice'/);
  assert.match(route, /'cache-control': 'no-store'/);
  assert.match(route, /'content-type': 'application\/pdf'/);
  assert.match(route, /finance_email,billing_address,gstin/);
});

test('lender invoice template escapes dynamic data and exposes reconciliation totals', () => {
  assert.match(template, /const escapeHtml =/);
  assert.match(template, /escapeHtml\(application\?\.customer_name/);
  assert.match(template, /escapeHtml\(line\.application_id/);
  assert.match(template, /money\(line\.expected_amount\)/);
  assert.match(template, /money\(line\.tax_amount\)/);
  assert.match(template, /money\(line\.invoiced_amount\)/);
  assert.match(template, /Payment allocation evidence/);
  assert.match(template, /payment\?\.reference \|\| allocation\.payment_id/);
  assert.match(template, /allocation\.reconciliation_item_id/);
  assert.match(template, /money\(allocation\.amount\)/);
  assert.match(template, /Invoice total/);
  assert.match(template, /const recipient = invoice\.recipient_snapshot/);
  assert.match(template, /const frozenIssuer = invoice\.issuer_snapshot/);
  assert.match(template, /recipient\.billingAddress/);
  assert.match(template, /recipient\.gstin/);
  assert.match(template, /recipient\.financeEmail/);
  assert.match(template, /frozenIssuer\.gstNumber/);
  assert.match(template, /Outstanding/);
  assert.match(template, /renderHtmlPdf\(renderLenderInvoiceHtml\(input\)/);
});
