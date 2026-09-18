import type { SimpleApiClient, SimpleApiConfig } from '@/lib/api-hub/simple-store';

type SupabaseAdmin = ReturnType<typeof import('@/lib/supabase/admin').createAdminClient>;

type AnyRecord = Record<string, any>;

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as AnyRecord : {};
}

function asArray(value: unknown): AnyRecord[] {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') as AnyRecord[] : [];
}

function clean(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function firstClean(record: AnyRecord, keys: string[]) {
  for (const key of keys) {
    const value = clean(record[key]);
    if (value) return value;
  }
  return '';
}

function digits(value: unknown) {
  return clean(value).replace(/\D/g, '');
}

function numberValue(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeScore(value: unknown) {
  const raw = clean(value);
  if (!raw) return null;
  const parsed = Number(raw.replace(/^0+/, '') || '0');
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeGender(value: unknown) {
  const gender = clean(value).toUpperCase();
  if (['1', '01', 'F', 'FEMALE'].includes(gender)) return 'Female';
  if (['2', '02', 'M', 'MALE'].includes(gender)) return 'Male';
  if (['3', '03', 'T', 'TRANSGENDER'].includes(gender)) return 'Transgender';
  return clean(value) || null;
}

function riskLevel(score: number | null) {
  if (!score || score < 650) return 'HIGH';
  if (score < 750) return 'MEDIUM';
  return 'LOW';
}

const ACCOUNT_TYPES: Record<string, string> = {
  '01': 'Auto Loan',
  '02': 'Housing Loan',
  '03': 'Property Loan',
  '05': 'Personal Loan',
  '06': 'Consumer Loan',
  '07': 'Gold Loan',
  '08': 'Education Loan',
  '10': 'Credit Card',
  '13': 'Two-wheeler Loan',
  '17': 'Commercial Vehicle Loan',
  '32': 'Business Loan',
  '50': 'Business Loan - Secured',
  '51': 'Business Loan - Unsecured',
  '61': 'Short Term Personal Loan',
};

function accountTypeLabel(value: unknown) {
  const raw = clean(value);
  return ACCOUNT_TYPES[raw] || ACCOUNT_TYPES[raw.padStart(2, '0')] || raw || null;
}

function findBureauBody(value: unknown, depth = 0): AnyRecord {
  if (depth > 7) return {};
  const record = asRecord(value);
  if (!Object.keys(record).length) return {};
  if (Array.isArray(record.consumerCreditData)) return record;
  for (const nested of Object.values(record)) {
    const found = findBureauBody(nested, depth + 1);
    if (Object.keys(found).length) return found;
  }
  return {};
}

function findProviderRef(value: unknown, fallback: string): string {
  const record = asRecord(value);
  for (const key of ['reportId', 'report_id', 'requestId', 'request_id', 'reference_id', 'transaction_id']) {
    const candidate = clean(record[key]);
    if (candidate) return candidate;
  }
  for (const nested of Object.values(record)) {
    const found: string = findProviderRef(nested, '');
    if (found) return found;
  }
  return fallback;
}

function firstPayloadName(payload: AnyRecord) {
  const direct = clean(payload.name || payload.fullName || payload.customerName);
  if (direct) return direct.toUpperCase();
  return [payload.firstName, payload.middleName, payload.lastName]
    .map(clean)
    .filter(Boolean)
    .join(' ')
    .toUpperCase();
}

async function resolvePartnerId(supabase: SupabaseAdmin, client: SimpleApiClient): Promise<string | null> {
  const email = clean(client.email).toLowerCase();
  const mobile = digits(client.mobile).slice(-10);
  const company = clean(client.company_name || client.name).toLowerCase();

  if (email) {
    const { data } = await supabase
      .from('partners')
      .select('id')
      .ilike('email', email)
      .maybeSingle();
    if (data?.id) return data.id as string;
  }

  if (mobile) {
    const { data } = await supabase
      .from('partners')
      .select('id')
      .eq('mobile', mobile)
      .maybeSingle();
    if (data?.id) return data.id as string;
  }

  if (company) {
    const { data: companyMatch } = await supabase
      .from('partners')
      .select('id')
      .ilike('company_name', `%${company}%`)
      .limit(1);
    if (companyMatch?.[0]?.id) return companyMatch[0].id as string;

    const { data: nameMatch } = await supabase
      .from('partners')
      .select('id')
      .ilike('name', `%${company}%`)
      .limit(1);
    if (nameMatch?.[0]?.id) return nameMatch[0].id as string;
  }

  return null;
}

export async function archiveApiHubBureauPull(params: {
  supabase: SupabaseAdmin;
  client: SimpleApiClient;
  api: SimpleApiConfig;
  requestId: string;
  requestBody: Record<string, unknown>;
  normalizedPayload?: Record<string, unknown>;
  responseJson: unknown;
  creditsDeducted: number;
}) {
  const { supabase, client, api, requestId, requestBody, normalizedPayload, responseJson, creditsDeducted } = params;
  const partnerId = await resolvePartnerId(supabase, client);
  if (!partnerId) {
    console.warn('[api-hub] bureau pull not archived: API client is not mapped to a partner', {
      requestId,
      clientId: client.id,
      clientName: client.name,
    });
    return { archived: false, reason: 'partner_not_mapped' };
  }

  const bureauBody = findBureauBody(responseJson);
  const credit = asArray(bureauBody.consumerCreditData)[0] ?? {};
  const summary = asRecord(bureauBody.consumerSummaryData);
  const accountSummary = asRecord(summary.accountSummary);
  const inquirySummary = asRecord(summary.inquirySummary);
  const name = asArray(credit.names)[0] ?? {};
  const score = asArray(credit.scores)[0] ?? {};
  const employment = asArray(credit.employment)[0] ?? {};
  const accounts = asArray(credit.accounts);
  const ids = asArray(credit.ids);
  const addresses = asArray(credit.addresses);
  const payload = normalizedPayload ?? requestBody;

  const reportId = findProviderRef(responseJson, requestId);
  const pan = clean(payload.pan || payload.idNumber)
    || clean(ids.find((item) => ['01', '1'].includes(clean(item.idType)))?.idNumber)
    || clean(requestBody.pan || requestBody.idNumber);
  const customerName = clean(name.name) || firstPayloadName(payload) || clean(client.company_name || client.name);
  const creditScore = normalizeScore(score.score || asRecord(asRecord(responseJson).data).score);
  const loanTypes = Array.from(new Set(accounts.map((account) => accountTypeLabel(account.accountType)).filter(Boolean))).join(', ');
  const activeTradeLines = numberValue(accountSummary.totalAccounts) !== null && numberValue(accountSummary.zeroBalanceAccounts) !== null
    ? Math.max(0, Number(accountSummary.totalAccounts) - Number(accountSummary.zeroBalanceAccounts))
    : null;

  const { data: existing } = await supabase
    .from('bureau_pulls')
    .select('id')
    .eq('partner_id', partnerId)
    .eq('report_id', reportId)
    .maybeSingle();
  if (existing?.id) return { archived: true, duplicate: true, id: existing.id as string };

  const { data, error } = await supabase
    .from('bureau_pulls')
    .insert({
      partner_id: partnerId,
      report_type: 'consumer',
      status: 'success',
      member_ref: requestId,
      pan: pan || null,
      customer_name: customerName || null,
      credit_score: creditScore,
      occupation_code: clean(employment.occupationCode) || null,
      gender: normalizeGender(name.gender || payload.gender),
      state: clean(addresses[0]?.state || payload.state) || null,
      dob: firstClean(name, ['birthDate', 'dateOfBirth', 'date_of_birth', 'dob', 'DOB', 'DateOfBirth'])
        || firstClean(payload, ['dob', 'birthDate', 'dateOfBirth', 'date_of_birth', 'DOB', 'DateOfBirth'])
        || null,
      income: clean(employment.income) || null,
      total_trades: numberValue(accountSummary.totalAccounts),
      active_trade_lines: activeTradeLines,
      loan_types: loanTypes || null,
      dpd_tag: riskLevel(creditScore),
      current_balance: numberValue(accountSummary.currentBalance),
      overdue_amount: numberValue(accountSummary.overdueBalance),
      total_enquiries: numberValue(inquirySummary.totalInquiry),
      amount_deducted: creditsDeducted,
      report_id: reportId,
      bureau: 'CIBIL',
      raw_json: {
        source: 'api_hub',
        api_code: api.code,
        api_client_id: client.id,
        api_client_name: client.name,
        source_request_id: requestId,
        requestPayload: requestBody,
        normalizedPayload: payload,
        response: bureauBody && Object.keys(bureauBody).length ? bureauBody : responseJson,
        providerResponse: responseJson,
      },
    })
    .select('id')
    .single();

  if (error) throw error;
  return { archived: true, id: data.id as string };
}
