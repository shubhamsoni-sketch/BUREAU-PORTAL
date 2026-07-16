import { NextRequest, NextResponse } from 'next/server';
import { sendTransactionalEmail } from '@/lib/email/transactional';

const SUPPORT_EMAIL = process.env.CRM_DEMO_ENQUIRY_EMAIL || process.env.SUPPORT_EMAIL || 'support@credittrust.in';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Credit Trust <support@credittrust.in>';

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function sendDirectDemoEmail(input: {
  subject: string;
  variables: Record<string, unknown>;
  replyTo?: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return { success: false, error: 'RESEND_API_KEY is missing' };
  }

  const html = `
    <h2>New CRM Demo Enquiry</h2>
    <p>A new CRM demo request has been submitted on CreditTrust.</p>
    <p><b>Name:</b> ${escapeHtml(input.variables.full_name)}</p>
    <p><b>Mobile:</b> ${escapeHtml(input.variables.mobile)}</p>
    <p><b>Business / DSA Name:</b> ${escapeHtml(input.variables.business_name)}</p>
    <p><b>City:</b> ${escapeHtml(input.variables.city)}</p>
    <p><b>Team Size:</b> ${escapeHtml(input.variables.team_size)}</p>
    <p><b>Monthly Lead Volume:</b> ${escapeHtml(input.variables.lead_volume)}</p>
    <p><b>Loan Products:</b> ${escapeHtml(input.variables.loan_products)}</p>
    <p><b>Message:</b> ${escapeHtml(input.variables.message)}</p>
    <p><b>Submitted At:</b> ${escapeHtml(input.variables.submitted_at)}</p>
    <p><b>Source:</b> ${escapeHtml(input.variables.source)}</p>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [SUPPORT_EMAIL],
      subject: input.subject,
      html,
      reply_to: input.replyTo,
    }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    return { success: false, error: data?.message || 'Resend API send failed' };
  }

  return { success: true, emailId: data?.id as string | undefined };
}

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
    const variables = {
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
    };
    const subject = `New CRM Demo Enquiry - ${businessName}`;

    const directResult = await sendDirectDemoEmail({
      subject,
      variables,
    });

    const result = directResult.success ? directResult : await sendTransactionalEmail({
      to: SUPPORT_EMAIL,
      subject,
      templateAlias: 'crm-demo-enquiry',
      fallbackOnly: true,
      variables,
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
