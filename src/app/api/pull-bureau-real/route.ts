import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, bearerToken, requireUser } from '@/lib/supabase/admin';
import { createDemoBureauResponse } from '@/lib/bureau/demo-response';
import { getStateCode } from '@/lib/bureau/state-codes';
import { sendLowWalletBalanceEmailIfNeeded } from '@/lib/email/wallet-events';

export const runtime = 'nodejs';
export const maxDuration = 60;

const DEMO_RESET_BALANCE = 100000;
const DEMO_TOP_UP_THRESHOLD = 1000;
const BUREAU_API_URL = process.env.BUREAU_API_URL?.trim() ?? '';
const BUREAU_API_AUTH_TOKEN = process.env.BUREAU_API_AUTH_TOKEN?.trim() ?? '';
const BUREAU_API_AUTH_HEADER = process.env.BUREAU_API_AUTH_HEADER?.trim() || 'x-api-key';
const BUREAU_API_TIMEOUT_MS = Number(process.env.BUREAU_API_TIMEOUT_MS ?? 30000);
const DEMO_CUSTOMER = {
  firstName: 'RAHUL',
  middleName: '',
  lastName: 'VERMA',
  name: 'RAHUL VERMA',
  birthDate: '01012000',
  gender: '2',
  pan: 'ABCDE1234F',
  state: 'Madhya Pradesh',
  stateCode: '23',
  pinCode: '452001',
  mobile: '9876543210',
  addressLine1: 'DEMO CUSTOMER ADDRESS',
};

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

type CibilLikeResponse = {
  controlData?: {
    success?: boolean | string;
  };
  consumerCreditData?: Array<{
    tuefHeader?: {
      enquiryControlNumber?: string;
      memberRefNo?: string;
      [key: string]: unknown;
    };
    employment?: Array<Record<string, unknown>>;
    scores?: Array<Record<string, unknown>>;
    accounts?: Array<Record<string, unknown>>;
    [key: string]: unknown;
  }>;
  consumerSummaryData?: {
    accountSummary?: Record<string, unknown>;
    inquirySummary?: Record<string, unknown>;
  };
  [key: string]: unknown;
};

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function normalizeJaadugarDob(value: string) {
  if (/^\d{8}$/.test(value)) return `${value.slice(4)}-${value.slice(2, 4)}-${value.slice(0, 2)}`;
  return value;
}

function normalizeJaadugarGender(value: string | null) {
  if (value === '1') return 'female';
  if (value === '2') return 'male';
  if (value === '3') return 'transgender';
  return '';
}

function findBureauBody(value: unknown, depth = 0): CibilLikeResponse | null {
  if (depth > 5 || !isRecord(value)) return null;
  if (Array.isArray(value.consumerCreditData) && isRecord(value.consumerSummaryData)) {
    return value as CibilLikeResponse;
  }
  for (const nested of Object.values(value)) {
    const found = findBureauBody(nested, depth + 1);
    if (found) return found;
  }
  return null;
}

function readProviderReportId(value: unknown): string | null {
  if (!isRecord(value)) return null;
  const direct = value.reportId || value.report_id || value.requestId || value.request_id;
  if (direct) return String(direct);
  for (const nested of Object.values(value)) {
    const found = readProviderReportId(nested);
    if (found) return found;
  }
  return null;
}

function generateMemberRef() {
  return `CT-${Date.now().toString().slice(-6)}`;
}

function formatMemberRefForDisplay(value: string | null) {
  if (!value) return '—';
  if (/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value)) {
    return `CT-${value.replace(/-/g, '').slice(-6).toUpperCase()}`;
  }
  if (/^(LIVE|DEMO)-\d+$/i.test(value)) {
    return `CT-${value.slice(-6)}`;
  }
  return value;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function bureauApiErrorMessage(raw: CibilLikeResponse, status: number) {
  const message = readString(raw.message);
  const error = readString(raw.error);
  const nestedMessage = isRecord(raw.data) ? readString(raw.data.message) : '';
  const nestedError = isRecord(raw.data) ? readString(raw.data.error) : '';

  if (message && message.toLowerCase() !== 'internal server error') return message;
  if (nestedMessage && nestedMessage.toLowerCase() !== 'internal server error') return nestedMessage;
  if (error && error.toLowerCase() !== 'internal server error') return error;
  if (nestedError && nestedError.toLowerCase() !== 'internal server error') return nestedError;
  if (message) return message;
  if (error) return error;
  return `Bureau API failed with status ${status}`;
}

function safeMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function normalizeNamePart(value: string | undefined) {
  return (value ?? '').trim().toUpperCase();
}

function normalizeScore(score: unknown) {
  if (typeof score === 'number') return score;
  if (typeof score !== 'string') return null;
  const parsed = Number(score.replace(/^0+/, '') || '0');
  if (!Number.isFinite(parsed)) return null;
  if (parsed === -1) return -1;
  return parsed > 0 ? parsed : null;
}

function riskLevel(score: number | null) {
  if (!score || score < 300) return 'High';
  if (score >= 750) return 'Low';
  if (score >= 650) return 'Medium';
  return 'High';
}

function getPrimaryCredit(response: CibilLikeResponse) {
  return response.consumerCreditData?.[0] ?? {};
}

function getAccountSummary(response: CibilLikeResponse) {
  return response.consumerSummaryData?.accountSummary ?? {};
}

function getInquirySummary(response: CibilLikeResponse) {
  return response.consumerSummaryData?.inquirySummary ?? {};
}

function getEmployment(response: CibilLikeResponse) {
  return getPrimaryCredit(response).employment?.[0] ?? {};
}

function isSuccessfulBureauResponse(response: CibilLikeResponse) {
  const success = response.controlData?.success;
  return success === true || success === 'true' || success === 'Success' || success === 'SUCCESS';
}

function readProviderStatus(value: unknown): string {
  if (!isRecord(value)) return '';
  const direct = value.status || value.code || value.message;
  if (direct) return String(direct);
  for (const nested of Object.values(value)) {
    const found = readProviderStatus(nested);
    if (found) return found;
  }
  return '';
}

