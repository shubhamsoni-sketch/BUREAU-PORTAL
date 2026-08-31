import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { otpHash, requireB2cSession } from '@/lib/b2c/security';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const requestId = String(body.request_id ?? '').trim();
    const otp = String(body.otp ?? '').replace(/\D/g, '');
    if (!requireB2cSession(request, requestId)) {
      return NextResponse.json({ success: false, error: 'This report session has expired.' }, { status: 401 });
    }
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json({ success: false, error: 'Enter the 6-digit OTP.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: challenge } = await supabase
      .from('b2c_otp_challenges')
      .select('*')
      .eq('request_id', requestId)
      .in('status', ['sent', 'created'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!challenge || new Date(challenge.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ success: false, error: 'OTP has expired. Request a new OTP.' }, { status: 410 });
    }
    if (challenge.attempts >= challenge.max_attempts) {
      return NextResponse.json({ success: false, error: 'Too many incorrect attempts. Request a new OTP.' }, { status: 429 });
    }

    const expected = Buffer.from(challenge.otp_hash, 'hex');
    const received = Buffer.from(otpHash(requestId, otp), 'hex');
    const matches = expected.length === received.length && timingSafeEqual(expected, received);
    const attempts = Number(challenge.attempts || 0) + 1;
    if (!matches) {
      await supabase.from('b2c_otp_challenges').update({ attempts, updated_at: new Date().toISOString() }).eq('id', challenge.id);
      return NextResponse.json({ success: false, error: 'Incorrect OTP.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    await Promise.all([
      supabase.from('b2c_otp_challenges').update({ attempts, status: 'verified', verified_at: now, updated_at: now }).eq('id', challenge.id),
      supabase.from('b2c_report_requests').update({ status: 'otp_verified', otp_verified_at: now, updated_at: now }).eq('id', requestId),
    ]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[customer-report/verify-otp]', error);
    return NextResponse.json({ success: false, error: 'Unable to verify OTP.' }, { status: 500 });
  }
}
