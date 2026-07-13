import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(bearerToken(req));
  if ('error' in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const partnerId = searchParams.get('partner_id');

    if (!partnerId) {
      return NextResponse.json({ error: 'partner_id is required' }, { status: 400 });
    }

    const { data, error } = await auth.supabase
      .from('wallet_transactions')
      .select('id, partner_id, type, amount, description, transaction_type, status, running_balance, created_at')
      .eq('partner_id', partnerId)
      .neq('transaction_type', 'deduction')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[admin-wallet-transactions] query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (err: any) {
    console.error('[admin-wallet-transactions] unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
