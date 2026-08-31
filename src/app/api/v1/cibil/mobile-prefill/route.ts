import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getApiHubStore, hitMasterApi, saveApiHubStore, SimpleApiConfig } from '@/lib/api-hub/simple-store';
import { hashApiKey, maskMobile, maskPan } from '@/lib/api-hub/keys';
import { getStateName } from '@/lib/bureau/state-codes';
import { appendApiUsageLedger, requestEvidence } from '@/lib/api-hub/usage-ledger';

type CibilPayload = {
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

function normalizeDob(value: string) {
  const raw = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const match = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (match) return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  const indian = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (indian) return `${indian[1].padStart(2, '0')}/${indian[2].padStart(2, '0')}/${indian[3]}`;
  return raw;
}

function normalizeGender(value: string) {
  const gender = value.toLowerCase();
  if (gender === '1' || gender.includes('female')) return 'female';
  if (gender === '2' || gender.includes('male')) return 'male';
  if (gender === '3' || gender.includes('trans')) return 'transgender';
  return gender;
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    middleName: parts.length > 2 ? parts.slice(1, -1).join(' ') : '',
    lastName: parts.length > 1 ? parts[parts.length - 1] : '',
  };
}

function nestedObject(source: unknown, path: string[]) {
  let current = source;
  for (const key of path) {
    if (!isObject(current)) return {};
    current = current[key];
  }
  return isObject(current) ? current : {};
}

function nestedArray(source: unknown, path: string[]) {
  let current = source;
  for (const key of path) {
    if (!isObject(current)) return [];
    current = current[key];
  }
  return Array.isArray(current) ? current.filter(isObject) : [];
}

function parseReportedDate(value: unknown) {
  const text = cleanString(value);
  const time = text ? Date.parse(text) : NaN;
  return Number.isFinite(time) ? time : 0;
}

function personalDataCandidates(prefill: unknown) {
  return [
    nestedObject(prefill, ['data', 'data', 'personal_data']),
    nestedObject(prefill, ['data', 'personal_data']),
    nestedObject(prefill, ['personal_data']),
  ].filter((item) => Object.keys(item).length);
}

function getPersonalInfo(prefill: unknown) {
  for (const personalData of personalDataCandidates(prefill)) {
    const info = personalData.personal_information;
    if (isObject(info)) return info;
  }
  return {};
}

function chooseBestAddress(prefill: unknown) {
  const addresses = personalDataCandidates(prefill).flatMap((personalData) => Array.isArray(personalData.address) ? personalData.address.filter(isObject) : []);
  const valid = addresses
    .map((address) => ({
      state: cleanString(address.state || address.state_name || address.stateName),
      pincode: digits(address.pincode || address.pinCode || address.postal_code || address.postalCode).slice(0, 6),
      reportedAt: parseReportedDate(address.date_of_reporting || address.reported_at || address.updated_at),
      detailedAddress: cleanString(address.detailed_address || address.address),
    }))
    .filter((address) => /^\d{6}$/.test(address.pincode) && address.state);

  if (valid.length) {
    return valid.sort((a, b) => b.reportedAt - a.reportedAt || Number(Boolean(b.detailedAddress)) - Number(Boolean(a.detailedAddress)))[0];
  }

  return null;
}

function firstArrayValue(source: unknown, path: string[]) {
  const items = nestedArray(source, path);
  return cleanString(items[0]?.value);
}

function documentValue(prefill: unknown, documentKey: string) {
  for (const personalData of personalDataCandidates(prefill)) {
    const documentData = personalData.document_data;
    if (!isObject(documentData)) continue;
    const value = documentData[documentKey];
    if (Array.isArray(value)) {
      const first = value.find(isObject);
      const text = cleanString(first?.value);
      if (text) return text;
    }
    const text = cleanString(value);
    if (text) return text;
  }
  return '';
}

