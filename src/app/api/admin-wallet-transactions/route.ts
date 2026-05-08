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
    const partnerId = searchParams.get('partner_id');

    if (!partnerId) {
      return NextResponse.json({ error: 'partner_id is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
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
