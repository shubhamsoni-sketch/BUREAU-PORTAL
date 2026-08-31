import { randomInt } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { otpHash, requestIp, setB2cSession } from '@/lib/b2c/security';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendWhatsAppTemplate } from '@/lib/whatsapp/cloud-api';

export const runtime = 'nodejs';

const CONSENT_VERSION = 'b2c-financial-report-v1';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mobile = String(body.mobile ?? '').replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json({ success: false, error: 'Enter a valid 10-digit mobile number.' }, { status: 400 });
    }
    if (body.consent !== true) {
      return NextResponse.json({ success: false, error: 'Consent is required to request the report.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
    const { count } = await supabase
      .from('b2c_otp_challenges')
      .select('id', { count: 'exact', head: true })
      .eq('mobile', mobile)
      .gte('created_at', oneMinuteAgo);
    if ((count || 0) > 0) {
      return NextResponse.json({ success: false, error: 'Please wait one minute before requesting another OTP.' }, { status: 429 });
    }

    const now = new Date().toISOString();
    const { data: reportRequest, error: requestError } = await supabase
      .from('b2c_report_requests')
      .insert({
        mobile,
        consent_given: true,
        consent_at: now,
        consent_version: CONSENT_VERSION,
        consent_ip: requestIp(request),
        consent_user_agent: request.headers.get('user-agent'),
        status: 'otp_sending',
        updated_at: now,
      })
      .select('id')
      .single();
    if (requestError || !reportRequest) throw requestError || new Error('Unable to create report request');

    const otp = String(randomInt(100000, 1_000_000));
    const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
    const { data: challenge, error: challengeError } = await supabase
      .from('b2c_otp_challenges')
      .insert({
        request_id: reportRequest.id,
        mobile,
        otp_hash: otpHash(reportRequest.id, otp),
        expires_at: expiresAt,
      })
      .select('id')
      .single();
    if (challengeError || !challenge) throw challengeError || new Error('Unable to create OTP challenge');

    const templateName = process.env.WHATSAPP_B2C_OTP_TEMPLATE || '';
    if (!templateName) throw new Error('WhatsApp OTP template is not configured');
    const buttonType = (process.env.WHATSAPP_B2C_OTP_BUTTON_TYPE || 'copy_code').toLowerCase();
    const sent = await sendWhatsAppTemplate({
      to: mobile,
      templateName,
      languageCode: process.env.WHATSAPP_B2C_OTP_LANGUAGE || undefined,
      bodyValues: [otp],
      ...(buttonType === 'copy_code' ? { copyCodeButtonValues: [otp] } : {}),
      ...(buttonType === 'url' ? { urlButtonValues: [otp] } : {}),
    });
    if (!sent.success) {
      await Promise.all([
        supabase.from('b2c_otp_challenges').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', challenge.id),
        supabase.from('b2c_report_requests').update({ status: 'otp_failed', api_error: sent.error, updated_at: new Date().toISOString() }).eq('id', reportRequest.id),
      ]);
      return NextResponse.json({ success: false, error: 'Unable to send OTP on WhatsApp. Please try again.' }, { status: 502 });
    }

    await Promise.all([
      supabase.from('b2c_otp_challenges').update({ status: 'sent', sent_at: now, provider_message_id: sent.messageId, updated_at: now }).eq('id', challenge.id),
      supabase.from('b2c_report_requests').update({ status: 'otp_sent', updated_at: now }).eq('id', reportRequest.id),
    ]);

    const response = NextResponse.json({ success: true, request_id: reportRequest.id, expires_in_seconds: 600 });
    setB2cSession(response, reportRequest.id);
    return response;
  } catch (error) {
    console.error('[customer-report/start]', error);
    return NextResponse.json({ success: false, error: 'Unable to start the report request.' }, { status: 500 });
  }
}
