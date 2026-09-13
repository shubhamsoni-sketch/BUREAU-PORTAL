import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizeWhatsAppPhone } from '@/lib/whatsapp/cloud-api';
import {
  logWhatsAppIncomingMessage,
  updateWhatsAppMessageStatus,
  type SupabaseLike,
} from '@/lib/whatsapp/analytics';
import {
  updateTrackedWhatsAppMessageStatus,
  upsertWhatsAppLeadFromInbound,
} from '@/lib/marketing/attribution';
import { handleWhatsAppAutoReply } from '@/lib/growth-campaigns/ai-agent';

type WhatsAppMessage = {
  from?: string;
  id?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  button?: { text?: string; payload?: string };
  referral?: unknown;
  interactive?:
    | {
        button_reply?: { id?: string; title?: string };
        list_reply?: { id?: string; title?: string; description?: string };
      }
    | unknown;
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
  return (
    status.errors
      ?.map((error) => [error.code, error.title || error.message].filter(Boolean).join(': '))
      .filter(Boolean)
      .join(' | ') || null
  );
}

async function insertLog(supabase: SupabaseLike, row: Record<string, unknown>) {
  const { error } = await supabase.from('whatsapp_event_logs').insert(row);
  if (error) throw new Error(error.message);
}

function incomingText(message: WhatsAppMessage) {
  const interactive =
    message.interactive && typeof message.interactive === 'object'
      ? (message.interactive as {
          button_reply?: { title?: string };
          list_reply?: { title?: string };
        })
      : null;
  return (
    message.text?.body ||
    message.button?.text ||
    interactive?.button_reply?.title ||
    interactive?.list_reply?.title ||
    null
  );
}

function incomingButtonPayload(message: WhatsAppMessage) {
  const interactive =
    message.interactive && typeof message.interactive === 'object'
      ? (message.interactive as { button_reply?: { id?: string }; list_reply?: { id?: string } })
      : null;
  return (
    message.button?.payload || interactive?.button_reply?.id || interactive?.list_reply?.id || null
  );
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
    const supabase = createAdminClient();
    let logged = 0;

    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : [];

      for (const change of changes) {
        const value = change?.value ?? {};
        const metadata = value?.metadata ?? {};
        const contacts = Array.isArray(value?.contacts) ? value.contacts : [];
        const messages: WhatsAppMessage[] = Array.isArray(value?.messages) ? value.messages : [];
        const statuses: WhatsAppStatus[] = Array.isArray(value?.statuses) ? value.statuses : [];

        for (const message of messages) {
          const from = normalizeWhatsAppPhone(message.from);
          const contact = contacts.find(
            (item: any) => normalizeWhatsAppPhone(item?.wa_id) === from
          );
          await insertLog(supabase, {
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
          await logWhatsAppIncomingMessage({
            supabase,
            phoneNumber: from,
            whatsappMessageId: message.id ?? null,
            messageType: message.type ?? null,
            messageText: incomingText(message),
            buttonPayload: incomingButtonPayload(message),
            timestamp: message.timestamp ?? null,
            rawMessage: message,
            metadata: {
              entry_id: entry?.id ?? null,
              field: change?.field ?? null,
              phone_number_id: metadata?.phone_number_id ?? null,
              display_phone_number: metadata?.display_phone_number ?? null,
            },
          });
          await upsertWhatsAppLeadFromInbound({
            supabase,
            phoneNumber: from,
            waId: message.from ?? null,
            profileName: contact?.profile?.name ?? null,
            message: message as any,
          }).catch((error) => {
            console.warn(
              '[whatsapp-webhook] marketing attribution failed:',
              error instanceof Error ? error.message : error
            );
          });
          await handleWhatsAppAutoReply({
            supabase,
            phoneNumber: from,
            messageText: incomingText(message),
            providerMessageId: message.id ?? null,
            contactName: contact?.profile?.name ?? null,
            metadata: {
              source: 'whatsapp_webhook',
              message_type: message.type ?? null,
              button_payload: incomingButtonPayload(message),
            },
          }).catch((error) => {
            console.warn(
              '[whatsapp-webhook] auto reply failed:',
              error instanceof Error ? error.message : error
            );
          });
          logged += 1;
        }

        for (const status of statuses) {
          const recipient = normalizeWhatsAppPhone(status.recipient_id);
          const failureReason = getErrorText(status);
          await insertLog(supabase, {
            event_type: 'whatsapp_message_status',
            recipient_phone: recipient || 'unknown',
            status: status.status || 'unknown',
            message_id: status.id ?? null,
            error: failureReason,
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
          await updateWhatsAppMessageStatus({
            supabase,
            whatsappMessageId: status.id ?? null,
            phoneNumber: recipient,
            status: status.status ?? null,
            timestamp: status.timestamp ?? null,
            failureReason,
            rawStatus: status,
          });
          await updateTrackedWhatsAppMessageStatus({
            supabase,
            whatsappMessageId: status.id ?? null,
            status: status.status ?? null,
            timestamp: status.timestamp ?? null,
            failureReason,
            rawStatus: status,
          }).catch((error) => {
            console.warn(
              '[whatsapp-webhook] tracked status update failed:',
              error instanceof Error ? error.message : error
            );
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
