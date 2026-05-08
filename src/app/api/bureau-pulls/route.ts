import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // Resolve partner_id from user_id using service role (bypasses RLS)
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('id')
      .eq('user_id', userId)
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
