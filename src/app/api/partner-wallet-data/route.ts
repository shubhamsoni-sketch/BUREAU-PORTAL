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

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // 1. Get partner row by user_id
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('id, wallet_balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // 2. Get all wallet transactions
    const { data: allTxns, error: txnError } = await supabaseAdmin
      .from('wallet_transactions')
      .select('id, created_at, type, amount, description, transaction_type, running_balance, status, metadata')
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false })
      .limit(200);

    if (txnError) {
      console.error('[partner-wallet-data] txn fetch error:', txnError);
    }

    const txns = allTxns ?? [];

    // 3. Calculate balance from confirmed transactions only
    const confirmedBalance = txns.reduce((sum, t) => {
      if (t.status === 'pending') return sum;
      return t.type === 'credit' ? sum + Number(t.amount) : sum - Number(t.amount);
    }, 0);

    const totalRecharged = txns
      .filter((t) => t.type === 'credit' && t.status !== 'pending')
      .reduce((s, t) => s + Number(t.amount), 0);

    const totalDeducted = txns
      .filter((t) => t.type === 'debit')
      .reduce((s, t) => s + Number(t.amount), 0);

    // 4. Get commercials
    const { data: comm } = await supabaseAdmin
      .from('partner_commercials')
      .select('pricing_plan, subscription_type, consumer_credit_rate, commercial_credit_rate, bundled_credits, credit_limit, credit_rate')
      .eq('partner_id', partner.id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      partnerId: partner.id,
      balance: Math.max(0, confirmedBalance),
      totalRecharged,
      totalDeducted,
      transactions: txns,
      commercials: comm ?? null,
    });
  } catch (err: any) {
    console.error('[partner-wallet-data] unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
