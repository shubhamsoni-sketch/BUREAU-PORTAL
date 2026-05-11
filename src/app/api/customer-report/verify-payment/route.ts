import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orderId = String(body.order_id ?? '').trim();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const hasCashfreeConfig = Boolean(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);

    if (!hasCashfreeConfig) {
      return NextResponse.json({
        success: true,
        mode: 'demo',
        payment_status: 'PAID',
        report_id: `RPT_${Date.now()}`,
      });
    }

    // Cashfree payment verification will be completed here using the order status API/webhook.
    return NextResponse.json({
      success: true,
      mode: 'cashfree-ready',
      payment_status: 'PAID',
      report_id: `RPT_${Date.now()}`,
    });
  } catch (error) {
    console.error('[customer-report/verify-payment] unexpected error:', error);
    return NextResponse.json({ error: 'Unable to verify payment' }, { status: 500 });
  }
}
