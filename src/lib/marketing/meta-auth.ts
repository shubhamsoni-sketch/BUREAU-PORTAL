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
  whatsappAdEnquiryNumber: string;
  instagramUserId: string;
  appSecret: string;
  specialAdCategories: string[];
  defaultCreativeImageUrl: string;
};

export type MetaFetchResult<T = any> = {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
};

export const CREDIT_TRUST_CLOUD_API_WHATSAPP_NUMBER = '9893332647';
export const CREDIT_TRUST_AD_ENQUIRY_WHATSAPP_NUMBER = '8109276589';

function clean(value: unknown) {
  return String(value ?? '').trim();
}

function graphParamValue(value: unknown) {
  if (value === undefined || value === null) return '';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

function graphErrorMessage(data: unknown) {
  if (!data || typeof data !== 'object' || !('error' in data)) {
    return 'Meta API request failed';
  }

  const error = (data as {
    error?: {
      message?: string;
      code?: number | string;
      error_subcode?: number | string;
      error_user_title?: string;
      error_user_msg?: string;
      fbtrace_id?: string;
    };
  }).error;
  const parts = [
    error?.message || 'Meta API request failed',
    error?.error_user_title,
    error?.error_user_msg,
    error?.code ? `code=${error.code}` : null,
    error?.error_subcode ? `subcode=${error.error_subcode}` : null,
    error?.fbtrace_id ? `fbtrace_id=${error.fbtrace_id}` : null,
  ].filter(Boolean);

  return parts.join(' | ');
}

function list(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function specialAdCategories(value: string) {
  const categories = list(value || 'CREDIT').map((item) => item.toUpperCase());
  return categories.includes('CREDIT') ? categories : ['CREDIT', ...categories];
}

export function normalizeCreditTrustWhatsAppNumber(
  value: unknown,
  fallback: string,
) {
  const digits = clean(value).replace(/\D/g, '');
  const fallbackDigits = clean(fallback).replace(/\D/g, '') || fallback;
  const localDigits = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits;
  const fallbackLocalDigits = fallbackDigits.startsWith('91') && fallbackDigits.length === 12
    ? fallbackDigits.slice(2)
    : fallbackDigits;

  if (!digits) return fallbackLocalDigits;
  return localDigits.length === 10 ? localDigits : digits;
}

export function resolveCreditTrustCloudWhatsAppNumber(value: unknown) {
  return normalizeCreditTrustWhatsAppNumber(value, CREDIT_TRUST_CLOUD_API_WHATSAPP_NUMBER);
}

export function resolveCreditTrustAdEnquiryWhatsAppNumber(value: unknown, fallback = CREDIT_TRUST_AD_ENQUIRY_WHATSAPP_NUMBER) {
  return normalizeCreditTrustWhatsAppNumber(value, fallback);
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
    whatsappBusinessAccountId: clean(process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID) || clean(process.env.WHATSAPP_BUSINESS_ACCOUNT_ID),
    whatsappPhoneNumberId: clean(process.env.META_WHATSAPP_PHONE_NUMBER_ID) || clean(process.env.WHATSAPP_PHONE_NUMBER_ID),
    whatsappDisplayNumber: resolveCreditTrustCloudWhatsAppNumber(process.env.META_WHATSAPP_DISPLAY_NUMBER),
    whatsappAdEnquiryNumber: resolveCreditTrustAdEnquiryWhatsAppNumber(
      clean(process.env.META_AD_WHATSAPP_NUMBER) || clean(process.env.WHATSAPP_AD_ENQUIRY_NUMBER),
    ),
    instagramUserId: clean(process.env.META_INSTAGRAM_USER_ID),
    appSecret: clean(process.env.META_APP_SECRET),
    specialAdCategories: specialAdCategories(clean(process.env.META_SPECIAL_AD_CATEGORIES)),
    defaultCreativeImageUrl: clean(process.env.META_DEFAULT_CREATIVE_IMAGE_URL),
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
    url.searchParams.set(key, graphParamValue(value));
  }

  const body = options.body
    ? Object.entries(options.body).reduce((params, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, graphParamValue(value));
      }
      return params;
    }, new URLSearchParams())
    : undefined;

  if (body && !body.has('access_token')) {
    body.set('access_token', token);
    url.searchParams.delete('access_token');
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : undefined,
    body,
  });
  const data = await response.json().catch(() => null) as T | null;
  if (!response.ok) {
    const error = graphErrorMessage(data);
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
