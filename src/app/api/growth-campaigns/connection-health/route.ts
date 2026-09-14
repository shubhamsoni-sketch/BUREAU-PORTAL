import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';

type HealthCheck = {
  key: string;
  label: string;
  ok: boolean;
  status?: number | string;
  detail?: string;
};

function clean(value: unknown) {
  return String(value ?? '').trim();
}

function isAuthError(auth: unknown): auth is { error: string; status: number } {
  return Boolean(auth && typeof auth === 'object' && 'error' in auth);
}

function graphUrl(apiVersion: string, path: string) {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `https://graph.facebook.com/${apiVersion}/${cleanPath}`;
}

async function checkGraph(params: {
  key: string;
  label: string;
  path: string;
  token: string;
  apiVersion: string;
  query?: Record<string, string>;
}): Promise<HealthCheck> {
  if (!params.token) {
    return { key: params.key, label: params.label, ok: false, status: 'missing_token' };
  }
  if (!params.path) {
    return { key: params.key, label: params.label, ok: false, status: 'missing_id' };
  }

  try {
    const url = new URL(graphUrl(params.apiVersion, params.path));
    url.searchParams.set('access_token', params.token);
    for (const [key, value] of Object.entries(params.query || {})) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url, { method: 'GET', cache: 'no-store' });
    const data = await response.json().catch(() => null);
    const apiError =
      data && typeof data === 'object' && 'error' in data
        ? clean((data as { error?: { message?: string } }).error?.message)
        : '';

    return {
      key: params.key,
      label: params.label,
      ok: response.ok,
      status: response.status,
      detail: response.ok ? 'Connected' : apiError || 'Connection failed',
    };
  } catch (error) {
    return {
      key: params.key,
      label: params.label,
      ok: false,
      status: 'request_failed',
      detail: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if (isAuthError(auth)) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const apiVersion =
    clean(process.env.META_GRAPH_API_VERSION || process.env.WHATSAPP_API_VERSION) || 'v23.0';
  const primaryToken = clean(process.env.META_ACCESS_TOKEN);
  const pageToken = clean(process.env.META_PAGE_ACCESS_TOKEN) || primaryToken;
  const messagingToken = clean(process.env.WHATSAPP_ACCESS_TOKEN) || primaryToken;
  const phoneNumberId = clean(
    process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.META_WHATSAPP_PHONE_NUMBER_ID
  );
  const businessAccountId = clean(
    process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID
  );
  const pageId = clean(process.env.META_PAGE_ID);
  const adAccountId = clean(process.env.META_AD_ACCOUNT_ID).replace(/^act_/, '');
  const instagramUserId = clean(process.env.META_INSTAGRAM_USER_ID);

  const [phone, templates, page, adAccount, permissions, instagram] = await Promise.all([
    checkGraph({
      key: 'messaging_phone',
      label: 'Messaging phone',
      path: phoneNumberId,
      token: messagingToken,
      apiVersion,
      query: { fields: 'id,display_phone_number,verified_name,quality_rating' },
    }),
    checkGraph({
      key: 'message_templates',
      label: 'Message templates',
      path: `${businessAccountId}/message_templates`,
      token: messagingToken,
      apiVersion,
      query: { fields: 'name,status,language,category', limit: '5' },
    }),
    checkGraph({
      key: 'page',
      label: 'Business page',
      path: pageId,
      token: pageToken,
      apiVersion,
      query: { fields: 'id,name' },
    }),
    checkGraph({
      key: 'ad_account',
      label: 'Ad account',
      path: adAccountId ? `act_${adAccountId}` : '',
      token: primaryToken,
      apiVersion,
      query: { fields: 'id,name,account_status,currency' },
    }),
    checkGraph({
      key: 'permissions',
      label: 'Token permissions',
      path: 'me/permissions',
      token: primaryToken,
      apiVersion,
    }),
    instagramUserId
      ? checkGraph({
          key: 'instagram',
          label: 'Instagram account',
          path: instagramUserId,
          token: primaryToken,
          apiVersion,
          query: { fields: 'id,username' },
        })
      : Promise.resolve({
          key: 'instagram',
          label: 'Instagram account',
          ok: false,
          status: 'missing_id',
          detail: 'Instagram account ID is not configured',
        } satisfies HealthCheck),
  ]);

  const checks = [phone, templates, page, adAccount, permissions, instagram];

  return NextResponse.json({
    success: true,
    checkedAt: new Date().toISOString(),
    ready: checks.filter((check) => check.key !== 'instagram').every((check) => check.ok),
    checks,
  });
}
