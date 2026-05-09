import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireUser } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const auth = await requireUser(bearerToken(request));
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { agreementId, consent } = await request.json();
    if (!agreementId || consent !== true) {
      return NextResponse.json({ error: 'Agreement consent is required' }, { status: 400 });
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      null;

    const { data, error } = await auth.supabase
      .from('partner_agreements')
      .update({
        status: 'signed',
        signed_at: new Date().toISOString(),
        signed_ip: ip,
        signed_user_agent: request.headers.get('user-agent'),
        updated_at: new Date().toISOString(),
      })
      .eq('id', agreementId)
      .eq('user_id', auth.user.id)
      .eq('status', 'pending')
      .select()
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Pending agreement not found' }, { status: 404 });

    return NextResponse.json({ success: true, agreement: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
