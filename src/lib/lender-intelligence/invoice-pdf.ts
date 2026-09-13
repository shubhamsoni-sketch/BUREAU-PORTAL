type InvoiceLine = {
  id: string;
  application_id?: string | null;
  expected_amount: number;
  tax_amount: number;
  invoiced_amount: number;
  lender_outcomes?:
    | {
        disbursed_amount?: number | null;
        crm_lender_applications?:
          | { customer_name?: string | null; product?: string | null }
          | { customer_name?: string | null; product?: string | null }[]
          | null;
      }
    | {
        disbursed_amount?: number | null;
        crm_lender_applications?:
          | { customer_name?: string | null; product?: string | null }[]
          | null;
      }[]
    | null;
};

export type LenderInvoicePdfInput = {
  invoice: {
    invoice_number: string;
    direction: string;
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    paid_amount: number;
    adjustment_amount?: number;
    status: string;
    issued_at?: string | null;
    due_at?: string | null;
    created_at: string;
    recipient_snapshot?: {
      legalName?: string | null;
      displayName?: string | null;
      billingAddress?: string | null;
      gstin?: string | null;
      financeEmail?: string | null;
      supportEmail?: string | null;
    } | null;
    issuer_snapshot?: {
      companyName?: string | null;
      companyAddress?: string | null;
      gstNumber?: string | null;
    } | null;
    lender_master?: {
      display_name?: string | null;
      legal_name?: string | null;
      support_email?: string | null;
      finance_email?: string | null;
      billing_address?: string | null;
      gstin?: string | null;
    } | null;
    partners?: {
      name?: string | null;
      company_name?: string | null;
      email?: string | null;
      city?: string | null;
    } | null;
  };
  lines: InvoiceLine[];
  allocations?: {
    payment_id: string;
    reconciliation_item_id: string;
    amount: number;
    allocated_at: string;
    lender_invoice_payments?:
      | { reference?: string | null; recorded_at?: string | null }
      | { reference?: string | null; recorded_at?: string | null }[]
      | null;
  }[];
  issuer?: {
    company_name?: string | null;
    company_address?: string | null;
    gst_number?: string | null;
  } | null;
};

const escapeHtml = (value: unknown) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ||
      character
  );
const money = (value: unknown) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value || 0));
const date = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
      })
    : '-';

