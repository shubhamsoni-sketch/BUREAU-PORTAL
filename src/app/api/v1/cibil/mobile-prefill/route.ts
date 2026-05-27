import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getApiHubStore, hitMasterApi, saveApiHubStore, SimpleApiConfig } from '@/lib/api-hub/simple-store';
import { hashApiKey, maskMobile, maskPan } from '@/lib/api-hub/keys';
import { getStateCode } from '@/lib/bureau/state-codes';

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
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function digits(value: unknown) {
  return cleanString(value).replace(/\D/g, '');
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function collectByKey(value: unknown, aliases: string[], found: string[] = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectByKey(item, aliases, found));
    return found;
  }
  if (!isObject(value)) return found;
  for (const [key, nested] of Object.entries(value)) {
    if (aliases.some((alias) => alias.toLowerCase() === key.toLowerCase())) {
      const text = cleanString(nested);
      if (text) found.push(text);
    }
    collectByKey(nested, aliases, found);
  }
  return found;
}

function firstValue(source: unknown, aliases: string[]) {
  return collectByKey(source, aliases)[0] || '';
}

function normalizeDate(value: string) {
  const raw = value.trim();
  if (/^\d{8}$/.test(raw)) return raw;
  const match = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (match) return `${match[3].padStart(2, '0')}${match[2].padStart(2, '0')}${match[1]}`;
  const indian = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (indian) return `${indian[1].padStart(2, '0')}${indian[2].padStart(2, '0')}${indian[3]}`;
  return digits(raw).slice(0, 8);
}

function normalizeGender(value: string) {
  const gender = value.toLowerCase();
  if (gender === '1' || gender.includes('female')) return '1';
  if (gender === '2' || gender.includes('male')) return '2';
  if (gender === '3' || gender.includes('trans')) return '3';
  return '';
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    middleName: parts.length > 2 ? parts.slice(1, -1).join(' ') : '',
    lastName: parts.length > 1 ? parts[parts.length - 1] : '',
  };
}

function buildCibilPayload(prefill: unknown, fallback: Record<string, unknown>): CibilPayload {
  const fullName = firstValue(prefill, ['full_name', 'fullName', 'name', 'customer_name']);
  const split = splitName(fullName);
  const stateName = firstValue(prefill, ['state', 'state_name', 'stateName']);
  const stateCode = firstValue(prefill, ['state_code', 'stateCode']) || getStateCode(stateName) || cleanString(fallback.stateCode);
  const pan = firstValue(prefill, ['pan', 'pan_number', 'panNumber', 'idNumber']);
  const dob = firstValue(prefill, ['dob', 'date_of_birth', 'dateOfBirth', 'birthDate']);

  return {
    firstName: (firstValue(prefill, ['first_name', 'firstName']) || cleanString(fallback.firstName) || split.firstName).toUpperCase(),
    middleName: (firstValue(prefill, ['middle_name', 'middleName']) || cleanString(fallback.middleName) || split.middleName).toUpperCase(),
    lastName: (firstValue(prefill, ['last_name', 'lastName']) || cleanString(fallback.lastName) || split.lastName).toUpperCase(),
    birthDate: normalizeDate(dob || cleanString(fallback.birthDate)),
    gender: normalizeGender(firstValue(prefill, ['gender', 'sex']) || cleanString(fallback.gender)),
    idNumber: (pan || cleanString(fallback.idNumber)).toUpperCase(),
    stateCode,
    pinCode: digits(firstValue(prefill, ['pincode', 'pinCode', 'postal_code', 'postalCode', 'zip']) || cleanString(fallback.pinCode)).slice(0, 6),
    telephoneNumber: digits(cleanString(fallback.mobile_number) || cleanString(fallback.telephoneNumber) || cleanString(fallback.mobile)).slice(-10),
    consent: fallback.consent === true,
  };
}

function validatePayload(payload: CibilPayload) {
  const required: Array<keyof CibilPayload> = ['firstName', 'lastName', 'birthDate', 'gender', 'idNumber', 'stateCode', 'pinCode', 'telephoneNumber'];
  const missing = required.filter((field) => !payload[field]);
  if (missing.length) return `Prefill response missing fields for CIBIL payload: ${missing.join(', ')}`;
  if (!/^\d{8}$/.test(payload.birthDate)) return 'birthDate must be DDMMYYYY';
  if (!/^[123]$/.test(payload.gender)) return 'gender must be 1, 2, or 3';
  if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(payload.idNumber)) return 'idNumber must be a valid PAN format';
  if (!/^\d{6}$/.test(payload.pinCode)) return 'pinCode must be 6 digits';
  if (!/^\d{10}$/.test(payload.telephoneNumber)) return 'telephoneNumber must be 10 digits';
  if (payload.consent !== true) return 'consent must be true';
  return null;
}

function findStandardApi(apis: SimpleApiConfig[], advancedId: string) {
  return apis.find((api) => api.id !== advancedId && api.status === 'active' && ['bureau-standard', 'bureau', 'cibil.consumer_score'].includes(api.code));
}

