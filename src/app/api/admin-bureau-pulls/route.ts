'use server';

import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(bearerToken(req));
  if ('error' in auth) {
    return NextResponse.json({ success: false, error: auth.error, pulls: [] }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // Fetch all bureau pulls with partner info joined
    let query = auth.supabase
      .from('bureau_pulls')
      .select(`
        *,
        partners (
          id,
          company_name,
          partner_code
        )
      `)
      .order('created_at', { ascending: false });

    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59');

    const { data, error } = await query;

    if (error) {
      console.error('[admin-bureau-pulls] fetch error:', error);
      return NextResponse.json({ error: error.message, pulls: [] }, { status: 500 });
    }

    // Flatten partner info into each pull
    const pulls = (data ?? []).map((row: any) => ({
      ...row,
      partner_name: row.partners?.company_name ?? row.partners?.partner_code ?? 'Unknown',
      partner_code: row.partners?.partner_code ?? null,
    }));

    return NextResponse.json({ success: true, pulls });
  } catch (err: any) {
    console.error('[admin-bureau-pulls] unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error', pulls: [] }, { status: 500 });
  }
}
