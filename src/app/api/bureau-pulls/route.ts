import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireUser } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const auth = await requireUser(bearerToken(req));
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error, pulls: [] }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    const supabaseAdmin = auth.supabase;

    // Resolve partner_id from user_id using service role (bypasses RLS)
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('id')
      .eq('user_id', auth.user.id)
      .maybeSingle();

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Partner not found', pulls: [] }, { status: 404 });
    }

    let query = supabaseAdmin
      .from('bureau_pulls')
      .select('*')
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false });

    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59');

    const { data, error } = await query;

    if (error) {
      console.error('[bureau-pulls] fetch error:', error);
      return NextResponse.json({ error: error.message, pulls: [] }, { status: 500 });
    }

    return NextResponse.json({ success: true, pulls: data ?? [], partnerId: partner.id });
  } catch (err: any) {
    console.error('[bureau-pulls] unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error', pulls: [] }, { status: 500 });
  }
}