async function hitPrefillApi(api: SimpleApiConfig, payload: Record<string, unknown>, requestId: string) {
  const endpoint = api.master_url.trim();
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

export async function POST(request: NextRequest) {
  const requestId = `ADV-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const startedAt = Date.now();

  try {
    const apiKey = request.headers.get('x-api-key')?.trim();
    if (!apiKey) return jsonError('x-api-key header is required', 401, requestId);

    const supabase = createAdminClient();
    const { rowId, store } = await getApiHubStore(supabase);
    const keyRecord = store.keys.find((key) => key.key_hash === hashApiKey(apiKey) && key.status === 'active');
    if (!keyRecord) return jsonError('Invalid or inactive API key', 401, requestId);

    const client = store.clients.find((item) => item.id === keyRecord.client_id && item.status === 'active');
    const advancedApi = store.apis.find((item) => item.id === keyRecord.api_id && item.status === 'active' && item.code === 'bureau-advanced');
    const standardApi = findStandardApi(store.apis, keyRecord.api_id);
    if (!client) return jsonError('Client is not active', 403, requestId);
    if (!advancedApi) return jsonError('API key is not allowed for Bureau API Advanced', 403, requestId);
    if (!standardApi) return jsonError('Bureau API Standard is not configured', 500, requestId);

    const cost = Math.max(1, Number(advancedApi.per_hit_credits || 1));
    if (Number(client.credits || 0) < cost) return jsonError('Insufficient credits', 402, requestId);

    const body = await request.json();
    if (!isObject(body)) return jsonError('Request body must be a JSON object', 400, requestId);
    if (body.consent !== true) return jsonError('consent must be true', 400, requestId);
    const mobile = digits(body.mobile_number || body.telephoneNumber || body.mobile).slice(-10);
    if (!/^\d{10}$/.test(mobile)) return jsonError('mobile_number must be 10 digits', 400, requestId);

    const prefillPayload = {
      mobile_number: mobile,
      first_name: cleanString(body.first_name || body.firstName),
      lastName: cleanString(body.lastName || body.last_name),
      consent: 'Y',
    };
    const prefillResponse = await hitPrefillApi(advancedApi, prefillPayload, requestId);
    if (!prefillResponse.ok) {
      const message = `Mobile Prefill API failed with ${prefillResponse.status}`;
      store.usage = [{
        id: crypto.randomUUID(),
        request_id: requestId,
        client_id: client.id,
        api_id: advancedApi.id,
        key_id: keyRecord.id,
        status: 'failed' as const,
        credits_deducted: 0,
        masked_mobile: maskMobile(mobile),
        response_time_ms: Date.now() - startedAt,
        error_message: message,
        created_at: new Date().toISOString(),
      }, ...store.usage].slice(0, 200);
      await saveApiHubStore(supabase, rowId, store);
      return jsonError(message, 502, requestId);
    }

    const prefillCode = isObject(prefillResponse.data) && isObject(prefillResponse.data.data) ? cleanString(prefillResponse.data.data.code) : '';
    if (prefillCode && prefillCode !== '1015') {
      const message = isObject(prefillResponse.data) && isObject(prefillResponse.data.data)
        ? cleanString(prefillResponse.data.data.message) || 'Mobile Prefill did not return usable data'
        : 'Mobile Prefill did not return usable data';
      return jsonError(message, prefillCode === '1004' ? 404 : 422, requestId);
    }

    const cibilPayload = buildCibilPayload(prefillResponse.data, { ...body, mobile_number: mobile });
    const validationError = validatePayload(cibilPayload);
    if (validationError) return jsonError(validationError, 422, requestId);

    const bureauResponse = await hitMasterApi(standardApi, cibilPayload);
    const responseTime = Date.now() - startedAt;
    if (!bureauResponse.ok) {
      const message = typeof bureauResponse.data === 'object' && bureauResponse.data && 'error' in bureauResponse.data
        ? String((bureauResponse.data as { error: unknown }).error)
        : `Bureau API Standard failed with ${bureauResponse.status}`;
      store.usage = [{
        id: crypto.randomUUID(),
        request_id: requestId,
        client_id: client.id,
        api_id: advancedApi.id,
        key_id: keyRecord.id,
        status: 'failed' as const,
        credits_deducted: 0,
        masked_pan: maskPan(cibilPayload.idNumber),
        masked_mobile: maskMobile(mobile),
        response_time_ms: responseTime,
        error_message: message,
        created_at: new Date().toISOString(),
      }, ...store.usage].slice(0, 200);
      await saveApiHubStore(supabase, rowId, store);
      return jsonError(message, 502, requestId);
    }

    store.clients = store.clients.map((item) => item.id === client.id
      ? { ...item, credits: Math.max(0, Number(item.credits || 0) - cost), updated_at: new Date().toISOString() }
      : item);
    store.keys = store.keys.map((key) => key.id === keyRecord.id ? { ...key, last_used_at: new Date().toISOString() } : key);
    store.usage = [{
      id: crypto.randomUUID(),
      request_id: requestId,
      client_id: client.id,
      api_id: advancedApi.id,
      key_id: keyRecord.id,
      status: 'success' as const,
      credits_deducted: cost,
      masked_pan: maskPan(cibilPayload.idNumber),
      masked_mobile: maskMobile(mobile),
      response_time_ms: responseTime,
      created_at: new Date().toISOString(),
    }, ...store.usage].slice(0, 200);
    await saveApiHubStore(supabase, rowId, store);

    return NextResponse.json({
      success: true,
      request_id: requestId,
      api: advancedApi.code,
      charged: { credits: cost },
      data: bureauResponse.data,
    });
  } catch (error) {
    console.error('[api-hub:cibil-mobile-prefill] unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unexpected API Hub error';
    return jsonError(message, 500, requestId);
  }
}
