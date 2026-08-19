import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireUser } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const auth = await requireUser(bearerToken(req));
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const supabaseAdmin = auth.supabase;

    // 1. Get partner row by user_id
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('id, wallet_balance, reports_pulled')
      .eq('user_id', auth.user.id)
      .maybeSingle();

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // 2. Read the materialized wallet balance and recent transactions separately.
    // Recent transactions are intentionally capped for the UI and must not be
    // used to reconstruct the complete wallet balance.
    const [walletResult, transactionsResult] = await Promise.all([
      supabaseAdmin
        .from('wallet_balances')
        .select('balance, total_recharged, total_deducted')
        .eq('partner_id', partner.id)
        .maybeSingle(),
      supabaseAdmin
        .from('wallet_transactions')
        .select('id, created_at, type, amount, description, transaction_type, running_balance, status, metadata')
        .eq('partner_id', partner.id)
        .order('created_at', { ascending: false })
        .limit(200),
    ]);

    const { data: walletBalance, error: walletError } = walletResult;
    const { data: allTxns, error: txnError } = transactionsResult;

    if (walletError) {
      console.error('[partner-wallet-data] wallet balance fetch error:', walletError);
    }

    if (txnError) {
      console.error('[partner-wallet-data] txn fetch error:', txnError);
    }

    const txns = allTxns ?? [];

    // 3. wallet_balances is maintained from the complete ledger. Fall back to
    // partners.wallet_balance for legacy partners without a materialized row.
    const currentBalance = Number(walletBalance?.balance ?? partner.wallet_balance ?? 0);
    const totalRecharged = Number(walletBalance?.total_recharged ?? 0);
    const totalDeducted = Number(walletBalance?.total_deducted ?? 0);

    // 4. Get commercials
    const { data: comm } = await supabaseAdmin
      .from('partner_commercials')
      .select('pricing_plan, subscription_type, consumer_credit_rate, commercial_credit_rate, bundled_credits, credit_limit, credit_rate')
      .eq('partner_id', partner.id)
      .maybeSingle();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
      { count: totalReportsCount },
      { count: reportsPulledToday },
      { data: weeklyPulls },
      { data: recentReports },
    ] = await Promise.all([
      supabaseAdmin
        .from('bureau_pulls')
        .select('id', { count: 'exact', head: true })
        .eq('partner_id', partner.id),
      supabaseAdmin
        .from('bureau_pulls')
        .select('id', { count: 'exact', head: true })
        .eq('partner_id', partner.id)
        .gte('created_at', todayStart.toISOString()),
      supabaseAdmin
        .from('bureau_pulls')
        .select('created_at')
        .eq('partner_id', partner.id)
        .gte('created_at', sevenDaysAgo.toISOString()),
      supabaseAdmin
        .from('bureau_pulls')
        .select('id, customer_name, bureau, credit_score, created_at, report_type')
        .eq('partner_id', partner.id)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    return NextResponse.json({
      success: true,
      partnerId: partner.id,
      balance: Math.max(0, currentBalance),
      totalRecharged,
      totalDeducted,
      transactions: txns,
      commercials: comm ?? null,
      reportsPulled: totalReportsCount ?? partner.reports_pulled ?? 0,
      reportsPulledToday: reportsPulledToday ?? 0,
      weeklyPulls: weeklyPulls ?? [],
      recentReports: recentReports ?? [],
    });
  } catch (err: any) {
    console.error('[partner-wallet-data] unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
