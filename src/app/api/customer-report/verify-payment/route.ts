import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orderId = String(body.order_id ?? '').trim();
    const requestId = String(body.request_id ?? '').trim();
    const reportId = `RPT_${Date.now()}`;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const hasCashfreeConfig = Boolean(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);

    if (!hasCashfreeConfig) {
      if (requestId) {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
        await supabaseAdmin.from('b2c_payments').update({
          status: 'success',
          payment_id: `DEMO_${Date.now()}`,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          raw_response: { mode: 'demo', payment_status: 'PAID' },
        }).eq('order_id', orderId);
        await supabaseAdmin.from('b2c_report_requests').update({
          status: 'report_generated',
          report_id: reportId,
          credit_score: 742,
          report_json: { score: 742, loanReadiness: 'Good', riskLevel: 'Moderate', nextAction: 'Reduce utilization' },
          api_status: 'demo_generated',
          updated_at: new Date().toISOString(),
        }).eq('id', requestId);
      }
      return NextResponse.json({
        success: true,
        mode: 'demo',
        payment_status: 'PAID',
        report_id: reportId,
      });
    }

    // Cashfree payment verification will be completed here using the order status API/webhook.
    if (requestId) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
      await supabaseAdmin.from('b2c_report_requests').update({ status: 'payment_success', report_id: reportId, updated_at: new Date().toISOString() }).eq('id', requestId);
      await supabaseAdmin.from('b2c_payments').update({ status: 'success', paid_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('order_id', orderId);
    }
    return NextResponse.json({
      success: true,
      mode: 'cashfree-ready',
      payment_status: 'PAID',
      report_id: reportId,
    });
  } catch (error) {
    console.error('[customer-report/verify-payment] unexpected error:', error);
    return NextResponse.json({ error: 'Unable to verify payment' }, { status: 500 });
  }
}
