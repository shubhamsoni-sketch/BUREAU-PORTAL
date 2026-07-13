import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[admin-partners-list] Missing Supabase env vars');
    return NextResponse.json({ success: false, error: 'Server configuration error', data: [] }, { status: 200 });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabaseAdmin
      .from('partners')
      .select('id, partner_code, name, email, mobile, city, status, wallet_balance, reports_pulled, pricing_plan, product_access, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[admin-partners-list] fetch error:', error);
      return NextResponse.json({ success: false, error: error.message, data: [] }, { status: 200 });
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (err: any) {
    console.error('[admin-partners-list] unexpected error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Unexpected error', data: [] }, { status: 200 });
  }
}
