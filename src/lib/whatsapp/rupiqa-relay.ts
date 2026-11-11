import { createHash } from 'crypto';

import type { SupabaseLike } from '@/lib/whatsapp/analytics';

const DEFAULT_RELAY_URL = 'https://www.rupiqa.in/api/webhooks/meta-whatsapp';
const MAX_ATTEMPTS = 8;

type RelayHeaders = Record<string, string>;

type RelayRow = {
  id: string;
  raw_body: string;
  forward_headers: RelayHeaders | null;
  attempts: number | null;
};

function relayUrl() {
  return (process.env.RUPIQA_META_WHATSAPP_RELAY_URL || DEFAULT_RELAY_URL).trim();
}

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function cleanHeader(value: string | null) {
  return value?.trim() || '';
}

function addHeader(headers: RelayHeaders, name: string, value: string | null) {
  const cleaned = cleanHeader(value);
  if (cleaned) headers[name] = cleaned;
}

export function buildWhatsAppRelayHeaders(request: Request) {
  const headers: RelayHeaders = {
    'content-type': request.headers.get('content-type') || 'application/json',
    'x-credittrust-relay': 'whatsapp-meta-webhook',
  };

  addHeader(headers, 'x-hub-signature-256', request.headers.get('x-hub-signature-256'));
  addHeader(headers, 'x-hub-signature', request.headers.get('x-hub-signature'));
  addHeader(headers, 'user-agent', request.headers.get('user-agent'));
  addHeader(headers, 'x-forwarded-for', request.headers.get('x-forwarded-for'));
  addHeader(headers, 'x-forwarded-host', request.headers.get('x-forwarded-host'));
  addHeader(headers, 'x-forwarded-proto', request.headers.get('x-forwarded-proto'));

  return headers;
}

function extractWebhookIds(payload: any) {
  const ids = new Set<string>();
  const entries = Array.isArray(payload?.entry) ? payload.entry : [];

  for (const entry of entries) {
    if (entry?.id) ids.add(`entry:${entry.id}`);
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];
    for (const change of changes) {
      const value = change?.value ?? {};
      const messages = Array.isArray(value?.messages) ? value.messages : [];
      const statuses = Array.isArray(value?.statuses) ? value.statuses : [];
      for (const message of messages) {
        if (message?.id) ids.add(`message:${message.id}`);
      }
      for (const status of statuses) {
        if (status?.id && status?.status) {
          ids.add(`status:${status.id}:${status.status}:${status.timestamp || ''}`);
        } else if (status?.id) {
          ids.add(`status:${status.id}`);
        }
      }
    }
  }

  return Array.from(ids);
}

export function buildRelayEventKey(rawBody: string, payload: any) {
  const webhookIds = extractWebhookIds(payload);
  return webhookIds.length ? sha256(webhookIds.sort().join('|')) : sha256(rawBody);
}

function nextAttemptAt(attempts: number) {
  const delaySeconds = Math.min(60 * 60, Math.max(30, 30 * 2 ** Math.max(0, attempts - 1)));
  return new Date(Date.now() + delaySeconds * 1000).toISOString();
}

export async function enqueueRupiqaWhatsAppRelay(params: {
  supabase: SupabaseLike;
  rawBody: string;
  payload: any;
  headers: RelayHeaders;
}) {
  const eventKey = buildRelayEventKey(params.rawBody, params.payload);
  const bodySha256 = sha256(params.rawBody);
  const webhookIds = extractWebhookIds(params.payload);

  const { data, error } = await params.supabase
    .from('whatsapp_webhook_relays')
    .upsert({
      event_key: eventKey,
      destination_url: relayUrl(),
      raw_body: params.rawBody,
      body_sha256: bodySha256,
      forward_headers: params.headers,
      webhook_ids: webhookIds,
      status: 'pending',
      next_attempt_at: new Date().toISOString(),
    }, {
      onConflict: 'event_key',
      ignoreDuplicates: true,
    })
    .select('id, raw_body, forward_headers, attempts')
    .single();

  if (error) {
    if (error.code === '23505') return { queued: false, duplicate: true, eventKey };
    throw new Error(error.message);
  }

  return { queued: Boolean(data), duplicate: !data, eventKey, row: data as RelayRow | null };
}

export async function dispatchRupiqaWhatsAppRelay(params: {
  supabase: SupabaseLike;
  row: RelayRow;
}) {
  const attempts = Number(params.row.attempts || 0) + 1;

  await params.supabase
    .from('whatsapp_webhook_relays')
    .update({
      status: 'sending',
      attempts,
      last_attempt_at: new Date().toISOString(),
      last_error: null,
    })
    .eq('id', params.row.id);

  try {
    const response = await fetch(relayUrl(), {
      method: 'POST',
      headers: {
        ...(params.row.forward_headers || {}),
        'content-type': params.row.forward_headers?.['content-type'] || 'application/json',
      },
      body: params.row.raw_body,
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      const responseText = await response.text().catch(() => '');
      throw new Error(`Rupiqa relay HTTP ${response.status}${responseText ? `: ${responseText.slice(0, 200)}` : ''}`);
    }

    await params.supabase
      .from('whatsapp_webhook_relays')
      .update({
        status: 'succeeded',
        response_status: response.status,
        last_error: null,
        next_attempt_at: null,
        delivered_at: new Date().toISOString(),
      })
      .eq('id', params.row.id);

    return { ok: true, status: response.status };
  } catch (error) {
    const lastError = error instanceof Error ? error.message : 'Rupiqa relay failed';
    const finalFailure = attempts >= MAX_ATTEMPTS;
    await params.supabase
      .from('whatsapp_webhook_relays')
      .update({
        status: finalFailure ? 'final_failed' : 'pending',
        last_error: lastError,
        next_attempt_at: finalFailure ? null : nextAttemptAt(attempts),
      })
      .eq('id', params.row.id);

    return { ok: false, error: lastError, finalFailure };
  }
}

export async function processPendingRupiqaWhatsAppRelays(params: {
  supabase: SupabaseLike;
  limit?: number;
}) {
  const { data, error } = await params.supabase
    .from('whatsapp_webhook_relays')
    .select('id, raw_body, forward_headers, attempts')
    .eq('status', 'pending')
    .lte('next_attempt_at', new Date().toISOString())
    .order('next_attempt_at', { ascending: true })
    .limit(params.limit || 25);

  if (error) throw new Error(error.message);

  const rows = (data || []) as RelayRow[];
  const results = [];
  for (const row of rows) {
    results.push(await dispatchRupiqaWhatsAppRelay({ supabase: params.supabase, row }));
  }

  return {
    scanned: rows.length,
    succeeded: results.filter((item) => item.ok).length,
    failed: results.filter((item) => !item.ok).length,
    finalFailed: results.filter((item) => !item.ok && item.finalFailure).length,
  };
}
