type JsonRecord = Record<string, unknown>;

export type InsightTone = 'positive' | 'warning' | 'critical' | 'info';

export type CreditAccount = {
  id: string;
  lender: string;
  accountNumber: string;
  product: string;
  category: 'loan' | 'credit_card' | 'overdraft' | 'other';
  openedAt: string | null;
  reportedAt: string | null;
  currentBalance: number;
  highCredit: number;
  creditLimit: number;
  overdue: number;
  emi: number;
  utilization: number | null;
  paymentHistory: string[];
  delayedPayments: number;
  severeDelays: number;
  status: 'active' | 'closed' | 'unknown';
  negativeFlags: string[];
};

export type CreditInsight = { id: string; tone: InsightTone; title: string; detail: string };

export type CreditIntelligence = {
  customerName: string;
  reportId: string;
  generatedAt: string;
  score: number | null;
  scoreBand: string;
  reasonCodes: string[];
  profile: {
    dob: string | null;
    gender: string | null;
    pan: string | null;
    mobile: string | null;
    addresses: number;
  };
  totals: {
    accounts: number;
    activeAccounts: number;
    closedAccounts: number;
    currentBalance: number;
    overdueBalance: number;
    highCredit: number;
    creditLimit: number;
    enquiries: number;
    recentEnquiries: number;
  };
  accounts: CreditAccount[];
  enquiries: Array<{ lender: string; purpose: string; amount: number; date: string | null }>;
  mix: { secured: number; unsecured: number; cards: number; overdrafts: number };
  dpd: {
    available: boolean;
    delayedPayments: number;
    severeDelays: number;
    accountsWithDelays: number;
  };
  negativeItems: Array<{ account: string; lender: string; issue: string }>;
  insights: CreditInsight[];
  actionPlan: string[];
};

const productNames: Record<string, string> = {
  '01': 'Auto Loan',
  '02': 'Housing Loan',
  '05': 'Personal Loan',
  '06': 'Credit Card',
  '10': 'Overdraft',
  '13': 'Consumer Loan',
  '17': 'Business Loan',
  '19': 'Property Loan',
  '31': 'Gold Loan',
  '35': 'Loan Against Property',
  '40': 'Education Loan',
};
const securedTypes = new Set(['01', '02', '19', '31', '35']);

function record(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : {};
}
function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value);
}
function lenderName(...values: unknown[]): string {
  const value = values.map(text).find(Boolean) || '';
  return /^not\s+disclosed$/i.test(value) ? '' : value;
}
function amount(value: unknown): number {
  const n = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}
function date(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  if (/^\d{8}$/.test(raw)) {
    const [d, m, y] = [raw.slice(0, 2), raw.slice(2, 4), raw.slice(4, 8)];
    return `${y}-${m}-${d}`;
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) {
    const [d, m, y] = raw.split('-');
    return `${y}-${m}-${d}`;
  }
  return raw;
}
function masked(value: unknown, visible = 4): string | null {
  const raw = text(value);
  return raw ? `${'X'.repeat(Math.max(0, raw.length - visible))}${raw.slice(-visible)}` : null;
}
function firstRecord(value: unknown): JsonRecord {
  return record(list(value)[0]);
}
function genderLabel(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  if (raw === '1') return 'Female';
  if (raw === '2') return 'Male';
  if (raw === '3') return 'Transgender';
  return raw;
}
function findBureauBody(raw: unknown): JsonRecord {
  const queue: unknown[] = [raw];
  const visited = new Set<unknown>();
  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== 'object' || visited.has(current)) continue;
    visited.add(current);
    const item = record(current);
    if (Array.isArray(item.consumerCreditData) || record(item.consumerSummaryData).accountSummary)
      return item;
    Object.values(item).forEach((value) => {
      if (value && typeof value === 'object') queue.push(value);
    });
  }
  return {};
}

