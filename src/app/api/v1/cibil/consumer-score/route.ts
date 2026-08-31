import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getApiHubStore, hitMasterApi, saveApiHubStore } from '@/lib/api-hub/simple-store';
import { hashApiKey, maskMobile, maskPan } from '@/lib/api-hub/keys';
import { appendApiUsageLedger, requestEvidence } from '@/lib/api-hub/usage-ledger';

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

const PORTAL_DEFAULTS = {
  dob: '2000-01-01',
  gender: 'male',
  address: 'CreditTrust Verified Address',
  state: 'MADHYA PRADESH',
  pincode: '452001',
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

function splitName(value: unknown) {
  const parts = cleanString(value).toUpperCase().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.length > 1 ? parts[parts.length - 1] : '',
  };
}

function normalizePayload(body: Record<string, unknown>): JaadugarCibilPayload {
  const fullName = splitName(body.name || body.fullName || body.customerName);
  return {
    firstName: cleanString(body.firstName).toUpperCase() || fullName.firstName,
    lastName: cleanString(body.lastName).toUpperCase() || fullName.lastName,
    dob: cleanString(body.dob || body.birthDate || body.dateOfBirth) || PORTAL_DEFAULTS.dob,
    gender: cleanString(body.gender) || PORTAL_DEFAULTS.gender,
    pan: cleanString(body.pan || body.idNumber).toUpperCase(),
    mobile: digits(body.mobile || body.telephoneNumber || body.mobile_number).slice(-10),
    address: cleanString(body.address || body.detailed_address) || PORTAL_DEFAULTS.address,
    state: cleanString(body.state || body.stateName).toUpperCase() || PORTAL_DEFAULTS.state,
    pincode: digits(body.pincode || body.pinCode).slice(0, 6) || PORTAL_DEFAULTS.pincode,
  };
}

function validatePayload(payload: JaadugarCibilPayload) {
  const required: Array<keyof JaadugarCibilPayload> = ['firstName', 'lastName', 'pan', 'mobile'];
  const missing = required.filter((field) => !payload[field]);
  if (missing.includes('firstName') || missing.includes('lastName')) return 'name must include first and last name';
  if (missing.length) return `Missing required fields: ${missing.join(', ')}`;
  if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(payload.pan)) return 'pan must be a valid PAN format';
  if (!/^\d{10}$/.test(payload.mobile)) return 'mobile must be 10 digits';
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
    if (!['bureau', 'bureau-standard', 'cibil.consumer_score'].includes(api.code)) {
      return jsonError('API key is not allowed for Bureau API Standard', 403, requestId);
    }

    let body: unknown = {};
    let invalidJson = false;
    try {
      body = await request.json();
    } catch {
      invalidJson = true;
    }
    const requestBody = body && typeof body === 'object' && !Array.isArray(body)
      ? body as Record<string, unknown>
      : {};
    const payload = normalizePayload(requestBody);
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
    const apiCode = api.code;
    const currentBalance = () => Number(client.credits || 0);

    async function saveFailure(message: string, status = 400, responseJson?: unknown, providerStatus?: number) {
      const responseTime = Date.now() - startedAt;
      store.usage = [{
        ...baseLog,
        status: 'failed' as const,
        credits_deducted: 0,
        response_time_ms: responseTime,
        error_message: message,
      }, ...store.usage].slice(0, 200);
      await saveApiHubStore(supabase, rowId, store);
      await appendApiUsageLedger(supabase, {
        ...baseLog,
        ...requestEvidence(request),
        api_code: apiCode,
        status: 'failed',
        http_status: status,
        provider_status: providerStatus,
        credits_deducted: 0,
        balance_after: currentBalance(),
        response_time_ms: responseTime,
        error_message: message,
        request_json: requestBody,
        response_json: responseJson,
        metadata: { normalized_provider_payload: payload },
      });
      return jsonError(message, status, requestId);
    }

    if (invalidJson) return saveFailure('Request body must be valid JSON', 400);
    const cost = Math.max(1, Number(api.per_hit_credits || 1));
    if (Number(client.credits || 0) < cost) return saveFailure('Insufficient credits', 402);

    const validationError = validatePayload(payload);
    if (validationError) return saveFailure(validationError, 400);

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
      await appendApiUsageLedger(supabase, {
        ...baseLog,
        ...requestEvidence(request),
        api_code: api.code,
        status: 'failed',
        http_status: 502,
        provider_status: response.status,
        credits_deducted: 0,
        balance_after: Number(client.credits || 0),
        response_time_ms: responseTime,
        error_message: message,
        request_json: requestBody,
        response_json: response.data,
        metadata: { normalized_provider_payload: payload },
      });
      return jsonError(message, 502, requestId);
    }

    const remainingCredits = Math.max(0, Number(client.credits || 0) - cost);
    store.clients = store.clients.map((item) => item.id === client.id
      ? {
        ...item,
        credits: remainingCredits,
        // Automatically suspend the client when the allocated credit balance is exhausted.
        status: remainingCredits === 0 ? 'inactive' : item.status,
        updated_at: new Date().toISOString(),
      }
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
      request_json: requestBody,
      response_json: response.data,
      metadata: { normalized_provider_payload: payload },
    });

    return NextResponse.json({
      success: true,
      request_id: requestId,
      charged: { credits: cost, balance: remainingCredits },
      access: remainingCredits === 0 ? 'inactive' : 'active',
      data: response.data,
    });
  } catch (error) {
    console.error('[api-hub:cibil] unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unexpected API Hub error';
    return jsonError(message, 500, requestId);
  }
}
