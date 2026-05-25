import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createSandboxCibilResponse } from '@/lib/api-hub/demo';
import { hashApiKey, maskMobile, maskPan } from '@/lib/api-hub/keys';

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
};

function jsonError(message: string, status = 400, requestId?: string) {
  return NextResponse.json({ success: false, request_id: requestId, error: message }, { status });
}

function cleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizePayload(body: Record<string, unknown>): CibilPayload {
  return {
    firstName: cleanString(body.firstName).toUpperCase(),
    middleName: cleanString(body.middleName).toUpperCase(),
    lastName: cleanString(body.lastName).toUpperCase(),
    birthDate: cleanString(body.birthDate),
    gender: cleanString(body.gender),
    idNumber: cleanString(body.idNumber).toUpperCase(),
    stateCode: cleanString(body.stateCode),
    pinCode: cleanString(body.pinCode),
    telephoneNumber: cleanString(body.telephoneNumber),
  };
}

function validatePayload(payload: CibilPayload) {
  const required: Array<keyof CibilPayload> = ['firstName', 'lastName', 'birthDate', 'gender', 'idNumber', 'stateCode', 'pinCode', 'telephoneNumber'];
  const missing = required.filter((field) => !payload[field]);
  if (missing.length) return `Missing required fields: ${missing.join(', ')}`;
  if (!/^\d{8}$/.test(payload.birthDate)) return 'birthDate must be DDMMYYYY';
  if (!/^[123]$/.test(payload.gender)) return 'gender must be 1, 2, or 3';
  if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(payload.idNumber)) return 'idNumber must be a valid PAN format';
  if (!/^\d{6}$/.test(payload.pinCode)) return 'pinCode must be 6 digits';
  if (!/^\d{10}$/.test(payload.telephoneNumber)) return 'telephoneNumber must be 10 digits';
  return null;
}

async function callGateway(payload: CibilPayload, product: Record<string, any>) {
  const gatewayUrl = product.endpoint_url || process.env.API_HUB_GATEWAY_URL || process.env.BUREAU_API_URL;
  if (!gatewayUrl) throw new Error('API_HUB_GATEWAY_URL is not configured');

  const authHeaderName = product.auth_header_name || process.env.API_HUB_GATEWAY_AUTH_HEADER || process.env.BUREAU_API_AUTH_HEADER || 'token';
  const authToken = product.auth_secret || process.env.API_HUB_GATEWAY_TOKEN || process.env.BUREAU_API_AUTH_TOKEN;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers[authHeaderName] = authToken;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.API_HUB_GATEWAY_TIMEOUT_MS || 45000));

  try {
    const response = await fetch(gatewayUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const text = await response.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }
    if (!response.ok) {
      const message = typeof data === 'object' && data && 'error' in data ? String((data as { error: unknown }).error) : `Gateway failed with ${response.status}`;
      throw new Error(message);
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: NextRequest) {
  const requestId = `API-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const startedAt = Date.now();

  try {
    const apiKey = request.headers.get('x-api-key')?.trim();
    if (!apiKey) return jsonError('x-api-key header is required', 401, requestId);

    const supabase = createAdminClient();
    const { data: keyRecord, error: keyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', hashApiKey(apiKey))
      .eq('status', 'active')
      .maybeSingle();

    if (keyError) return jsonError(keyError.message, 500, requestId);
    if (!keyRecord) return jsonError('Invalid or inactive API key', 401, requestId);

    const [{ data: client }, { data: product }] = await Promise.all([
      supabase.from('api_clients').select('*').eq('id', keyRecord.client_id).maybeSingle(),
      supabase.from('api_products').select('*').eq('id', keyRecord.product_id).maybeSingle(),
    ]);

    if (!client || client.status !== 'active') return jsonError('Client is not active', 403, requestId);
    if (!product || product.is_active === false) return jsonError('API product is not active', 403, requestId);

    const body = await request.json();
    const payload = normalizePayload(body || {});
    const validationError = validatePayload(payload);
    if (validationError) return jsonError(validationError, 400, requestId);

    const environment = keyRecord.environment === 'live' ? 'live' : 'sandbox';
    const maskedRequest = {
      ...payload,
      idNumber: maskPan(payload.idNumber),
      telephoneNumber: maskMobile(payload.telephoneNumber),
    };

    await supabase.from('api_usage_logs').insert({
      client_id: client.id,
      api_key_id: keyRecord.id,
      product_id: product.id,
      environment,
      request_id: requestId,
      status: 'pending',
      charged: false,
      masked_pan: maskPan(payload.idNumber),
      masked_mobile: maskMobile(payload.telephoneNumber),
      raw_json: { request: maskedRequest },
    });

    if (environment === 'sandbox') {
      const responseData = createSandboxCibilResponse(payload, requestId);
      await supabase.from('api_usage_logs').update({
        status: 'success',
        charged: false,
        amount_charged: 0,
        sandbox_credits_charged: 0,
        response_time_ms: Date.now() - startedAt,
        raw_json: { request: maskedRequest, response: responseData },
      }).eq('request_id', requestId);
      await supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', keyRecord.id);

      return NextResponse.json({
        success: true,
        environment,
        request_id: requestId,
        charged: { sandbox_credits: 0, amount: 0 },
        data: responseData,
      });
    }

    try {
      const responseData = await callGateway(payload, product);
      await supabase.from('api_usage_logs').update({
        status: 'success',
        charged: false,
        amount_charged: 0,
        sandbox_credits_charged: 0,
        response_time_ms: Date.now() - startedAt,
        raw_json: { request: maskedRequest, response: responseData },
      }).eq('request_id', requestId);
      await supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', keyRecord.id);

      return NextResponse.json({
        success: true,
        environment,
        request_id: requestId,
        charged: { sandbox_credits: 0, amount: 0 },
        data: responseData,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gateway request failed';
      await supabase.from('api_usage_logs').update({
        status: 'failed',
        error_message: message,
        response_time_ms: Date.now() - startedAt,
        raw_json: { request: maskedRequest, error: message },
      }).eq('request_id', requestId);
      return jsonError(message, 502, requestId);
    }
  } catch (error) {
    console.error('[api-hub:cibil] unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unexpected API Hub error';
    return jsonError(message, 500, requestId);
  }
}
