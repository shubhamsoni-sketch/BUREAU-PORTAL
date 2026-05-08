import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const partnerId = searchParams.get('partner_id');
    const statusParam = searchParams.get('status'); // comma-separated e.g. "raised,paid"

    let query = supabaseAdmin
      .from('invoices')
      .select('*')
      .order('issued_at', { ascending: false });

    if (partnerId) {
      query = query.eq('partner_id', partnerId);
    }

    if (statusParam) {
      const statuses = statusParam.split(',').map((s) => s.trim());
      query = query.in('status', statuses);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[admin-invoices-list] query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (err: any) {
    console.error('[admin-invoices-list] unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { data, error } = await supabaseAdmin
      .from('invoices')
      .insert({
        invoice_number: body.invoice_number,
        partner_id: body.partner_id,
        partner_name: body.partner_name,
        partner_email: body.partner_email,
        amount: body.amount,
        credits_added: body.credits_added,
        payment_mode: body.payment_mode,
        status: body.status,
        transaction_ref: body.transaction_ref,
        notes: body.notes || '',
        issued_at: body.issued_at,
      })
      .select()
      .single();

    if (error) {
      console.error('[admin-invoices-list] POST error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('[admin-invoices-list] POST unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
