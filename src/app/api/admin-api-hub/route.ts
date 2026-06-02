import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, createAdminClient, requireAdmin } from '@/lib/supabase/admin';
import { createApiKey } from '@/lib/api-hub/keys';
import {
  defaultBureauApi,
  getApiHubStore,
  hitMasterApi,
  publicApi,
  saveApiHubStore,
  SimpleApiConfig,
} from '@/lib/api-hub/simple-store';
import { getStateName } from '@/lib/bureau/state-codes';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

async function adminContext(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if ('error' in auth) return auth;
  return auth;
}

function parseJson(value: unknown, fallback: Record<string, unknown>) {
  if (!value) return fallback;
  if (typeof value !== 'string') return value as Record<string, unknown>;
  try {
    return JSON.parse(value);
  } catch {
    throw new Error('Payload must be valid JSON');
  }
}

function buildApi(body: Record<string, any>, existing?: SimpleApiConfig): SimpleApiConfig {
  const now = new Date().toISOString();
  const apiId = String(body.api_id || existing?.id || crypto.randomUUID());
  const name = String(body.name || existing?.name || '').trim();
  if (!name) throw new Error('API name is required');

  return {
    id: apiId,
    name,
    code: String(body.code || existing?.code || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, ''),
    master_url: String(body.master_url || '').trim() || existing?.master_url || '',
    method: String(body.method || existing?.method || 'POST').toUpperCase() === 'GET' ? 'GET' : 'POST',
    auth_header: String(body.auth_header || existing?.auth_header || 'x-api-key').trim(),
    auth_token: String(body.auth_token || '').trim() || existing?.auth_token || '',
    has_auth_token: Boolean(String(body.auth_token || '').trim() || existing?.auth_token || existing?.has_auth_token),
    per_hit_credits: Math.max(1, Number(body.per_hit_credits || existing?.per_hit_credits || 1)),
    test_payload: parseJson(body.test_payload, existing?.test_payload || defaultBureauApi.test_payload),
    status: body.status === 'inactive' ? 'inactive' : 'active',
    created_at: existing?.created_at || now,
    updated_at: now,
  };
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
    lastName: parts.length > 1 ? parts[parts.length - 1] : '',
  };
}

function parseReportedDate(value: unknown) {
  const text = cleanString(value);
  const time = text ? Date.parse(text) : NaN;
  return Number.isFinite(time) ? time : 0;
}

function chooseBestAddress(prefill: unknown) {
  const addresses = nestedArray(prefill, ['data', 'data', 'personal_data', 'address']);
  const valid = addresses
    .map((address) => ({
      state: cleanString(address.state || address.state_name || address.stateName),
      pincode: digits(address.pincode || address.pinCode || address.postal_code || address.postalCode).slice(0, 6),
      reportedAt: parseReportedDate(address.date_of_reporting || address.reported_at || address.updated_at),
      detailedAddress: cleanString(address.detailed_address || address.address),
    }))
    .filter((address) => /^\d{6}$/.test(address.pincode) && address.state);

  return valid.length
    ? valid.sort((a, b) => b.reportedAt - a.reportedAt || Number(Boolean(b.detailedAddress)) - Number(Boolean(a.detailedAddress)))[0]
    : null;
}

function firstArrayValue(source: unknown, path: string[]) {
  const items = nestedArray(source, path);
  return cleanString(items[0]?.value);
}

