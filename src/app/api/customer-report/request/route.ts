import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

function fullName(body: any) {
  return [body.first_name, body.middle_name, body.last_name].map((v) => String(v ?? '').trim()).filter(Boolean).join(' ');
}

function demoRequest(requestId: string, payload: Record<string, any>) {
  return {
    id: requestId || `demo_${Date.now()}`,
    ...payload,
    demo_mode: true,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const requestId = String(body.request_id ?? '').trim();
    const stage = String(body.stage ?? 'mobile_started');
    const mobile = String(body.mobile ?? '').trim();

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json({ error: 'Valid mobile number is required' }, { status: 400 });
    }

    const payload: Record<string, any> = {
      mobile,
      status: stage,
      updated_at: new Date().toISOString(),
    };

    if (body.first_name !== undefined) payload.first_name = String(body.first_name ?? '').trim();
    if (body.middle_name !== undefined) payload.middle_name = String(body.middle_name ?? '').trim();
    if (body.last_name !== undefined) payload.last_name = String(body.last_name ?? '').trim();
    if (body.first_name !== undefined || body.middle_name !== undefined || body.last_name !== undefined) payload.full_name = fullName(body);
    if (body.email !== undefined) payload.email = String(body.email ?? '').trim().toLowerCase();
    if (body.pan !== undefined) payload.pan = String(body.pan ?? '').trim().toUpperCase();
    if (body.dob !== undefined) payload.dob = body.dob || null;
    if (body.gender !== undefined) payload.gender = String(body.gender ?? '').trim();
    if (body.address !== undefined) payload.address = String(body.address ?? '').trim();
    if (body.state !== undefined) payload.state = String(body.state ?? '').trim();
    if (body.pin_code !== undefined) payload.pin_code = String(body.pin_code ?? '').trim();
    if (body.consent_given !== undefined) {
      payload.consent_given = Boolean(body.consent_given);
      payload.consent_at = body.consent_given ? new Date().toISOString() : null;
    }
    if (body.report_id !== undefined) payload.report_id = String(body.report_id ?? '').trim();
    if (body.credit_score !== undefined) payload.credit_score = body.credit_score;
    if (body.report_json !== undefined) payload.report_json = body.report_json;

    const query = requestId
      ? supabaseAdmin.from('b2c_report_requests').update(payload).eq('id', requestId).select('*').single()
      : supabaseAdmin.from('b2c_report_requests').insert(payload).select('*').single();

    const { data, error } = await query;

    if (error) {
      console.error('[customer-report/request] db error:', error);
      return NextResponse.json({
        success: true,
        request: demoRequest(requestId, payload),
        warning: error.message,
      });
    }

    return NextResponse.json({ success: true, request: data });
  } catch (error: any) {
    console.error('[customer-report/request] unexpected error:', error);
    return NextResponse.json({
      success: true,
      request: { id: `demo_${Date.now()}`, demo_mode: true },
      warning: error?.message ?? 'Unable to save request',
    });
  }
}
