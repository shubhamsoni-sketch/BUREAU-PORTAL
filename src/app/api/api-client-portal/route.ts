import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getClientPortalSession } from '@/lib/api-hub/client-portal-auth';
import { hashApiKey } from '@/lib/api-hub/keys';
import { getApiHubStore, saveApiHubStore, SimpleSupportTicket } from '@/lib/api-hub/simple-store';
import { listApiUsageLedger } from '@/lib/api-hub/usage-ledger';

const SUPPORT_EMAIL = process.env.API_HUB_SUPPORT_EMAIL || process.env.SUPPORT_EMAIL || 'support@credittrust.in';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Credit Trust Bridge <support@credittrust.in>';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function apiKeyFromRequest(request: NextRequest) {
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  return request.headers.get('x-api-key')?.trim() || bearer || '';
}

async function clientContext(request: NextRequest) {
  const supabase = createAdminClient();
  const { rowId, store } = await getApiHubStore(supabase);

  const session = getClientPortalSession(request);
  if (session?.client_id) {
    const client = store.clients.find((item) => item.id === session.client_id && item.status === 'active');
    if (!client) return { error: 'Client is inactive or unavailable', status: 403 } as const;
    const key = store.keys.find((item) => item.client_id === client.id && item.status === 'active')
      || store.keys.find((item) => item.client_id === client.id);
    return { supabase, rowId, store, key, client } as const;
  }

  const apiKey = apiKeyFromRequest(request);
  if (!apiKey) return { error: 'Client portal login is required', status: 401 } as const;

  const keyHash = hashApiKey(apiKey);
  const key = store.keys.find((item) => item.key_hash === keyHash && item.status === 'active');
  if (!key) return { error: 'Invalid or inactive API key', status: 401 } as const;
  const client = store.clients.find((item) => item.id === key.client_id && item.status === 'active');
  if (!client) return { error: 'Client is inactive or unavailable', status: 403 } as const;
  return { supabase, rowId, store, key, client } as const;
}

function ticketStatusLabel(status: SimpleSupportTicket['status']) {
  return status.replace(/_/g, ' ');
}

async function notifySupport(ticket: SimpleSupportTicket, clientName: string) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) return { success: false, error: 'RESEND_API_KEY is missing' };

  const html = `
    <h2>New API Hub Support Ticket</h2>
    <p><b>Ticket:</b> ${escapeHtml(ticket.ticket_number)}</p>
    <p><b>Client:</b> ${escapeHtml(clientName)}</p>
    <p><b>Category:</b> ${escapeHtml(ticket.category)}</p>
    <p><b>Priority:</b> ${escapeHtml(ticket.priority)}</p>
    <p><b>Status:</b> ${escapeHtml(ticketStatusLabel(ticket.status))}</p>
    <p><b>Request ID:</b> ${escapeHtml(ticket.request_id || '-')}</p>
    <p><b>Subject:</b> ${escapeHtml(ticket.subject)}</p>
    <p><b>Message:</b><br/>${escapeHtml(ticket.message).replace(/\n/g, '<br/>')}</p>
    <p><b>Raised At:</b> ${escapeHtml(ticket.created_at)}</p>
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
      subject: `New Bridge Support Ticket ${ticket.ticket_number} - ${clientName}`,
      html,
      reply_to: ticket.client_email || undefined,
    }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) return { success: false, error: data?.message || 'Resend send failed' };
  return { success: true, emailId: data?.id as string | undefined };
}

function publicTicket(ticket: SimpleSupportTicket) {
  return {
    id: ticket.id,
    ticket_number: ticket.ticket_number,
    category: ticket.category,
    priority: ticket.priority,
    subject: ticket.subject,
    message: ticket.message,
    request_id: ticket.request_id,
    status: ticket.status,
    last_response: ticket.last_response,
    created_at: ticket.created_at,
    updated_at: ticket.updated_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await clientContext(request);
    if ('error' in auth) return jsonError(auth.error || 'Unauthorized', auth.status || 401);

    const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') || 1));
    const pageSize = Math.min(50, Math.max(10, Number(request.nextUrl.searchParams.get('page_size') || 25)));
    const ledger = await listApiUsageLedger(auth.supabase, {
      page,
      pageSize,
      clientId: auth.client.id,
    });
    const tickets = auth.store.tickets
      .filter((ticket) => ticket.client_id === auth.client.id)
      .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))
      .map(publicTicket);
    const usage = ledger.rows || [];
    const successCount = usage.filter((row: Record<string, unknown>) => row.status === 'success').length;
    const failedCount = usage.filter((row: Record<string, unknown>) => row.status === 'failed').length;
    const liveCredits = Number((auth.client.metadata as Record<string, unknown> | undefined)?.live_credits || 0);

    return NextResponse.json({
      success: true,
      client: {
        id: auth.client.id,
        name: auth.client.name,
        legal_name: auth.client.company_name || auth.client.name,
        email: auth.client.email,
        uat_credits: auth.client.credits,
        live_credits: liveCredits,
        allowed_ips: auth.client.allowed_ips || [],
        status: auth.client.status,
      },
      key: {
        id: auth.key?.id || null,
        environment: auth.key?.environment || 'uat',
        label: auth.key?.label || 'Client API access',
        prefix: auth.key?.key_prefix || '',
        last_used_at: auth.key?.last_used_at || null,
      },
      metrics: {
        total_requests: ledger.total,
        page_success: successCount,
        page_failed: failedCount,
        open_tickets: tickets.filter((ticket) => ticket.status === 'open' || ticket.status === 'in_progress').length,
      },
      usage,
      usage_pagination: ledger,
      tickets,
    });
  } catch (error) {
    console.error('[api-client-portal] GET failed:', error);
    return jsonError('Unable to load client portal data', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await clientContext(request);
    if ('error' in auth) return jsonError(auth.error || 'Unauthorized', auth.status || 401);
    const body = await request.json();
    const subject = String(body.subject || '').trim();
    const message = String(body.message || '').trim();
    if (!subject || !message) return jsonError('Subject and message are required');

    const now = new Date().toISOString();
    const ticket: SimpleSupportTicket = {
      id: crypto.randomUUID(),
      ticket_number: `CT-${Date.now().toString().slice(-8)}`,
      client_id: auth.client.id,
      category: ['api_issue', 'auth_access', 'response_mismatch', 'credits_billing', 'ip_certificate', 'other'].includes(String(body.category))
        ? body.category
        : 'api_issue',
      priority: ['low', 'medium', 'high', 'critical'].includes(String(body.priority))
        ? body.priority
        : 'medium',
      subject,
      message,
      request_id: String(body.request_id || '').trim() || null,
      status: 'open',
      client_email: auth.client.email || null,
      client_name: auth.client.contact_name || auth.client.name,
      internal_note: null,
      last_response: null,
      created_at: now,
      updated_at: now,
    };

    auth.store.tickets = [ticket, ...(auth.store.tickets || [])];
    await saveApiHubStore(auth.supabase, auth.rowId, auth.store);
    const emailResult = await notifySupport(ticket, auth.client.name);
    if (!emailResult.success) console.warn('[api-client-portal] support email failed:', emailResult.error);

    return NextResponse.json({ success: true, ticket: publicTicket(ticket), email_sent: emailResult.success });
  } catch (error) {
    console.error('[api-client-portal] POST failed:', error);
    return jsonError('Unable to create support ticket', 500);
  }
}
