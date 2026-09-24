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
  SimpleSupportTicket,
} from '@/lib/api-hub/simple-store';
import { getStateName } from '@/lib/bureau/state-codes';
import { exportApiUsageLedger, listApiUsageLedger } from '@/lib/api-hub/usage-ledger';
import { hasHubConsoleSession } from '@/lib/api-hub/console-auth';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

const SUPPORT_EMAIL = process.env.API_HUB_SUPPORT_EMAIL || process.env.SUPPORT_EMAIL || 'support@credittrust.in';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Credit Trust Bridge <support@credittrust.in>';

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function ticketStatusLabel(status: SimpleSupportTicket['status']) {
  return status.replace(/_/g, ' ');
}

async function notifyTicketStatusUpdate(ticket: SimpleSupportTicket, clientName: string) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const recipient = String(ticket.client_email || '').trim();
  if (!resendApiKey) return { success: false, error: 'RESEND_API_KEY is missing' };
  if (!recipient) return { success: false, error: 'Client email is missing' };

  const html = `
    <h2>CreditTrust Bridge support ticket update</h2>
    <p>Hello ${escapeHtml(ticket.client_name || clientName || 'there')},</p>
    <p>Your support ticket has been marked as <b>${escapeHtml(ticketStatusLabel(ticket.status))}</b>.</p>
    <p><b>Ticket:</b> ${escapeHtml(ticket.ticket_number)}</p>
    <p><b>Subject:</b> ${escapeHtml(ticket.subject)}</p>
    ${ticket.last_response ? `<p><b>CreditTrust response:</b><br/>${escapeHtml(ticket.last_response).replace(/\n/g, '<br/>')}</p>` : ''}
    <p>If you still need help, please reply to this email or raise a new support ticket from the client portal.</p>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [recipient],
      subject: `Support Ticket ${ticket.ticket_number} ${ticketStatusLabel(ticket.status)} - CreditTrust Bridge`,
      html,
      reply_to: SUPPORT_EMAIL,
    }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) return { success: false, error: data?.message || 'Resend send failed' };
  return { success: true, emailId: data?.id as string | undefined };
}

async function adminContext(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0];
  const isLocalDev =
    process.env.NODE_ENV === 'development' &&
    ['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname);

  if (isLocalDev && !bearerToken(request)) {
    return {
      user: { id: 'local-api-console-preview' },
      supabase: createAdminClient(),
    };
  }

  if (hasHubConsoleSession(request)) {
    return {
      user: { id: 'hub-console-operator' },
      supabase: createAdminClient(),
    };
  }

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

  return valid.length
    ? valid.sort((a, b) => b.reportedAt - a.reportedAt || Number(Boolean(b.detailedAddress)) - Number(Boolean(a.detailedAddress)))[0]
    : null;
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

function buildAdvancedCibilPayload(prefill: unknown, fallback: Record<string, unknown>) {
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
    if (request.nextUrl.searchParams.get('usage_export') === 'csv') {
      const rows = await exportApiUsageLedger(auth.supabase);
      const columns = ['request_id', 'client_id', 'api_id', 'key_id', 'api_code', 'environment', 'method', 'request_path', 'status', 'http_status', 'provider_status', 'credits_deducted', 'balance_after', 'masked_pan', 'masked_mobile', 'ip_address', 'user_agent', 'response_time_ms', 'provider_ref', 'error_message', 'request_json', 'response_json', 'metadata', 'created_at'];
      const escape = (value: unknown) => {
        const serialized = value && typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
        return `"${serialized.replace(/"/g, '""')}"`;
      };
      const csv = [columns.join(','), ...rows.map((row) => columns.map((column) => escape(row[column])).join(','))].join('\n');
      return new NextResponse(csv, {
        headers: {
          'content-type': 'text/csv; charset=utf-8',
          'content-disposition': `attachment; filename="credittrust-api-usage-${new Date().toISOString().slice(0, 10)}.csv"`,
          'cache-control': 'no-store',
        },
      });
    }
    const page = Math.max(1, Number(request.nextUrl.searchParams.get('usage_page') || 1));
    const pageSize = Math.min(100, Math.max(10, Number(request.nextUrl.searchParams.get('usage_page_size') || 50)));
    const clientId = request.nextUrl.searchParams.get('usage_client_id') || undefined;
    const status = request.nextUrl.searchParams.get('usage_status') || undefined;
    const ledger = await listApiUsageLedger(auth.supabase, { page, pageSize, clientId, status });

    return NextResponse.json({
      success: true,
      apis: store.apis.map(publicApi),
      clients: store.clients,
      keys: store.keys.map((key) => ({ ...key, key_hash: undefined })),
      tickets: store.tickets || [],
      usage: ledger.rows,
      usage_pagination: {
        page,
        page_size: pageSize,
        total: ledger.total,
        total_pages: Math.max(1, Math.ceil(ledger.total / pageSize)),
      },
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
      const allowedIps = String(body.allowed_ips || '')
        .split(/[\s,]+/)
        .map((ip) => ip.trim())
        .filter(Boolean);
      if (!allowedIps.length) return jsonError('At least one allowed static IP is required for API client onboarding');
      let metadata: Record<string, unknown> = {};
      try {
        metadata = parseJson(body.metadata, {}) as Record<string, unknown>;
      } catch (error) {
        return jsonError(error instanceof Error ? error.message : 'Metadata must be valid JSON');
      }

      const client = {
        id: crypto.randomUUID(),
        name,
        company_name: String(body.company_name || '').trim() || null,
        contact_name: String(body.contact_name || '').trim() || null,
        email: String(body.email || '').trim() || null,
        mobile: String(body.mobile || '').trim() || null,
        allowed_ips: allowedIps,
        metadata,
        credits: Math.max(0, Number(body.credits || 0)),
        status: 'active' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      store.clients = [client, ...store.clients];
      await saveApiHubStore(auth.supabase, rowId, store);
      return NextResponse.json({ success: true, client });
    }

    if (action === 'update_client') {
      const clientId = String(body.client_id || body.id || '').trim();
      if (!clientId) return jsonError('Client is required');

      const existing = store.clients.find((item) => item.id === clientId);
      if (!existing) return jsonError('Client not found', 404);

      let metadata = existing.metadata || {};
      if (body.metadata !== undefined) {
        try {
          metadata = parseJson(body.metadata, existing.metadata || {}) as Record<string, unknown>;
        } catch (error) {
          return jsonError(error instanceof Error ? error.message : 'Metadata must be valid JSON');
        }
      }

      const allowedIps = body.allowed_ips !== undefined
        ? String(body.allowed_ips || '')
          .split(/[\s,]+/)
          .map((ip) => ip.trim())
          .filter(Boolean)
        : existing.allowed_ips || [];

      store.clients = store.clients.map((client) => client.id === clientId
        ? {
          ...client,
          name: String(body.name ?? client.name).trim() || client.name,
          company_name: body.company_name !== undefined ? String(body.company_name || '').trim() || null : client.company_name || null,
          contact_name: body.contact_name !== undefined ? String(body.contact_name || '').trim() || null : client.contact_name || null,
          email: body.email !== undefined ? String(body.email || '').trim() || null : client.email || null,
          mobile: body.mobile !== undefined ? String(body.mobile || '').trim() || null : client.mobile || null,
          allowed_ips: allowedIps,
          metadata,
          credits: body.credits !== undefined ? Math.max(0, Number(body.credits || 0)) : client.credits,
          status: body.status === 'inactive' || body.status === 'suspended' ? 'inactive' : 'active',
          updated_at: new Date().toISOString(),
        }
        : client);

      await saveApiHubStore(auth.supabase, rowId, store);
      const client = store.clients.find((item) => item.id === clientId);
      return NextResponse.json({ success: true, client });
    }

    if (action === 'add_credits') {
      const clientId = String(body.client_id || '').trim();
      const credits = Number(body.credits || 0);
      const environment = String(body.environment || body.env || 'uat').toLowerCase();
      if (!clientId) return jsonError('Client is required');
      if (!Number.isFinite(credits) || credits <= 0) return jsonError('Credits must be greater than zero');

      const client = store.clients.find((item) => item.id === clientId);
      if (!client) return jsonError('Client not found', 404);
      store.clients = store.clients.map((item) => item.id === clientId
        ? environment === 'production' || environment === 'live'
          ? {
            ...item,
            metadata: {
              ...(item.metadata || {}),
              live_credits: Math.max(0, Number((item.metadata as Record<string, unknown> | undefined)?.live_credits || 0)) + credits,
            },
            updated_at: new Date().toISOString(),
          }
          : { ...item, credits: Number(item.credits || 0) + credits, updated_at: new Date().toISOString() }
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

      const environment = String(body.environment || body.env || 'uat').toLowerCase();
      const normalizedEnvironment: 'uat' | 'production' = environment === 'production' || environment === 'live' ? 'production' : 'uat';
      const generated = createApiKey(normalizedEnvironment === 'production' ? 'live' : 'sandbox');
      const apiKey = {
        id: crypto.randomUUID(),
        client_id: clientId,
        api_id: apiId,
        label: String(body.label || '').trim() || `${api.name} key`,
        environment: normalizedEnvironment,
        key_prefix: generated.prefix,
        key_hash: generated.hash,
        client_visible_key: generated.key,
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

    if (action === 'set_key_status') {
      const keyId = String(body.key_id || '').trim();
      const status = String(body.status || '').trim().toLowerCase() === 'active' ? 'active' : 'inactive';
      if (!keyId) return jsonError('API key is required');
      store.keys = store.keys.map((key) => key.id === keyId ? { ...key, status } : key);
      await saveApiHubStore(auth.supabase, rowId, store);
      return NextResponse.json({ success: true, status });
    }

    if (action === 'delete_key') {
      const keyId = String(body.key_id || '').trim();
      if (!keyId) return jsonError('API key is required');
      store.keys = store.keys.filter((key) => key.id !== keyId);
      await saveApiHubStore(auth.supabase, rowId, store);
      return NextResponse.json({ success: true });
    }

    if (action === 'delete_uat_keys') {
      const clientId = String(body.client_id || '').trim();
      const before = store.keys.length;
      store.keys = store.keys.filter((key) => {
        const isUat = key.environment !== 'production';
        const matchesClient = clientId ? key.client_id === clientId : true;
        return !(isUat && matchesClient);
      });
      await saveApiHubStore(auth.supabase, rowId, store);
      return NextResponse.json({ success: true, deleted_count: before - store.keys.length });
    }

    if (action === 'update_ticket') {
      const ticketId = String(body.ticket_id || '').trim();
      if (!ticketId) return jsonError('Ticket is required');
      const rawStatus = String(body.status || '');
      const status = ['open', 'in_progress', 'resolved', 'closed'].includes(rawStatus)
        ? rawStatus as 'open' | 'in_progress' | 'resolved' | 'closed'
        : undefined;
      const existing = (store.tickets || []).find((ticket) => ticket.id === ticketId);
      if (!existing) return jsonError('Ticket not found', 404);
      const shouldNotifyClient = Boolean(
        status &&
        status !== existing.status &&
        ['resolved', 'closed'].includes(status),
      );
      store.tickets = (store.tickets || []).map((ticket) => ticket.id === ticketId
        ? {
          ...ticket,
          status: status || ticket.status,
          internal_note: body.internal_note !== undefined ? String(body.internal_note || '') : ticket.internal_note || null,
          last_response: body.last_response !== undefined ? String(body.last_response || '') : ticket.last_response || null,
          updated_at: new Date().toISOString(),
        }
        : ticket);
      await saveApiHubStore(auth.supabase, rowId, store);
      const updatedTicket = store.tickets.find((ticket) => ticket.id === ticketId);
      const client = store.clients.find((item) => item.id === updatedTicket?.client_id);
      const emailResult = shouldNotifyClient && updatedTicket
        ? await notifyTicketStatusUpdate(updatedTicket, client?.name || updatedTicket.client_name || 'API client')
        : null;
      if (emailResult && !emailResult.success) console.warn('[admin-api-hub] ticket status email failed:', emailResult.error);
      return NextResponse.json({
        success: true,
        ticket: updatedTicket,
        email_sent: emailResult?.success || false,
        email_error: emailResult && !emailResult.success ? emailResult.error : undefined,
      });
    }

    return jsonError('Unknown API Hub action');
  } catch (error) {
    console.error('[admin-api-hub] POST failed:', error);
    return jsonError('Unable to process API Hub request', 500);
  }
}
