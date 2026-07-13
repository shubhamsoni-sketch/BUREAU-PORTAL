import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';

function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  const ts = Date.now().toString().slice(-4);
  return `INV-${year}-${rand}${ts}`;
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(bearerToken(req));
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { credit_request_id } = body;
    const supabaseAdmin = auth.supabase;

    if (!credit_request_id) {
      return NextResponse.json({ error: 'credit_request_id is required' }, { status: 400 });
    }

    // 1. Fetch the credit request
    const { data: creditRequest, error: crError } = await supabaseAdmin
      .from('credit_requests')
      .select('id, partner_id, user_id, amount, note, status')
      .eq('id', credit_request_id)
      .maybeSingle();

    if (crError || !creditRequest) {
      return NextResponse.json({ error: 'Credit request not found' }, { status: 404 });
    }

    if (creditRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Credit request is already processed' }, { status: 400 });
    }

    const { partner_id, amount, note } = creditRequest;
    const creditAmount = Number(amount);

    // 2. Fetch partner details
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('id, name, email, wallet_balance')
      .eq('id', partner_id)
      .maybeSingle();

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // 3. Insert wallet_transactions row as PENDING (Payment Pending tag)
    const description = note
      ? `Credit Request Approved — ${note}`
      : `Credit Request Approved — ₹${creditAmount.toLocaleString('en-IN')}`;

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
          source: 'credit_request_approval',
          credit_request_id,
          note: note || null,
        },
      })
      .select('id')
      .single();

    if (txnError) {
      console.error('[approve-credit-request] transaction insert error:', txnError);
      return NextResponse.json({ error: txnError.message }, { status: 500 });
    }

    // 4. Create draft invoice
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
        notes: note || `Credit request approved for ₹${creditAmount.toLocaleString('en-IN')}`,
        source_transaction_id: txnData?.id ?? null,
        issued_at: new Date().toISOString(),
      })
      .select('id, invoice_number')
      .single();

    if (invoiceError) {
      console.error('[approve-credit-request] invoice insert error:', invoiceError);
    }

    // 5. Mark credit request as approved
    await supabaseAdmin
      .from('credit_requests')
      .update({ status: 'approved' })
      .eq('id', credit_request_id);

    // 6. Notify the partner
    if (creditRequest.user_id) {
      await supabaseAdmin.from('notifications').insert({
        user_id: creditRequest.user_id,
        type: 'credit_approved',
        title: 'Credit Request Approved',
        message: `Your credit request of ₹${creditAmount.toLocaleString('en-IN')} has been approved. Draft invoice ${invoiceData?.invoice_number ?? ''} has been created.`,
        metadata: {
          partner_id,
          amount: creditAmount,
          invoice_number: invoiceData?.invoice_number ?? null,
          invoice_id: invoiceData?.id ?? null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Credit request approved. Pending transaction and draft invoice created.',
      invoice_number: invoiceData?.invoice_number ?? null,
      invoice_id: invoiceData?.id ?? null,
      transaction_id: txnData?.id ?? null,
    });
  } catch (err: any) {
    console.error('[approve-credit-request] unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(bearerToken(req));
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';
    const supabaseAdmin = auth.supabase;

    const { data, error } = await supabaseAdmin
      .from('credit_requests')
      .select(`
        id,
        partner_id,
        user_id,
        amount,
        note,
        status,
        created_at
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich with partner names
    const partnerIds = [...new Set((data ?? []).map((r: any) => r.partner_id))];
    let partnerMap: Record<string, { name: string; email: string; partner_code: string }> = {};

    if (partnerIds.length > 0) {
      const { data: partners } = await supabaseAdmin
        .from('partners')
        .select('id, name, email, partner_code')
        .in('id', partnerIds);

      (partners ?? []).forEach((p: any) => {
        partnerMap[p.id] = { name: p.name, email: p.email, partner_code: p.partner_code };
      });
    }

    const enriched = (data ?? []).map((r: any) => ({
      ...r,
      partner_name: partnerMap[r.partner_id]?.name ?? 'Unknown',
      partner_email: partnerMap[r.partner_id]?.email ?? '',
      partner_code: partnerMap[r.partner_id]?.partner_code ?? '',
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
