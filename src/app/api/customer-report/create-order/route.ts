import { NextRequest, NextResponse } from 'next/server';
import { cashfreeMode, createCashfreeOrder } from '@/lib/b2c/cashfree';
import { requireB2cSession } from '@/lib/b2c/security';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const requestId = String(body.request_id ?? '').trim();
    if (!requireB2cSession(request, requestId)) {
      return NextResponse.json({ success: false, error: 'This report session has expired.' }, { status: 401 });
    }
    const supabase = createAdminClient();
    const { data: reportRequest } = await supabase
      .from('b2c_report_requests')
      .select('id,mobile,consent_given,otp_verified_at')
      .eq('id', requestId)
      .maybeSingle();
    if (!reportRequest?.consent_given || !reportRequest.otp_verified_at) {
      return NextResponse.json({ success: false, error: 'Verify your mobile number before payment.' }, { status: 409 });
    }

    const amount = Math.max(1, Number(process.env.B2C_REPORT_PRICE || 199));
    const orderId = `CTR_${Date.now()}_${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const order = await createCashfreeOrder({ orderId, amount, requestId, mobile: reportRequest.mobile });
    const now = new Date().toISOString();
    const { error } = await supabase.from('b2c_payments').insert({
      request_id: requestId,
      mobile: reportRequest.mobile,
      order_id: orderId,
      amount,
      status: 'created',
      raw_response: order,
      updated_at: now,
    });
    if (error) throw error;
    await supabase.from('b2c_report_requests').update({ status: 'payment_pending', updated_at: now }).eq('id', requestId);

    return NextResponse.json({
      success: true,
      order_id: orderId,
      amount,
      currency: 'INR',
      payment_session_id: order.payment_session_id,
      mode: cashfreeMode(),
    });
  } catch (error) {
    console.error('[customer-report/create-order]', error);
    const message = error instanceof Error ? error.message : 'Unable to create payment order';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
