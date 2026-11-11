import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const ENDPOINT = 'https://optim.co.in/custom_api/';
const TIMEOUT_MS = 35_000;

function value(input: unknown) {
  return typeof input === 'string' ? input.trim() : '';
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if ('error' in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const publicKey = process.env.CIBIL_V1_DTC_PUBLIC_KEY;
  const secretKey = process.env.CIBIL_V1_DTC_SECRET_KEY;
  if (!publicKey || !secretKey) {
    return NextResponse.json({ success: false, error: 'CIBIL V1 DTC credentials are not configured.' }, { status: 503 });
  }

  let input: Record<string, unknown>;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON request.' }, { status: 400 });
  }

  const payload = {
    cust_fname: value(input.cust_fname),
    cust_mname: value(input.cust_mname),
    cust_lname: value(input.cust_lname),
    cust_pan: value(input.cust_pan).toUpperCase(),
    cust_phone: value(input.cust_phone).replace(/\D/g, ''),
  };

  if (!payload.cust_fname || !payload.cust_lname || !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(payload.cust_pan) || !/^[6-9][0-9]{9}$/.test(payload.cust_phone)) {
    return NextResponse.json({ success: false, error: 'Enter first and last name, a valid PAN, and a 10-digit mobile number.' }, { status: 400 });
  }

  const form = new FormData();
  form.set('request', 'request_crv1');
  form.set('server_data', '');
  form.set('payload', JSON.stringify(payload));
  form.set('api_public_key', publicKey);
  form.set('api_secret_key', secretKey);

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      body: form,
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const raw = await response.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(raw);
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Not an object');
    } catch {
      return NextResponse.json({ success: false, error: 'Provider returned a non-JSON response. Do not retry until its processing status is checked.' }, { status: 502 });
    }

    const provider = data.provider_response as Record<string, unknown> | undefined;
    const wrapper = provider?.response as Record<string, unknown> | undefined;
    const assets = wrapper?.GetCustomerAssetsResponse as Record<string, unknown> | undefined;
    const responseBody = data.response as Record<string, unknown> | undefined;
    const topLevelAssets = responseBody?.GetCustomerAssetsResponse as Record<string, unknown> | undefined;
    const directAssets = data.GetCustomerAssetsResponse as Record<string, unknown> | undefined;
    const businessStatus = assets?.ResponseStatus ?? topLevelAssets?.ResponseStatus ?? directAssets?.ResponseStatus;
    const topLevelSuccess = data.success === true;
    const successful = response.ok && topLevelSuccess && businessStatus === 'Success';

    return NextResponse.json({
      success: successful,
      httpStatus: response.status,
      businessStatus: businessStatus ?? null,
      error: successful ? null : value(data.error) || 'Report not generated. Review the provider response before retrying.',
      result: data,
    }, { status: successful ? 200 : 422, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Provider request timed out or could not connect. It may still have processed the request; check status before retrying.' }, { status: 504 });
  }
}
