import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getApiHubStore, hitMasterApi, saveApiHubStore } from '@/lib/api-hub/simple-store';
import { hashApiKey, maskMobile, maskPan } from '@/lib/api-hub/keys';

type CibilPayload = {
  firstName: string;
  middleName?: string;
  lastName: string;
  birthDate: string;
  gender: string;
  idNumber: string;
  stateCode: string;
  pinCode: string;
  telephoneNumber: string;
  consent: boolean;
};

function jsonError(message: string, status = 400, requestId?: string) {
  return NextResponse.json({ success: false, request_id: requestId, error: message }, { status });
}

function cleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizePayload(body: Record<string, unknown>): CibilPayload {
  return {
    firstName: cleanString(body.firstName).toUpperCase(),
    middleName: cleanString(body.middleName).toUpperCase(),
    lastName: cleanString(body.lastName).toUpperCase(),
    birthDate: cleanString(body.birthDate),
    gender: cleanString(body.gender),
    idNumber: cleanString(body.idNumber).toUpperCase(),
    stateCode: cleanString(body.stateCode),
    pinCode: cleanString(body.pinCode),
    telephoneNumber: cleanString(body.telephoneNumber),
    consent: body.consent === true,
  };
}

function validatePayload(payload: CibilPayload) {
  const required: Array<keyof CibilPayload> = ['firstName', 'lastName', 'birthDate', 'gender', 'idNumber', 'stateCode', 'pinCode', 'telephoneNumber'];
  const missing = required.filter((field) => !payload[field]);
  if (missing.length) return `Missing required fields: ${missing.join(', ')}`;
  if (!/^\d{8}$/.test(payload.birthDate)) return 'birthDate must be DDMMYYYY';
  if (!/^[123]$/.test(payload.gender)) return 'gender must be 1, 2, or 3';
  if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(payload.idNumber)) return 'idNumber must be a valid PAN format';
  if (!/^\d{6}$/.test(payload.pinCode)) return 'pinCode must be 6 digits';
  if (!/^\d{10}$/.test(payload.telephoneNumber)) return 'telephoneNumber must be 10 digits';
  if (payload.consent !== true) return 'consent must be true';
  return null;
}

export async function POST(request: NextRequest) {
  const requestId = `API-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const startedAt = Date.now();

  try {
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

    const cost = Math.max(1, Number(api.per_hit_credits || 1));
    if (Number(client.credits || 0) < cost) return jsonError('Insufficient credits', 402, requestId);

    const body = await request.json();
    const payload = normalizePayload(body || {});
    const validationError = validatePayload(payload);
    if (validationError) return jsonError(validationError, 400, requestId);

    const maskedRequest = {
      ...payload,
      idNumber: maskPan(payload.idNumber),
      telephoneNumber: maskMobile(payload.telephoneNumber),
    };

    const now = new Date().toISOString();
    const baseLog = {
      id: crypto.randomUUID(),
      request_id: requestId,
      client_id: client.id,
      api_id: api.id,
      key_id: keyRecord.id,
      masked_pan: maskPan(payload.idNumber),
      masked_mobile: maskMobile(payload.telephoneNumber),
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
      charged: { credits: cost },
      data: response.data,
      request: maskedRequest,
    });
  } catch (error) {
    console.error('[api-hub:cibil] unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unexpected API Hub error';
    return jsonError(message, 500, requestId);
  }
}
