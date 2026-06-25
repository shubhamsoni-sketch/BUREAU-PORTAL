import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveCrmScope } from '@/lib/crm/scope';
import { defaultCrmLenders, normalizeLenders } from '@/lib/crm/lender-policy';
import { defaultCrmLeads, normalizeApplications, normalizeLeads } from '@/lib/crm/leads';
import {
  CrmTeamMember,
  CrmUserStatus,
  defaultCrmTeam,
  initials,
  normalizePermissions,
  normalizeRole,
  normalizeTeam,
  rolePermissions,
} from '@/lib/crm/team';

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function cleanString(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function digits(value: unknown) {
  return cleanString(value).replace(/\D/g, '').slice(-10);
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
      eligibility_credits: isObject(raw.eligibility_credits)
        ? raw.eligibility_credits
        : { balance: 100, total_added: 100, total_used: 0, per_check_cost: 1 },
      credit_transactions: Array.isArray(raw.credit_transactions) ? raw.credit_transactions : [],
      invoices: Array.isArray(raw.invoices) ? raw.invoices : [],
      lenders: normalizeLenders(raw.lenders),
      leads: normalizeLeads(raw.leads),
      applications: normalizeApplications(raw.applications),
      reports: Array.isArray(raw.reports) ? raw.reports : [],
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

function normalizeIncomingMember(
  body: Record<string, unknown>,
  existing?: CrmTeamMember
): CrmTeamMember {
  const role = normalizeRole(body.role || existing?.role);
  const name = cleanString(body.name || existing?.name);
  const status = cleanString(body.status || existing?.status || 'active');
  return {
    id: cleanString(body.id) || existing?.id || `usr-${Date.now()}`,
    name,
    email: cleanString(body.email || existing?.email).toLowerCase(),
    mobile: digits(body.mobile || existing?.mobile),
    role,
    zone: cleanString(body.zone || existing?.zone),
    leadsAssigned: Number(body.leadsAssigned ?? existing?.leadsAssigned ?? 0),
    leadsConverted: Number(body.leadsConverted ?? existing?.leadsConverted ?? 0),
    joinedDate:
      cleanString(body.joinedDate || existing?.joinedDate) ||
      new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    status: status === 'inactive' ? 'inactive' : 'active',
    avatar: cleanString(body.avatar || existing?.avatar) || initials(name),
    permissions: normalizePermissions(body.permissions || existing?.permissions, role),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { store, scope } = await getStore(request);
    return NextResponse.json({
      success: true,
      data: normalizeTeam(store.team),
      rolePermissions,
      scope,
    });
  } catch (error) {
    console.error('[crm:team] GET failed:', error);
    return jsonError(error instanceof Error ? error.message : 'Unable to load team', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!isObject(body)) return jsonError('Request body must be JSON');
    const action = cleanString(body.action || 'save');
    const { supabase, rowId, store, scope } = await getStore(request);
    const team = normalizeTeam(store.team);

    if (action === 'delete') {
      const id = cleanString(body.id);
      if (!id) return jsonError('Member is required');
      const target = team.find((member) => member.id === id);
      if (!target) return jsonError('Member not found', 404);
      if (target.role === 'Admin') return jsonError('Admin member cannot be removed', 400);
      const nextTeam = team.filter((member) => member.id !== id);
      await saveStore(supabase, rowId, { ...store, team: nextTeam });
      return NextResponse.json({ success: true, data: nextTeam, scope });
    }

    if (action === 'toggle_status') {
      const id = cleanString(body.id);
      const status = cleanString(body.status) as CrmUserStatus;
      if (!id) return jsonError('Member is required');
      if (!['active', 'inactive'].includes(status)) return jsonError('Valid status is required');
      const nextTeam = team.map((member) => (member.id === id ? { ...member, status } : member));
      await saveStore(supabase, rowId, { ...store, team: nextTeam });
      return NextResponse.json({ success: true, data: nextTeam, scope });
    }

    const existing = team.find((member) => member.id === body.id);
    const member = normalizeIncomingMember(body, existing);
    if (!member.name) return jsonError('Name is required');
    if (!/^\S+@\S+\.\S+$/.test(member.email)) return jsonError('Valid email is required');
    if (!/^[6-9]\d{9}$/.test(member.mobile)) return jsonError('Valid mobile is required');
    if (!member.zone) return jsonError('Zone / location is required');
    const duplicate = team.find(
      (item) => item.email === member.email && item.id !== member.id
    );
    if (duplicate) return jsonError('A member with this email already exists');

    const nextTeam = existing
      ? team.map((item) => (item.id === member.id ? member : item))
      : [member, ...team];
    await saveStore(supabase, rowId, { ...store, team: nextTeam });
    return NextResponse.json({ success: true, data: nextTeam, member, scope });
  } catch (error) {
    console.error('[crm:team] POST failed:', error);
    return jsonError(error instanceof Error ? error.message : 'Unable to save team member', 500);
  }
}
