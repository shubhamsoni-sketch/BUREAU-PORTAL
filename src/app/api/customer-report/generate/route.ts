import { NextRequest, NextResponse } from 'next/server';
import { getApiHubStore, hitMasterApi } from '@/lib/api-hub/simple-store';
import { findB2cApis, type CibilPayload } from '@/lib/b2c/prefill';
import { requireB2cSession } from '@/lib/b2c/security';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 60;

function scoreFrom(raw: unknown): number | null {
  const seen = new Set<unknown>();
  const visit = (value: unknown): number | null => {
    if (!value || typeof value !== 'object' || seen.has(value)) return null;
    seen.add(value);
    if (Array.isArray(value)) {
      for (const item of value) {
        const score = visit(item);
        if (score !== null) return score;
      }
      return null;
    }
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (/^(score|creditScore|bureauScore)$/i.test(key)) {
        const parsed = Number(nested);
        if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 999) return parsed;
      }
    }
    for (const nested of Object.values(value as Record<string, unknown>)) {
      const score = visit(nested);
      if (score !== null) return score;
    }
    return null;
  };
  return visit(raw);
}

function reportReference() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `CTF-${date}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const requestId = String(body.request_id ?? '').trim();
  if (!requireB2cSession(request, requestId)) {
    return NextResponse.json({ success: false, error: 'This report session has expired.' }, { status: 401 });
  }

  const supabase = createAdminClient();
  try {
    const { data: existing, error: readError } = await supabase
      .from('b2c_report_requests')
      .select('id,status,report_id,report_json,consent_given,otp_verified_at,payment_verified_at,prefill_payload')
      .eq('id', requestId)
      .maybeSingle();
    if (readError) throw readError;
    if (!existing?.consent_given || !existing.otp_verified_at || !existing.payment_verified_at || !existing.prefill_payload) {
      return NextResponse.json({ success: false, error: 'Complete consent, OTP, payment and profile verification first.' }, { status: 409 });
    }
    if (existing.status === 'report_generated' && existing.report_json) {
      return NextResponse.json({ success: true, report_id: existing.report_id, ready: true });
    }
    if (existing.status === 'report_generating') {
      return NextResponse.json({ success: true, ready: false, processing: true }, { status: 202 });
    }

    const now = new Date().toISOString();
    const { data: locked, error: lockError } = await supabase
      .from('b2c_report_requests')
      .update({ status: 'report_generating', prefill_confirmed_at: now, generation_started_at: now, updated_at: now })
      .eq('id', requestId)
      .in('status', ['prefill_review', 'report_failed'])
      .select('id')
      .maybeSingle();
    if (lockError) throw lockError;
    if (!locked) {
      return NextResponse.json({ success: false, error: 'The report is already being processed.' }, { status: 409 });
    }

    const { store } = await getApiHubStore(supabase);
    const { bureau } = findB2cApis(store.apis);
    if (!bureau?.master_url || !bureau.auth_token) throw new Error('Bureau API is not configured');

    const payload = existing.prefill_payload as CibilPayload;
    const result = await hitMasterApi(bureau, payload);
    if (!result.ok) {
      await supabase.from('b2c_report_requests').update({
        status: 'report_failed',
        api_request_json: payload,
        api_response_json: result.data,
        api_status: String(result.status),
        api_error: 'Bureau provider could not generate the report',
        updated_at: new Date().toISOString(),
      }).eq('id', requestId);
      return NextResponse.json({ success: false, error: 'Your report could not be generated right now. Please try again.' }, { status: 502 });
    }

    const reportId = reportReference();
    const { error: saveError } = await supabase.from('b2c_report_requests').update({
      status: 'report_generated',
      report_id: reportId,
      report_json: result.data,
      api_request_json: payload,
      api_response_json: result.data,
      api_status: String(result.status),
      api_error: null,
      credit_score: scoreFrom(result.data),
      updated_at: new Date().toISOString(),
    }).eq('id', requestId);
    if (saveError) throw saveError;

    return NextResponse.json({ success: true, report_id: reportId, ready: true });
  } catch (error) {
    console.error('[customer-report/generate]', error);
    await supabase.from('b2c_report_requests').update({
      status: 'report_failed',
      api_error: error instanceof Error ? error.message : 'Report generation failed',
      updated_at: new Date().toISOString(),
    }).eq('id', requestId).eq('status', 'report_generating');
    return NextResponse.json({ success: false, error: 'Your report could not be generated right now.' }, { status: 500 });
  }
}