function buildCibilPayload(prefill: unknown, fallback: Record<string, unknown>): CibilPayload {
  const personalInfo = getPersonalInfo(prefill);
  const bestAddress = chooseBestAddress(prefill);
  const fullName = cleanString(personalInfo.full_name || personalInfo.fullName || personalInfo.name) || firstValue(prefill, ['full_name', 'fullName', 'name', 'customer_name']);
  const split = splitName(fullName);
  const stateName = bestAddress?.state || firstValue(prefill, ['state', 'state_name', 'stateName']);
  const pan = documentValue(prefill, 'pan') || firstArrayValue(prefill, ['data', 'data', 'personal_data', 'document_data', 'pan']) || firstValue(prefill, ['pan', 'pan_number', 'panNumber', 'idNumber']);
  const dob = cleanString(personalInfo.date_of_birth || personalInfo.dateOfBirth || personalInfo.dob) || firstValue(prefill, ['dob', 'date_of_birth', 'dateOfBirth', 'birthDate']);

  return {
    firstName: firstValue(prefill, ['first_name', 'firstName']) || cleanString(fallback.firstName) || split.firstName,
    lastName: firstValue(prefill, ['last_name', 'lastName']) || cleanString(fallback.lastName) || split.lastName,
    dob: normalizeDob(dob || cleanString(fallback.dob || fallback.birthDate)),
    gender: normalizeGender(cleanString(personalInfo.gender || personalInfo.sex) || firstValue(prefill, ['gender', 'sex']) || cleanString(fallback.gender)),
    pan: (pan || cleanString(fallback.pan || fallback.idNumber)).toUpperCase(),
    mobile: digits(cleanString(fallback.mobile_number) || cleanString(fallback.telephoneNumber) || cleanString(fallback.mobile)).slice(-10),
    address: bestAddress?.detailedAddress || cleanString(fallback.address),
    state: getStateName(stateName || cleanString(fallback.state || fallback.stateName)),
    pincode: bestAddress?.pincode || digits(firstValue(prefill, ['pincode', 'pinCode', 'postal_code', 'postalCode', 'zip']) || cleanString(fallback.pincode || fallback.pinCode)).slice(0, 6),
  };
}

function validatePayload(payload: CibilPayload) {
  const required: Array<keyof CibilPayload> = ['firstName', 'lastName', 'dob', 'gender', 'pan', 'mobile', 'address', 'state', 'pincode'];
  const missing = required.filter((field) => !payload[field]);
  if (missing.length) return `Prefill response missing fields for Jaadugar payload: ${missing.join(', ')}`;
  if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(payload.pan)) return 'pan must be a valid PAN format';
  if (!/^\d{10}$/.test(payload.mobile)) return 'mobile must be 10 digits';
  if (!/^\d{6}$/.test(payload.pincode)) return 'pincode must be 6 digits';
  return null;
}

function findStandardApi(apis: SimpleApiConfig[], advancedId: string) {
  return apis.find((api) => api.id !== advancedId && api.status === 'active' && ['bureau-standard', 'bureau', 'cibil.consumer_score'].includes(api.code));
}

