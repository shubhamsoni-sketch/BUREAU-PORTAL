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
      balance: Math.max(0, confirmedBalance),
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
