import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { agreementId, status } = await request.json();
    if (!agreementId || !['pending', 'signed', 'expired', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Valid agreementId and status are required' }, { status: 400 });
    }

    const patch: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (status === 'signed') {
      patch.signed_at = new Date().toISOString();
      patch.signed_user_agent = 'admin-manual-override';
    }

    const { data, error } = await auth.supabase
      .from('partner_agreements')
      .update(patch)
      .eq('id', agreementId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
