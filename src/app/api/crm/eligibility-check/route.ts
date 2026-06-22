import { NextRequest, NextResponse } from 'next/server';
import {
  defaultBureauApi,
  getApiHubStore,
  hitMasterApi,
  saveApiHubStore,
} from '@/lib/api-hub/simple-store';
import { maskMobile, maskPan } from '@/lib/api-hub/keys';
import { createAdminClient } from '@/lib/supabase/admin';

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
  credits_deducted: number;
  created_at: string;
  cibil_payload: Record<string, unknown>;
  bureau_response: unknown;
};

type CrmStore = {
  eligibility_credits: {
    balance: number;
    total_added: number;
    total_used: number;
    per_check_cost: number;
  };
  reports: CrmEligibilityReport[];
};

const defaultCrmStore: CrmStore = {
  eligibility_credits: {
    balance: 100,
    total_added: 100,
    total_used: 0,
    per_check_cost: 1,
  },
  reports: [],
};

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
      store.eligibility_credits = {
        ...store.eligibility_credits,
        balance: store.eligibility_credits.balance + credits,
        total_added: store.eligibility_credits.total_added + credits,
      };
      await saveCrmStore(supabase, rowId, store);
      return NextResponse.json({ success: true, data: store });
    }

    const fullName = cleanString(body.fullName);
    const name = splitName(fullName);
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

    if (!fullName) return jsonError('Full name is required', 400);
    if (!/^\d{10}$/.test(mobile)) return jsonError('Valid mobile is required', 400);
    if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(pan)) return jsonError('Valid PAN is required', 400);
    if (!loanType) return jsonError('Loan type is required', 400);
    if (!loanAmount || loanAmount <= 0) return jsonError('Loan amount is required', 400);
    if (!monthlyIncome || monthlyIncome <= 0) return jsonError('Monthly income is required', 400);

    const supabase = createAdminClient();
    const { rowId: crmRowId, store: crmStore } = await getCrmStore(supabase);
    const creditCost = Math.max(1, Number(crmStore.eligibility_credits.per_check_cost || 1));
    if (crmStore.eligibility_credits.balance < creditCost)
      return jsonError('Insufficient eligibility credits', 402);

    const { rowId: apiHubRowId, store: apiHubStore } = await getApiHubStore(supabase);
    const bureauApi =
      apiHubStore.apis.find(
        (api) =>
          api.status === 'active' &&
          ['bureau', 'bureau-standard', 'cibil.consumer_score'].includes(api.code)
      ) || defaultBureauApi;
    if (!bureauApi.master_url)
      return jsonError('Bureau API Standard is not configured in API Hub', 500);

    const state = stateFromPincode(pincode, city);
    const cibilPayload = {
      firstName: name.firstName,
      lastName: name.lastName,
      dob,
      gender: cleanString(body.gender) || 'male',
      pan,
      mobile,
      address: cleanString(body.address) || [city, pincode].filter(Boolean).join(' '),
      state,
      pincode,
    };

    const missing = Object.entries(cibilPayload)
      .filter(([, value]) => !cleanString(value))
      .map(([key]) => key);
    if (missing.length)
      return jsonError(`Missing bureau payload fields: ${missing.join(', ')}`, 400);

    const bureauResponse = await hitMasterApi(bureauApi, cibilPayload);
    if (!bureauResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          request_id: requestId,
          error: `Bureau API failed with ${bureauResponse.status}`,
          cibil_payload: cibilPayload,
          data: bureauResponse.data,
        },
        { status: 502 }
      );
    }

    const score = findScore(bureauResponse.data);
    const status = findStatus(bureauResponse.data) || (score ? 'score_pulled' : 'no_hit');
    const r = 10.5 / 12 / 100;
    const emi = (loanAmount * r * Math.pow(1 + r, tenure)) / (Math.pow(1 + r, tenure) - 1);
    const foir = Math.round(((existingEmi + emi) / monthlyIncome) * 100);
    const eligible = Boolean(score && score >= 680 && foir <= 55);
    const maxLoanAmount = Math.max(
      0,
      Math.round(((monthlyIncome * 0.55) / r) * (1 - Math.pow(1 + r, -tenure)))
    );

    const remarks = [
      score ? `Bureau score received: ${score}` : `Bureau response status: ${status}`,
      foir <= 55 ? `FOIR within policy at ${foir}%` : `FOIR is high at ${foir}%`,
      eligible
        ? 'Customer is eligible as per CRM policy.'
        : 'Customer needs manual review or alternate lender mapping.',
    ];

    const report: CrmEligibilityReport = {
      id: crypto.randomUUID(),
      request_id: requestId,
      borrower_name: fullName,
      pan: maskPan(pan),
      mobile: maskMobile(mobile),
      loan_type: loanType,
      loan_amount: loanAmount,
      score,
      eligible,
      status,
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
        matchedLenders: eligible
          ? [
              {
                name: 'HDFC Bank',
                roi: '8.75-12%',
                maxLoan: new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0,
                }).format(Math.min(loanAmount, maxLoanAmount)),
              },
              {
                name: 'ICICI Bank',
                roi: '9.0-13.5%',
                maxLoan: new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0,
                }).format(Math.min(loanAmount, maxLoanAmount)),
              },
              {
                name: 'Bajaj Finserv',
                roi: '11-24%',
                maxLoan: new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0,
                }).format(Math.min(loanAmount, maxLoanAmount)),
              },
            ]
          : [],
        rawBureauResponse: bureauResponse.data,
      },
    });
  } catch (error) {
    console.error('[crm:eligibility-check] POST failed:', error);
    return jsonError(error instanceof Error ? error.message : 'Eligibility check failed', 500);
  }
}
