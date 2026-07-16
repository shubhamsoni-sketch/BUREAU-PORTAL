import { sendTransactionalEmail } from './transactional';

type SupabaseLike = {
  from: (table: string) => any;
};

const PORTAL_LINK = 'https://portal.credittrust.in/partner-login';
const LOW_BALANCE_THRESHOLD = Number(process.env.LOW_WALLET_BALANCE_THRESHOLD ?? 500);
const LOW_BALANCE_COOLDOWN_HOURS = Number(process.env.LOW_WALLET_BALANCE_COOLDOWN_HOURS ?? 24);

export async function sendLowWalletBalanceEmailIfNeeded(params: {
  supabase: SupabaseLike;
  partnerId: string;
  userId?: string | null;
  partnerName: string;
  partnerEmail: string;
  walletBalance: number;
}) {
  if (!params.partnerEmail || params.walletBalance > LOW_BALANCE_THRESHOLD) {
    return { sent: false, reason: 'not_low' };
  }

  const since = new Date(Date.now() - LOW_BALANCE_COOLDOWN_HOURS * 60 * 60 * 1000).toISOString();
  const { data: recentLog, error: logFetchError } = await params.supabase
    .from('email_event_logs')
    .select('id')
    .eq('partner_id', params.partnerId)
    .eq('event_type', 'low_wallet_balance')
    .gte('created_at', since)
    .limit(1)
    .maybeSingle();

  if (!logFetchError && recentLog) {
    return { sent: false, reason: 'cooldown' };
  }

  if (logFetchError) {
    console.warn('[email] low wallet cooldown check failed:', logFetchError.message);
  }

  const result = await sendTransactionalEmail({
    to: params.partnerEmail,
    subject: 'Low Wallet Balance Alert',
    templateAlias: 'low-wallet-balance-alert',
    variables: {
      partner_name: params.partnerName,
      wallet_balance: params.walletBalance.toLocaleString('en-IN'),
      minimum_balance: LOW_BALANCE_THRESHOLD.toLocaleString('en-IN'),
      portal_link: PORTAL_LINK,
    },
  });

  if (result.success) {
    await params.supabase.from('email_event_logs').insert({
      partner_id: params.partnerId,
      user_id: params.userId ?? null,
      event_type: 'low_wallet_balance',
      recipient_email: params.partnerEmail,
      template_alias: 'low-wallet-balance-alert',
      metadata: {
        wallet_balance: params.walletBalance,
        threshold: LOW_BALANCE_THRESHOLD,
        email_id: result.emailId ?? null,
      },
    });
  } else {
    console.warn('[email] low wallet email failed:', result.error);
  }

  return { sent: result.success, error: result.error };
}

export async function sendWalletRechargeSuccessEmail(params: {
  partnerName: string;
  partnerEmail: string;
  amount: number;
  newBalance?: number | null;
  transactionId?: string | null;
  invoiceNumber?: string | null;
}) {
  if (!params.partnerEmail) {
    return { sent: false, reason: 'missing_email' };
  }

  const result = await sendTransactionalEmail({
    to: params.partnerEmail,
    subject: 'Credits Added to Your Credit Trust Wallet',
    templateAlias: 'wallet-recharge-success',
    variables: {
      partner_name: params.partnerName,
      amount: params.amount.toLocaleString('en-IN'),
      new_balance: params.newBalance == null ? '-' : params.newBalance.toLocaleString('en-IN'),
      transaction_id: params.transactionId || '-',
      invoice_number: params.invoiceNumber || '-',
      portal_link: PORTAL_LINK,
    },
  });

  if (!result.success) {
    console.warn('[email] wallet recharge email failed:', result.error);
  }

  return { sent: result.success, error: result.error };
}
