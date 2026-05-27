import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getApiHubStore, hitMasterApi, saveApiHubStore } from '@/lib/api-hub/simple-store';
import { hashApiKey, maskMobile, maskPan } from '@/lib/api-hub/keys';

function jsonError(message: string, status = 400, requestId?: string) {
  return NextResponse.json({ success: false, request_id: requestId, error: message }, { status });
}

function readMaskedValue(payload: Record<string, unknown>, names: string[]) {
  for (const name of names) {
    const value = payload[name];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ apiCode: string }> },
) {
  const requestId = `API-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const startedAt = Date.now();

  try {
    const { apiCode } = await params;
    const apiKey = request.headers.get('x-api-key')?.trim();
    if (!apiKey) return jsonError('x-api-key header is required', 401, requestId);

    const supabase = createAdminClient();
    const { rowId, store } = await getApiHubStore(supabase);
    const apiKeyHash = hashApiKey(apiKey);
    const keyRecord = store.keys.find((key) => key.key_hash === apiKeyHash && key.status === 'active');
    if (!keyRecord) return jsonError('Invalid or inactive API key', 401, requestId);

    const client = store.clients.find((item) => item.id === keyRecord.client_id && item.status === 'active');
    const api = store.apis.find((item) => item.id === keyRecord.api_id && item.status === 'active');
    if (!client) return jsonError('Client is not active', 403, requestId);
    if (!api) return jsonError('API is not active', 403, requestId);
    if (api.code !== apiCode && api.id !== apiCode) return jsonError('API key is not allowed for this API', 403, requestId);

    const cost = Math.max(1, Number(api.per_hit_credits || 1));
    if (Number(client.credits || 0) < cost) return jsonError('Insufficient credits', 402, requestId);

    const payload = await request.json();
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return jsonError('Request body must be a JSON object', 400, requestId);

    const pan = readMaskedValue(payload as Record<string, unknown>, ['idNumber', 'panNumber', 'pan', 'PAN']);
    const mobile = readMaskedValue(payload as Record<string, unknown>, ['telephoneNumber', 'mobile', 'mobileNumber', 'phone']);
    const now = new Date().toISOString();
    const baseLog = {
      id: crypto.randomUUID(),
      request_id: requestId,
      client_id: client.id,
      api_id: api.id,
      key_id: keyRecord.id,
      masked_pan: pan ? maskPan(pan) : undefined,
      masked_mobile: mobile ? maskMobile(mobile) : undefined,
      created_at: now,
    };

    const response = await hitMasterApi(api, payload);
    const responseTime = Date.now() - startedAt;

    if (!response.ok) {
      const message = typeof response.data === 'object' && response.data && 'error' in response.data
        ? String((response.data as { error: unknown }).error)
        : `Master API failed with ${response.status}`;
      store.usage = [{
        ...baseLog,
        status: 'failed' as const,
        credits_deducted: 0,
        response_time_ms: responseTime,
        error_message: message,
      }, ...store.usage].slice(0, 200);
      await saveApiHubStore(supabase, rowId, store);
      return jsonError(message, 502, requestId);
    }

    store.clients = store.clients.map((item) => item.id === client.id
      ? { ...item, credits: Math.max(0, Number(item.credits || 0) - cost), updated_at: new Date().toISOString() }
      : item);
    store.keys = store.keys.map((key) => key.id === keyRecord.id ? { ...key, last_used_at: new Date().toISOString() } : key);
    store.usage = [{
      ...baseLog,
      status: 'success' as const,
      credits_deducted: cost,
      response_time_ms: responseTime,
    }, ...store.usage].slice(0, 200);
    await saveApiHubStore(supabase, rowId, store);

    return NextResponse.json({
      success: true,
      request_id: requestId,
      api: api.code,
      charged: { credits: cost },
      data: response.data,
    });
  } catch (error) {
    console.error('[api-hub:generic] unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unexpected API Hub error';
    return jsonError(message, 500, requestId);
  }
}
