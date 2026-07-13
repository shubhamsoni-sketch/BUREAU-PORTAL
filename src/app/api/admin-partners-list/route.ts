import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(bearerToken(req));
  if ('error' in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const { data, error } = await auth.supabase
      .from('partners')
      .select('id, partner_code, name, email, mobile, city, status, wallet_balance, reports_pulled, pricing_plan, product_access, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[admin-partners-list] fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (err: any) {
    console.error('[admin-partners-list] unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
