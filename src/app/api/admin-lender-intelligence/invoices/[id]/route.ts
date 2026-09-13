import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';
import { logLenderIntelligenceAudit } from '@/lib/lender-intelligence/audit';
import {
  renderLenderInvoiceHtml,
  renderLenderInvoicePdf,
} from '@/lib/lender-intelligence/invoice-pdf';
import { requireLenderIntelligenceCapability } from '@/lib/lender-intelligence/access';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(bearerToken(request));
  if ('error' in auth)
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  const denied = requireLenderIntelligenceCapability(auth.user, 'finance.read');
  if (denied)
    return NextResponse.json({ success: false, error: denied.error }, { status: denied.status });
  const { id } = await context.params;
  const [invoiceResult, linesResult, settingsResult, allocationsResult] = await Promise.all([
    auth.supabase
      .from('lender_invoices')
      .select(
        '*,lender_master(display_name,legal_name,support_email,finance_email,billing_address,gstin),partners(name,company_name,email,city)'
      )
      .eq('id', id)
      .maybeSingle(),
    auth.supabase
      .from('lender_reconciliation_items')
      .select(
        'id,application_id,expected_amount,tax_amount,invoiced_amount,lender_outcomes(disbursed_amount,crm_lender_applications(customer_name,product))'
      )
      .eq('invoice_id', id)
      .order('created_at'),
    auth.supabase
      .from('invoice_settings')
      .select('company_name,company_address,gst_number')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    auth.supabase
      .from('lender_invoice_payment_allocations')
      .select(
        'payment_id,reconciliation_item_id,amount,allocated_at,lender_invoice_payments!inner(invoice_id,reference,recorded_at)'
      )
      .eq('lender_invoice_payments.invoice_id', id)
      .order('allocated_at'),
  ]);
  if (invoiceResult.error || !invoiceResult.data)
    return NextResponse.json(
      { success: false, error: 'Lender invoice not found' },
      { status: 404 }
    );
  if (linesResult.error)
    return NextResponse.json({ success: false, error: linesResult.error.message }, { status: 500 });
  if (allocationsResult.error)
    return NextResponse.json(
      { success: false, error: allocationsResult.error.message },
      { status: 500 }
    );
  const input = {
    invoice: invoiceResult.data,
    lines: linesResult.data || [],
    allocations: allocationsResult.data || [],
    issuer: settingsResult.data,
  };
  const format = new URL(request.url).searchParams.get('format') || 'pdf';
  await logLenderIntelligenceAudit(auth.supabase, auth.user, {
    partnerId: invoiceResult.data.partner_id,
    module: 'invoicing',
    action: 'download_invoice',
    entityType: 'lender_invoice',
    entityId: id,
    summary: `${invoiceResult.data.invoice_number} invoice artifact accessed`,
    metadata: {
      format,
      lineCount: input.lines.length,
      paymentAllocationCount: input.allocations.length,
    },
  });
  if (format === 'html')
    return new NextResponse(renderLenderInvoiceHtml(input), {
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
    });
  const pdf = await renderLenderInvoicePdf(input);
  const fileName = `${invoiceResult.data.invoice_number.replace(/[^a-z0-9_-]/gi, '-')}.pdf`;
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${fileName}"`,
      'cache-control': 'no-store',
    },
  });
}
