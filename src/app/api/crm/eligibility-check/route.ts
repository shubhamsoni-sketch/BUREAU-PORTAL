import { NextRequest, NextResponse } from 'next/server';
import {
  defaultBureauApi,
  getApiHubStore,
  hitMasterApi,
  saveApiHubStore,
  SimpleApiConfig,
} from '@/lib/api-hub/simple-store';
import { maskMobile, maskPan } from '@/lib/api-hub/keys';
import { bearerToken, createAdminClient, requireUser } from '@/lib/supabase/admin';
import { getStateName } from '@/lib/bureau/state-codes';
import { resolveCrmScope } from '@/lib/crm/scope';
import { requireCrmPermission } from '@/lib/crm/access';
import {
  CrmLender,
  defaultCrmLenders,
  matchLenders,
  normalizeLenders,
} from '@/lib/crm/lender-policy';
import {
  CrmApplication,
  CrmLead,
  createDefaultApplicationDocuments,
  defaultCrmLeads,
  normalizeApplications,
  normalizeApplicationDocuments,
  normalizeLeads,
} from '@/lib/crm/leads';
import { CrmPermissionKey, CrmTeamMember, defaultCrmTeam, normalizeTeam } from '@/lib/crm/team';
import {
  getCrmTableData,
  insertCrmEligibilityReport,
  logCrmAudit,
  saveCrmApplicationDocuments,
  upsertCrmApplication,
  upsertCrmLead,
  upsertCrmReminder,
} from '@/lib/crm/db';
import { matchPublishedPrograms, saveRoutingDecision } from '@/lib/lender-intelligence/server';
import {
  canTransitionLenderApplication,
  isLenderApplicationStage,
} from '@/lib/lender-intelligence/lifecycle';

type CrmEligibilityReport = {
  id: string;
  request_id: string;
  borrower_name: string;
  pan: string;
  mobile: string;
  loan_type: string;
  loan_amount: number;
  score: number | null;
  eligible: boolean;
  status: string;
  foir: number;
  max_loan_amount: number;
  matched_lenders: { name: string; roi: string; maxLoan: string }[];
  credits_deducted: number;
  created_at: string;
  cibil_payload: Record<string, unknown>;
  bureau_response: unknown;
  consent_given?: boolean;
  consent_at?: string | null;
  consent_version?: string | null;
  consent_purpose?: string | null;
  consent_source?: string | null;
  consent_captured_by?: string | null;
};

const ELIGIBILITY_CONSENT_VERSION = 'eligibility-routing-v1';
const ELIGIBILITY_CONSENT_PURPOSE =
  'Customer authorized profile verification, eligibility assessment, and lender-fit routing.';

type CrmCreditTransaction = {
  id: string;
  type: 'credit' | 'debit';
  credits: number;
  description: string;
  status: 'paid' | 'pending';
  invoice_number?: string;
  created_at: string;
};

type CrmInvoice = {
  id: string;
  invoice_number: string;
  amount: number;
  credits_added: number;
  status: 'paid' | 'draft';
  issued_at: string;
  notes: string;
};

type CrmStore = {
  eligibility_credits: {
    balance: number;
    total_added: number;
    total_used: number;
    per_check_cost: number;
  };
  credit_transactions: CrmCreditTransaction[];
  invoices: CrmInvoice[];
  lenders: CrmLender[];
  leads: CrmLead[];
  applications: CrmApplication[];
  team: CrmTeamMember[];
  reports: CrmEligibilityReport[];
};

const defaultCrmStore: CrmStore = {
  eligibility_credits: {
    balance: 100,
    total_added: 100,
    total_used: 0,
    per_check_cost: 1,
  },
  credit_transactions: [],
  invoices: [],
  lenders: defaultCrmLenders,
  leads: defaultCrmLeads,
  applications: [],
  team: defaultCrmTeam,
  reports: [],
};

const CRM_STANDARD_DEFAULTS = {
  dob: '2000-01-01',
  gender: 'male',
  address: 'CreditTrust Verified Address',
  state: 'MADHYA PRADESH',
  pincode: '452001',
};
const CRM_LIVE_ELIGIBILITY_ENABLED = process.env.CRM_LIVE_ELIGIBILITY_ENABLED === 'true';

