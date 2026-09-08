import { createHmac, timingSafeEqual } from 'crypto';

type SupabaseLike = {
  from: (table: string) => any;
};

export type MetaConfig = {
  apiVersion: string;
  accessToken: string;
  pageAccessToken: string;
  pageId: string;
  adAccountId: string;
  businessId: string;
  whatsappBusinessAccountId: string;
  whatsappPhoneNumberId: string;
  whatsappDisplayNumber: string;
  instagramUserId: string;
  appSecret: string;
  specialAdCategories: string[];
};

export type MetaFetchResult<T = any> = {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
};

function clean(value: unknown) {
  return String(value ?? '').trim();
}

function list(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

export function getMetaConfig(): MetaConfig {
  const apiVersion = clean(process.env.META_GRAPH_API_VERSION)
    || clean(process.env.WHATSAPP_API_VERSION)
    || 'v23.0';
  const accessToken = clean(process.env.META_ACCESS_TOKEN);
  const pageAccessToken = clean(process.env.META_PAGE_ACCESS_TOKEN) || accessToken;

  return {
    apiVersion,
    accessToken,
    pageAccessToken,
    pageId: clean(process.env.META_PAGE_ID),
    adAccountId: clean(process.env.META_AD_ACCOUNT_ID).replace(/^act_/, ''),
    businessId: clean(process.env.META_BUSINESS_ID),
    whatsappBusinessAccountId: clean(process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID),
    whatsappPhoneNumberId: clean(process.env.META_WHATSAPP_PHONE_NUMBER_ID) || clean(process.env.WHATSAPP_PHONE_NUMBER_ID),
    whatsappDisplayNumber: clean(process.env.META_WHATSAPP_DISPLAY_NUMBER) || '8109276589',
    instagramUserId: clean(process.env.META_INSTAGRAM_USER_ID),
    appSecret: clean(process.env.META_APP_SECRET),
    specialAdCategories: list(clean(process.env.META_SPECIAL_AD_CATEGORIES) || 'CREDIT'),
  };
}

export function missingMetaConfig(keys: Array<keyof MetaConfig>) {
  const config = getMetaConfig();
  return keys.filter((key) => {
    const value = config[key];
    return Array.isArray(value) ? !value.length : !value;
  });
}

export function assertMetaConfig(keys: Array<keyof MetaConfig>) {
  const missing = missingMetaConfig(keys);
  if (missing.length) {
    throw new Error(`Meta configuration missing: ${missing.join(', ')}`);
  }
  return getMetaConfig();
}

export function metaApiUrl(path: string, version?: string) {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const apiVersion = version || getMetaConfig().apiVersion;
  return `https://graph.facebook.com/${apiVersion}/${cleanPath}`;
}

export async function metaGraphFetch<T = any>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'DELETE';
    token?: string;
    body?: Record<string, unknown>;
    query?: Record<string, unknown>;
  } = {},
): Promise<MetaFetchResult<T>> {
  const config = getMetaConfig();
  const token = options.token || config.accessToken || config.pageAccessToken;
  if (!token) return { ok: false, status: 503, data: null, error: 'Meta access token is not configured' };

  const url = new URL(metaApiUrl(path, config.apiVersion));
  url.searchParams.set('access_token', token);
  for (const [key, value] of Object.entries(options.query || {})) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await response.json().catch(() => null) as T | null;
  if (!response.ok) {
    const error = data && typeof data === 'object' && 'error' in data
      ? String((data as { error?: { message?: string } }).error?.message || 'Meta API request failed')
      : 'Meta API request failed';
    return { ok: false, status: response.status, data, error };
  }
  return { ok: true, status: response.status, data };
}

export async function ensureMetaAdAccountRecord(supabase: SupabaseLike) {
  const config = getMetaConfig();
  if (!config.adAccountId) return null;

  const row = {
    business_id: config.businessId || null,
    ad_account_id: config.adAccountId,
    page_id: config.pageId || null,
    instagram_user_id: config.instagramUserId || null,
    whatsapp_business_account_id: config.whatsappBusinessAccountId || null,
    whatsapp_phone_number_id: config.whatsappPhoneNumberId || null,
    whatsapp_display_number: config.whatsappDisplayNumber,
    status: 'active',
  };

  const { data, error } = await supabase
    .from('meta_ad_accounts')
    .upsert(row, { onConflict: 'ad_account_id', ignoreDuplicates: false })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function validateMetaPermissions() {
  const config = assertMetaConfig(['accessToken']);
  const result = await metaGraphFetch<{ data?: Array<{ permission?: string; status?: string }> }>(
    'me/permissions',
    { token: config.accessToken },
  );
  if (!result.ok) return result;
  const permissions = (result.data?.data || []).reduce<Record<string, string>>((acc, item) => {
    if (item.permission) acc[item.permission] = item.status || 'unknown';
    return acc;
  }, {});
  return { ...result, data: permissions };
}

export function verifyMetaSignature(rawBody: string, signatureHeader: string | null) {
  const { appSecret } = getMetaConfig();
  if (!appSecret) return { verified: false, reason: 'META_APP_SECRET missing' };
  if (!signatureHeader?.startsWith('sha256=')) return { verified: false, reason: 'signature missing' };

  const received = Buffer.from(signatureHeader.slice('sha256='.length), 'hex');
  const expected = Buffer.from(createHmac('sha256', appSecret).update(rawBody).digest('hex'), 'hex');
  if (received.length !== expected.length) return { verified: false, reason: 'signature length mismatch' };
  return { verified: timingSafeEqual(received, expected), reason: timingSafeEqual(received, expected) ? null : 'signature mismatch' };
}
