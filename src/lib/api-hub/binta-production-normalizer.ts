import codeDirectory from './binta-code-directory.json';

type RecordValue = Record<string, unknown>;

export type BintaBureauPayload = {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  pan: string;
  mobile: string;
  address: string;
  state: string;
  pincode: string;
};

const directories = codeDirectory.directories as Record<string, { values?: Record<string, string> }>;

function record(value: unknown): RecordValue {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : {};
}

function records(value: unknown): RecordValue[] {
  return Array.isArray(value) ? value.map(record).filter((item) => Object.keys(item).length > 0) : [];
}

function text(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function amount(value: unknown): number | null {
  const raw = text(value).replace(/,/g, '');
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function date(value: unknown): string | null {
  const raw = text(value);
  const compact = raw.match(/^(\d{2})(\d{2})(\d{4})$/);
  const dashed = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const parts = compact || dashed;
  const year = Number(iso ? iso[1] : parts?.[3]);
  const month = Number(iso ? iso[2] : parts?.[2]);
  const day = Number(iso ? iso[3] : parts?.[1]);
  if (!year || !month || !day) return null;
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() + 1 !== month || parsed.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function directoryValue(section: string, value: unknown): string | null {
  return directories[section]?.values?.[text(value)] || null;
}

function maskPan(value: unknown): string {
  const pan = text(value).toUpperCase();
  return pan.length === 10 ? `${pan.slice(0, 5)}****${pan.slice(-1)}` : '***';
}

function maskMobile(value: unknown): string {
  const mobile = text(value).replace(/\D/g, '');
  return mobile.length >= 4 ? `${mobile.slice(0, 2)}******${mobile.slice(-2)}` : '******';
}

function maskEmail(value: unknown): string {
  const email = text(value);
  const at = email.indexOf('@');
  return at > 1 ? `${email.slice(0, 2)}***${email.slice(at)}` : '***';
}

function scoreRange(value: unknown) {
  const score = amount(value);
  if (score === -1) return { available: false, score_range: '-1', score_band: 'no-hit' };
  if (score === null || score < 300 || score > 900) {
    return { available: false, score_range: 'not_available', score_band: 'unknown' };
  }
  const lower = score === 900 ? 895 : Math.floor(score / 5) * 5;
  const band = score >= 750 ? 'excellent' : score >= 700 ? 'good' : score >= 650 ? 'fair' : score >= 600 ? 'weak' : 'poor';
  return { available: true, score_range: `${lower}-${lower + 5}`, score_band: band };
}

function sourceBody(value: unknown, depth = 0): RecordValue {
  if (depth > 8) return {};
  const root = record(value);
  if (Array.isArray(root.consumerCreditData)) return root;
  for (const nested of Object.values(root)) {
    const found = sourceBody(nested, depth + 1);
    if (Object.keys(found).length) return found;
  }
  return {};
}

function paymentHistory(account: RecordValue) {
  const raw = text(account.paymentHistory);
  if (!raw) return [];
  const start = date(account.paymentStartDate);
  if (!start || raw.length % 3 !== 0) throw new Error('Source payment history cannot be normalized safely');
  const [year, month] = start.split('-').map(Number);
  const history = raw.match(/.{3}/g) || [];
  const result = history.map((dpd, index) => {
    const period = new Date(Date.UTC(year, month - 1 - index, 1));
    return { month: `${period.getUTCFullYear()}-${String(period.getUTCMonth() + 1).padStart(2, '0')}`, dpd };
  });
  const end = date(account.paymentEndDate);
  if (end && result.at(-1)?.month !== end.slice(0, 7)) {
    throw new Error('Source payment history date range does not match its buckets');
  }
  return result;
}

export function normalizeBintaProductionResponse(params: {
  requestId: string;
  responseTimeMs: number;
  requestBody: RecordValue;
  payload: BintaBureauPayload;
  sourceResponse: unknown;
}) {
  const { requestId, responseTimeMs, requestBody, payload } = params;
  const source = sourceBody(params.sourceResponse);
  const credit = records(source.consumerCreditData)[0];
  if (!credit) throw new Error('Source consumer report is missing');

  const summary = record(source.consumerSummaryData);
  const accountSummary = record(summary.accountSummary);
  const inquirySummary = record(summary.inquirySummary);
  const sourceAccounts = records(credit.accounts);
  const sourceEnquiries = records(credit.enquiries);
  const declaredAccounts = amount(accountSummary.totalAccounts);
  if (declaredAccounts !== null && declaredAccounts !== sourceAccounts.length) {
    throw new Error('Source account count differs from delivered tradelines');
  }

  const consent = record(requestBody.consent_metadata || requestBody.consentMeta || requestBody.consent);
  const consentMetadata = Object.keys(consent).length ? consent : requestBody;
  const consentTimestamp = text(consentMetadata.consent_timestamp || consentMetadata.consentTimestamp || consentMetadata.consent_timespamp);
  const consentReference = text(consentMetadata.consent_reference || consentMetadata.consentReference || requestBody.consent_reference);
  const accounts = sourceAccounts.map((account, index) => {
    const history = paymentHistory(account);
    const numericDpd = history.slice(0, 36).map((item) => /^\d{3}$/.test(item.dpd) ? Number(item.dpd) : null)
      .filter((item): item is number => item !== null);
    const latestDpd = /^\d{3}$/.test(history[0]?.dpd || '') ? Number(history[0].dpd) : null;
    const overdue = amount(account.amountOverdue);
    const accountType = text(account.accountType);
    return {
      sequence: index + 1,
      loan_type: directoryValue('account_type_or_enquiry_purpose_code', accountType) || accountType || null,
      account_category: ['10', '12', '31', '35'].includes(accountType) ? 'revolving_credit'
        : ['01', '02', '03', '05', '06', '07', '08', '13', '17', '32', '50', '51', '61'].includes(accountType)
          ? 'installment_or_term_credit' : 'not_disclosed',
      ownership: directoryValue('ownership_indicator', account.ownershipIndicator) || text(account.ownershipIndicator) || null,
      account_status: text(account.accountStatus) || (date(account.dateClosed) ? 'Closed' : 'Not disclosed'),
      date_opened: date(account.dateOpened),
      date_closed: date(account.dateClosed),
      last_payment_date: date(account.lastPaymentDate),
      date_reported: date(account.dateReported),
      current_balance: amount(account.currentBalance),
      high_credit_amount: amount(account.highCreditAmount),
      credit_limit: amount(account.creditLimit),
      amount_overdue: overdue,
      emi_amount: amount(account.emiAmount),
      dpd: {
        max_days_last_36_months: numericDpd.length ? Math.max(...numericDpd) : null,
        bucket: history[0]?.dpd || null,
        delinquency_indicator: latestDpd === null && overdue === null ? null : (latestDpd !== null && latestDpd > 0) || (overdue !== null && overdue > 0),
      },
      payment_history: history,
    };
  });

  const sourceAddresses = records(credit.addresses);
  const addresses = sourceAddresses.length ? sourceAddresses.map((address, index) => ({
    sequence: index + 1,
    address_line_1: text(address.line1) || null,
    address_line_2: text(address.line2),
    address_line_3: text(address.line3),
    state_code: text(address.stateCode) || null,
    state: directoryValue('state_code', address.stateCode),
    pincode: text(address.pinCode) || null,
    address_category: directoryValue('address_category', address.addressCategory) || text(address.addressCategory) || null,
    date_reported: date(address.dateReported),
  })) : [{
    sequence: 1,
    address_line_1: payload.address,
    address_line_2: '',
    address_line_3: '',
    state_code: text(requestBody.state_code || requestBody.stateCode) || null,
    state: payload.state,
    pincode: payload.pincode,
    address_category: 'residence',
    date_reported: null,
  }];

  const sourceIds = records(credit.ids).filter((id) => ['1', '01'].includes(text(id.idType)));
  const identities = sourceIds.length
    ? sourceIds.map((id) => ({ type: 'PAN', id_masked: maskPan(id.idNumber) }))
    : [{ type: 'PAN', id_masked: maskPan(payload.pan) }];
  const phones = records(credit.telephones);
  const emails = records(credit.emails);

  return {
    success: true,
    request_id: requestId,
    environment: 'production',
    response_version: 'binta-schedule-a-v1',
    status: 'completed',
    source: 'BUREAU',
    processing: {
      response_time_ms: responseTimeMs,
      generated_at: new Date().toISOString(),
      source_raw_json_included: false,
      normalization_policy: 'schedule_a_normalized_bureau_report',
    },
    consent: { validated: true, consent_timestamp: consentTimestamp, consent_reference: consentReference || null },
    input: {
      mandatory_fields_received: ['firstName', 'lastName', 'dob', 'pan', 'mobile', 'gender', 'address', 'state', 'pincode'],
      identity: {
        first_name: payload.firstName,
        middle_name: text(requestBody.middleName || requestBody.middle_name).toUpperCase(),
        last_name: payload.lastName,
        dob: date(payload.dob),
        gender: payload.gender,
        pan_masked: maskPan(payload.pan),
        mobile_masked: maskMobile(payload.mobile),
      },
    },
    score: scoreRange(records(credit.scores)[0]?.score),
    account_summary: {
      total_accounts: sourceAccounts.length,
      active_accounts: amount(accountSummary.zeroBalanceAccounts) === null ? null
        : Math.max(0, sourceAccounts.length - Number(accountSummary.zeroBalanceAccounts)),
      closed_or_zero_balance_accounts: amount(accountSummary.zeroBalanceAccounts),
      overdue_accounts: amount(accountSummary.overdueAccounts),
      delinquent_accounts: amount(accountSummary.delinquentAccounts),
      total_current_balance: amount(accountSummary.currentBalance),
      total_overdue_balance: amount(accountSummary.overdueBalance),
      high_credit_amount_total: amount(accountSummary.highCreditAmount),
      oldest_account_opened_on: date(accountSummary.oldestDateOpened),
      recent_account_opened_on: date(accountSummary.recentDateOpened),
    },
    inquiry_summary: {
      total_inquiries: amount(inquirySummary.totalInquiry) ?? sourceEnquiries.length,
      inquiries_past_30_days: amount(inquirySummary.inquiryPast30Days),
      inquiries_past_12_months: amount(inquirySummary.inquiryPast12Months),
      inquiries_past_24_months: amount(inquirySummary.inquiryPast24Months),
      recent_inquiry_date: date(inquirySummary.recentInquiryDate),
    },
    identities,
    contacts: {
      mobiles: phones.length ? phones.map((phone) => ({
        mobile_masked: maskMobile(phone.telephoneNumber),
        type: directoryValue('telephone_type', phone.telephoneType) || text(phone.telephoneType) || null,
      })) : [{ mobile_masked: maskMobile(payload.mobile), type: 'mobile' }],
      emails: emails.length ? emails.map((email) => ({ email_masked: maskEmail(email.emailID) }))
        : (text(consentMetadata.email || requestBody.email) ? [{ email_masked: maskEmail(consentMetadata.email || requestBody.email) }] : []),
    },
    addresses,
    employment: records(credit.employment).map((job, index) => ({
      sequence: index + 1,
      occupation_code: text(job.occupationCode) || null,
      income: amount(job.income),
      income_type: ({ G: 'gross', N: 'net' } as Record<string, string>)[text(job.incomeType)] || null,
      income_frequency: ({ M: 'monthly', A: 'annual' } as Record<string, string>)[text(job.incomeFrequency)] || null,
      date_reported: date(job.dateReported),
    })),
    tradelines: accounts,
    enquiries: sourceEnquiries.map((enquiry, index) => ({
      sequence: index + 1,
      enquiry_date: date(enquiry.enquiryDate),
      purpose_code: text(enquiry.enquiryPurpose) || null,
      purpose: directoryValue('account_type_or_enquiry_purpose_code', enquiry.enquiryPurpose),
      amount: amount(enquiry.enquiryAmount),
    })),
    disputes: [],
  };
}
