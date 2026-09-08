import { NextRequest, NextResponse } from 'next/server';
import { getApiHubStore, hitMasterApi } from '@/lib/api-hub/simple-store';
import { findB2cApis, type CibilPayload } from '@/lib/b2c/prefill';
import { requireB2cSession, setB2cSession } from '@/lib/b2c/security';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  buildB2cReportRedirectUrl,
  buildWhatsAppTrackingUrl,
  createWhatsAppTrackingToken,
} from '@/lib/whatsapp/analytics';
import { sendWhatsAppTemplate } from '@/lib/whatsapp/cloud-api';

export const runtime = 'nodejs';
export const maxDuration = 60;

type AnyRecord = Record<string, unknown>;

function record(value: unknown): AnyRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as AnyRecord : {};
}

function providerResult(raw: unknown) {
  const response = record(raw);
  const normalized = record(response.data);
  const body = record(record(response.raw).body);
  const control = record(body.controlData);
  const errors = Array.isArray(control.errorResponseArray) ? control.errorResponseArray.map(record) : [];
  const status = String(normalized.status ?? '').trim().toLowerCase();
  const providerError = errors.map((item) => String(item.errorMessage ?? '').trim()).find(Boolean);
  const providerCode = errors.map((item) => String(item.errorCode ?? '').trim()).find(Boolean);

  if (status === 'provider_error' || control.success === false) {
    return {
      accepted: false,
      error: [providerCode, providerError].filter(Boolean).join(': ') || 'Bureau provider rejected the request',
    };
  }

  if (status === 'no_hit') return { accepted: true, error: null };
  if (status === 'success' && body.consumerCreditData) return { accepted: true, error: null };
  if (body.consumerCreditData) return { accepted: true, error: null };

  return { accepted: false, error: 'Bureau provider response did not include report data' };
}

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

function reportReadyBodyValues(input: {
  fullName?: string | null;
  reportId: string;
  trackingUrl: string;
}) {
  const raw = process.env.WHATSAPP_B2C_REPORT_READY_BODY_VALUES || '';
  if (!raw.trim()) return [];
  return raw
    .split('|')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => value
      .replace(/\{name\}/gi, input.fullName || 'Customer')
      .replace(/\{report_id\}/gi, input.reportId)
      .replace(/\{tracking_url\}/gi, input.trackingUrl)
      .replace(/\{link\}/gi, input.trackingUrl));
}

async function sendReportReadyWhatsApp(params: {
  supabase: ReturnType<typeof createAdminClient>;
  requestId: string;
  mobile?: string | null;
  fullName?: string | null;
  reportId: string;
}) {
  const templateName = process.env.WHATSAPP_B2C_REPORT_READY_TEMPLATE || '';
  if (!templateName || !params.mobile) return;

  const trackingToken = createWhatsAppTrackingToken('rpt');
  const trackingUrl = buildWhatsAppTrackingUrl(trackingToken);
  const urlButtonMode = (process.env.WHATSAPP_B2C_REPORT_READY_URL_BUTTON_MODE || 'token').toLowerCase();
  const urlButtonValue = urlButtonMode === 'full_url' ? trackingUrl : trackingToken;
  const includeUrlButton = urlButtonMode !== 'none';

  const result = await sendWhatsAppTemplate({
    to: params.mobile,
    templateName,
    languageCode: process.env.WHATSAPP_B2C_REPORT_READY_LANGUAGE || undefined,
    bodyValues: reportReadyBodyValues({
      fullName: params.fullName,
      reportId: params.reportId,
      trackingUrl,
    }),
    ...(includeUrlButton ? { urlButtonValues: [urlButtonValue] } : {}),
    analytics: {
      supabase: params.supabase,
      customerId: params.requestId,
      customerSource: 'b2c_report_requests',
      reportRequestId: params.requestId,
      campaignName: 'b2c_report_ready',
      campaignType: 'utility',
      trackingToken,
      redirectUrl: buildB2cReportRedirectUrl(params.requestId),
      metadata: {
        source: 'customer_report_generate',
        report_id: params.reportId,
      },
    },
  });

  if (!result.success) {
    console.warn('[customer-report/generate] report-ready WhatsApp failed:', {
      status: result.status,
      error: result.error,
    });
  }
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
      .select('id,status,full_name,mobile,report_id,report_json,consent_given,otp_verified_at,payment_verified_at,prefill_payload')
      .eq('id', requestId)
      .maybeSingle();
    if (readError) throw readError;
    if (!existing?.consent_given || !existing.otp_verified_at || !existing.payment_verified_at || !existing.prefill_payload) {
      return NextResponse.json({ success: false, error: 'Complete consent, OTP, payment and profile verification first.' }, { status: 409 });
    }
    if (existing.status === 'report_generated' && existing.report_json) {
      const response = NextResponse.json({ success: true, request_id: requestId, report_id: existing.report_id, ready: true });
      setB2cSession(response, requestId);
      return response;
    }
    if (existing.status === 'report_generating') {
      const response = NextResponse.json({ success: true, request_id: requestId, ready: false, processing: true }, { status: 202 });
      setB2cSession(response, requestId);
      return response;
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
    const provider = providerResult(result.data);
    if (!result.ok || !provider.accepted) {
      const apiError = provider.error || 'Bureau provider could not generate the report';
      await supabase.from('b2c_report_requests').update({
        status: 'report_failed',
        api_request_json: payload,
        api_response_json: result.data,
        api_status: String(result.status),
        api_error: apiError,
        updated_at: new Date().toISOString(),
      }).eq('id', requestId);
      console.error('[customer-report/generate] provider rejected request', { requestId, apiError });
      const response = NextResponse.json({ success: false, request_id: requestId, error: 'Your report could not be generated right now. Please try again.' }, { status: 502 });
      setB2cSession(response, requestId);
      return response;
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

    await sendReportReadyWhatsApp({
      supabase,
      requestId,
      mobile: existing.mobile,
      fullName: existing.full_name,
      reportId,
    });

    const response = NextResponse.json({ success: true, request_id: requestId, report_id: reportId, ready: true });
    setB2cSession(response, requestId);
    return response;
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
