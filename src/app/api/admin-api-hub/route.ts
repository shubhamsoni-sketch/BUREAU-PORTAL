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
