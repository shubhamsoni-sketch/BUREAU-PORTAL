import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireUser } from '@/lib/supabase/admin';

const BUCKET = 'partner-agreements';

export async function GET(request: NextRequest) {
  const auth = await requireUser(bearerToken(request));
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { data: partner, error: partnerError } = await auth.supabase
      .from('partners')
      .select('id, partner_code, name')
      .eq('user_id', auth.user.id)
      .maybeSingle();

    if (partnerError) return NextResponse.json({ error: partnerError.message }, { status: 500 });
    if (!partner) return NextResponse.json({ success: true, agreement: null, reason: 'partner_not_found' });

    const { data: agreement, error } = await auth.supabase
      .from('partner_agreements')
      .select('*')
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!agreement) return NextResponse.json({ success: true, agreement: null, reason: 'agreement_not_assigned', partner });

    const { data: signedUrl } = await auth.supabase.storage
      .from(BUCKET)
      .createSignedUrl(agreement.file_path, 60 * 30);

    return NextResponse.json({
      success: true,
      partner,
      agreement: {
        ...agreement,
        signed_url: signedUrl?.signedUrl ?? null,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
