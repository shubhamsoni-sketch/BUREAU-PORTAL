import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveCrmScope } from '@/lib/crm/scope';
import { requireCrmPermission } from '@/lib/crm/access';
import {
  CrmLead,
  defaultCrmLeads,
  normalizeApplications,
  normalizeLeadStage,
  normalizeLeads,
} from '@/lib/crm/leads';
import { defaultCrmLenders, normalizeLenders } from '@/lib/crm/lender-policy';
import { defaultCrmTeam, normalizeTeam } from '@/lib/crm/team';
import { getCrmTableData, upsertCrmLead } from '@/lib/crm/db';

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function cleanString(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function digits(value: unknown) {
  return cleanString(value).replace(/\D/g, '');
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

async function getStore(request: NextRequest) {
  const supabase = createAdminClient();
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
    const store = {
      ...raw,
      leads: normalizeLeads(raw.leads),
      applications: normalizeApplications(raw.applications),
      lenders: normalizeLenders(raw.lenders),
      team: normalizeTeam(raw.team),
    };
    return { supabase, rowId: data.id as string, store, scope };
  }

  const store = {
    eligibility_credits: { balance: 100, total_added: 100, total_used: 0, per_check_cost: 1 },
    credit_transactions: [],
    invoices: [],
    lenders: defaultCrmLenders,
    leads: scope.isDemo ? defaultCrmLeads : [],
    applications: [],
    reports: [],
    team: defaultCrmTeam,
    scope: {
      partner_id: scope.partnerId,
      user_id: scope.userId,
      scoped_at: new Date().toISOString(),
    },
  };
  const { data: inserted, error: insertError } = await supabase
    .from('b2c_report_requests')
    .insert({
      mobile: scope.storeMobile,
      full_name: scope.storeName,
      status: scope.storeStatus,
      report_type: 'crm_store',
      report_json: store,
      consent_given: true,
      consent_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (insertError) throw insertError;
  return { supabase, rowId: inserted.id as string, store, scope };
}

async function saveStore(
  supabase: ReturnType<typeof createAdminClient>,
  rowId: string,
  store: Record<string, unknown>
) {
  const { error } = await supabase
    .from('b2c_report_requests')
    .update({ report_json: store, updated_at: new Date().toISOString() })
    .eq('id', rowId);
  if (error) throw error;
}

function normalizeIncomingLead(body: Record<string, unknown>, existing?: CrmLead): CrmLead {
  const now = new Date().toISOString();
  const mobile = digits(body.mobile).slice(-10);
  return {
    id: cleanString(body.id) || existing?.id || `lead-${Date.now()}`,
    name: cleanString(body.name || existing?.name),
    mobile,
    email: cleanString(body.email || existing?.email),
    product: cleanString(body.product || existing?.product || 'personal_loan'),
    loanAmount: Number(body.loanAmount ?? existing?.loanAmount ?? 0),
    source: cleanString(body.source || existing?.source || 'walk_in'),
    stage: normalizeLeadStage(body.stage || existing?.stage || 'eligibility_pending'),
    assignedAgent: cleanString(body.assignedAgent || existing?.assignedAgent || 'Unassigned'),
    lastContact: cleanString(
      body.lastContact || existing?.lastContact || new Date().toLocaleDateString('en-IN')
    ),
    nextFollowUp: cleanString(body.nextFollowUp || existing?.nextFollowUp || '-'),
    daysInStage: Number(body.daysInStage ?? existing?.daysInStage ?? 0),
    city: cleanString(body.city || existing?.city),
    notes: cleanString(body.notes || existing?.notes),
    eligibilityReportId:
      cleanString(body.eligibilityReportId || existing?.eligibilityReportId) || undefined,
    selectedLender: cleanString(body.selectedLender || existing?.selectedLender) || undefined,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queue = searchParams.get('queue');
    const { supabase, store, scope } = await getStore(request);
    const tableData = await getCrmTableData(supabase, scope);
    const effectiveStore = tableData ? { ...store, ...tableData } : store;
    const access = requireCrmPermission(scope, effectiveStore, 'lead_management');
    if (!access.ok) return jsonError(access.error, access.status);
    const leads = normalizeLeads(effectiveStore.leads);
    const data =
      queue === 'eligibility'
        ? leads.filter((lead) => ['new', 'contacted', 'eligibility_pending'].includes(lead.stage))
        : leads;
    return NextResponse.json({
      success: true,
      data,
      applications: effectiveStore.applications || [],
      team: effectiveStore.team || defaultCrmTeam,
      scope,
    });
  } catch (error) {
    console.error('[crm:leads] GET failed:', error);
    return jsonError(error instanceof Error ? error.message : 'Unable to load leads', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!isObject(body)) return jsonError('Request body must be JSON');
    const { supabase, rowId, store, scope } = await getStore(request);
    const access = requireCrmPermission(scope, store, 'lead_management');
    if (!access.ok) return jsonError(access.error, access.status);
    const leads = normalizeLeads(store.leads);
    const existing = leads.find((lead) => lead.id === body.id);
    const lead = normalizeIncomingLead(body, existing);
    if (!lead.name) return jsonError('Lead name is required');
    if (!/^\d{10}$/.test(lead.mobile)) return jsonError('Valid mobile is required');
    if (!lead.product) return jsonError('Loan product is required');
    if (!lead.loanAmount) return jsonError('Loan amount is required');

    const nextLeads = existing
      ? leads.map((item) => (item.id === lead.id ? lead : item))
      : [lead, ...leads];
    const nextStore = { ...store, leads: nextLeads };
    await saveStore(supabase, rowId, nextStore);
    await upsertCrmLead(supabase, scope, lead);
    return NextResponse.json({ success: true, data: nextLeads, lead, scope });
  } catch (error) {
    console.error('[crm:leads] POST failed:', error);
    return jsonError(error instanceof Error ? error.message : 'Unable to save lead', 500);
  }
}
