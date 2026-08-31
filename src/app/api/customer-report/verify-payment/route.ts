import { NextRequest, NextResponse } from 'next/server';
import { getCashfreeOrder } from '@/lib/b2c/cashfree';
import { requireB2cSession } from '@/lib/b2c/security';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const requestId = String(body.request_id ?? '').trim();
    const orderId = String(body.order_id ?? '').trim();
    if (!requireB2cSession(request, requestId)) {
      return NextResponse.json({ success: false, error: 'This report session has expired.' }, { status: 401 });
    }
    const supabase = createAdminClient();
    const { data: payment } = await supabase
      .from('b2c_payments')
      .select('id,status')
      .eq('request_id', requestId)
      .eq('order_id', orderId)
      .maybeSingle();
    if (!payment) return NextResponse.json({ success: false, error: 'Payment order not found.' }, { status: 404 });

    const order = await getCashfreeOrder(orderId);
    if (order.order_status !== 'PAID') {
      await supabase.from('b2c_payments').update({ status: String(order.order_status || 'pending').toLowerCase(), raw_response: order, updated_at: new Date().toISOString() }).eq('id', payment.id);
      return NextResponse.json({ success: false, payment_status: order.order_status || 'PENDING', error: 'Payment is not complete.' }, { status: 409 });
    }

    const now = new Date().toISOString();
    await Promise.all([
      supabase.from('b2c_payments').update({ status: 'success', payment_id: order.cf_order_id ? String(order.cf_order_id) : null, paid_at: now, raw_response: order, updated_at: now }).eq('id', payment.id),
      supabase.from('b2c_report_requests').update({ status: 'payment_verified', payment_verified_at: now, updated_at: now }).eq('id', requestId),
    ]);
    return NextResponse.json({ success: true, payment_status: 'PAID' });
  } catch (error) {
    console.error('[customer-report/verify-payment]', error);
    return NextResponse.json({ success: false, error: 'Unable to verify payment.' }, { status: 500 });
  }
}
