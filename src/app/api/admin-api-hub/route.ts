import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, createAdminClient, requireAdmin } from '@/lib/supabase/admin';
import { createApiKey } from '@/lib/api-hub/keys';

const STORE_MOBILE = '0000000000';
const STORE_STATUS = 'api_hub_store';

const DEFAULT_PRODUCT = {
  id: 'cibil.consumer_score',
  code: 'cibil.consumer_score',
  name: 'Bureau API',
  description: 'Credit bureau report and score API through the whitelisted gateway.',
  vendor_name: 'Bureau API Gateway',
  endpoint_url: '',
  http_method: 'POST',
  auth_header_name: 'x-api-key',
  has_auth_secret: false,
  auth_secret: '',
  request_template: {
    firstName: 'HARSHAL',
    middleName: 'ARUN',
    lastName: 'PAWAR',
    birthDate: '13122000',
    gender: '2',
    idNumber: 'GEAPP1589H',
    stateCode: '23',
    pinCode: '450221',
    telephoneNumber: '7067384810',
  },
  sandbox_enabled: true,
  live_enabled: true,
  is_active: true,
  status: 'active',
};

type ApiHubStore = {
  products: Array<Record<string, any>>;
  clients: Array<Record<string, any>>;
  keys: Array<Record<string, any>>;
  logs: Array<Record<string, any>>;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function publicProduct(product: Record<string, any>) {
  const { auth_secret: _secret, ...safe } = product;
  return { ...safe, has_auth_secret: Boolean(product.auth_secret || product.has_auth_secret) };
}

async function adminContext(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if ('error' in auth) return auth;
  return auth;
}

async function getStore(supabase: ReturnType<typeof createAdminClient>) {
  const { data, error } = await supabase
    .from('b2c_report_requests')
    .select('id,report_json')
    .eq('mobile', STORE_MOBILE)
    .eq('status', STORE_STATUS)
    .maybeSingle();

  if (error) throw error;

  if (data?.id) {
    const stored = (data.report_json || {}) as Partial<ApiHubStore>;
    return {
      rowId: data.id,
      store: {
        products: stored.products?.length ? stored.products : [DEFAULT_PRODUCT],
        clients: stored.clients || [],
        keys: stored.keys || [],
        logs: stored.logs || [],
      },
    };
  }

  const initial: ApiHubStore = { products: [DEFAULT_PRODUCT], clients: [], keys: [], logs: [] };
  const { data: inserted, error: insertError } = await supabase
    .from('b2c_report_requests')
    .insert({
      mobile: STORE_MOBILE,
      full_name: 'API Hub Store',
      status: STORE_STATUS,
      report_type: STORE_STATUS,
      report_json: initial,
      consent_given: true,
      consent_at: new Date().toISOString(),
    })
    .select('id,report_json')
    .single();

  if (insertError) throw insertError;
  return { rowId: inserted.id, store: initial };
}

async function saveStore(supabase: ReturnType<typeof createAdminClient>, rowId: string, store: ApiHubStore) {
  const { error } = await supabase
    .from('b2c_report_requests')
    .update({ report_json: store, updated_at: new Date().toISOString() })
    .eq('id', rowId);
  if (error) throw error;
}

async function hitVendorApi(product: Record<string, any>, payload: unknown) {
  const endpoint = String(product.endpoint_url || '').trim();
  if (!endpoint) throw new Error('Vendor endpoint is not configured');

  const method = String(product.http_method || 'POST').toUpperCase();
  const headers: Record<string, string> = { accept: 'application/json', 'content-type': 'application/json' };
  if (product.auth_header_name && product.auth_secret) headers[String(product.auth_header_name)] = String(product.auth_secret);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.API_HUB_GATEWAY_TIMEOUT_MS || 45000));
  try {
    const response = await fetch(endpoint, {
      method,
      headers,
      body: method === 'GET' ? undefined : JSON.stringify(payload),
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

export async function GET(request: NextRequest) {
  try {
    const auth = await adminContext(request);
    if ('error' in auth) return jsonError(auth.error || 'Unauthorized', auth.status);

    const { rowId, store } = await getStore(auth.supabase);
    await saveStore(auth.supabase, rowId, store);

    return NextResponse.json({
      success: true,
      products: store.products.map(publicProduct),
      clients: store.clients,
      keys: store.keys.map((key) => ({ ...key, key_hash: undefined })),
      logs: store.logs.slice(0, 100),
      wallets: [],
      transactions: [],
      gateway: null,
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

    const { rowId, store } = await getStore(auth.supabase);
    const body = await request.json();
    const action = body?.action;

    if (action === 'save_api_config') {
      const productId = String(body.product_id || DEFAULT_PRODUCT.id);
      const existing = store.products.find((item) => item.id === productId) || DEFAULT_PRODUCT;
      let requestTemplate = existing.request_template || DEFAULT_PRODUCT.request_template;
      try {
        requestTemplate = typeof body.request_template === 'string' ? JSON.parse(body.request_template) : (body.request_template || requestTemplate);
      } catch {
        return jsonError('Request template must be valid JSON');
      }

      const nextProduct = {
        ...existing,
        id: productId,
        code: existing.code || productId,
        name: String(body.name || existing.name || 'Bureau API').trim(),
        description: String(body.description || '').trim(),
        vendor_name: String(body.vendor_name || '').trim(),
        endpoint_url: String(body.endpoint_url || '').trim(),
        http_method: String(body.http_method || 'POST').toUpperCase(),
        auth_header_name: String(body.auth_header_name || '').trim(),
        auth_secret: String(body.auth_secret || '').trim() || existing.auth_secret || '',
        has_auth_secret: Boolean(String(body.auth_secret || '').trim() || existing.auth_secret),
        request_template: requestTemplate,
        sandbox_enabled: body.sandbox_enabled !== false,
        live_enabled: body.live_enabled !== false,
        is_active: body.is_active !== false,
        status: body.is_active === false ? 'inactive' : 'active',
      };

      store.products = store.products.some((item) => item.id === productId)
        ? store.products.map((item) => (item.id === productId ? nextProduct : item))
        : [nextProduct, ...store.products];
      await saveStore(auth.supabase, rowId, store);
      return NextResponse.json({ success: true, product: publicProduct(nextProduct) });
    }

    if (action === 'test_vendor_api') {
      const product = store.products.find((item) => item.id === String(body.product_id || DEFAULT_PRODUCT.id));
      if (!product) return jsonError('API product not found', 404);
      let payload = body.payload || product.request_template || DEFAULT_PRODUCT.request_template;
      try {
        if (typeof payload === 'string') payload = JSON.parse(payload);
      } catch {
        return jsonError('Payload must be valid JSON');
      }
      const startedAt = Date.now();
      const vendorResponse = await hitVendorApi(product, payload);
      return NextResponse.json({
        success: vendorResponse.ok,
        status: vendorResponse.status,
        response_time_ms: Date.now() - startedAt,
        data: vendorResponse.data,
      }, { status: vendorResponse.ok ? 200 : 502 });
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
        status: 'active',
        created_at: new Date().toISOString(),
      };
      store.clients = [client, ...store.clients];
      await saveStore(auth.supabase, rowId, store);
      return NextResponse.json({ success: true, client });
    }

    if (action === 'generate_key') {
      const clientId = String(body.client_id || '').trim();
      const productId = String(body.product_id || DEFAULT_PRODUCT.id).trim();
      const client = store.clients.find((item) => item.id === clientId && item.status === 'active');
      const product = store.products.find((item) => item.id === productId && item.is_active !== false);
      if (!client) return jsonError('Active client not found', 404);
      if (!product) return jsonError('Active API product not found', 404);

      const environment = body.environment === 'sandbox' ? 'sandbox' : 'live';
      const generated = createApiKey(environment);
      const apiKey = {
        id: crypto.randomUUID(),
        client_id: clientId,
        product_id: productId,
        label: String(body.label || '').trim() || `${environment.toUpperCase()} key`,
        key_prefix: generated.prefix,
        key_hash: generated.hash,
        environment,
        status: 'active',
        rate_limit_per_minute: Number(body.rate_limit_per_minute || 60),
        last_used_at: null,
        created_at: new Date().toISOString(),
      };
      store.keys = [apiKey, ...store.keys];
      await saveStore(auth.supabase, rowId, store);
      return NextResponse.json({ success: true, api_key: { ...apiKey, key_hash: undefined }, secret_key: generated.key });
    }

    if (action === 'revoke_key') {
      const keyId = String(body.key_id || '').trim();
      store.keys = store.keys.map((key) => key.id === keyId ? { ...key, status: 'revoked' } : key);
      await saveStore(auth.supabase, rowId, store);
      return NextResponse.json({ success: true });
    }

    return jsonError('Unknown API Hub action');
  } catch (error) {
    console.error('[admin-api-hub] POST failed:', error);
    return jsonError('Unable to process API Hub request', 500);
  }
}
