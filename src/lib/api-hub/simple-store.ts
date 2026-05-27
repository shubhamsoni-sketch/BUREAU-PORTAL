import { createAdminClient } from '@/lib/supabase/admin';

export const API_HUB_STORE_MOBILE = '0000000000';
export const API_HUB_STORE_STATUS = 'api_hub_store';

export type SimpleApiConfig = {
  id: string;
  name: string;
  code: string;
  master_url: string;
  method: 'POST' | 'GET';
  auth_header: string;
  auth_token?: string;
  has_auth_token?: boolean;
  per_hit_credits: number;
  test_payload: Record<string, unknown>;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
};

export type SimpleApiClient = {
  id: string;
  name: string;
  company_name?: string | null;
  contact_name?: string | null;
  email?: string | null;
  mobile?: string | null;
  credits: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
};

export type SimpleApiKey = {
  id: string;
  client_id: string;
  api_id: string;
  label: string;
  key_prefix: string;
  key_hash: string;
  status: 'active' | 'revoked';
  last_used_at: string | null;
  created_at: string;
};

export type SimpleUsageLog = {
  id: string;
  request_id: string;
  client_id: string;
  api_id: string;
  key_id: string;
  status: 'success' | 'failed';
  credits_deducted: number;
  masked_pan?: string;
  masked_mobile?: string;
  response_time_ms?: number;
  error_message?: string;
  created_at: string;
};

export type SimpleApiHubStore = {
  apis: SimpleApiConfig[];
  clients: SimpleApiClient[];
  keys: SimpleApiKey[];
  usage: SimpleUsageLog[];
};

const defaultPrefillPayload = {
  mobile_number: '9876543210',
  first_name: '',
  lastName: '',
  consent: true,
};

export const defaultBureauPayload = {
  firstName: 'HARSHAL',
  middleName: 'ARUN',
  lastName: 'PAWAR',
  birthDate: '13122000',
  gender: '2',
  idNumber: 'GEAPP1589H',
  stateCode: '23',
  pinCode: '450221',
  telephoneNumber: '7067384810',
  consent: true,
};

export const defaultBureauApi: SimpleApiConfig = {
  id: 'bureau-api',
  name: 'Bureau API Standard',
  code: 'bureau',
  master_url: '',
  method: 'POST',
  auth_header: 'x-api-key',
  auth_token: '',
  has_auth_token: false,
  per_hit_credits: 1,
  test_payload: defaultBureauPayload,
  status: 'active',
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
};

export const defaultBureauAdvancedApi: SimpleApiConfig = {
  id: 'bureau-advanced',
  name: 'Bureau API Advanced',
  code: 'bureau-advanced',
  master_url: 'https://api.gridlines.io/profile-api/mobile/prefill',
  method: 'POST',
  auth_header: 'X-API-Key',
  auth_token: '',
  has_auth_token: false,
  per_hit_credits: 1,
  test_payload: defaultPrefillPayload,
  status: 'active',
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
};

export const defaultMobilePrefillApi: SimpleApiConfig = {
  id: 'mobile-prefill',
  name: 'Mobile Prefill API',
  code: 'mobile-prefill',
  master_url: 'https://api.gridlines.io/profile-api/mobile/prefill',
  method: 'POST',
  auth_header: 'X-API-Key',
  auth_token: '',
  has_auth_token: false,
  per_hit_credits: 1,
  test_payload: defaultPrefillPayload,
  status: 'active',
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
};

type LegacyStore = {
  apis?: SimpleApiConfig[];
  clients?: Array<Record<string, any>>;
  keys?: Array<Record<string, any>>;
  usage?: SimpleUsageLog[];
  logs?: Array<Record<string, any>>;
  products?: Array<Record<string, any>>;
};

export function publicApi(api: SimpleApiConfig) {
  const { auth_token: _authToken, ...safe } = api;
  return { ...safe, has_auth_token: Boolean(api.auth_token || api.has_auth_token) };
}

