import { NextRequest, NextResponse } from 'next/server';
import {
  defaultBureauApi,
  getApiHubStore,
  hitMasterApi,
  saveApiHubStore,
  SimpleApiConfig,
} from '@/lib/api-hub/simple-store';
import { maskMobile, maskPan } from '@/lib/api-hub/keys';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStateName } from '@/lib/bureau/state-codes';
import {
  CrmLender,
  defaultCrmLenders,
  matchLenders,
  normalizeLenders,
} from '@/lib/crm/lender-policy';
import {
  CrmApplication,
  CrmLead,
  defaultCrmLeads,
  normalizeApplications,
  normalizeLeads,
} from '@/lib/crm/leads';

const CRM_STORE_MOBILE = '0000000001';
const CRM_STORE_STATUS = 'crm_store';

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
};

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
  reports: [],
};

function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CRM-INV-${year}-${rand}`;
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
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

async function getCrmStore(supabase: ReturnType<typeof createAdminClient>) {
  const { data, error } = await supabase
    .from('b2c_report_requests')
    .select('id,report_json')
    .eq('mobile', CRM_STORE_MOBILE)
    .eq('status', CRM_STORE_STATUS)
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
        reports: Array.isArray(raw.reports)
          ? (raw.reports.slice(0, 200) as CrmEligibilityReport[])
          : [],
      } satisfies CrmStore,
    };
  }

  const { data: inserted, error: insertError } = await supabase
    .from('b2c_report_requests')
    .insert({
      mobile: CRM_STORE_MOBILE,
      full_name: 'DSA CRM Store',
      status: CRM_STORE_STATUS,
      report_type: CRM_STORE_STATUS,
      report_json: defaultCrmStore,
      consent_given: true,
      consent_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (insertError) throw insertError;
  return { rowId: inserted.id as string, store: defaultCrmStore };
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

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { store } = await getCrmStore(supabase);
    return NextResponse.json({ success: true, data: store });
  } catch (error) {
    console.error('[crm:eligibility-wallet] GET failed:', error);
    return jsonError(error instanceof Error ? error.message : 'Unable to load CRM wallet', 500);
  }
}

export async function POST(request: NextRequest) {
  const requestId = `CRM-ELIG-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  try {
    const body = await request.json();
    if (!isObject(body)) return jsonError('Request body must be JSON', 400);

    if (body.action === 'add_credits') {
      const credits = Math.max(1, Number(body.credits || 0));
      const supabase = createAdminClient();
      const { rowId, store } = await getCrmStore(supabase);
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

    if (body.action === 'seed_demo_eligibility') {
      const supabase = createAdminClient();
      const { rowId, store } = await getCrmStore(supabase);
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
      return NextResponse.json({ success: true, data: { leads: demoLeads, reports: demoReports } });
    }

    if (body.action === 'submit_to_lender') {
      const leadId = cleanString(body.leadId);
      const lenderName = cleanString(body.lenderName);
      if (!leadId) return jsonError('Lead is required', 400);
      if (!lenderName) return jsonError('Lender is required', 400);

      const supabase = createAdminClient();
      const { rowId, store } = await getCrmStore(supabase);
      const lead = store.leads.find((item) => item.id === leadId);
      if (!lead) return jsonError('Lead not found', 404);

      const now = new Date().toISOString();
      const existingApplication = (store.applications || []).find(
        (item) => item.leadId === leadId && item.lenderName === lenderName
      );
      const application: CrmApplication = existingApplication || {
        id: crypto.randomUUID(),
        leadId,
        customerName: lead.name,
        mobile: lead.mobile,
        lenderName,
        product: lead.product,
        loanAmount: lead.loanAmount,
        status: 'login_pending',
        createdAt: now,
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
      await saveCrmStore(supabase, rowId, store);
      return NextResponse.json({ success: true, data: { application, leads: store.leads } });
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

    const supabase = createAdminClient();
    const { rowId: crmRowId, store: crmStore } = await getCrmStore(supabase);
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
      if (!name.firstName) return jsonError('First name is required', 400);
      if (!name.lastName) return jsonError('Last name is required', 400);
      if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(pan)) return jsonError('Valid PAN is required', 400);
      if (!dob) return jsonError('Date of birth is required', 400);
      if (!cleanString(body.gender)) return jsonError('Gender is required', 400);
      if (!cleanString(body.address)) return jsonError('Address is required', 400);
      if (!loanType) return jsonError('Loan type is required', 400);
      if (!loanAmount || loanAmount <= 0) return jsonError('Loan amount is required', 400);
      if (!monthlyIncome || monthlyIncome <= 0) return jsonError('Monthly income is required', 400);

      const state = cleanString(body.state) || stateFromPincode(pincode, city);
      cibilPayload = {
        firstName: name.firstName,
        lastName: name.lastName,
        dob,
        gender: normalizeGender(body.gender),
        pan,
        mobile,
        address: cleanString(body.address),
        state,
        pincode,
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
    const matchedLenders =
      monthlyIncome > 0 && loanType
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
      },
    });
  } catch (error) {
    console.error('[crm:eligibility-check] POST failed:', error);
    return jsonError(error instanceof Error ? error.message : 'Eligibility check failed', 500);
  }
}
