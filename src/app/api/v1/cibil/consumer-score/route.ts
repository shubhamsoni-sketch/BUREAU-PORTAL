import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getApiHubStore, hitMasterApi, saveApiHubStore } from '@/lib/api-hub/simple-store';
import { hashApiKey, maskMobile, maskPan } from '@/lib/api-hub/keys';

type JaadugarCibilPayload = {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  pan: string;
  mobile: string;
  address: string;
  state: string;
  pincode: string;
};

function jsonError(message: string, status = 400, requestId?: string) {
  return NextResponse.json({ success: false, request_id: requestId, error: message }, { status });
}

function cleanString(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function digits(value: unknown) {
  return cleanString(value).replace(/\D/g, '');
}

function normalizePayload(body: Record<string, unknown>): JaadugarCibilPayload {
  return {
    firstName: cleanString(body.firstName),
    lastName: cleanString(body.lastName),
    dob: cleanString(body.dob || body.birthDate || body.dateOfBirth),
    gender: cleanString(body.gender),
    pan: cleanString(body.pan || body.idNumber).toUpperCase(),
    mobile: digits(body.mobile || body.telephoneNumber || body.mobile_number).slice(-10),
    address: cleanString(body.address || body.detailed_address),
    state: cleanString(body.state || body.stateName),
    pincode: digits(body.pincode || body.pinCode).slice(0, 6),
  };
}

function validatePayload(payload: JaadugarCibilPayload) {
  const required: Array<keyof JaadugarCibilPayload> = ['firstName', 'lastName', 'dob', 'gender', 'pan', 'mobile', 'address', 'state', 'pincode'];
  const missing = required.filter((field) => !payload[field]);
  if (missing.length) return `Missing required fields: ${missing.join(', ')}`;
  if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(payload.pan)) return 'pan must be a valid PAN format';
  if (!/^\d{10}$/.test(payload.mobile)) return 'mobile must be 10 digits';
  if (!/^\d{6}$/.test(payload.pincode)) return 'pincode must be 6 digits';
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
    const keyRecord = store.keys.find((key) => key.key_hash === hashApiKey(apiKey) && key.status === 'active');
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

    const baseLog = {
      id: crypto.randomUUID(),
      request_id: requestId,
      client_id: client.id,
      api_id: api.id,
      key_id: keyRecord.id,
      masked_pan: maskPan(payload.pan),
      masked_mobile: maskMobile(payload.mobile),
      created_at: new Date().toISOString(),
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
    });
  } catch (error) {
    console.error('[api-hub:cibil] unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unexpected API Hub error';
    return jsonError(message, 500, requestId);
  }
}