async function hitPrefillApi(api: SimpleApiConfig, payload: Record<string, unknown>, requestId: string) {
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

    let body: unknown = {};
    let invalidJson = false;
    try {
      body = await request.json();
    } catch {
      invalidJson = true;
    }
    const bodyObject = isObject(body) ? body : {};
    const mobile = digits(bodyObject.mobile_number || bodyObject.telephoneNumber || bodyObject.mobile).slice(-10);

    const baseLog = {
      id: crypto.randomUUID(),
      request_id: requestId,
      client_id: client.id,
      api_id: advancedApi.id,
      key_id: keyRecord.id,
      masked_mobile: maskMobile(mobile),
      created_at: new Date().toISOString(),
    };
    const apiCode = advancedApi.code;
    const currentBalance = () => Number(client.credits || 0);

    async function saveFailure(message: string, httpStatus: number, responseJson?: unknown, providerStatus?: number, pan?: string) {
      const responseTime = Date.now() - startedAt;
      const cachedLog = {
        ...baseLog,
        status: 'failed' as const,
        credits_deducted: 0,
        masked_pan: pan ? maskPan(pan) : undefined,
        response_time_ms: responseTime,
        error_message: message,
      };
      store.usage = [cachedLog, ...store.usage].slice(0, 200);
      await saveApiHubStore(supabase, rowId, store);
      await appendApiUsageLedger(supabase, {
        ...cachedLog,
        ...requestEvidence(request),
        api_code: apiCode,
        http_status: httpStatus,
        provider_status: providerStatus,
        balance_after: currentBalance(),
        request_json: bodyObject,
        response_json: responseJson,
      });
      return jsonError(message, httpStatus, requestId);
    }

    if (invalidJson) return saveFailure('Request body must be valid JSON', 400);
    if (!isObject(body)) return saveFailure('Request body must be a JSON object', 400);
    if (body.consent !== true) return saveFailure('consent must be true', 400);
    if (!/^\d{10}$/.test(mobile)) return saveFailure('mobile_number must be 10 digits', 400);
    const cost = Math.max(1, Number(advancedApi.per_hit_credits || 1));
    if (Number(client.credits || 0) < cost) return saveFailure('Insufficient credits', 402);

    const prefillPayload = {
      mobile_number: mobile,
      first_name: cleanString(body.first_name || body.firstName),
      lastName: cleanString(body.lastName || body.last_name),
      consent: 'Y',
    };
    const prefillResponse = await hitPrefillApi(advancedApi, prefillPayload, requestId);
    if (!prefillResponse.ok) {
      const message = `Mobile Prefill API failed with ${prefillResponse.status}`;
      return saveFailure(message, 502, prefillResponse.data, prefillResponse.status);
    }

    const prefillCode = isObject(prefillResponse.data) && isObject(prefillResponse.data.data) ? cleanString(prefillResponse.data.data.code) : '';
    if (prefillCode && prefillCode !== '1015') {
      const message = isObject(prefillResponse.data) && isObject(prefillResponse.data.data)
        ? cleanString(prefillResponse.data.data.message) || 'Mobile Prefill did not return usable data'
        : 'Mobile Prefill did not return usable data';
      return saveFailure(message, prefillCode === '1004' ? 404 : 422, prefillResponse.data, prefillResponse.status);
    }

    const cibilPayload = buildCibilPayload(prefillResponse.data, { ...body, mobile_number: mobile });
    const validationError = validatePayload(cibilPayload);
    if (validationError) return saveFailure(validationError, 422, prefillResponse.data, prefillResponse.status, cibilPayload.pan);

    const bureauResponse = await hitMasterApi(standardApi, cibilPayload);
    const responseTime = Date.now() - startedAt;
    if (!bureauResponse.ok) {
      const message = typeof bureauResponse.data === 'object' && bureauResponse.data && 'error' in bureauResponse.data
        ? String((bureauResponse.data as { error: unknown }).error)
        : `Bureau API Standard failed with ${bureauResponse.status}`;
      return saveFailure(message, 502, bureauResponse.data, bureauResponse.status, cibilPayload.pan);
    }

    const remainingCredits = Math.max(0, Number(client.credits || 0) - cost);
    store.clients = store.clients.map((item) => item.id === client.id
      ? { ...item, credits: remainingCredits, status: remainingCredits === 0 ? 'inactive' : item.status, updated_at: new Date().toISOString() }
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
      masked_pan: maskPan(cibilPayload.pan),
      masked_mobile: maskMobile(mobile),
      response_time_ms: responseTime,
      created_at: new Date().toISOString(),
    }, ...store.usage].slice(0, 200);
    await saveApiHubStore(supabase, rowId, store);
    await appendApiUsageLedger(supabase, {
      ...baseLog,
      ...requestEvidence(request),
      api_code: advancedApi.code,
      status: 'success',
      http_status: 200,
      provider_status: bureauResponse.status,
      credits_deducted: cost,
      balance_after: remainingCredits,
      masked_pan: maskPan(cibilPayload.pan),
      response_time_ms: responseTime,
      request_json: body,
      response_json: bureauResponse.data,
      metadata: { prefill_response: prefillResponse.data },
    });

    return NextResponse.json({
      success: true,
      request_id: requestId,
      api: advancedApi.code,
      charged: { credits: cost, balance: remainingCredits },
      access: remainingCredits === 0 ? 'inactive' : 'active',
      data: bureauResponse.data,
    });
  } catch (error) {
    console.error('[api-hub:cibil-mobile-prefill] unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unexpected API Hub error';
    return jsonError(message, 500, requestId);
  }
}