export function renderLenderInvoiceHtml({
  invoice,
  lines,
  allocations = [],
  issuer,
}: LenderInvoicePdfInput) {
  const recipient = invoice.recipient_snapshot || {
    legalName: invoice.lender_master?.legal_name,
    displayName: invoice.lender_master?.display_name,
    billingAddress: invoice.lender_master?.billing_address,
    gstin: invoice.lender_master?.gstin,
    financeEmail: invoice.lender_master?.finance_email,
    supportEmail: invoice.lender_master?.support_email,
  };
  const frozenIssuer = invoice.issuer_snapshot || {
    companyName: issuer?.company_name,
    companyAddress: issuer?.company_address,
    gstNumber: issuer?.gst_number,
  };
  const outstanding =
    Number(invoice.total_amount) -
    Number(invoice.adjustment_amount || 0) -
    Number(invoice.paid_amount);
  const rows = lines
    .map((line, index) => {
      const outcome = Array.isArray(line.lender_outcomes)
        ? line.lender_outcomes[0]
        : line.lender_outcomes;
      const application = Array.isArray(outcome?.crm_lender_applications)
        ? outcome.crm_lender_applications[0]
        : outcome?.crm_lender_applications;
      return `<tr><td>${index + 1}</td><td><strong>${escapeHtml(application?.customer_name || 'Customer')}</strong><br><small>${escapeHtml(line.application_id || line.id)}</small></td><td>${escapeHtml(application?.product?.replace(/_/g, ' ') || '-')}</td><td class="num">${escapeHtml(money(outcome?.disbursed_amount))}</td><td class="num">${escapeHtml(money(line.expected_amount))}</td><td class="num">${escapeHtml(money(line.tax_amount))}</td><td class="num">${escapeHtml(money(line.invoiced_amount))}</td></tr>`;
    })
    .join('');
  const allocationRows = allocations
    .map((allocation, index) => {
      const payment = Array.isArray(allocation.lender_invoice_payments)
        ? allocation.lender_invoice_payments[0]
        : allocation.lender_invoice_payments;
      return `<tr><td>${index + 1}</td><td>${escapeHtml(payment?.reference || allocation.payment_id)}</td><td>${escapeHtml(allocation.reconciliation_item_id)}</td><td>${escapeHtml(date(payment?.recorded_at || allocation.allocated_at))}</td><td class="num">${escapeHtml(money(allocation.amount))}</td></tr>`;
    })
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4;margin:14mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#172033;font-size:11px;margin:0}.top{display:flex;justify-content:space-between;border-bottom:3px solid #1d4ed8;padding-bottom:14px}.brand{font-size:22px;font-weight:800;color:#1d4ed8}.title{text-align:right}.title h1{margin:0;font-size:25px}.muted{color:#64748b}.parties{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:20px 0}.card{border:1px solid #dbe3ef;border-radius:8px;padding:12px;min-height:95px}.label{font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;font-weight:700;margin-bottom:6px}table{width:100%;border-collapse:collapse}th{background:#eff6ff;text-align:left;color:#1e3a8a;font-size:9px;text-transform:uppercase;padding:8px 6px}td{border-bottom:1px solid #e2e8f0;padding:9px 6px;vertical-align:top}.num{text-align:right;white-space:nowrap}small{color:#64748b}.summary{margin:18px 0 0 auto;width:310px}.summary td{padding:6px}.summary .total{font-size:14px;font-weight:800;border-top:2px solid #1d4ed8}.status{display:inline-block;padding:4px 8px;border-radius:999px;background:#eff6ff;color:#1d4ed8;font-weight:700;text-transform:uppercase}.footer{margin-top:28px;border-top:1px solid #e2e8f0;padding-top:10px;color:#64748b;font-size:9px}.avoid{page-break-inside:avoid}</style></head><body>
    <div class="top"><div><div class="brand">${escapeHtml(frozenIssuer.companyName || 'Credit Trust Financial Services')}</div><div class="muted">${escapeHtml(frozenIssuer.companyAddress || '')}</div><div class="muted">GSTIN: ${escapeHtml(frozenIssuer.gstNumber || 'Not configured')}</div></div><div class="title"><h1>Lender Invoice</h1><div>${escapeHtml(invoice.invoice_number)}</div><div class="status">${escapeHtml(invoice.status.replace(/_/g, ' '))}</div></div></div>
    <div class="parties"><div class="card"><div class="label">Bill to / lender</div><strong>${escapeHtml(recipient.legalName || recipient.displayName || 'Lender')}</strong><br>${escapeHtml(recipient.billingAddress || '')}<br>GSTIN: ${escapeHtml(recipient.gstin || 'Not configured')}<br>${escapeHtml(recipient.financeEmail || recipient.supportEmail || '')}</div><div class="card"><div class="label">Partner / source</div><strong>${escapeHtml(invoice.partners?.company_name || invoice.partners?.name || 'CreditTrust network')}</strong><br>${escapeHtml(invoice.partners?.email || '')}<br>${escapeHtml(invoice.partners?.city || '')}</div></div>
    <div class="avoid"><table><thead><tr><th>#</th><th>Customer / application</th><th>Product</th><th class="num">Disbursed</th><th class="num">Payout</th><th class="num">Tax</th><th class="num">Line total</th></tr></thead><tbody>${rows || '<tr><td colspan="7">No reconciliation lines found.</td></tr>'}</tbody></table></div>
    <table class="summary"><tr><td>Subtotal</td><td class="num">${escapeHtml(money(invoice.subtotal))}</td></tr><tr><td>Tax</td><td class="num">${escapeHtml(money(invoice.tax_amount))}</td></tr><tr class="total"><td>Invoice total</td><td class="num">${escapeHtml(money(invoice.total_amount))}</td></tr><tr><td>Adjustments</td><td class="num">${escapeHtml(money(invoice.adjustment_amount))}</td></tr><tr><td>Paid</td><td class="num">${escapeHtml(money(invoice.paid_amount))}</td></tr><tr class="total"><td>Outstanding</td><td class="num">${escapeHtml(money(outstanding))}</td></tr></table>
    <div class="avoid"><div class="label">Payment allocation evidence</div><table><thead><tr><th>#</th><th>Payment reference / UTR</th><th>Reconciliation line</th><th>Date</th><th class="num">Allocated</th></tr></thead><tbody>${allocationRows || '<tr><td colspan="5">No payment allocations recorded.</td></tr>'}</tbody></table></div>
    <div class="footer">Created: ${escapeHtml(date(invoice.created_at))} | Issued: ${escapeHtml(date(invoice.issued_at))} | Due: ${escapeHtml(date(invoice.due_at))} | Direction: ${escapeHtml(invoice.direction)}<br>This system-generated document is backed by the immutable reconciliation, commercial-version, payment, adjustment, and audit records in CreditTrust Lender Intelligence.</div>
  </body></html>`;
}

export async function renderLenderInvoicePdf(input: LenderInvoicePdfInput) {
  const { renderHtmlPdf } = await import('@/lib/bureau/report-pdf');
  return renderHtmlPdf(renderLenderInvoiceHtml(input), { format: 'A4', scale: 0.92 });
}
