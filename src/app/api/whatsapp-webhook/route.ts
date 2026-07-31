import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizeWhatsAppPhone } from '@/lib/whatsapp/cloud-api';

type WhatsAppMessage = {
  from?: string;
  id?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  button?: { text?: string; payload?: string };
  interactive?: unknown;
};

type WhatsAppStatus = {
  id?: string;
  recipient_id?: string;
  status?: string;
  timestamp?: string;
  errors?: Array<{ code?: number; title?: string; message?: string; error_data?: unknown }>;
  conversation?: unknown;
  pricing?: unknown;
};

function json(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, { status });
}

function verifyToken() {
  return process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '';
}

function getErrorText(status: WhatsAppStatus) {
  return status.errors
    ?.map((error) => [error.code, error.title || error.message].filter(Boolean).join(': '))
    .filter(Boolean)
    .join(' | ') || null;
}

async function insertLog(row: Record<string, unknown>) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('whatsapp_event_logs').insert(row);
  if (error) throw new Error(error.message);
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = params.get('hub.mode');
  const token = params.get('hub.verify_token');
  const challenge = params.get('hub.challenge');

  if (mode === 'subscribe' && token && token === verifyToken()) {
    return new Response(challenge || '', { status: 200 });
  }

  return new Response('Forbidden', { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const entries = Array.isArray(payload?.entry) ? payload.entry : [];
    let logged = 0;

    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : [];

      for (const change of changes) {
        const value = change?.value ?? {};
        const metadata = value?.metadata ?? {};
        const messages: WhatsAppMessage[] = Array.isArray(value?.messages) ? value.messages : [];
        const statuses: WhatsAppStatus[] = Array.isArray(value?.statuses) ? value.statuses : [];

        for (const message of messages) {
          const from = normalizeWhatsAppPhone(message.from);
          await insertLog({
            event_type: 'whatsapp_inbound_message',
            recipient_phone: from || 'unknown',
            status: 'received',
            message_id: message.id ?? null,
            metadata: {
              entry_id: entry?.id ?? null,
              field: change?.field ?? null,
              phone_number_id: metadata?.phone_number_id ?? null,
              display_phone_number: metadata?.display_phone_number ?? null,
              message_type: message.type ?? null,
              timestamp: message.timestamp ?? null,
              text: message.text?.body ?? null,
              button: message.button ?? null,
              interactive: message.interactive ?? null,
              raw_message: message,
            },
          });
          logged += 1;
        }

        for (const status of statuses) {
          const recipient = normalizeWhatsAppPhone(status.recipient_id);
          await insertLog({
            event_type: 'whatsapp_message_status',
            recipient_phone: recipient || 'unknown',
            status: status.status || 'unknown',
            message_id: status.id ?? null,
            error: getErrorText(status),
            metadata: {
              entry_id: entry?.id ?? null,
              field: change?.field ?? null,
              phone_number_id: metadata?.phone_number_id ?? null,
              display_phone_number: metadata?.display_phone_number ?? null,
              timestamp: status.timestamp ?? null,
              conversation: status.conversation ?? null,
              pricing: status.pricing ?? null,
              errors: status.errors ?? null,
              raw_status: status,
            },
          });
          logged += 1;
        }
      }
    }

    return json({ success: true, logged });
  } catch (error) {
    console.error('[whatsapp-webhook] failed:', error);
    return json(
      { success: false, error: error instanceof Error ? error.message : 'Webhook failed' },
      500
    );
  }
}
