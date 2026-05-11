import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    let query = supabaseAdmin.from('b2c_report_requests').select('*').order('created_at', { ascending: false });
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59');

    const { data, error } = await query;
    if (error) {
      console.error('[admin-b2c-reports] query error:', error);
      return NextResponse.json({ success: true, reports: [], warning: error.message });
    }

    return NextResponse.json({ success: true, reports: data ?? [] });
  } catch (error: any) {
    console.error('[admin-b2c-reports] unexpected error:', error);
    return NextResponse.json({ success: true, reports: [], warning: error?.message ?? 'Unexpected error' });
  }
}
