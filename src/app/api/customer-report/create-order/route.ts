import { NextRequest, NextResponse } from 'next/server';

const REPORT_PRICE = 199;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mobile = String(body.mobile ?? '').trim();
    const name = String(body.name ?? '').trim();

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json({ error: 'Valid mobile number is required' }, { status: 400 });
    }

    const orderId = `IQR_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const hasCashfreeConfig = Boolean(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);

    if (!hasCashfreeConfig) {
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