function historyChunks(raw: unknown): string[] {
  const clean = text(raw).replace(/\s/g, '');
  return clean.match(/.{1,3}/g) ?? [];
}
function accountFlags(item: JsonRecord): string[] {
  const blob = Object.values(item).map(text).join(' ').toLowerCase();
  const flags: string[] = [];
  if (/write.?off|written.?off/.test(blob) || amount(item.woAmountTotal) > 0 || amount(item.woAmountPrincipal) > 0)
    flags.push('Write-off reported');
  if (/settled|settlement/.test(blob) || amount(item.settlementAmount) > 0) flags.push('Settled status reported');
  if (/suit.?filed|wilful/.test(blob)) flags.push('Legal or suit-filed marker reported');
  return Array.from(new Set(flags));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);
}
export function formatDate(value: string | null | undefined): string {
  const rawValue = value?.trim();
  if (!rawValue) return 'Not available';

  const normalizedValue = /^\d{4}-\d{2}-\d{2}$/.test(rawValue) ? `${rawValue}T00:00:00` : rawValue;
  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) return 'Not available';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function buildCreditIntelligence(
  raw: unknown,
  meta: { fullName?: string | null; reportId?: string | null; createdAt?: string | null }
): CreditIntelligence {
  const body = findBureauBody(raw);
  const credit = record(list(body.consumerCreditData)[0]);
  const summary = record(record(body.consumerSummaryData).accountSummary);
  const inquirySummary = record(record(body.consumerSummaryData).inquirySummary);
  const names = firstRecord(credit.names);
  const ids = list(credit.ids).map(record);
  const phones = list(credit.telephones).map(record);
  const scoreData = record(list(credit.scores)[0]);
  const rawAccounts = list(credit.accounts);
  const accountRecords = rawAccounts.map(record);
  const accounts = accountRecords.map((item, index) => {
    const type = text(item.accountType);
    const category =
      type === '06'
        ? 'credit_card'
        : type === '10'
          ? 'overdraft'
          : productNames[type]
            ? 'loan'
            : 'other';
    const creditLimit = amount(item.creditLimit);
    const currentBalance = amount(item.currentBalance);
    const chunks = historyChunks(item.paymentHistory);
    const delayed = chunks.filter(
      (part) => /^0?[1-9]\d?$/.test(part) || (/^0\d\d$/.test(part) && part !== '000')
    ).length;
    const severe = chunks.filter(
      (part) => /^0?(?:6\d|[7-9]\d|\d{3,})$/.test(part) && part !== '000'
    ).length;
    const closed = Boolean(text(item.dateClosed) || text(item.closedDate));
    return {
      id: `${text(item.accountNumber) || index}-${type}`,
      lender: lenderName(item.memberShortName, item.memberName),
      accountNumber: masked(item.accountNumber) || 'Masked account',
      product: productNames[type] || text(item.accountType) || 'Credit facility',
      category,
      openedAt: date(item.dateOpened),
      reportedAt: date(item.dateReported),
      currentBalance,
      highCredit: amount(item.highCreditAmount),
      creditLimit,
      overdue: amount(item.amountOverdue),
      emi: amount(item.emiAmount),
      utilization: creditLimit > 0 ? Math.round((currentBalance / creditLimit) * 100) : null,
      paymentHistory: chunks,
      delayedPayments: delayed,
      severeDelays: severe,
      status: closed ? 'closed' : 'active',
      negativeFlags: accountFlags(item),
    } satisfies CreditAccount;
  });
  const rawEnquiries = list(credit.enquiries);
  const enquiries = rawEnquiries.map((entry) => {
    const item = record(entry);
    return {
      lender: lenderName(item.memberShortName, item.memberName),
      purpose: text(item.enquiryPurpose) || text(item.enquiryType) || 'Credit enquiry',
      amount: amount(item.enquiryAmount),
      date: date(item.enquiryDate),
    };
  });
  const scoreValue = amount(scoreData.score);
  const score = scoreValue > 0 ? scoreValue : null;
  const overdueBalance =
    accounts.reduce((sum, account) => sum + account.overdue, 0) || amount(summary.overdueBalance);
  const currentBalance =
    accounts.reduce((sum, account) => sum + account.currentBalance, 0) ||
    amount(summary.currentBalance);
  const highCredit =
    accounts.reduce((sum, account) => sum + account.highCredit, 0) ||
    amount(summary.highCreditAmount);
  const creditLimit = accounts.reduce((sum, account) => sum + account.creditLimit, 0);
  const delayedPayments = accounts.reduce((sum, account) => sum + account.delayedPayments, 0);
  const severeDelays = accounts.reduce((sum, account) => sum + account.severeDelays, 0);
  const negativeItems = accounts.flatMap((account) =>
    account.negativeFlags.map((issue) => ({
      account: account.accountNumber,
      lender: account.lender,
      issue,
    }))
  );
  const recentEnquiries = amount(inquirySummary.past30Days) || amount(inquirySummary.inquiryPast30Days);
  const mix = {
    secured: accountRecords.filter((account) => securedTypes.has(text(account.accountType))).length,
    unsecured: accountRecords.filter((account) => {
      const type = text(account.accountType);
      return productNames[type] && !securedTypes.has(type) && type !== '06' && type !== '10';
    }).length,
    cards: accounts.filter((a) => a.category === 'credit_card').length,
    overdrafts: accounts.filter((a) => a.category === 'overdraft').length,
  };
  const insights: CreditInsight[] = [];
  if (overdueBalance > 0)
    insights.push({
      id: 'overdue',
      tone: 'critical',
      title: 'Overdue amount reported',
      detail: `${formatCurrency(overdueBalance)} is reported as overdue across the available account data.`,
    });
  else if (accounts.length)
    insights.push({
      id: 'overdue-clear',
      tone: 'positive',
      title: 'No overdue balance in the available summary',
      detail: 'The report does not show an overdue balance in the account data received.',
    });
  const highUtilization = accounts.filter((a) => a.utilization !== null && a.utilization >= 60);
  if (highUtilization.length)
    insights.push({
      id: 'utilization',
      tone: 'warning',
      title: 'High revolving credit utilisation',
      detail: `${highUtilization.length} account${highUtilization.length > 1 ? 's are' : ' is'} at or above 60% utilisation based on reported limits.`,
    });
  if (delayedPayments)
    insights.push({
      id: 'repayment',
      tone: severeDelays ? 'critical' : 'warning',
      title: 'Delayed repayment markers found',
      detail: `${delayedPayments} non-zero DPD marker${delayedPayments > 1 ? 's were' : ' was'} found in the payment history supplied by the bureau.`,
    });
  if (recentEnquiries >= 3)
    insights.push({
      id: 'enquiries',
      tone: 'warning',
      title: 'Recent credit enquiry activity',
      detail: `${recentEnquiries} enquiry records were reported in the recent-period summary.`,
    });
  if (negativeItems.length)
    insights.push({
      id: 'negative',
      tone: 'critical',
      title: 'Negative account marker reported',
      detail: `${negativeItems.length} negative marker${negativeItems.length > 1 ? 's are' : ' is'} present in the available account data.`,
    });
  if (!accounts.length)
    insights.push({
      id: 'no-accounts',
      tone: 'info',
      title: 'Limited account data available',
      detail: 'This report did not include tradeline details to analyse at account level.',
    });
  const actionPlan = [
    overdueBalance > 0
      ? 'Clear any reported overdue amount and keep evidence of payment.'
      : 'Continue paying all active facilities by their due dates.',
    highUtilization.length
      ? 'Reduce revolving credit utilisation where possible, especially accounts above 60%.'
      : 'Keep revolving credit use comfortably below the available limit.',
    delayedPayments
      ? 'Review the repayment-history entries and raise disputes only where records are inaccurate.'
      : 'Avoid late payments so future repayment history remains clean.',
    recentEnquiries >= 3
      ? 'Avoid unnecessary fresh credit applications until recent enquiry activity reduces.'
      : 'Apply for new credit only when it is genuinely required.',
  ];
  const idRecord = ids.find((item) => text(item.idType) === '01') || ids[0] || {};
  const phoneRecord = phones.find((item) => text(item.telephoneNumber)) || phones[0] || {};
  return {
    customerName: meta.fullName || text(names.name) || 'CreditTrust customer',
    reportId: meta.reportId || 'CT report',
    generatedAt: meta.createdAt || new Date().toISOString(),
    score,
    scoreBand: score
      ? score >= 750
        ? 'Strong'
        : score >= 700
          ? 'Good'
          : score >= 650
            ? 'Building'
            : 'Needs attention'
      : 'Not available',
    reasonCodes: list(scoreData.reasonCodes)
      .map((item) => text(record(item).reasonCodeValue || item))
      .filter(Boolean),
    profile: {
      dob: date(names.birthDate),
      gender: genderLabel(names.gender),
      pan: masked(idRecord.idNumber) || null,
      mobile: masked(phoneRecord.telephoneNumber) || null,
      addresses: list(credit.addresses).length,
    },
    totals: {
      accounts: accounts.length || amount(summary.totalAccounts),
      activeAccounts: accounts.filter((a) => a.status === 'active').length,
      closedAccounts:
        accounts.filter((a) => a.status === 'closed').length || amount(summary.zeroBalanceAccounts),
      currentBalance,
      overdueBalance,
      highCredit,
      creditLimit,
      enquiries: enquiries.length || amount(inquirySummary.total) || amount(inquirySummary.totalInquiry),
      recentEnquiries,
    },
    accounts,
    enquiries,
    mix,
    dpd: {
      available: accounts.some((a) => a.paymentHistory.length),
      delayedPayments,
      severeDelays,
      accountsWithDelays: accounts.filter((a) => a.delayedPayments > 0).length,
    },
    negativeItems,
    insights,
    actionPlan,
  };
}

export function buildComparisonHistory(
  rows: Array<{
    id: string;
    report_id: string | null;
    credit_score: number | null;
    report_json: unknown;
    created_at: string;
  }>
) {
  return rows.map((row) => {
    const analysis = buildCreditIntelligence(row.report_json, {
      reportId: row.report_id,
      createdAt: row.created_at,
    });
    return {
      id: row.id,
      reportId: analysis.reportId,
      createdAt: row.created_at,
      score: analysis.score,
      accounts: analysis.totals.accounts,
      currentBalance: analysis.totals.currentBalance,
      overdueBalance: analysis.totals.overdueBalance,
    };
  });
}

