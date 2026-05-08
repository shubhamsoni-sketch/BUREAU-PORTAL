import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invoice_id } = body;

    if (!invoice_id) {
      return NextResponse.json({ error: 'invoice_id is required' }, { status: 400 });
    }

    // Fetch invoice details first for notification
    const { data: invoice } = await supabaseAdmin
      .from('invoices')
      .select('id, invoice_number, partner_id, partner_name, amount')
      .eq('id', invoice_id)
      .maybeSingle();

    const { data, error } = await supabaseAdmin
      .from('invoices')
      .update({ status: 'raised' })
      .eq('id', invoice_id)
      .select('id, invoice_number, status')
      .single();

    if (error) {
      console.error('[raise-invoice] update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Notify partner that invoice has been raised
    if (invoice) {
      const { data: partner } = await supabaseAdmin
        .from('partners')
        .select('user_id')
        .eq('id', invoice.partner_id)
        .maybeSingle();

      if (partner?.user_id) {
        await supabaseAdmin.from('notifications').insert({
          user_id: partner.user_id,
          type: 'invoice_raised',
          title: 'Invoice Raised',
          message: `Invoice ${invoice.invoice_number} for ₹${Number(invoice.amount).toLocaleString('en-IN')} has been raised. Please arrange payment.`,
          metadata: {
            invoice_id: invoice.id,
            invoice_number: invoice.invoice_number,
            amount: invoice.amount,
          },
        });
      }
    }

    return NextResponse.json({ success: true, invoice: data });
  } catch (err: any) {
    console.error('[raise-invoice] unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
