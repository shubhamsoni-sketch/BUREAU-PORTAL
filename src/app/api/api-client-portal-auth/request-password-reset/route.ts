import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getClientPortalMetadata } from '@/lib/api-hub/client-portal-auth';
import { getApiHubStore, SimpleApiClient } from '@/lib/api-hub/simple-store';

const SUPPORT_EMAIL = process.env.API_HUB_SUPPORT_EMAIL || process.env.SUPPORT_EMAIL || 'support@credittrust.in';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Credit Trust Bridge <support@credittrust.in>';

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function findClientByUsername(clients: SimpleApiClient[], username: string) {
  const normalizedUsername = username.trim().toLowerCase();
  if (!normalizedUsername) return null;

  return clients.find((client) => {
    const portal = getClientPortalMetadata(client);
    const configuredUsername = String(portal.username || '').trim().toLowerCase();
    return client.status === 'active' && configuredUsername === normalizedUsername;
  }) || null;
}

async function sendResetRequestMail(username: string, client: SimpleApiClient | null) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) return { success: false, error: 'RESEND_API_KEY is missing' };

  const html = `
    <h2>Client Workspace Password Reset Request</h2>
    <p>A client requested a manual password reset from the CreditTrust Bridge client workspace login screen.</p>
    <p><b>Login ID:</b> ${escapeHtml(username)}</p>
    <p><b>Matched Client:</b> ${escapeHtml(client?.name || 'No active client matched')}</p>
    <p><b>Legal Name:</b> ${escapeHtml(client?.company_name || '-')}</p>
    <p><b>Primary Email:</b> ${escapeHtml(client?.email || '-')}</p>
    <p><b>Requested At:</b> ${escapeHtml(new Date().toISOString())}</p>
    <p>Please verify the requester and reset the workspace password from the API Hub admin console before sharing it through the agreed secure channel.</p>
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
      subject: `Client workspace password reset request - ${username}`,
      html,
      reply_to: client?.email || undefined,
    }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) return { success: false, error: data?.message || 'Resend send failed' };
  return { success: true, emailId: data?.id as string | undefined };
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Request body must be valid JSON' }, { status: 400 });
  }

  const username = String(body.username || '').trim();
  if (!username) {
    return NextResponse.json({ success: false, error: 'Enter Login ID before requesting password reset' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { store } = await getApiHubStore(supabase);
    const client = findClientByUsername(store.clients || [], username);
    const emailResult = await sendResetRequestMail(username, client);
    if (!emailResult.success) {
      console.warn('[api-client-portal-auth] password reset request email failed:', emailResult.error);
      return NextResponse.json({ success: false, error: 'Password reset request mail is not configured' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset request sent to CreditTrust support.',
    });
  } catch (error) {
    console.error('[api-client-portal-auth] password reset request failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to send password reset request' }, { status: 500 });
  }
}
