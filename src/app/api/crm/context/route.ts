import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveCrmScope } from '@/lib/crm/scope';

type WalletTxn = {
  type: 'credit' | 'debit' | string;
  amount: number | string | null;
  status?: string | null;
};

function isPending(status?: string | null) {
  return String(status || '').toLowerCase() === 'pending';
}

async function findPartner(supabase: ReturnType<typeof createAdminClient>, partnerId: string | null, userId: string | null) {
  const fields =
    'id, user_id, partner_code, name, company_name, email, mobile, city, status, wallet_balance, reports_pulled, pricing_plan, created_at';

  if (partnerId) {
    const { data, error } = await supabase.from('partners').select(fields).eq('id', partnerId).maybeSingle();
    if (error) throw error;
    return data;
  }

  if (userId) {
    const { data, error } = await supabase.from('partners').select(fields).eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return data;
  }

  const approved = await supabase
    .from('partners')
    .select(fields)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (approved.error) throw approved.error;
  if (approved.data) return approved.data;

  const fallback = await supabase
    .from('partners')
    .select(fields)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fallback.error) throw fallback.error;
  return fallback.data;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supabase = createAdminClient();
    const scope = await resolveCrmScope(request, supabase);
    const partner = await findPartner(
      supabase,
      searchParams.get('partner_id') || scope.partnerId,
      searchParams.get('user_id') || scope.userId
    );

    if (!partner) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No partner onboarding record found yet',
      });
    }

    const [
      transactionsResult,
      invoicesResult,
      agreementResult,
      commercialsResult,
    ] = await Promise.all([
      supabase
        .from('wallet_transactions')
        .select('id, created_at, type, amount, description, transaction_type, running_balance, status, metadata')
        .eq('partner_id', partner.id)
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('invoices')
        .select('*')
        .eq('partner_id', partner.id)
        .order('issued_at', { ascending: false })
        .limit(100),
      supabase
        .from('partner_agreements')
        .select('*')
        .eq('partner_id', partner.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('partner_commercials')
        .select('partner_id, pricing_plan, subscription_type, consumer_credit_rate, commercial_credit_rate, bundled_credits, credit_limit, credit_rate, notes')
        .eq('partner_id', partner.id)
        .maybeSingle(),
    ]);

    if (transactionsResult.error) throw transactionsResult.error;
    if (invoicesResult.error) throw invoicesResult.error;
    if (agreementResult.error) throw agreementResult.error;
    if (commercialsResult.error) throw commercialsResult.error;

    const transactions = transactionsResult.data ?? [];
    const confirmedTransactions = transactions.filter((txn: WalletTxn) => !isPending(txn.status));
    const balanceFromLedger = confirmedTransactions.reduce((sum: number, txn: WalletTxn) => {
      const amount = Number(txn.amount || 0);
      return txn.type === 'credit' ? sum + amount : sum - amount;
    }, 0);
    const totalRecharged = confirmedTransactions
      .filter((txn: WalletTxn) => txn.type === 'credit')
      .reduce((sum: number, txn: WalletTxn) => sum + Number(txn.amount || 0), 0);
    const totalDeducted = confirmedTransactions
      .filter((txn: WalletTxn) => txn.type === 'debit')
      .reduce((sum: number, txn: WalletTxn) => sum + Number(txn.amount || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        partner,
        scope,
        wallet: {
          balance: transactions.length ? Math.max(0, balanceFromLedger) : Number(partner.wallet_balance || 0),
          adminBalance: Number(partner.wallet_balance || 0),
          totalRecharged,
          totalDeducted,
          transactions,
        },
        invoices: invoicesResult.data ?? [],
        agreement: agreementResult.data ?? null,
        commercials: commercialsResult.data ?? null,
      },
    });
  } catch (err: any) {
    console.error('[crm/context] unexpected error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Unable to load CRM context' },
      { status: 500 }
    );
  }
}
