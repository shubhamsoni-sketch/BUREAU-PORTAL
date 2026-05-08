import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  const ts = Date.now().toString().slice(-4);
  return `INV-${year}-${rand}${ts}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { partner_id, amount, note } = body;

    if (!partner_id || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: 'partner_id and valid amount are required' }, { status: 400 });
    }

    const creditAmount = Number(amount);

    // 1. Fetch partner details
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('id, name, email, wallet_balance')
      .eq('id', partner_id)
      .maybeSingle();

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // 2. Insert wallet_transactions row as PENDING (no balance update yet)
    const description = note || `Admin Credit Addition — ₹${creditAmount.toLocaleString('en-IN')}`;
    const { data: txnData, error: txnError } = await supabaseAdmin
      .from('wallet_transactions')
      .insert({
        partner_id,
        type: 'credit',
        amount: creditAmount,
        description,
        transaction_type: 'recharge',
        status: 'pending',
        metadata: {
          source: 'admin_credit_addition',
          note: note || null,
        },
      })
      .select('id')
      .single();

    if (txnError) {
      console.error('[add-credits] transaction insert error:', txnError);
      return NextResponse.json({ error: txnError.message }, { status: 500 });
    }

    // 3. Fetch invoice_settings for company info
    const { data: invoiceSettings } = await supabaseAdmin
      .from('invoice_settings')
      .select('company_name, company_address, gst_number')
      .limit(1)
      .maybeSingle();

    // 4. Create draft invoice (wallet NOT updated yet — only after invoice is marked paid)
    const invoiceNumber = generateInvoiceNumber();
    const { data: invoiceData, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        partner_id,
        partner_name: partner.name,
        partner_email: partner.email || '',
        amount: creditAmount,
        credits_added: creditAmount,
        payment_mode: 'Pending',
        status: 'draft',
        transaction_ref: txnData?.id ?? null,
        notes: note || '',
        source_transaction_id: txnData?.id ?? null,
        issued_at: new Date().toISOString(),
      })
      .select('id, invoice_number')
      .single();

    if (invoiceError) {
      console.error('[add-credits] invoice insert error:', invoiceError);
      // Don't fail — transaction already created
    }

    return NextResponse.json({
      success: true,
      message: 'Draft invoice created. Wallet will update when invoice is marked paid.',
      invoice_number: invoiceData?.invoice_number ?? null,
      invoice_id: invoiceData?.id ?? null,
      transaction_id: txnData?.id ?? null,
    });
  } catch (err: any) {
    console.error('[add-credits] unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