function cleanString(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function normalizePrefillPayload(payload: unknown) {
  const source = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload as Record<string, unknown> : {};
  const mobile = cleanString(source.mobile_number || source.mobile || source.telephoneNumber).replace(/\D/g, '').slice(-10);
  return {
    mobile_number: mobile,
    first_name: cleanString(source.first_name || source.firstName),
    lastName: cleanString(source.lastName || source.last_name),
    consent: 'Y',
  };
}

function normalizeApi(raw: Record<string, any>): SimpleApiConfig {
  const now = new Date().toISOString();
  return {
    id: String(raw.id || raw.code || crypto.randomUUID()),
    name: String(raw.name || 'Bureau API'),
    code: String(raw.code || raw.id || 'bureau'),
    master_url: String(raw.master_url || raw.endpoint_url || ''),
    method: String(raw.method || raw.http_method || 'POST').toUpperCase() === 'GET' ? 'GET' : 'POST',
    auth_header: String(raw.auth_header || raw.auth_header_name || 'x-api-key'),
    auth_token: String(raw.auth_token || raw.auth_secret || ''),
    has_auth_token: Boolean(raw.auth_token || raw.auth_secret || raw.has_auth_token || raw.has_auth_secret),
    per_hit_credits: Math.max(1, Number(raw.per_hit_credits || 1)),
    test_payload: raw.test_payload || raw.request_template || defaultBureauPayload,
    status: raw.status === 'inactive' || raw.is_active === false ? 'inactive' : 'active',
    created_at: raw.created_at || now,
    updated_at: raw.updated_at || now,
  };
}

function normalizeClient(raw: Record<string, any>): SimpleApiClient {
  const now = new Date().toISOString();
  return {
    id: String(raw.id || crypto.randomUUID()),
    name: String(raw.name || 'Client'),
    company_name: raw.company_name || null,
    contact_name: raw.contact_name || null,
    email: raw.email || null,
    mobile: raw.mobile || null,
    credits: Math.max(0, Number(raw.credits || 0)),
    status: raw.status === 'inactive' || raw.status === 'suspended' ? 'inactive' : 'active',
    created_at: raw.created_at || now,
    updated_at: raw.updated_at || now,
  };
}

function normalizeKey(raw: Record<string, any>): SimpleApiKey {
  return {
    id: String(raw.id || crypto.randomUUID()),
    client_id: String(raw.client_id || ''),
    api_id: String(raw.api_id || raw.product_id || defaultBureauApi.id),
    label: String(raw.label || 'API key'),
    key_prefix: String(raw.key_prefix || ''),
    key_hash: String(raw.key_hash || ''),
    status: raw.status === 'revoked' ? 'revoked' : 'active',
    last_used_at: raw.last_used_at || null,
    created_at: raw.created_at || new Date().toISOString(),
  };
}

export function normalizeStore(raw: LegacyStore | null | undefined): SimpleApiHubStore {
  const sourceApis = raw?.apis?.length ? raw.apis : raw?.products;
  const apis = sourceApis?.length ? sourceApis.map(normalizeApi) : [defaultBureauApi, defaultBureauAdvancedApi, defaultMobilePrefillApi];
  const hasAdvanced = apis.some((api) => api.code === defaultBureauAdvancedApi.code || api.id === defaultBureauAdvancedApi.id);
  if (!hasAdvanced) apis.push(defaultBureauAdvancedApi);
  const hasMobilePrefill = apis.some((api) => api.code === defaultMobilePrefillApi.code || api.id === defaultMobilePrefillApi.id);
  if (!hasMobilePrefill) apis.push(defaultMobilePrefillApi);
  const clients = (raw?.clients || []).map(normalizeClient);
  const keys = (raw?.keys || []).map(normalizeKey).filter((key) => key.client_id && key.api_id && key.key_hash);
  const usage: SimpleUsageLog[] = (raw?.usage || raw?.logs || []).map((log: Record<string, any>) => ({
    id: String(log.id || crypto.randomUUID()),
    request_id: String(log.request_id || ''),
    client_id: String(log.client_id || ''),
    api_id: String(log.api_id || log.product_id || defaultBureauApi.id),
    key_id: String(log.key_id || log.api_key_id || ''),
    status: log.status === 'success' ? 'success' as const : 'failed' as const,
    credits_deducted: Number(log.credits_deducted || log.sandbox_credits_charged || 0),
    masked_pan: log.masked_pan,
    masked_mobile: log.masked_mobile,
    response_time_ms: log.response_time_ms,
    error_message: log.error_message,
    created_at: log.created_at || new Date().toISOString(),
  }));

  return { apis, clients, keys, usage };
}

export async function getApiHubStore(supabase: ReturnType<typeof createAdminClient>) {
  const { data, error } = await supabase
    .from('b2c_report_requests')
    .select('id,report_json')
    .eq('mobile', API_HUB_STORE_MOBILE)
    .eq('status', API_HUB_STORE_STATUS)
    .maybeSingle();

  if (error) throw error;

  if (data?.id) {
    return { rowId: data.id as string, store: normalizeStore(data.report_json as LegacyStore) };
  }

  const initial = normalizeStore(null);
  const { data: inserted, error: insertError } = await supabase
    .from('b2c_report_requests')
    .insert({
      mobile: API_HUB_STORE_MOBILE,
      full_name: 'API Hub Store',
      status: API_HUB_STORE_STATUS,
      report_type: API_HUB_STORE_STATUS,
      report_json: initial,
      consent_given: true,
      consent_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (insertError) throw insertError;
  return { rowId: inserted.id as string, store: initial };
}

export async function saveApiHubStore(
  supabase: ReturnType<typeof createAdminClient>,
  rowId: string,
  store: SimpleApiHubStore,
) {
  const normalized = normalizeStore(store);
  const { error } = await supabase
    .from('b2c_report_requests')
    .update({ report_json: normalized, updated_at: new Date().toISOString() })
    .eq('id', rowId);
  if (error) throw error;
}

export async function hitMasterApi(api: SimpleApiConfig, payload: unknown) {
  const endpoint = api.master_url.trim().replace(/\/+$/, '');
  if (!endpoint) throw new Error('Master API URL is not configured');

  const headers: Record<string, string> = {
    accept: 'application/json',
    'content-type': 'application/json',
  };
  if (api.auth_header && api.auth_token) headers[api.auth_header] = api.auth_token;
  if (api.code === 'mobile-prefill' || api.code === 'bureau-advanced') {
    headers['X-Auth-Type'] = 'API-Key';
    headers['X-Reference-ID'] = `ct-${Date.now()}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.API_HUB_GATEWAY_TIMEOUT_MS || 45000));

  try {
    const response = await fetch(endpoint, {
      method: api.method,
      headers,
      body: api.method === 'GET' ? undefined : JSON.stringify(
        api.code === 'mobile-prefill' || api.code === 'bureau-advanced'
          ? normalizePrefillPayload(payload)
          : payload,
      ),
      signal: controller.signal,
    });
    const text = await response.text();
    let data: unknown = text;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }
    return { ok: response.ok, status: response.status, data };
  } finally {
    clearTimeout(timeout);
  }
}