function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CRM-INV-${year}-${rand}`;
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function permissionForAction(action: string): CrmPermissionKey {
  if (action === 'add_credits') return 'eligibility_credits';
  if (
    [
      'send_to_lender',
      'submit_to_lender',
      'update_application_status',
      'add_application_note',
      'update_application_document',
      'update_application_followup',
    ].includes(action)
  ) {
    return 'file_process';
  }
  return 'eligibility_check';
}

function cleanString(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function digits(value: unknown) {
  return cleanString(value).replace(/\D/g, '');
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.length > 1 ? parts[parts.length - 1] : parts[0] || '',
  };
}

function normalizeGender(value: unknown) {
  const gender = cleanString(value).toLowerCase();
  if (gender === '1' || gender.includes('female')) return 'female';
  if (gender === '2' || gender.includes('male')) return 'male';
  if (gender === '3' || gender.includes('trans')) return 'transgender';
  return gender;
}

function normalizeDob(value: unknown) {
  const raw = cleanString(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const indian = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (indian) return `${indian[1].padStart(2, '0')}/${indian[2].padStart(2, '0')}/${indian[3]}`;
  return raw;
}

function stateFromPincode(pincode: string, city: string) {
  const prefix = pincode.slice(0, 2);
  const cityText = city.toLowerCase();
  if (
    cityText.includes('indore') ||
    cityText.includes('bhopal') ||
    prefix === '45' ||
    prefix === '46' ||
    prefix === '47' ||
    prefix === '48'
  )
    return 'MADHYA PRADESH';
  if (
    cityText.includes('mumbai') ||
    cityText.includes('pune') ||
    prefix === '40' ||
    prefix === '41' ||
    prefix === '42' ||
    prefix === '43' ||
    prefix === '44'
  )
    return 'MAHARASHTRA';
  if (cityText.includes('delhi') || prefix === '11') return 'DELHI';
  if (
    cityText.includes('jaipur') ||
    prefix === '30' ||
    prefix === '31' ||
    prefix === '32' ||
    prefix === '33' ||
    prefix === '34'
  )
    return 'RAJASTHAN';
  if (
    cityText.includes('ahmedabad') ||
    prefix === '36' ||
    prefix === '37' ||
    prefix === '38' ||
    prefix === '39'
  )
    return 'GUJARAT';
  if (
    cityText.includes('bangalore') ||
    cityText.includes('bengaluru') ||
    prefix === '56' ||
    prefix === '57' ||
    prefix === '58' ||
    prefix === '59'
  )
    return 'KARNATAKA';
  if (
    cityText.includes('chennai') ||
    prefix === '60' ||
    prefix === '61' ||
    prefix === '62' ||
    prefix === '63' ||
    prefix === '64'
  )
    return 'TAMIL NADU';
  return '';
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function nestedObject(source: unknown, path: string[]) {
  let current = source;
  for (const key of path) {
    if (!isObject(current)) return {};
    current = current[key];
  }
  return isObject(current) ? current : {};
}

function personalDataCandidates(prefill: unknown) {
  return [
    nestedObject(prefill, ['data', 'data', 'personal_data']),
    nestedObject(prefill, ['data', 'personal_data']),
    nestedObject(prefill, ['personal_data']),
  ].filter((item) => Object.keys(item).length);
}

function getPersonalInfo(prefill: unknown) {
  for (const personalData of personalDataCandidates(prefill)) {
    const info = personalData.personal_information;
    if (isObject(info)) return info;
  }
  return {};
}

function parseReportedDate(value: unknown) {
  const text = cleanString(value);
  const time = text ? Date.parse(text) : NaN;
  return Number.isFinite(time) ? time : 0;
}

function chooseBestAddress(prefill: unknown) {
  const addresses = personalDataCandidates(prefill).flatMap((personalData) =>
    Array.isArray(personalData.address) ? personalData.address.filter(isObject) : []
  );
  return addresses
    .map((address) => ({
      state: cleanString(address.state || address.state_name || address.stateName),
      pincode: digits(address.pincode || address.pinCode || address.postal_code).slice(0, 6),
      detailedAddress: cleanString(address.detailed_address || address.address),
      reportedAt: parseReportedDate(address.date_of_reporting || address.updated_at),
    }))
    .filter((address) => /^\d{6}$/.test(address.pincode) && address.detailedAddress)
    .sort((a, b) => b.reportedAt - a.reportedAt)[0];
}

function documentValue(prefill: unknown, documentKey: string) {
  for (const personalData of personalDataCandidates(prefill)) {
    const documentData = personalData.document_data;
    if (!isObject(documentData)) continue;
    const value = documentData[documentKey];
    if (Array.isArray(value)) {
      const first = value.find(isObject);
      const text = cleanString(first?.value);
      if (text) return text;
    }
    const text = cleanString(value);
    if (text) return text;
  }
  return '';
}

function buildPrefillCibilPayload(prefill: unknown, mobile: string) {
  const personalInfo = getPersonalInfo(prefill);
  const bestAddress = chooseBestAddress(prefill);
  const fullName = cleanString(
    personalInfo.full_name || personalInfo.fullName || personalInfo.name
  );
  const name = splitName(fullName);
  const state = getStateName(bestAddress?.state || '');

  return {
    firstName: name.firstName,
    lastName: name.lastName,
    dob: normalizeDob(personalInfo.date_of_birth || personalInfo.dateOfBirth || personalInfo.dob),
    gender: normalizeGender(personalInfo.gender || personalInfo.sex),
    pan: documentValue(prefill, 'pan').toUpperCase(),
    mobile,
    address: bestAddress?.detailedAddress || '',
    state,
    pincode: bestAddress?.pincode || '',
  };
}

function validateCibilPayload(payload: Record<string, unknown>) {
  const required = [
    'firstName',
    'lastName',
    'dob',
    'gender',
    'pan',
    'mobile',
    'address',
    'state',
    'pincode',
  ];
  const missing = required.filter((field) => !cleanString(payload[field]));
  if (missing.length) return `Missing required customer fields: ${missing.join(', ')}`;
  if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(cleanString(payload.pan))) return 'Valid PAN is required';
  if (!/^\d{10}$/.test(digits(payload.mobile))) return 'Valid mobile is required';
  if (!/^\d{6}$/.test(digits(payload.pincode))) return 'Valid pincode is required';
  return null;
}

async function hitPrefillApi(api: SimpleApiConfig, mobile: string, requestId: string) {
  const endpoint = api.master_url.trim().replace(/\/+$/, '');
  if (!endpoint) throw new Error('Mobile eligibility service is not configured');
  const headers: Record<string, string> = {
    accept: 'application/json',
    'content-type': 'application/json',
    'X-Auth-Type': 'API-Key',
    'X-Reference-ID': requestId,
  };
  if (api.auth_header && api.auth_token) headers[api.auth_header] = api.auth_token;
  const response = await fetch(endpoint, {
    method: api.method || 'POST',
    headers,
    body: JSON.stringify({ mobile_number: mobile, consent: 'Y' }),
  });
  const text = await response.text();
  let data: unknown = text;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { ok: response.ok, status: response.status, data };
}

function findStandardApi(apis: SimpleApiConfig[]) {
  return apis.find(
    (api) =>
      api.status === 'active' &&
      ['bureau', 'bureau-standard', 'cibil.consumer_score'].includes(api.code)
  );
}

function findAdvancedApi(apis: SimpleApiConfig[]) {
  return apis.find((api) => api.status === 'active' && api.code === 'bureau-advanced');
}

function findScore(value: unknown): number | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const score = findScore(item);
      if (score !== null) return score;
    }
    return null;
  }
  if (!isObject(value)) return null;
  for (const [key, nested] of Object.entries(value)) {
    if (/score/i.test(key)) {
      const number = Number(cleanString(nested));
      if (Number.isFinite(number) && number > 0) return number;
    }
    const score = findScore(nested);
    if (score !== null) return score;
  }
  return null;
}

function findStatus(value: unknown): string {
  if (!isObject(value)) return '';
  const direct = cleanString(value.status || value.result || value.message);
  if (direct) return direct;
  for (const nested of Object.values(value)) {
    if (isObject(nested) || Array.isArray(nested)) {
      const status = findStatus(nested);
      if (status) return status;
    }
  }
  return '';
}

function scoreGrade(score: number | null) {
  if (!score) return 'Fair';
  if (score >= 800) return 'Excellent';
  if (score >= 720) return 'Good';
  if (score >= 660) return 'Fair';
  return 'Poor';
}

function buildEligibilityResultFromReport(report: CrmEligibilityReport) {
  const score = Number(report.score || 0);
  return {
    eligible: Boolean(report.eligible),
    score,
    scoreGrade: scoreGrade(score || null),
    maxLoanAmount: Number(report.max_loan_amount || 0),
    recommendedEMI: 0,
    foir: Number(report.foir || 0),
    remarks: [
      score
        ? `Saved bureau score: ${score}`
        : `Saved bureau status: ${report.status || 'available'}`,
      'Saved CRM report used. No live bureau API was called.',
      report.matched_lenders?.length
        ? `${report.matched_lenders.length} lender policy match found in saved result.`
        : 'Open the PDF for the full saved bureau report.',
    ],
    matchedLenders: Array.isArray(report.matched_lenders) ? report.matched_lenders : [],
    rawBureauResponse: report.bureau_response,
    reportId: report.id,
    requestId: report.request_id,
    customerName: report.borrower_name,
    createdAt: report.created_at,
  };
}

function findSavedReport(
  store: CrmStore,
  input: { leadId: string; mobile: string; pan: string; reportId?: string }
) {
  const reports = Array.isArray(store.reports) ? store.reports : [];
  if (input.reportId) {
    const report = reports.find((item) => item.id === input.reportId);
    if (report) return report;
  }

  const lead = input.leadId ? store.leads.find((item) => item.id === input.leadId) : null;
  if (lead?.eligibilityReportId) {
    const report = reports.find((item) => item.id === lead.eligibilityReportId);
    if (report) return report;
  }

  const mobileMatch = reports.find(
    (item) => digits(item.cibil_payload?.mobile).slice(-10) === input.mobile
  );
  if (mobileMatch) return mobileMatch;

  const pan = input.pan.toUpperCase();
  if (pan) {
    const panMatch = reports.find(
      (item) => cleanString(item.cibil_payload?.pan).toUpperCase() === pan
    );
    if (panMatch) return panMatch;
  }

  return reports[0] || null;
}

async function getCrmStore(request: NextRequest, supabase: ReturnType<typeof createAdminClient>) {
  const scope = await resolveCrmScope(request, supabase);
  const { data, error } = await supabase
    .from('b2c_report_requests')
    .select('id,report_json')
    .eq('mobile', scope.storeMobile)
    .eq('status', scope.storeStatus)
    .maybeSingle();
  if (error) throw error;
  if (data?.id) {
    const raw = isObject(data.report_json) ? data.report_json : {};
    const credits = isObject(raw.eligibility_credits) ? raw.eligibility_credits : {};
    return {
      rowId: data.id as string,
      store: {
        eligibility_credits: {
          balance: Math.max(
            0,
            Number(credits.balance ?? defaultCrmStore.eligibility_credits.balance)
          ),
          total_added: Math.max(
            0,
            Number(credits.total_added ?? defaultCrmStore.eligibility_credits.total_added)
          ),
          total_used: Math.max(0, Number(credits.total_used ?? 0)),
          per_check_cost: Math.max(1, Number(credits.per_check_cost ?? 1)),
        },
        credit_transactions: Array.isArray(raw.credit_transactions)
          ? (raw.credit_transactions.slice(0, 200) as CrmCreditTransaction[])
          : [],
        invoices: Array.isArray(raw.invoices) ? (raw.invoices.slice(0, 200) as CrmInvoice[]) : [],
        lenders: normalizeLenders(raw.lenders),
        leads: normalizeLeads(raw.leads),
        applications: normalizeApplications(raw.applications),
        team: normalizeTeam(raw.team),
        reports: Array.isArray(raw.reports)
          ? (raw.reports.slice(0, 200) as CrmEligibilityReport[])
          : [],
      } satisfies CrmStore,
      scope,
    };
  }

  const initialStore = {
    ...defaultCrmStore,
    leads: scope.isDemo ? defaultCrmStore.leads : [],
    applications: [],
    reports: [],
  } satisfies CrmStore;

  const { data: inserted, error: insertError } = await supabase
    .from('b2c_report_requests')
    .insert({
      mobile: scope.storeMobile,
      full_name: scope.storeName,
      status: scope.storeStatus,
      report_type: 'crm_store',
      report_json: {
        ...initialStore,
        scope: {
          partner_id: scope.partnerId,
          user_id: scope.userId,
          scoped_at: new Date().toISOString(),
        },
      },
      consent_given: true,
      consent_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (insertError) throw insertError;
  return { rowId: inserted.id as string, store: initialStore, scope };
}

async function saveCrmStore(
  supabase: ReturnType<typeof createAdminClient>,
  rowId: string,
  store: CrmStore
) {
  const { error } = await supabase
    .from('b2c_report_requests')
    .update({ report_json: store, updated_at: new Date().toISOString() })
    .eq('id', rowId);
  if (error) throw error;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { store, scope } = await getCrmStore(request, supabase);
    const tableData = await getCrmTableData(supabase, scope);
    const effectiveStore = tableData ? { ...store, ...tableData } : store;
    const access = requireCrmPermission(scope, effectiveStore, 'eligibility_check');
    if (!access.ok) return jsonError(access.error, access.status);
    return NextResponse.json({ success: true, data: effectiveStore, scope });
  } catch (error) {
    console.error('[crm:eligibility-wallet] GET failed:', error);
    return jsonError(error instanceof Error ? error.message : 'Unable to load CRM wallet', 500);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(bearerToken(request));
  if ('error' in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const requestId = `CRM-ELIG-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  try {
    const body = await request.json();
    if (!isObject(body)) return jsonError('Request body must be JSON', 400);
    const action = cleanString(body.action);

    {
      const supabase = createAdminClient();
      const { store, scope } = await getCrmStore(request, supabase);
      const tableData = await getCrmTableData(supabase, scope);
      const effectiveStore = tableData ? { ...store, ...tableData } : store;
      const access = requireCrmPermission(scope, effectiveStore, permissionForAction(action));
      if (!access.ok) return jsonError(access.error, access.status);
    }

    if (body.action === 'add_credits') {
      const credits = Math.max(1, Number(body.credits || 0));
      const supabase = createAdminClient();
      const { rowId, store } = await getCrmStore(request, supabase);
      const invoiceNumber = generateInvoiceNumber();
      const createdAt = new Date().toISOString();
      store.eligibility_credits = {
        ...store.eligibility_credits,
        balance: store.eligibility_credits.balance + credits,
        total_added: store.eligibility_credits.total_added + credits,
      };
      const transaction: CrmCreditTransaction = {
        id: crypto.randomUUID(),
        type: 'credit',
        credits,
        description: cleanString(body.note) || `Eligibility credits recharge: ${credits}`,
        status: 'paid',
        invoice_number: invoiceNumber,
        created_at: createdAt,
      };
      const invoice: CrmInvoice = {
        id: crypto.randomUUID(),
        invoice_number: invoiceNumber,
        amount: credits,
        credits_added: credits,
        status: 'paid',
        issued_at: createdAt,
        notes: cleanString(body.note),
      };
      store.credit_transactions = [transaction, ...(store.credit_transactions || [])].slice(0, 200);
      store.invoices = [invoice, ...(store.invoices || [])].slice(0, 200);
      await saveCrmStore(supabase, rowId, store);
      return NextResponse.json({ success: true, data: store });
    }

    if (body.action === 'withdraw_eligibility_consent') {
      const eligibilityReportId = cleanString(body.eligibilityReportId);
      const reason = cleanString(body.reason);
      if (!eligibilityReportId || reason.length < 5 || reason.length > 2000) {
        return jsonError('Eligibility report and a meaningful withdrawal reason are required');
      }
      const supabase = createAdminClient();
      const scope = await resolveCrmScope(request, supabase);
      if (!scope.partnerId || scope.isDemo) return jsonError('Partner account is required', 403);
      const { data, error } = await supabase.rpc('withdraw_lender_eligibility_consent', {
        p_partner_id: scope.partnerId,
        p_eligibility_report_id: eligibilityReportId,
        p_reason: reason,
        p_actor_user_id: scope.userId,
      });
      if (error) return jsonError(error.message, 409);
      return NextResponse.json({ success: true, data });
    }

    if (body.action === 'seed_demo_eligibility') {
      if (process.env.NODE_ENV === 'production' || process.env.CRM_ALLOW_DEMO_SEED !== 'true') {
        return jsonError('Demo seed is disabled in production', 403);
      }

      const supabase = createAdminClient();
      const { rowId, store } = await getCrmStore(request, supabase);
      const now = new Date().toISOString();
      const demos = [
        {
          leadId: 'lead-demo-lender-flow',
          reportId: 'rpt-demo-lender-flow',
          requestId: 'CRM-DEMO-LENDER-FLOW',
          name: 'Demo Eligible Customer',
          firstName: 'Demo',
          lastName: 'Customer',
          mobile: '9876543210',
          maskedMobile: '98765XXXXX',
          email: 'demo.customer@credittrust.in',
          product: 'home_loan',
          loanAmount: 4200000,
          city: 'Mumbai',
          state: 'MAHARASHTRA',
          pincode: '400001',
          pan: 'DEMOX1234X',
          score: 782,
          foir: 38,
          maxLoanAmount: 4800000,
          agent: 'Priya Sharma',
          matchedLenders: [
            { name: 'HDFC Bank', roi: '8.65%', maxLoan: '₹42L' },
            { name: 'Axis Bank', roi: '8.9%', maxLoan: '₹38L' },
            { name: 'ICICI Bank', roi: '9.1%', maxLoan: '₹35L' },
          ],
        },
        {
          leadId: 'lead-demo-lender-flow-2',
          reportId: 'rpt-demo-lender-flow-2',
          requestId: 'CRM-DEMO-LENDER-FLOW-2',
          name: 'Amit Sharma Demo',
          firstName: 'Amit',
          lastName: 'Sharma',
          mobile: '9123456780',
          maskedMobile: '91234XXXXX',
          email: 'amit.demo@credittrust.in',
          product: 'personal_loan',
          loanAmount: 850000,
          city: 'Pune',
          state: 'MAHARASHTRA',
          pincode: '411001',
          pan: 'DEMOS2345A',
          score: 756,
          foir: 41,
          maxLoanAmount: 1100000,
          agent: 'Anil Mehta',
          matchedLenders: [
            { name: 'Bajaj Finserv', roi: '11-24%', maxLoan: '₹8.5L' },
            { name: 'HDFC Bank', roi: '8.5-12%', maxLoan: '₹8.5L' },
            { name: 'ICICI Bank', roi: '8.75-13.5%', maxLoan: '₹8.5L' },
          ],
        },
        {
          leadId: 'lead-demo-lender-flow-3',
          reportId: 'rpt-demo-lender-flow-3',
          requestId: 'CRM-DEMO-LENDER-FLOW-3',
          name: 'Kavita Rao Demo',
          firstName: 'Kavita',
          lastName: 'Rao',
          mobile: '9988776655',
          maskedMobile: '99887XXXXX',
          email: 'kavita.demo@credittrust.in',
          product: 'business_loan',
          loanAmount: 2500000,
          city: 'Ahmedabad',
          state: 'GUJARAT',
          pincode: '380001',
          pan: 'DEMOR6789K',
          score: 724,
          foir: 47,
          maxLoanAmount: 2800000,
          agent: 'Priya Sharma',
          matchedLenders: [
            { name: 'ICICI Bank', roi: '8.75-13.5%', maxLoan: '₹25L' },
            { name: 'Tata Capital', roi: '10.99-18%', maxLoan: '₹25L' },
            { name: 'Bajaj Finserv', roi: '11-24%', maxLoan: '₹25L' },
          ],
        },
      ];

      const demoReports: CrmEligibilityReport[] = demos.map((demo) => ({
        id: demo.reportId,
        request_id: demo.requestId,
        borrower_name: demo.name,
        pan: demo.pan,
        mobile: demo.maskedMobile,
        loan_type: demo.product,
        loan_amount: demo.loanAmount,
        score: demo.score,
        eligible: true,
        status: 'score_pulled',
        foir: demo.foir,
        max_loan_amount: demo.maxLoanAmount,
        matched_lenders: demo.matchedLenders,
        credits_deducted: 0,
        created_at: now,
        cibil_payload: {
          firstName: demo.firstName,
          lastName: demo.lastName,
          mobile: demo.mobile,
          state: demo.state,
          pincode: demo.pincode,
        },
        bureau_response: {
          provider: 'demo',
          score: demo.score,
          status: 'demo_lender_match',
        },
      }));

      const demoLeads: CrmLead[] = demos.map((demo) => ({
        id: demo.leadId,
        name: demo.name,
        mobile: demo.mobile,
        email: demo.email,
        product: demo.product,
        loanAmount: demo.loanAmount,
        source: 'web',
        stage: 'eligibility_done',
        assignedAgent: demo.agent,
        lastContact: new Date().toLocaleDateString('en-IN'),
        nextFollowUp: '-',
        daysInStage: 0,
        city: demo.city,
        notes: 'Demo lead for lender selection testing',
        eligibilityReportId: demo.reportId,
        createdAt: now,
        updatedAt: now,
      }));

      const demoLeadIds = new Set(demos.map((demo) => demo.leadId));
      const demoReportIds = new Set(demos.map((demo) => demo.reportId));

      store.reports = [
        ...demoReports,
        ...(store.reports || []).filter((report) => !demoReportIds.has(report.id)),
      ].slice(0, 200);
      store.leads = [
        ...demoLeads,
        ...(store.leads || []).filter((lead) => !demoLeadIds.has(lead.id)),
      ].slice(0, 500);
      store.applications = (store.applications || []).filter(
        (application) => !demoLeadIds.has(application.leadId)
      );
      await saveCrmStore(supabase, rowId, store);
      await Promise.all([
        ...demoLeads.map((lead) => upsertCrmLead(supabase, scope, lead)),
        ...demoReports.map((report) =>
          insertCrmEligibilityReport(supabase, scope, report, report.id.replace('rpt-', 'lead-'))
        ),
      ]);
      return NextResponse.json({ success: true, data: { leads: demoLeads, reports: demoReports } });
    }

    if (body.action === 'submit_to_lender') {
      const leadId = cleanString(body.leadId);
      const lenderName = cleanString(body.lenderName);
      const requestedProgramId = cleanString(body.programId);
      const overrideReasonCode = cleanString(body.overrideReasonCode).toUpperCase();
      const overrideNote = cleanString(body.overrideNote);
      const switchReason = cleanString(body.switchReason);
      if (!leadId) return jsonError('Lead is required', 400);
      if (!lenderName) return jsonError('Lender is required', 400);

      const supabase = createAdminClient();
      const { rowId, store, scope } = await getCrmStore(request, supabase);
      const tableData = await getCrmTableData(supabase, scope);
      if (tableData) {
        store.leads = tableData.leads;
        store.applications = tableData.applications;
        store.reports = tableData.reports;
        store.lenders = tableData.lenders;
      }
      const lead = store.leads.find((item) => item.id === leadId);
      if (!lead) return jsonError('Lead not found', 404);
      const isLenderSwitch = Boolean(
        lead.selectedLender && lead.selectedLender.toLowerCase() !== lenderName.toLowerCase()
      );
      if (isLenderSwitch && !switchReason) {
        return jsonError('Rerouting reason is required when changing the selected lender', 409);
      }

      const eligibilityReport = lead.eligibilityReportId
        ? store.reports.find((item) => item.id === lead.eligibilityReportId)
        : null;
      if (!eligibilityReport) {
        return jsonError('Run eligibility before selecting a lender', 409);
      }

      let matchedLender = (eligibilityReport.matched_lenders || []).find(
        (item) => cleanString(item.name).toLowerCase() === lenderName.toLowerCase()
      );
      let approvedExceptionId = '';
      let approvedExceptionReasonCode = '';
      let approvedExceptionNote = '';
      if (!matchedLender && requestedProgramId && scope.partnerId) {
        const { data: exception } = await supabase
          .from('lender_routing_exceptions')
          .select(
            'id,program_id,lender_id,reason_code,reason_note,lender_master!inner(display_name)'
          )
          .eq('partner_id', scope.partnerId)
          .eq('eligibility_report_id', eligibilityReport.id)
          .eq('program_id', requestedProgramId)
          .eq('status', 'approved')
          .maybeSingle();
        const exceptionLender = exception
          ? Array.isArray(exception.lender_master)
            ? exception.lender_master[0]
            : exception.lender_master
          : null;
        if (
          exception &&
          cleanString(exceptionLender?.display_name).toLowerCase() === lenderName.toLowerCase()
        ) {
          approvedExceptionId = exception.id;
          approvedExceptionReasonCode = cleanString(exception.reason_code);
          approvedExceptionNote = cleanString(exception.reason_note);
          matchedLender = {
            name: lenderName,
            roi: '-',
            maxLoan: '-',
          };
        }
      }
      if (!matchedLender) {
        return jsonError('Selected lender is not an eligible match for this lead', 409);
      }

      const matchedDetails = matchedLender as unknown as Record<string, unknown>;
      const matchedProgramId =
        cleanString(matchedDetails.programId) || (approvedExceptionId ? requestedProgramId : '');
      const selectedRank = Number(matchedDetails.rank || 0) || null;
      if (selectedRank && selectedRank > 1 && (!overrideReasonCode || !overrideNote)) {
        return jsonError('Override reason is required when selecting outside rank 1', 409);
      }
      let selectedLenderId = '';
      let selectedProgramId = '';
      if (matchedProgramId) {
        const { data: program, error: programError } = await supabase
          .from('lender_programs')
          .select(
            'id,lender_id,status,capacity_status,lender_master!inner(display_name,onboarding_status)'
          )
          .eq('id', matchedProgramId)
          .single();
        if (programError) return jsonError('Selected lender program is unavailable', 409);
        const lender = Array.isArray(program.lender_master)
          ? program.lender_master[0]
          : program.lender_master;
        if (
          program.status !== 'active' ||
          program.capacity_status === 'paused' ||
          lender?.onboarding_status !== 'active' ||
          cleanString(lender?.display_name).toLowerCase() !== lenderName.toLowerCase()
        ) {
          return jsonError('Selected lender program is no longer active', 409);
        }
        selectedLenderId = cleanString(program.lender_id);
        selectedProgramId = cleanString(program.id);
      }

      const activeLegacyLender = store.lenders.find(
        (item) => item.status === 'active' && item.name.toLowerCase() === lenderName.toLowerCase()
      );
      if (!matchedProgramId && !activeLegacyLender) {
        return jsonError('Selected lender is no longer active', 409);
      }

      const now = new Date().toISOString();
      const terminalStatuses: CrmApplication['status'][] = ['rejected', 'rerouted', 'disbursed'];
      const previousApplication = isLenderSwitch
        ? (store.applications || []).find(
            (item) =>
              item.leadId === leadId &&
              item.lenderName.toLowerCase() === lead.selectedLender?.toLowerCase() &&
              !terminalStatuses.includes(item.status)
          )
        : undefined;
      if (previousApplication) {
        previousApplication.status = 'rerouted';
        previousApplication.statusHistory = [
          {
            status: 'rerouted' as const,
            note: `Rerouted from ${previousApplication.lenderName} to ${lenderName}: ${switchReason}`,
            changedAt: now,
            changedBy: 'Admin',
          },
          ...(previousApplication.statusHistory || []),
        ].slice(0, 100);
        previousApplication.lenderHistory = [
          {
            lenderName: previousApplication.lenderName,
            status: 'rerouted',
            changedAt: now,
            note: `Transferred to ${lenderName}: ${switchReason}`,
          },
          ...(previousApplication.lenderHistory || []),
        ].slice(0, 100);
        previousApplication.updatedAt = now;
      }
      const existingApplication = (store.applications || []).find(
        (item) =>
          item.leadId === leadId &&
          item.lenderName.toLowerCase() === lenderName.toLowerCase() &&
          !terminalStatuses.includes(item.status)
      );
      if (existingApplication && selectedProgramId && scope.partnerId && !scope.isDemo) {
        return NextResponse.json({
          success: true,
          data: { application: existingApplication, leads: store.leads, idempotent: true },
        });
      }
      const application: CrmApplication = existingApplication || {
        id: crypto.randomUUID(),
        leadId,
        customerName: lead.name,
        mobile: lead.mobile,
        lenderName,
        product: lead.product,
        loanAmount: lead.loanAmount,
        status: 'case_sent_to_lender',
        statusHistory: [
          {
            status: 'case_sent_to_lender',
            note: `Case sent to ${lenderName}`,
            changedAt: now,
            changedBy: 'System',
          },
        ],
        notes: [],
        lenderHistory: [
          ...(isLenderSwitch && lead.selectedLender
            ? [
                {
                  lenderName: lead.selectedLender,
                  status: 'rerouted',
                  changedAt: now,
                  note: `Transferred to ${lenderName}: ${switchReason}`,
                },
              ]
            : []),
          {
            lenderName,
            status: 'sent',
            changedAt: now,
            note: `File process created with ${lenderName}`,
          },
        ],
        documents: createDefaultApplicationDocuments(lead.product),
        createdAt: now,
        updatedAt: now,
      };

      store.applications = existingApplication
        ? store.applications
        : [application, ...(store.applications || [])].slice(0, 200);
      store.leads = store.leads.map((item) =>
        item.id === leadId
          ? {
              ...item,
              stage: 'submitted_to_lender',
              selectedLender: lenderName,
              updatedAt: now,
            }
          : item
      );
      const decisionType = approvedExceptionId
        ? 'exception'
        : selectedRank && selectedRank > 1
          ? 'override'
          : 'selected';
      const selectionReasonCode = approvedExceptionId
        ? approvedExceptionReasonCode
        : decisionType === 'override'
          ? overrideReasonCode
          : '';
      const selectionReasonNote = approvedExceptionId
        ? approvedExceptionNote
        : decisionType === 'override'
          ? overrideNote
          : '';
      let usedAtomicReroute = false;
      let usedAtomicSelection = false;
      if (previousApplication && selectedProgramId && scope.partnerId && !scope.isDemo) {
        const { error: rerouteError } = await supabase.rpc('reroute_crm_application', {
          p_partner_id: scope.partnerId,
          p_previous_application_id: previousApplication.id,
          p_new_application: application,
          p_new_lender_id: selectedLenderId || null,
          p_new_program_id: selectedProgramId || null,
          p_reason: switchReason,
          p_eligibility_report_id: eligibilityReport.id,
          p_selected_rank: selectedRank,
          p_decision_type: decisionType,
          p_reason_code: selectionReasonCode,
          p_reason_note: selectionReasonNote,
          p_exception_id: approvedExceptionId || null,
          p_actor_user_id: scope.userId,
          p_occurred_at: now,
        });
        if (rerouteError) throw rerouteError;
        usedAtomicReroute = true;
        await saveCrmApplicationDocuments(supabase, scope, application);
        await logCrmAudit(supabase, scope, {
          module: 'file_process',
          action: 'reroute_application',
          entityType: 'application',
          entityId: application.id,
          summary: `${lead.name} file rerouted from ${previousApplication.lenderName} to ${lenderName}`,
          metadata: { previousApplicationId: previousApplication.id, switchReason },
        });
      } else if (previousApplication) {
        await upsertCrmApplication(supabase, scope, previousApplication);
      }
      if (
        !previousApplication &&
        !existingApplication &&
        selectedProgramId &&
        scope.partnerId &&
        !scope.isDemo
      ) {
        const { error: selectionError } = await supabase.rpc('commit_lender_selection', {
          p_partner_id: scope.partnerId,
          p_eligibility_report_id: eligibilityReport.id,
          p_application: application,
          p_lender_id: selectedLenderId,
          p_program_id: selectedProgramId,
          p_selected_rank: selectedRank,
          p_decision_type: decisionType,
          p_reason_code: selectionReasonCode,
          p_reason_note: selectionReasonNote,
          p_exception_id: approvedExceptionId || null,
          p_actor_user_id: scope.userId,
          p_occurred_at: now,
        });
        if (selectionError) throw selectionError;
        usedAtomicSelection = true;
        await saveCrmApplicationDocuments(supabase, scope, application);
        await logCrmAudit(supabase, scope, {
          module: 'lender_selection',
          action: 'commit_lender_selection',
          entityType: 'application',
          entityId: application.id,
          summary: `${lead.name} file committed to ${lenderName}`,
          metadata: {
            selectedProgramId,
            selectedRank,
            decisionType,
            approvedExceptionId: approvedExceptionId || null,
          },
        });
      }
      if (!usedAtomicReroute && !usedAtomicSelection)
        await upsertCrmApplication(supabase, scope, application);
      await saveCrmStore(supabase, rowId, store);
      const changedLead = store.leads.find((item) => item.id === leadId);
      if (changedLead) await upsertCrmLead(supabase, scope, changedLead);
      return NextResponse.json({ success: true, data: { application, leads: store.leads } });
    }

    if (body.action === 'update_application_status') {
      const applicationId = cleanString(body.applicationId);
      const status = cleanString(body.status);
      const note = cleanString(body.note);
      const rejectionReason = cleanString(body.rejectionReason);
      const rejectionReasonCode = cleanString(body.rejectionReasonCode).toUpperCase();
      const sanctionedAmount = Math.max(0, Number(body.sanctionedAmount || 0));
      const disbursedAmount = Math.max(0, Number(body.disbursedAmount || 0));
      const approvedRoi = Math.max(0, Number(body.approvedRoi || 0));
      const approvedTenureMonths = Math.max(0, Number(body.approvedTenureMonths || 0));
      if (!applicationId) return jsonError('Application is required', 400);
      if (!isLenderApplicationStage(status)) return jsonError('Valid status is required', 400);
      if (note.length > 2000 || rejectionReason.length > 2000 || rejectionReasonCode.length > 50) {
        return jsonError('Application outcome text exceeds the allowed length', 400);
      }
      if (
        ![sanctionedAmount, disbursedAmount, approvedRoi, approvedTenureMonths].every(
          Number.isFinite
        )
      ) {
        return jsonError('Application outcome values must be valid numbers', 400);
      }
      if (sanctionedAmount > 1_000_000_000_000 || disbursedAmount > 1_000_000_000_000) {
        return jsonError('Application outcome amount is outside the allowed range', 400);
      }
      if (
        [body.sanctionedAmount, body.disbursedAmount].some((value) => {
          const amount = cleanString(value);
          return amount.length > 0 && !/^\d+(?:\.\d{1,2})?$/.test(amount);
        })
      ) {
        return jsonError('Application outcome amounts cannot contain sub-paise precision', 400);
      }
      if (approvedRoi > 100) return jsonError('Approved ROI must be between 0 and 100', 400);
      if (approvedTenureMonths > 1200) {
        return jsonError('Approved tenure must be between 0 and 1200 months', 400);
      }

      const supabase = createAdminClient();
      const { rowId, store, scope } = await getCrmStore(request, supabase);
      const tableData = await getCrmTableData(supabase, scope);
      if (tableData) store.applications = tableData.applications;
      const existingApplication = (store.applications || []).find(
        (application) => application.id === applicationId
      );
      if (!existingApplication) return jsonError('Application not found', 404);
      if (!canTransitionLenderApplication(existingApplication.status, status)) {
        return jsonError(
          `Invalid lender stage transition from ${existingApplication.status} to ${status}`,
          409
        );
      }

      if (status === 'sanctioned' && sanctionedAmount <= 0) {
        return jsonError('Sanctioned amount must be greater than zero', 400);
      }
      if (status === 'sanctioned' && approvedRoi <= 0) {
        return jsonError('Approved ROI must be greater than zero', 400);
      }
      if (
        status === 'sanctioned' &&
        (approvedTenureMonths <= 0 || !Number.isInteger(approvedTenureMonths))
      ) {
        return jsonError('Approved tenure must be a positive whole number of months', 400);
      }
      if (status === 'disbursed' && disbursedAmount <= 0) {
        return jsonError('Disbursed amount must be greater than zero', 400);
      }
      if (status === 'disbursed') {
        const { data: boundDecision, error: boundDecisionError } = await supabase
          .from('lender_routing_decisions')
          .select('selected_lender_id,selected_program_id')
          .eq('partner_id', scope.partnerId)
          .eq('application_id', applicationId)
          .order('decided_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (boundDecisionError) return jsonError(boundDecisionError.message, 500);
        if (!boundDecision?.selected_lender_id || !boundDecision.selected_program_id) {
          return jsonError('A bound lender decision is required before disbursal', 409);
        }
        const { data: approvedOutcome, error: approvedOutcomeError } = await supabase
          .from('lender_outcomes')
          .select('sanctioned_amount')
          .eq('partner_id', scope.partnerId)
          .eq('application_id', applicationId)
          .eq('lender_id', boundDecision.selected_lender_id)
          .eq('program_id', boundDecision.selected_program_id)
          .eq('outcome', 'approved')
          .order('decided_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (approvedOutcomeError) return jsonError(approvedOutcomeError.message, 500);
        if (!approvedOutcome) {
          return jsonError('Record a canonical sanction before disbursal', 409);
        }
        if (disbursedAmount > Number(approvedOutcome.sanctioned_amount || 0)) {
          return jsonError('Disbursed amount cannot exceed the sanctioned amount', 400);
        }
      }

      if (status === 'rejected') {
        if (!rejectionReasonCode || !rejectionReason) {
          return jsonError('Rejection reason code and detail are required', 400);
        }
        let reasonQuery = supabase
          .from('lender_rejection_reasons')
          .select('code')
          .eq('code', rejectionReasonCode)
          .eq('active', true);
        reasonQuery = scope.partnerId
          ? reasonQuery.or(`partner_id.is.null,partner_id.eq.${scope.partnerId}`)
          : reasonQuery.is('partner_id', null);
        const { data: reason } = await reasonQuery.limit(1).maybeSingle();
        if (!reason) return jsonError('Select a valid active rejection reason', 400);
      }

      const occurredAt = new Date().toISOString();

      store.applications = (store.applications || []).map((application) =>
        application.id === applicationId
          ? {
              ...application,
              status: status as CrmApplication['status'],
              rejectionReason:
                status === 'rejected'
                  ? rejectionReason || application.rejectionReason || note || 'Rejected'
                  : application.rejectionReason,
              statusHistory: [
                {
                  status: status as CrmApplication['status'],
                  note:
                    note ||
                    (status === 'rejected' && rejectionReason
                      ? rejectionReason
                      : `Status changed to ${status.replace(/_/g, ' ')}`),
                  changedAt: occurredAt,
                  changedBy: 'Admin',
                },
                ...(application.statusHistory || []),
              ].slice(0, 100),
              updatedAt: occurredAt,
            }
          : application
      );
      const changedApplication = (store.applications || []).find(
        (application) => application.id === applicationId
      );
      if (!changedApplication || !scope.partnerId)
        return jsonError('Persisted partner application is required', 409);
      const { error: transitionError } = await supabase.rpc('transition_lender_application', {
        p_partner_id: scope.partnerId,
        p_application_id: applicationId,
        p_expected_from_stage: existingApplication.status,
        p_to_stage: status,
        p_status_history: changedApplication.statusHistory || [],
        p_note: note || rejectionReason || '',
        p_reason_code: status === 'rejected' ? rejectionReasonCode || 'OTHER' : '',
        p_rejection_reason: rejectionReason || '',
        p_sanctioned_amount: sanctionedAmount,
        p_disbursed_amount: disbursedAmount,
        p_approved_roi: approvedRoi,
        p_approved_tenure_months: approvedTenureMonths,
        p_actor_user_id: scope.userId,
        p_occurred_at: occurredAt,
      });
      if (transitionError) return jsonError(transitionError.message, 409);
      // The normalized tables above are authoritative. Keep the legacy JSON store synchronized for older screens.
      await saveCrmStore(supabase, rowId, store).catch(() => undefined);
      return NextResponse.json({ success: true, data: { applications: store.applications } });
    }

    if (body.action === 'add_application_note') {
      const applicationId = cleanString(body.applicationId);
      const note = cleanString(body.note);
      if (!applicationId) return jsonError('Application is required', 400);
      if (!note) return jsonError('Note is required', 400);

      const supabase = createAdminClient();
      const { rowId, store, scope } = await getCrmStore(request, supabase);
      const tableData = await getCrmTableData(supabase, scope);
      if (tableData) store.applications = tableData.applications;
      const existingApplication = (store.applications || []).find(
        (application) => application.id === applicationId
      );
      if (!existingApplication) return jsonError('Application not found', 404);

      const now = new Date().toISOString();
      store.applications = (store.applications || []).map((application) =>
        application.id === applicationId
          ? {
              ...application,
              notes: [
                {
                  id: crypto.randomUUID(),
                  note,
                  createdAt: now,
                  createdBy: 'Admin',
                },
                ...(application.notes || []),
              ].slice(0, 100),
              updatedAt: now,
            }
          : application
      );
      await saveCrmStore(supabase, rowId, store);
      const changedApplication = (store.applications || []).find(
        (application) => application.id === applicationId
      );
      if (changedApplication) await upsertCrmApplication(supabase, scope, changedApplication);
      return NextResponse.json({ success: true, data: { applications: store.applications } });
    }

    if (body.action === 'update_application_document') {
      const applicationId = cleanString(body.applicationId);
      const documentId = cleanString(body.documentId);
      const status = cleanString(body.status);
      const fileName = cleanString(body.fileName);
      const note = cleanString(body.note);
      const allowedStatuses = new Set(['missing', 'uploaded', 'verified', 'rejected']);
      if (!applicationId) return jsonError('Application is required', 400);
      if (!documentId) return jsonError('Document is required', 400);
      if (!allowedStatuses.has(status)) return jsonError('Valid document status is required', 400);

      const supabase = createAdminClient();
      const { rowId, store, scope } = await getCrmStore(request, supabase);
      const tableData = await getCrmTableData(supabase, scope);
      if (tableData) store.applications = tableData.applications;
      const existingApplication = (store.applications || []).find(
        (application) => application.id === applicationId
      );
      if (!existingApplication) return jsonError('Application not found', 404);

      const now = new Date().toISOString();
      store.applications = (store.applications || []).map((application) => {
        if (application.id !== applicationId) return application;
        const documents = normalizeApplicationDocuments(application.documents, application.product);
        const nextDocuments = documents.map((document) => {
          if (document.id !== documentId) return document;
          return {
            ...document,
            status: status as 'missing' | 'uploaded' | 'verified' | 'rejected',
            fileName: fileName || document.fileName,
            uploadedAt: status === 'uploaded' ? now : document.uploadedAt,
            verifiedAt: status === 'verified' ? now : document.verifiedAt,
            rejectedAt: status === 'rejected' ? now : document.rejectedAt,
            note: note || document.note,
          };
        });
        const documentName = nextDocuments.find((document) => document.id === documentId)?.name;
        return {
          ...application,
          documents: nextDocuments,
          notes: [
            {
              id: crypto.randomUUID(),
              note: note || `${documentName || 'Document'} marked ${status.replace(/_/g, ' ')}`,
              createdAt: now,
              createdBy: 'System',
            },
            ...(application.notes || []),
          ].slice(0, 100),
          updatedAt: now,
        };
      });
      await saveCrmStore(supabase, rowId, store);
      const changedApplication = (store.applications || []).find(
        (application) => application.id === applicationId
      );
      if (changedApplication) {
        await upsertCrmApplication(supabase, scope, changedApplication);
        await saveCrmApplicationDocuments(supabase, scope, changedApplication);
      }
      return NextResponse.json({ success: true, data: { applications: store.applications } });
    }

    if (body.action === 'update_application_followup') {
      const applicationId = cleanString(body.applicationId);
      const followUpDate = cleanString(body.followUpDate);
      if (!applicationId) return jsonError('Application is required', 400);

      const supabase = createAdminClient();
      const { rowId, store, scope } = await getCrmStore(request, supabase);
      const tableData = await getCrmTableData(supabase, scope);
      if (tableData) store.applications = tableData.applications;
      const existingApplication = (store.applications || []).find(
        (application) => application.id === applicationId
      );
      if (!existingApplication) return jsonError('Application not found', 404);

      const now = new Date().toISOString();
      store.applications = (store.applications || []).map((application) =>
        application.id === applicationId
          ? {
              ...application,
              followUpDate: followUpDate || undefined,
              notes: followUpDate
                ? [
                    {
                      id: crypto.randomUUID(),
                      note: `Follow-up scheduled for ${followUpDate}`,
                      createdAt: now,
                      createdBy: 'System',
                    },
                    ...(application.notes || []),
                  ].slice(0, 100)
                : application.notes,
              updatedAt: now,
            }
          : application
      );
      await saveCrmStore(supabase, rowId, store);
      const changedApplication = (store.applications || []).find(
        (application) => application.id === applicationId
      );
      if (changedApplication) {
        await upsertCrmApplication(supabase, scope, changedApplication);
        if (followUpDate) {
          await upsertCrmReminder(supabase, scope, {
            applicationId,
            title: `Follow-up: ${changedApplication.customerName}`,
            dueAt: followUpDate,
          });
        }
      }
      return NextResponse.json({ success: true, data: { applications: store.applications } });
    }

    const mode = cleanString(body.mode || 'full_details');
    const leadId = cleanString(body.leadId);
    const firstName = cleanString(body.firstName);
    const lastName = cleanString(body.lastName);
    const fullName =
      cleanString(body.fullName) || [firstName, lastName].filter(Boolean).join(' ').trim();
    const name = firstName || lastName ? { firstName, lastName } : splitName(fullName);
    const mobile = digits(body.mobile).slice(-10);
    const pan = cleanString(body.pan).toUpperCase();
    const pincode = digits(body.pincode).slice(0, 6);
    const city = cleanString(body.city);
    const dob = cleanString(body.dob);
    const loanType = cleanString(body.loanType);
    const loanAmount = Number(body.loanAmount || 0);
    const monthlyIncome = Number(body.monthlyIncome || 0) + Number(body.otherIncome || 0);
    const existingEmi = Number(body.existingEMI || 0);
    const tenure = Math.max(1, Number(body.tenure || 60));

    if (!/^\d{10}$/.test(mobile)) return jsonError('Valid mobile is required', 400);
    if (body.consent !== true) {
      return jsonError('Explicit customer consent attestation is required', 422);
    }

    const supabase = createAdminClient();
    const { rowId: crmRowId, store: crmStore, scope } = await getCrmStore(request, supabase);
    const tableData = await getCrmTableData(supabase, scope);
    if (tableData) {
      crmStore.leads = tableData.leads;
      crmStore.applications = tableData.applications;
      crmStore.lenders = tableData.lenders;
      crmStore.team = tableData.team;
      crmStore.reports = tableData.reports as CrmEligibilityReport[];
    }
    if (!CRM_LIVE_ELIGIBILITY_ENABLED) {
      const savedReport = findSavedReport(crmStore, {
        leadId,
        mobile,
        pan,
        reportId: cleanString(body.reportId),
      });
      if (!savedReport) {
        return jsonError(
          'No saved bureau report found for CRM safe mode. Run a live check only after enabling CRM_LIVE_ELIGIBILITY_ENABLED.',
          409
        );
      }

      if (leadId) {
        crmStore.leads = crmStore.leads.map((lead) =>
          lead.id === leadId
            ? {
                ...lead,
                stage: 'eligibility_done',
                eligibilityReportId: savedReport.id,
                updatedAt: new Date().toISOString(),
              }
            : lead
        );
        await saveCrmStore(supabase, crmRowId, crmStore);
        const changedLead = crmStore.leads.find((lead) => lead.id === leadId);
        if (changedLead) await upsertCrmLead(supabase, scope, changedLead);
      }

      await logCrmAudit(supabase, scope, {
        module: 'eligibility_check',
        action: 'saved_eligibility_replay',
        entityType: 'eligibility_report',
        entityId: savedReport.id,
        summary: `Saved eligibility report opened for ${savedReport.borrower_name || 'customer'}`,
        metadata: { requestId, savedReportId: savedReport.id, leadId },
      });

      return NextResponse.json({
        success: true,
        request_id: requestId,
        charged: { credits: 0, balance: crmStore.eligibility_credits.balance },
        mode: 'saved_report',
        data: buildEligibilityResultFromReport(savedReport),
      });
    }

    const creditCost = Math.max(1, Number(crmStore.eligibility_credits.per_check_cost || 1));
    if (crmStore.eligibility_credits.balance < creditCost)
      return jsonError('Insufficient eligibility credits', 402);

    const { rowId: apiHubRowId, store: apiHubStore } = await getApiHubStore(supabase);
    const bureauApi = findStandardApi(apiHubStore.apis) || defaultBureauApi;
    if (!bureauApi.master_url) return jsonError('Eligibility service is not configured', 500);

    let cibilPayload: Record<string, unknown>;
    let borrowerName = fullName || 'Mobile Customer';

    if (mode === 'mobile_advanced') {
      const advancedApi = findAdvancedApi(apiHubStore.apis);
      if (!advancedApi?.master_url)
        return jsonError('Mobile eligibility service is not configured', 500);

      const prefillResponse = await hitPrefillApi(advancedApi, mobile, requestId);
      if (!prefillResponse.ok) {
        return NextResponse.json(
          {
            success: false,
            request_id: requestId,
            error: `Mobile eligibility check failed with ${prefillResponse.status}`,
            data: prefillResponse.data,
          },
          { status: 502 }
        );
      }

      cibilPayload = buildPrefillCibilPayload(prefillResponse.data, mobile);
      borrowerName = [cleanString(cibilPayload.firstName), cleanString(cibilPayload.lastName)]
        .filter(Boolean)
        .join(' ');
    } else {
      if (!name.firstName || !name.lastName)
        return jsonError('Full name with first and last name is required', 400);
      if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(pan)) return jsonError('Valid PAN is required', 400);

      const state =
        cleanString(body.state) || stateFromPincode(pincode, city) || CRM_STANDARD_DEFAULTS.state;
      cibilPayload = {
        firstName: name.firstName,
        lastName: name.lastName,
        dob: dob || CRM_STANDARD_DEFAULTS.dob,
        gender: normalizeGender(body.gender) || CRM_STANDARD_DEFAULTS.gender,
        pan,
        mobile,
        address: cleanString(body.address) || CRM_STANDARD_DEFAULTS.address,
        state,
        pincode: pincode || CRM_STANDARD_DEFAULTS.pincode,
      };
    }

    const validationError = validateCibilPayload(cibilPayload);
    if (validationError) return jsonError(validationError, mode === 'mobile_advanced' ? 422 : 400);

    const bureauResponse = await hitMasterApi(bureauApi, cibilPayload);
    if (!bureauResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          request_id: requestId,
          error: `Eligibility check failed with ${bureauResponse.status}`,
          cibil_payload: cibilPayload,
          data: bureauResponse.data,
        },
        { status: 502 }
      );
    }

    const score = findScore(bureauResponse.data);
    const status = findStatus(bureauResponse.data) || (score ? 'score_pulled' : 'no_hit');
    const r = 10.5 / 12 / 100;
    const emi =
      loanAmount > 0
        ? (loanAmount * r * Math.pow(1 + r, tenure)) / (Math.pow(1 + r, tenure) - 1)
        : 0;
    const foir = monthlyIncome > 0 ? Math.round(((existingEmi + emi) / monthlyIncome) * 100) : 0;
    const eligible = Boolean(score && score >= 680 && (monthlyIncome > 0 ? foir <= 55 : true));
    const maxLoanAmount = Math.max(
      0,
      monthlyIncome > 0
        ? Math.round(((monthlyIncome * 0.55) / r) * (1 - Math.pow(1 + r, -tenure)))
        : 0
    );
    const routingInput = {
      score,
      loanType,
      loanAmount,
      monthlyIncome,
      tenure,
      foir,
      state: cleanString(cibilPayload.state),
      city,
      employmentType: cleanString(body.employmentType),
      channel: cleanString(body.channel) || 'crm',
      maxLoanAmount,
    };
    const policyResults =
      monthlyIncome > 0 && loanType
        ? await matchPublishedPrograms(supabase, scope, routingInput)
        : null;
    const matchedLenders = policyResults
      ? policyResults
          .filter((item) => item.matchStatus === 'eligible')
          .map((item) => ({
            name: item.lenderName,
            programId: item.programId,
            programName: item.programName,
            policyVersionId: item.policyVersionId,
            policyVersion: item.policyVersion,
            fitScore: item.fitScore,
            rank: item.rank,
            reasons: item.reasons,
            roi: item.roi,
            maxLoan: new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
              maximumFractionDigits: 0,
            }).format(
              Math.min(loanAmount || maxLoanAmount, item.maxLoan || loanAmount || maxLoanAmount)
            ),
            tat: item.tat,
          }))
      : monthlyIncome > 0 && loanType
        ? matchLenders(crmStore.lenders, {
            score,
            loanType,
            loanAmount,
            monthlyIncome,
            tenure,
            foir,
            state: cleanString(cibilPayload.state),
            maxLoanAmount,
          })
        : [];

    const remarks = [
      score ? `Bureau score received: ${score}` : `Bureau response status: ${status}`,
      monthlyIncome > 0
        ? foir <= 55
          ? `FOIR within policy at ${foir}%`
          : `FOIR is high at ${foir}%`
        : 'Mobile flow completed. Add income and loan details for FOIR-based lender matching.',
      eligible
        ? matchedLenders.length
          ? `${matchedLenders.length} lender policy match found.`
          : 'Customer passes score/FOIR policy, but no lender rule matched.'
        : 'Customer needs manual review or alternate lender mapping.',
    ];

    const consentAt = new Date().toISOString();
    const report: CrmEligibilityReport = {
      id: crypto.randomUUID(),
      request_id: requestId,
      borrower_name: borrowerName,
      pan: maskPan(cleanString(cibilPayload.pan)),
      mobile: maskMobile(mobile),
      loan_type: loanType || (mode === 'mobile_advanced' ? 'mobile_advanced' : ''),
      loan_amount: loanAmount,
      score,
      eligible,
      status,
      foir,
      max_loan_amount: maxLoanAmount,
      matched_lenders: eligible ? matchedLenders : [],
      credits_deducted: creditCost,
      created_at: new Date().toISOString(),
      cibil_payload: cibilPayload,
      bureau_response: bureauResponse.data,
      consent_given: true,
      consent_at: consentAt,
      consent_version: ELIGIBILITY_CONSENT_VERSION,
      consent_purpose: ELIGIBILITY_CONSENT_PURPOSE,
      consent_source: 'operator_attestation',
      consent_captured_by: scope.userId,
    };

    crmStore.eligibility_credits = {
      ...crmStore.eligibility_credits,
      balance: Math.max(0, crmStore.eligibility_credits.balance - creditCost),
      total_used: crmStore.eligibility_credits.total_used + creditCost,
    };
    const usageTransaction: CrmCreditTransaction = {
      id: crypto.randomUUID(),
      type: 'debit',
      credits: creditCost,
      description: `Eligibility check for ${borrowerName}`,
      status: 'paid',
      created_at: new Date().toISOString(),
    };
    crmStore.credit_transactions = [
      usageTransaction,
      ...(crmStore.credit_transactions || []),
    ].slice(0, 200);
    if (leadId) {
      crmStore.leads = crmStore.leads.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              stage: 'eligibility_done',
              eligibilityReportId: report.id,
              updatedAt: new Date().toISOString(),
            }
          : lead
      );
    }
    crmStore.reports = [report, ...crmStore.reports].slice(0, 200);
    await saveCrmStore(supabase, crmRowId, crmStore);
    await saveApiHubStore(supabase, apiHubRowId, apiHubStore);
    await insertCrmEligibilityReport(supabase, scope, report, leadId || undefined);
    if (policyResults) {
      await saveRoutingDecision(supabase, scope, {
        leadId: leadId || undefined,
        eligibilityReportId: report.id,
        engineVersion: 'policy-rules-v1',
        inputSnapshot: routingInput,
        results: policyResults,
      });
    }
    if (leadId) {
      const changedLead = crmStore.leads.find((lead) => lead.id === leadId);
      if (changedLead) await upsertCrmLead(supabase, scope, changedLead);
    }
    await logCrmAudit(supabase, scope, {
      module: 'eligibility_check',
      action: mode === 'mobile_advanced' ? 'mobile_eligibility_check' : 'full_eligibility_check',
      entityType: 'eligibility_report',
      entityId: report.id,
      summary: `Eligibility check completed for ${borrowerName}`,
      metadata: {
        requestId,
        score,
        status,
        leadId,
        consentVersion: ELIGIBILITY_CONSENT_VERSION,
        consentSource: 'operator_attestation',
        consentAt,
      },
    });

    return NextResponse.json({
      success: true,
      request_id: requestId,
      charged: { credits: creditCost, balance: crmStore.eligibility_credits.balance },
      data: {
        eligible,
        score: score || 0,
        scoreGrade: scoreGrade(score),
        maxLoanAmount,
        recommendedEMI: emi,
        foir,
        remarks,
        matchedLenders: eligible ? matchedLenders : [],
        rawBureauResponse: bureauResponse.data,
        reportId: report.id,
        requestId,
        customerName: borrowerName,
        createdAt: report.created_at,
      },
    });
  } catch (error) {
    console.error('[crm:eligibility-check] POST failed:', error);
    return jsonError(error instanceof Error ? error.message : 'Eligibility check failed', 500);
  }
}