function createNoHistoryBureauResponse(params: {
  reportCustomer: typeof DEMO_CUSTOMER;
  reportId: string;
  providerResponse: unknown;
}): CibilLikeResponse {
  const providerStatus = readProviderStatus(params.providerResponse);
  const now = new Date();
  const processedDate = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${now.getFullYear()}`;
  const processedTime = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

  return {
    controlData: { success: true },
    consumerCreditData: [
      {
        tuefHeader: {
          enquiryControlNumber: params.reportId,
          memberRefNo: params.reportId,
          dateProcessed: processedDate,
          timeProcessed: processedTime,
        },
        names: [
          {
            name: params.reportCustomer.name,
            birthDate: params.reportCustomer.birthDate,
          },
        ],
        ids: [
          {
            idType: '01',
            idNumber: params.reportCustomer.pan,
          },
        ],
        telephones: [
          {
            telephoneType: '01',
            telephoneNumber: params.reportCustomer.mobile,
          },
        ],
        addresses: [
          {
            line1: params.reportCustomer.addressLine1,
            state: params.reportCustomer.state,
            pinCode: params.reportCustomer.pinCode,
            addressCategory: '01',
            dateReported: processedDate,
          },
        ],
        employment: [],
        scores: [
          {
            scoreName: 'CIBILTUSC4',
            score: '-1',
            reasonCodes: [
              {
                reasonCodeValue: providerStatus || 'No credit history found for this customer',
              },
            ],
          },
        ],
        accounts: [],
        enquiries: [],
      },
    ],
    consumerSummaryData: {
      accountSummary: {
        totalAccounts: 0,
        overdueAccounts: 0,
        zeroBalanceAccounts: 0,
        highCreditAmount: 0,
        currentBalance: 0,
        overdueBalance: 0,
      },
      inquirySummary: {
        totalInquiry: 0,
        inquiryPast30Days: 0,
        inquiryPast12Months: 0,
        inquiryPast24Months: 0,
      },
    },
    providerStatus: providerStatus || 'no_credit_history',
    providerResponse: params.providerResponse,
  };
}

function buildKeyIssues(response: CibilLikeResponse) {
  const accountSummary = getAccountSummary(response);
  const inquirySummary = getInquirySummary(response);
  const overdue = Number(accountSummary.overdueAccounts ?? 0);
  const recent = Number(inquirySummary.inquiryPast30Days ?? 0);
  const issues: string[] = [];
  const score = normalizeScore(getPrimaryCredit(response).scores?.[0]?.score);
  if (score === -1 || response.providerStatus) {
    issues.push('No credit history found in bureau response');
  }
  if (overdue > 0) issues.push(`${overdue} overdue account${overdue > 1 ? 's' : ''}`);
  else issues.push('No overdue accounts found');
  if (recent > 0) issues.push(`${recent} enquiries in last 30 days`);
  issues.push('Credit summary generated from bureau response');
  return issues;
}

function normalizeBureauResult(response: CibilLikeResponse, reportId: string) {
  const credit = getPrimaryCredit(response);
  const preferredScore =
    credit.scores?.find((item) => item.scoreName === 'CIBILTUSC4' || item.scoreCardName === '28') ??
    credit.scores?.[0];
  const score = normalizeScore(preferredScore?.score);
  return {
    score,
    riskLevel: riskLevel(score),
    keyIssues: buildKeyIssues(response),
    reportId,
    generatedAt: new Date().toLocaleString('en-IN'),
  };
}

async function callLiveBureauApi(payload: Record<string, string>) {
  if (!BUREAU_API_URL) {
    throw new Error('Live bureau API URL is not configured');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BUREAU_API_TIMEOUT_MS);

  try {
    const response = await fetch(BUREAU_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(BUREAU_API_AUTH_TOKEN ? { [BUREAU_API_AUTH_HEADER]: BUREAU_API_AUTH_TOKEN } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await response.text();
    let raw: CibilLikeResponse;
    try {
      raw = JSON.parse(text) as CibilLikeResponse;
    } catch {
      throw new Error(`Bureau API returned non-JSON response with status ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(bureauApiErrorMessage(raw, response.status));
    }

    return raw;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Live bureau API timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
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
      .select('id, user_id, wallet_balance, email, partner_code, name')
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

    let reportId = `${isDemoPartner ? 'DEMO' : 'LIVE'}-${Date.now().toString().slice(-10)}`;
    const memberRef = generateMemberRef();
    const reportCustomer = isDemoPartner
      ? DEMO_CUSTOMER
      : {
          firstName,
          middleName,
          lastName,
          name: customerName,
          birthDate,
          gender,
          pan,
          state: body.state ?? '',
          stateCode,
          pinCode: body.pinCode!,
          mobile: body.telephoneNumber!,
          addressLine1: body.addressLine1 || `${body.pinCode} ${body.state}`.trim(),
        };
    const requestPayload = {
      firstName: reportCustomer.firstName,
      middleName: reportCustomer.middleName,
      lastName: reportCustomer.lastName,
      birthDate: reportCustomer.birthDate,
      gender: reportCustomer.gender,
      idNumber: reportCustomer.pan,
      stateCode: reportCustomer.stateCode,
      pinCode: reportCustomer.pinCode,
      telephoneNumber: reportCustomer.mobile,
    };

    let rawResponse: CibilLikeResponse;
    let providerResponse: unknown = null;
    if (isDemoPartner) {
      rawResponse = createDemoBureauResponse({
        name: reportCustomer.name,
        birthDate: reportCustomer.birthDate,
        gender: reportCustomer.gender,
        idNumber: reportCustomer.pan,
        stateCode: reportCustomer.stateCode,
        pinCode: reportCustomer.pinCode,
        telephoneNumber: reportCustomer.mobile,
        reportId,
      });
    } else {
      try {
        const jaadugarPayload = {
          firstName,
          lastName,
          dob: normalizeJaadugarDob(birthDate),
          gender: normalizeJaadugarGender(gender),
          pan,
          mobile: body.telephoneNumber!,
          address: body.addressLine1 || `${body.pinCode} ${body.state}`.trim(),
          state: (body.state || '').toUpperCase(),
          pincode: body.pinCode!,
        };
        providerResponse = await callLiveBureauApi(jaadugarPayload);
        reportId = readProviderReportId(providerResponse) || reportId;
        const bureauBody = findBureauBody(providerResponse);
        rawResponse = bureauBody || createNoHistoryBureauResponse({ reportCustomer, reportId, providerResponse });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to fetch live bureau report';
        return jsonError(message, BUREAU_API_URL ? 502 : 501);
      }
    }

    const result = normalizeBureauResult(rawResponse, reportId);
    if (!isSuccessfulBureauResponse(rawResponse) || result.score === null) {
      return jsonError('Bureau report response was invalid or missing score', 502);
    }

    const newBalance = currentBalance - rate;
    const { error: partnerUpdateError } = await supabase
      .from('partners')
      .update({ wallet_balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', partner.id);
    if (partnerUpdateError) {
      console.error('[pull-bureau-real] partner balance update error:', partnerUpdateError);
      return jsonError('Report fetched, but wallet update failed. Please contact support.', 500);
    }

    const { error: walletBalanceError } = await supabase.from('wallet_balances').upsert(
      {
        partner_id: partner.id,
        balance: newBalance,
        total_deducted: rate,
        last_transaction_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'partner_id' }
    );
    if (walletBalanceError) {
      console.error('[pull-bureau-real] wallet balance upsert error:', walletBalanceError);
      return jsonError('Report fetched, but wallet ledger update failed. Please contact support.', 500);
    }

    const { error: walletTransactionError } = await supabase.from('wallet_transactions').insert({
      partner_id: partner.id,
      type: 'debit',
      amount: rate,
      description: `${body.report_type === 'commercial' ? 'Commercial' : 'Consumer'} Bureau Pull - ${reportCustomer.name}`,
      transaction_type: 'deduction',
      rate_snapshot: rate,
      running_balance: newBalance,
      reference_id: reportId,
      status: 'confirmed',
      metadata: {
        demo: isDemoPartner,
        report_type: body.report_type,
        customer_name: reportCustomer.name,
        report_id: reportId,
      },
    });
    if (walletTransactionError) {
      console.error('[pull-bureau-real] wallet transaction insert error:', walletTransactionError);
      return jsonError('Report fetched, but wallet transaction save failed. Please contact support.', 500);
    }

    const accountSummary = getAccountSummary(rawResponse);
    const inquirySummary = getInquirySummary(rawResponse);
    const employment = getEmployment(rawResponse);
    const activeTradeLines = Number(accountSummary.totalAccounts) - Number(accountSummary.zeroBalanceAccounts);

    const { error: bureauPullError } = await supabase.from('bureau_pulls').insert({
      partner_id: partner.id,
      report_type: body.report_type,
      status: 'success',
      member_ref: memberRef,
      pan: reportCustomer.pan,
      customer_name: reportCustomer.name,
      credit_score: result.score,
      occupation_code: String(employment.occupationCode ?? ''),
      gender: isDemoPartner ? 'Male' : body.gender,
      state: reportCustomer.state,
      dob: reportCustomer.birthDate,
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
        demo: isDemoPartner,
        source: isDemoPartner ? 'shared_demo_account' : 'live_bureau_api',
        requestPayload,
        providerResponse,
        response: rawResponse,
      },
    });
    if (bureauPullError) {
      console.error('[pull-bureau-real] bureau pull insert error:', bureauPullError);
      return jsonError('Report fetched, but report history save failed. Please contact support.', 500);
    }

    try {
      await sendLowWalletBalanceEmailIfNeeded({
        supabase,
        partnerId: partner.id,
        userId: partner.user_id,
        partnerName: partner.name || 'Partner',
        partnerEmail: partner.email || '',
        walletBalance: newBalance,
      });
    } catch (emailError) {
      console.warn('[pull-bureau-real] low wallet email error (non-blocking):', emailError);
    }

    return NextResponse.json({
      success: true,
      demo: isDemoPartner,
      rate,
      new_balance: newBalance,
      result,
      raw_json: rawResponse,
      display_customer: {
        name: reportCustomer.name,
        mobile: reportCustomer.mobile,
        pan: reportCustomer.pan,
      },
    });
  } catch (err) {
    const message = safeMessage(err, 'Unexpected error');
    console.error('[pull-bureau-real] unexpected error:', err);
    return jsonError(message, 500);
  }
}
