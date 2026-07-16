import { NextRequest, NextResponse } from 'next/server';
import { sendTransactionalEmail } from '@/lib/email/transactional';

const SUPPORT_EMAIL = process.env.CRM_DEMO_ENQUIRY_EMAIL || process.env.SUPPORT_EMAIL || 'support@credittrust.in';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fullName,
      mobile,
      businessName,
      city,
      teamSize,
      leadVolume,
      loanProducts = [],
      message,
    } = body;

    if (!fullName || !mobile || !businessName || !city) {
      return NextResponse.json(
        { error: 'Full name, mobile number, business name, and city are required.' },
        { status: 400 }
      );
    }

    const submittedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const result = await sendTransactionalEmail({
      to: SUPPORT_EMAIL,
      subject: `New CRM Demo Enquiry - ${businessName}`,
      templateAlias: 'crm-demo-enquiry',
      fallbackOnly: true,
      variables: {
        full_name: String(fullName).trim(),
        mobile: String(mobile).trim(),
        business_name: String(businessName).trim(),
        city: String(city).trim(),
        team_size: teamSize ? String(teamSize).trim() : '-',
        lead_volume: leadVolume ? String(leadVolume).trim() : '-',
        loan_products: Array.isArray(loanProducts) && loanProducts.length ? loanProducts.join(', ') : '-',
        message: message ? String(message).trim() : '-',
        submitted_at: submittedAt,
        source: 'credittrust.in CRM marketing demo page',
      },
    });

    if (!result.success) {
      console.warn('[crm-demo-enquiry] email failed:', result.error);
      return NextResponse.json(
        { error: 'Demo request could not be sent. Please try again.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[crm-demo-enquiry] unexpected error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