function buildAdvancedCibilPayload(prefill: unknown, fallback: Record<string, unknown>) {
  const personalInfo = nestedObject(prefill, ['data', 'data', 'personal_data', 'personal_information']);
  const bestAddress = chooseBestAddress(prefill);
  const fullName = cleanString(personalInfo.full_name || personalInfo.fullName || personalInfo.name) || firstValue(prefill, ['full_name', 'fullName', 'name', 'customer_name']);
  const split = splitName(fullName);
  const stateName = bestAddress?.state || firstValue(prefill, ['state', 'state_name', 'stateName']);
  const pan = firstArrayValue(prefill, ['data', 'data', 'personal_data', 'document_data', 'pan']) || firstValue(prefill, ['pan', 'pan_number', 'panNumber', 'idNumber']);
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

function validateAdvancedCibilPayload(payload: ReturnType<typeof buildAdvancedCibilPayload>) {
  const required = ['firstName', 'lastName', 'dob', 'gender', 'pan', 'mobile', 'address', 'state', 'pincode'] as const;
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

export async function GET(request: NextRequest) {
  try {
    const auth = await adminContext(request);
    if ('error' in auth) return jsonError(auth.error || 'Unauthorized', auth.status);

    const { rowId, store } = await getApiHubStore(auth.supabase);
    await saveApiHubStore(auth.supabase, rowId, store);

    return NextResponse.json({
      success: true,
      apis: store.apis.map(publicApi),
      clients: store.clients,
      keys: store.keys.map((key) => ({ ...key, key_hash: undefined })),
      usage: store.usage.slice(0, 100),
    });
  } catch (error) {
    console.error('[admin-api-hub] GET failed:', error);
    return jsonError('Unable to load API Hub data', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await adminContext(request);
    if ('error' in auth) return jsonError(auth.error || 'Unauthorized', auth.status);

    const { rowId, store } = await getApiHubStore(auth.supabase);
    const body = await request.json();
    const action = body?.action;

    if (action === 'save_api') {
      const existing = store.apis.find((api) => api.id === String(body.api_id || ''));
      let api: SimpleApiConfig;
      try {
        api = buildApi(body, existing);
      } catch (error) {
        return jsonError(error instanceof Error ? error.message : 'Invalid API details');
      }

      store.apis = existing
        ? store.apis.map((item) => (item.id === api.id ? api : item))
        : [api, ...store.apis];
      await saveApiHubStore(auth.supabase, rowId, store);
      return NextResponse.json({ success: true, api: publicApi(api) });
    }

    if (action === 'test_api') {
      const api = store.apis.find((item) => item.id === String(body.api_id || ''));
      if (!api) return jsonError('API not found', 404);
      let payload: Record<string, unknown>;
      try {
        payload = parseJson(body.payload, api.test_payload);
      } catch (error) {
        return jsonError(error instanceof Error ? error.message : 'Payload must be valid JSON');
      }

      const startedAt = Date.now();
      if (api.code === 'bureau-advanced') {
        const standardApi = findStandardApi(store.apis, api.id);
        if (!standardApi) return jsonError('Bureau API Standard is not configured', 500);
        if (!isObject(payload)) return jsonError('Request body must be a JSON object');
        if (payload.consent !== true) return jsonError('consent must be true');
        const mobile = digits(payload.mobile_number || payload.telephoneNumber || payload.mobile).slice(-10);
        if (!/^\d{10}$/.test(mobile)) return jsonError('mobile_number must be 10 digits');

        const requestId = `ADMIN-ADV-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
        const prefillPayload = {
          mobile_number: mobile,
          first_name: cleanString(payload.first_name || payload.firstName),
          lastName: cleanString(payload.lastName || payload.last_name),
          consent: 'Y',
        };
        const prefillResponse = await hitPrefillApi(api, prefillPayload, requestId);
        if (!prefillResponse.ok) {
          return NextResponse.json({
            success: false,
            status: prefillResponse.status,
            response_time_ms: Date.now() - startedAt,
            stage: 'mobile_prefill',
            data: prefillResponse.data,
          }, { status: 502 });
        }

        const cibilPayload = buildAdvancedCibilPayload(prefillResponse.data, { ...payload, mobile_number: mobile });
        const validationError = validateAdvancedCibilPayload(cibilPayload);
        if (validationError) {
          return NextResponse.json({
            success: false,
            status: 422,
            response_time_ms: Date.now() - startedAt,
            stage: 'build_cibil_payload',
            error: validationError,
            cibil_payload: cibilPayload,
          }, { status: 422 });
        }

        const bureauResponse = await hitMasterApi(standardApi, cibilPayload);
        return NextResponse.json({
          success: bureauResponse.ok,
          status: bureauResponse.status,
          response_time_ms: Date.now() - startedAt,
          stage: 'bureau_cibil',
          cibil_payload: cibilPayload,
          data: bureauResponse.data,
        }, { status: bureauResponse.ok ? 200 : 502 });
      }

      const response = await hitMasterApi(api, payload);
      return NextResponse.json({
        success: response.ok,
        status: response.status,
        response_time_ms: Date.now() - startedAt,
        data: response.data,
      }, { status: response.ok ? 200 : 502 });
    }

    if (action === 'create_client') {
      const name = String(body.name || '').trim();
      if (!name) return jsonError('Client name is required');

      const client = {
        id: crypto.randomUUID(),
        name,
        company_name: String(body.company_name || '').trim() || null,
        contact_name: String(body.contact_name || '').trim() || null,
        email: String(body.email || '').trim() || null,
        mobile: String(body.mobile || '').trim() || null,
        credits: Math.max(0, Number(body.credits || 0)),
        status: 'active' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      store.clients = [client, ...store.clients];
      await saveApiHubStore(auth.supabase, rowId, store);
      return NextResponse.json({ success: true, client });
    }

    if (action === 'add_credits') {
      const clientId = String(body.client_id || '').trim();
      const credits = Number(body.credits || 0);
      if (!clientId) return jsonError('Client is required');
      if (!Number.isFinite(credits) || credits <= 0) return jsonError('Credits must be greater than zero');

      const client = store.clients.find((item) => item.id === clientId);
      if (!client) return jsonError('Client not found', 404);
      store.clients = store.clients.map((item) => item.id === clientId
        ? { ...item, credits: Number(item.credits || 0) + credits, updated_at: new Date().toISOString() }
        : item);
      await saveApiHubStore(auth.supabase, rowId, store);
      return NextResponse.json({ success: true });
    }

    if (action === 'generate_key') {
      const clientId = String(body.client_id || '').trim();
      const apiId = String(body.api_id || '').trim();
      const client = store.clients.find((item) => item.id === clientId && item.status === 'active');
      const api = store.apis.find((item) => item.id === apiId && item.status === 'active');
      if (!client) return jsonError('Active client not found', 404);
      if (!api) return jsonError('Active API not found', 404);

      const generated = createApiKey('live');
      const apiKey = {
        id: crypto.randomUUID(),
        client_id: clientId,
        api_id: apiId,
        label: String(body.label || '').trim() || `${api.name} key`,
        key_prefix: generated.prefix,
        key_hash: generated.hash,
        status: 'active' as const,
        last_used_at: null,
        created_at: new Date().toISOString(),
      };
      store.keys = [apiKey, ...store.keys];
      await saveApiHubStore(auth.supabase, rowId, store);
      return NextResponse.json({ success: true, api_key: { ...apiKey, key_hash: undefined }, secret_key: generated.key });
    }

    if (action === 'revoke_key') {
      const keyId = String(body.key_id || '').trim();
      store.keys = store.keys.map((key) => key.id === keyId ? { ...key, status: 'revoked' } : key);
      await saveApiHubStore(auth.supabase, rowId, store);
      return NextResponse.json({ success: true });
    }

    return jsonError('Unknown API Hub action');
  } catch (error) {
    console.error('[admin-api-hub] POST failed:', error);
    return jsonError('Unable to process API Hub request', 500);
  }
}
