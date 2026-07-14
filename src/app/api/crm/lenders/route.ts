import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveCrmScope } from '@/lib/crm/scope';
import { requireCrmPermission } from '@/lib/crm/access';
import { CrmLender, defaultCrmLenders, normalizeLenders } from '@/lib/crm/lender-policy';
import { getCrmTableData, upsertCrmLender } from '@/lib/crm/db';

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

async function getStore(request: NextRequest) {
  const supabase = createAdminClient();
  const scope = await resolveCrmScope(request, supabase);
  const emptyStore = {
    eligibility_credits: { balance: 0, total_added: 0, total_used: 0, per_check_cost: 1 },
    credit_transactions: [],
    invoices: [],
    lenders: [],
    leads: [],
    applications: [],
    team: [],
    reports: [],
    scope: {
      partner_id: scope.partnerId,
      user_id: scope.userId,
      scoped_at: new Date().toISOString(),
    },
  };

  if (!scope.isDemo && scope.partnerId) {
    return { supabase, rowId: '', store: emptyStore, scope };
  }

  const { data, error } = await supabase
    .from('b2c_report_requests')
    .select('id,report_json')
    .eq('mobile', scope.storeMobile)
    .eq('status', scope.storeStatus)
    .maybeSingle();
  if (error) throw error;

  if (data?.id) {
    const raw = isObject(data.report_json) ? data.report_json : {};
    const store = { ...raw, team: raw.team, lenders: normalizeLenders(raw.lenders) };
    return { supabase, rowId: data.id as string, store, scope };
  }

  const store = {
    eligibility_credits: { balance: 100, total_added: 100, total_used: 0, per_check_cost: 1 },
    credit_transactions: [],
    invoices: [],
    lenders: defaultCrmLenders,
    leads: [],
    applications: [],
    team: [],
    reports: [],
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
  if (!rowId) return;
  const { error } = await supabase
    .from('b2c_report_requests')
    .update({ report_json: store, updated_at: new Date().toISOString() })
    .eq('id', rowId);
  if (error) throw error;
}

function normalizeIncomingLender(value: Record<string, unknown>, existing?: CrmLender): CrmLender {
  return {
    id: String(value.id || existing?.id || `lndr-${Date.now()}`),
    name: String(value.name || existing?.name || '').trim(),
    type: value.type === 'nbfc' ? 'nbfc' : 'bank',
    products: Array.isArray(value.products) ? value.products.map(String) : existing?.products || [],
    roiMin: Number(value.roiMin ?? existing?.roiMin ?? 0),
    roiMax: Number(value.roiMax ?? existing?.roiMax ?? 0),
    minLoan: Number(value.minLoan ?? existing?.minLoan ?? 0),
    maxLoan: Number(value.maxLoan ?? existing?.maxLoan ?? 0),
    processingFee: String(value.processingFee ?? existing?.processingFee ?? ''),
    approvalRate: Number(value.approvalRate ?? existing?.approvalRate ?? 75),
    activeApps: Number(value.activeApps ?? existing?.activeApps ?? 0),
    scoreCutoff: Number(value.scoreCutoff ?? existing?.scoreCutoff ?? 700),
    minIncome: Number(value.minIncome ?? existing?.minIncome ?? 0),
    maxTenure: Number(value.maxTenure ?? existing?.maxTenure ?? 120),
    foirLimit: Number(value.foirLimit ?? existing?.foirLimit ?? 50),
    ltvMax: Number(value.ltvMax ?? existing?.ltvMax ?? 0),
    states: Array.isArray(value.states) ? value.states.map(String) : existing?.states || [],
    status: value.status === 'inactive' ? 'inactive' : 'active',
    contact: String(value.contact ?? existing?.contact ?? ''),
    rm: String(value.rm ?? existing?.rm ?? ''),
    avgTat: String(value.avgTat ?? existing?.avgTat ?? ''),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, store, scope } = await getStore(request);
    const tableData = await getCrmTableData(supabase, scope);
    const effectiveStore = tableData ? { ...store, ...tableData } : store;
    const access = requireCrmPermission(scope, effectiveStore, 'lender_management');
    if (!access.ok) return jsonError(access.error, access.status);
    return NextResponse.json({ success: true, data: normalizeLenders(effectiveStore.lenders), scope });
  } catch (error) {
    console.error('[crm:lenders] GET failed:', error);
    return jsonError(error instanceof Error ? error.message : 'Unable to load lenders', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!isObject(body)) return jsonError('Request body must be JSON');
    const { supabase, rowId, store, scope } = await getStore(request);
    const tableData = await getCrmTableData(supabase, scope);
    const effectiveStore = tableData ? { ...store, ...tableData } : store;
    const access = requireCrmPermission(scope, effectiveStore, 'lender_management');
    if (!access.ok) return jsonError(access.error, access.status);
    const lenders = normalizeLenders(effectiveStore.lenders);
    const existing = lenders.find((item) => item.id === body.id);
    const lender = normalizeIncomingLender(body, existing);

    if (!lender.name) return jsonError('Lender name is required');
    if (!lender.products.length) return jsonError('At least one product is required');
    if (!lender.roiMin || !lender.roiMax) return jsonError('ROI range is required');
    if (!lender.maxLoan) return jsonError('Max loan is required');

    const nextLenders = existing
      ? lenders.map((item) => (item.id === lender.id ? lender : item))
      : [lender, ...lenders];
    const nextStore = { ...effectiveStore, lenders: nextLenders };
    await saveStore(supabase, rowId, nextStore);
    await upsertCrmLender(supabase, scope, lender);
    return NextResponse.json({ success: true, data: nextLenders, scope });
  } catch (error) {
    console.error('[crm:lenders] POST failed:', error);
    return jsonError(error instanceof Error ? error.message : 'Unable to save lender', 500);
  }
}
