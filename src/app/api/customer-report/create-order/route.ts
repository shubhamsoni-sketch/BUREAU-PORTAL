import { NextRequest, NextResponse } from 'next/server';

const REPORT_PRICE = 199;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mobile = String(body.mobile ?? '').trim();
    const name = String(body.name ?? '').trim();
    const requestId = String(body.request_id ?? '').trim();
    const pan = String(body.pan ?? '').trim().toUpperCase();

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json({ error: 'Valid mobile number is required' }, { status: 400 });
    }

    const orderId = `CTR_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const hasCashfreeConfig = Boolean(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);

    if (!hasCashfreeConfig) {
      if (requestId) {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
        await supabaseAdmin.from('b2c_report_requests').update({ status: 'payment_pending', updated_at: new Date().toISOString() }).eq('id', requestId);
        await supabaseAdmin.from('b2c_payments').insert({
          request_id: requestId,
          full_name: name || 'Customer',
          mobile,
          pan: pan || null,
          order_id: orderId,
          amount: REPORT_PRICE,
          status: 'created',
          raw_response: { mode: 'demo' },
        });
      }
      return NextResponse.json({
        success: true,
        mode: 'demo',
        order: {
          order_id: orderId,
          order_amount: REPORT_PRICE,
          order_currency: 'INR',
          customer_details: {
            customer_id: mobile,
            customer_name: name || 'Customer',
            customer_phone: mobile,
          },
        },
      });
    }

    // Cashfree production/sandbox call will be wired here once merchant keys and callback URLs are finalized.
    if (requestId) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
      await supabaseAdmin.from('b2c_report_requests').update({ status: 'payment_pending', updated_at: new Date().toISOString() }).eq('id', requestId);
      await supabaseAdmin.from('b2c_payments').insert({
        request_id: requestId,
        full_name: name || 'Customer',
        mobile,
        pan: pan || null,
        order_id: orderId,
        amount: REPORT_PRICE,
        status: 'created',
        raw_response: { mode: 'cashfree-ready' },
      });
    }
    return NextResponse.json({
      success: true,
      mode: 'cashfree-ready',
      order: {
        order_id: orderId,
        order_amount: REPORT_PRICE,
        order_currency: 'INR',
      },
    });
  } catch (error) {
    console.error('[customer-report/create-order] unexpected error:', error);
    return NextResponse.json({ error: 'Unable to create payment order' }, { status: 500 });
  }
}
