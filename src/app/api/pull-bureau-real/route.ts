import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, bearerToken, requireUser } from '@/lib/supabase/admin';
import { createDemoBureauResponse } from '@/lib/bureau/demo-response';
import { getStateCode } from '@/lib/bureau/state-codes';

const DEMO_RESET_BALANCE = 100000;
const DEMO_TOP_UP_THRESHOLD = 1000;

type ReportType = 'consumer' | 'commercial';

type PullBureauBody = {
  partner_id?: string;
  report_type?: ReportType;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  birthDate?: string;
  gender?: string;
  idNumber?: string;
  state?: string;
  pinCode?: string;
  telephoneNumber?: string;
  aadhaar?: string;
  city?: string;
  addressLine1?: string;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function normalizeNamePart(value: string | undefined) {
  return (value ?? '').trim().toUpperCase();
}

function normalizeScore(score: unknown) {
  if (typeof score === 'number') return score;
  if (typeof score !== 'string') return null;
  const parsed = Number(score.replace(/^0+/, '') || '0');
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function riskLevel(score: number | null) {
  if (!score) return 'High';
  if (score >= 750) return 'Low';
  if (score >= 650) return 'Medium';
  return 'High';
}

function buildKeyIssues(response: ReturnType<typeof createDemoBureauResponse>) {
  const summary = response.consumerSummaryData;
  const overdue = Number(summary.accountSummary.overdueAccounts ?? 0);
  const recent = Number(summary.inquirySummary.inquiryPast30Days ?? 0);
  const issues: string[] = [];
  if (overdue > 0) issues.push(`${overdue} overdue account${overdue > 1 ? 's' : ''}`);
  else issues.push('No overdue accounts found');
  if (recent > 0) issues.push(`${recent} enquiries in last 30 days`);
  issues.push('Credit utilisation within demo threshold');
  return issues;
}

function normalizeDemoResult(response: ReturnType<typeof createDemoBureauResponse>, reportId: string) {
  const credit = response.consumerCreditData[0];
  const score = normalizeScore(credit.scores[0]?.score);
  return {
    score,
    riskLevel: riskLevel(score),
    keyIssues: buildKeyIssues(response),
    reportId,
    generatedAt: new Date().toLocaleString('en-IN'),
  };
}

async function calculateLedgerBalance(supabase: ReturnType<typeof createAdminClient>, partnerId: string) {
  const { data: txns, error } = await supabase
    .from('wallet_transactions')
    .select('type, amount, status')
    .eq('partner_id', partnerId);

  if (error) throw error;

  return (txns ?? []).reduce((sum, txn) => {
    if (txn.status === 'pending') return sum;
    return txn.type === 'credit' ? sum + Number(txn.amount ?? 0) : sum - Number(txn.amount ?? 0);
  }, 0);
}

async function topUpDemoWalletIfNeeded(
  supabase: ReturnType<typeof createAdminClient>,
  partnerId: string,
  currentBalance: number
) {
  if (currentBalance >= DEMO_TOP_UP_THRESHOLD) return currentBalance;

  const topUpAmount = DEMO_RESET_BALANCE - currentBalance;
  if (topUpAmount <= 0) return currentBalance;

  await supabase.from('wallet_transactions').insert({
    partner_id: partnerId,
    type: 'credit',
    amount: topUpAmount,
    description: 'Demo wallet auto top-up',
    transaction_type: 'manual_adjustment',
    running_balance: DEMO_RESET_BALANCE,
    status: 'confirmed',
    metadata: { demo: true, auto_top_up: true },
  });

  await supabase
    .from('partners')
    .update({ wallet_balance: DEMO_RESET_BALANCE, updated_at: new Date().toISOString() })
    .eq('id', partnerId);

  await supabase.from('wallet_balances').upsert(
    {
      partner_id: partnerId,
      balance: DEMO_RESET_BALANCE,
      last_transaction_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'partner_id' }
  );

  return DEMO_RESET_BALANCE;
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(bearerToken(request));
  if ('error' in auth) {
    return jsonError(auth.error ?? 'Unauthorized', auth.status ?? 401);
  }

  try {
    const body = (await request.json()) as PullBureauBody;
    const supabase = auth.supabase;

    if (!body.partner_id) return jsonError('partner_id is required', 400);
    if (!body.report_type) return jsonError('report_type is required', 400);

    const firstName = normalizeNamePart(body.firstName);
    const middleName = normalizeNamePart(body.middleName);
    const lastName = normalizeNamePart(body.lastName);
    const customerName = [firstName, middleName, lastName].filter(Boolean).join(' ');
    const pan = normalizeNamePart(body.idNumber);
    const stateCode = getStateCode(body.state ?? '');
    const gender = body.gender === 'Male' ? '2' : body.gender === 'Female' ? '1' : null;

    if (!firstName || !lastName) return jsonError('First name and last name are required', 400);
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) return jsonError('Valid PAN is required', 400);
    const birthDate = body.birthDate ?? '';
    if (!/^\d{8}$/.test(birthDate)) return jsonError('Valid birthDate is required', 400);
    if (!gender) return jsonError('Gender must be Male or Female', 400);
    if (!stateCode) return jsonError('Valid state is required', 400);
    if (!/^\d{6}$/.test(body.pinCode ?? '')) return jsonError('Valid pinCode is required', 400);
    if (!/^[6-9]\d{9}$/.test(body.telephoneNumber ?? '')) return jsonError('Valid telephoneNumber is required', 400);

    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, user_id, wallet_balance, email, partner_code')
      .eq('id', body.partner_id)
      .maybeSingle();

    if (partnerError) return jsonError(partnerError.message, 500);
    if (!partner) return jsonError('Partner not found', 404);
    if (partner.user_id !== auth.user.id) return jsonError('Forbidden', 403);

    const isDemoPartner = partner.email === 'user@demo.in' || partner.partner_code === 'DEMO001';

    const { data: commercials } = await supabase
      .from('partner_commercials')
      .select('consumer_credit_rate, commercial_credit_rate, credit_rate')
      .eq('partner_id', partner.id)
      .maybeSingle();

    const rate = body.report_type === 'commercial'
      ? Number(commercials?.commercial_credit_rate ?? commercials?.credit_rate ?? 15)
      : Number(commercials?.consumer_credit_rate ?? commercials?.credit_rate ?? 10);

    let currentBalance = await calculateLedgerBalance(supabase, partner.id);
    if (isDemoPartner) currentBalance = await topUpDemoWalletIfNeeded(supabase, partner.id, currentBalance);

    if (currentBalance < rate) {
      return NextResponse.json(
        { success: false, error: 'Insufficient wallet balance', balance: currentBalance, required: rate },
        { status: 402 }
      );
    }

    if (!isDemoPartner) {
      return jsonError('Live bureau integration is not enabled yet', 501);
    }

    const reportId = `DEMO-${Date.now().toString().slice(-10)}`;
    const requestPayload = {
      firstName,
      middleName,
      lastName,
      birthDate,
      gender,
      idNumber: pan,
      stateCode,
      pinCode: body.pinCode,
      telephoneNumber: body.telephoneNumber,
    };

    const rawResponse = createDemoBureauResponse({
      name: customerName,
      birthDate,
      gender,
      idNumber: pan,
      stateCode,
      pinCode: body.pinCode!,
      telephoneNumber: body.telephoneNumber!,
      reportId,
    });

    const result = normalizeDemoResult(rawResponse, reportId);
    if (!rawResponse.controlData.success || !result.score) {
      return jsonError('Demo report response was invalid', 502);
    }

    const newBalance = currentBalance - rate;
    await supabase
      .from('partners')
      .update({ wallet_balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', partner.id);

    await supabase.from('wallet_balances').upsert(
      {
        partner_id: partner.id,
        balance: newBalance,
        total_deducted: rate,
        last_transaction_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'partner_id' }
    );

    await supabase.from('wallet_transactions').insert({
      partner_id: partner.id,
      type: 'debit',
      amount: rate,
      description: `${body.report_type === 'commercial' ? 'Commercial' : 'Consumer'} Bureau Pull - ${customerName}`,
      transaction_type: 'deduction',
      rate_snapshot: rate,
      running_balance: newBalance,
      reference_id: reportId,
      status: 'confirmed',
      metadata: {
        demo: true,
        report_type: body.report_type,
        customer_name: customerName,
        report_id: reportId,
      },
    });

    const accountSummary = rawResponse.consumerSummaryData.accountSummary;
    const inquirySummary = rawResponse.consumerSummaryData.inquirySummary;
    const employment = rawResponse.consumerCreditData[0].employment[0];
    const activeTradeLines = Number(accountSummary.totalAccounts) - Number(accountSummary.zeroBalanceAccounts);

    await supabase.from('bureau_pulls').insert({
      partner_id: partner.id,
      report_type: body.report_type,
      status: 'success',
      member_ref: reportId,
      pan,
      customer_name: customerName,
      credit_score: result.score,
      occupation_code: employment.occupationCode,
      gender: body.gender,
      state: body.state,
      dob: birthDate,
      income: String(employment.income ?? ''),
      total_trades: Number(accountSummary.totalAccounts ?? 0),
      active_trade_lines: Number.isFinite(activeTradeLines) ? activeTradeLines : null,
      loan_types: 'Consumer Loan, Credit Card',
      dpd_tag: result.riskLevel.toUpperCase(),
      current_balance: Number(accountSummary.currentBalance ?? 0),
      overdue_amount: Number(accountSummary.overdueBalance ?? 0),
      total_enquiries: Number(inquirySummary.totalInquiry ?? 0),
      amount_deducted: rate,
      report_id: reportId,
      bureau: 'Bureau',
      raw_json: {
        demo: true,
        source: 'shared_demo_account',
        requestPayload,
        response: rawResponse,
      },
    });

    return NextResponse.json({
      success: true,
      demo: true,
      rate,
      new_balance: newBalance,
      result,
      raw_json: rawResponse,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    console.error('[pull-bureau-real] unexpected error:', err);
    return jsonError(message, 500);
  }
}
