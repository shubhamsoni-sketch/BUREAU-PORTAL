import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getApiHubStore, hitMasterApi, saveApiHubStore } from '@/lib/api-hub/simple-store';
import { hashApiKey, maskMobile, maskPan } from '@/lib/api-hub/keys';
import { appendApiUsageLedger, requestEvidence } from '@/lib/api-hub/usage-ledger';

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

function cleanString(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function digits(value: unknown) {
  return cleanString(value).replace(/\D/g, '');
}

async function hitMobilePrefillApi(
  api: { master_url: string; method: 'POST' | 'GET'; auth_header: string; auth_token?: string },
  payload: Record<string, unknown>,
  requestId: string,
) {
  const endpoint = api.master_url.trim().replace(/\/+$/, '');
  if (!endpoint) throw new Error('Mobile Prefill API URL is not configured');

  const headers: Record<string, string> = {
    accept: 'application/json',
    'content-type': 'application/json',
    'X-Auth-Type': 'API-Key',
    'X-Reference-ID': requestId,
  };
  if (api.auth_header && api.auth_token) headers[api.auth_header] = api.auth_token;

  const response = await fetch(endpoint, {
    method: api.method || 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  let data: unknown = text;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { ok: response.ok, status: response.status, data };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ apiCode: string }> },
) {
  const requestId = `API-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const startedAt = Date.now();

  try {
    const { apiCode } = await params;
    if (['bureau', 'bureau-standard', 'cibil.consumer_score'].includes(apiCode)) {
      const endpoint = new URL('/api/v1/cibil/consumer-score', request.url);
      const headers = new Headers(request.headers);
      headers.delete('host');
      headers.delete('content-length');
      return fetch(endpoint, {
        method: 'POST',
        headers,
        body: await request.text(),
      });
    }
    if (apiCode === 'bureau-advanced') {
      const endpoint = new URL('/api/v1/cibil/mobile-prefill', request.url);
      const headers = new Headers(request.headers);
      headers.delete('host');
      headers.delete('content-length');
      return fetch(endpoint, {
        method: 'POST',
        headers,
        body: await request.text(),
      });
    }

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

    let payload: unknown = {};
    let invalidJson = false;
    try {
      payload = await request.json();
    } catch {
      invalidJson = true;
    }
    const payloadObject = payload && typeof payload === 'object' && !Array.isArray(payload)
      ? payload as Record<string, unknown>
      : {};

    const pan = readMaskedValue(payloadObject, ['idNumber', 'panNumber', 'pan', 'PAN']);
    const mobile = readMaskedValue(payloadObject, ['mobile_number', 'telephoneNumber', 'mobile', 'mobileNumber', 'phone']);
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
    const apiCodeValue = api.code;
    const currentBalance = () => Number(client.credits || 0);

    async function saveFailure(message: string, httpStatus: number, responseJson?: unknown, providerStatus?: number) {
      const responseTime = Date.now() - startedAt;
      const cachedLog = {
        ...baseLog,
        status: 'failed' as const,
        credits_deducted: 0,
        response_time_ms: responseTime,
        error_message: message,
      };
      store.usage = [cachedLog, ...store.usage].slice(0, 200);
      await saveApiHubStore(supabase, rowId, store);
      await appendApiUsageLedger(supabase, {
        ...cachedLog,
        ...requestEvidence(request),
        api_code: apiCodeValue,
        http_status: httpStatus,
        provider_status: providerStatus,
        balance_after: currentBalance(),
        request_json: payloadObject,
        response_json: responseJson,
      });
      return jsonError(message, httpStatus, requestId);
    }

    if (invalidJson) return saveFailure('Request body must be valid JSON', 400);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return saveFailure('Request body must be a JSON object', 400);
    const cost = Math.max(1, Number(api.per_hit_credits || 1));
    if (Number(client.credits || 0) < cost) return saveFailure('Insufficient credits', 402);

    let upstreamPayload = payloadObject;
    if (api.code === 'mobile-prefill') {
      if (payloadObject.consent !== true) return saveFailure('consent must be true', 400);
      const mobileNumber = digits(mobile).slice(-10);
      if (!/^\d{10}$/.test(mobileNumber)) return saveFailure('mobile_number must be 10 digits', 400);
      upstreamPayload = {
        mobile_number: mobileNumber,
        first_name: cleanString(payloadObject.first_name || payloadObject.firstName),
        lastName: cleanString(payloadObject.lastName || payloadObject.last_name),
        consent: 'Y',
      };
    }

    const response = api.code === 'mobile-prefill'
      ? await hitMobilePrefillApi(api, upstreamPayload, requestId)
      : await hitMasterApi(api, upstreamPayload);
    const responseTime = Date.now() - startedAt;

    if (!response.ok) {
      const message = typeof response.data === 'object' && response.data && 'error' in response.data
        ? String((response.data as { error: unknown }).error)
        : `Master API failed with ${response.status}`;
      return saveFailure(message, 502, response.data, response.status);
    }

    const remainingCredits = Math.max(0, Number(client.credits || 0) - cost);
    store.clients = store.clients.map((item) => item.id === client.id
      ? { ...item, credits: remainingCredits, status: remainingCredits === 0 ? 'inactive' : item.status, updated_at: new Date().toISOString() }
      : item);
    store.keys = store.keys.map((key) => key.id === keyRecord.id ? { ...key, last_used_at: new Date().toISOString() } : key);
    store.usage = [{
      ...baseLog,
      status: 'success' as const,
      credits_deducted: cost,
      response_time_ms: responseTime,
    }, ...store.usage].slice(0, 200);
    await saveApiHubStore(supabase, rowId, store);
    await appendApiUsageLedger(supabase, {
      ...baseLog,
      ...requestEvidence(request),
      api_code: api.code,
      status: 'success',
      http_status: 200,
      provider_status: response.status,
      credits_deducted: cost,
      balance_after: remainingCredits,
      response_time_ms: responseTime,
      request_json: payloadObject,
      response_json: response.data,
    });

    return NextResponse.json({
      success: true,
      request_id: requestId,
      api: api.code,
      charged: { credits: cost, balance: remainingCredits },
      access: remainingCredits === 0 ? 'inactive' : 'active',
      data: response.data,
    });
  } catch (error) {
    console.error('[api-hub:generic] unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unexpected API Hub error';
    return jsonError(message, 500, requestId);
  }
}
