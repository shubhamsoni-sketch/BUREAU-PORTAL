import { NextRequest, NextResponse } from 'next/server';
import { getApiHubStore } from '@/lib/api-hub/simple-store';
import { buildCibilPayload, findB2cApis, hitPrefill, prefillPreview, validateCibilPayload } from '@/lib/b2c/prefill';
import { requireB2cSession } from '@/lib/b2c/security';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const requestId = String(body.request_id ?? '').trim();
    if (!requireB2cSession(request, requestId)) {
      return NextResponse.json({ success: false, error: 'This report session has expired.' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: reportRequest, error: requestError } = await supabase
      .from('b2c_report_requests')
      .select('id,mobile,consent_given,otp_verified_at,payment_verified_at,prefill_payload')
      .eq('id', requestId)
      .maybeSingle();
    if (requestError) throw requestError;
    if (!reportRequest?.consent_given || !reportRequest.otp_verified_at || !reportRequest.payment_verified_at) {
      return NextResponse.json({ success: false, error: 'Payment must be verified before fetching profile details.' }, { status: 409 });
    }

    if (reportRequest.prefill_payload) {
      return NextResponse.json({ success: true, profile: prefillPreview(reportRequest.prefill_payload) });
    }

    const { store } = await getApiHubStore(supabase);
    const { prefill } = findB2cApis(store.apis);
    if (!prefill?.master_url || !prefill.auth_token) {
      throw new Error('Mobile prefill API is not configured');
    }

    const result = await hitPrefill(prefill, reportRequest.mobile, `ct-b2c-${requestId}`);
    if (!result.ok) {
      await supabase.from('b2c_report_requests').update({
        status: 'prefill_failed',
        api_status: String(result.status),
        api_error: 'Unable to retrieve profile details',
        prefill_json: result.data,
        updated_at: new Date().toISOString(),
      }).eq('id', requestId);
      return NextResponse.json({ success: false, error: 'Unable to retrieve profile details for this mobile number.' }, { status: 422 });
    }

    const payload = buildCibilPayload(result.data, reportRequest.mobile);
    const validationError = validateCibilPayload(payload);
    if (validationError) {
      await supabase.from('b2c_report_requests').update({
        status: 'prefill_incomplete',
        api_error: validationError,
        prefill_json: result.data,
        prefill_payload: payload,
        updated_at: new Date().toISOString(),
      }).eq('id', requestId);
      return NextResponse.json({ success: false, error: 'We could not retrieve complete profile details for this mobile number.' }, { status: 422 });
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabase.from('b2c_report_requests').update({
      first_name: payload.firstName,
      last_name: payload.lastName,
      full_name: `${payload.firstName} ${payload.lastName}`.trim(),
      pan: payload.pan,
      dob: payload.dob,
      gender: payload.gender,
      address: payload.address,
      state: payload.state,
      pin_code: payload.pincode,
      prefill_json: result.data,
      prefill_payload: payload,
      status: 'prefill_review',
      api_error: null,
      updated_at: now,
    }).eq('id', requestId);
    if (updateError) throw updateError;

    return NextResponse.json({ success: true, profile: prefillPreview(payload) });
  } catch (error) {
    console.error('[customer-report/prefill]', error);
    return NextResponse.json({ success: false, error: 'Unable to retrieve profile details.' }, { status: 500 });
  }
}
