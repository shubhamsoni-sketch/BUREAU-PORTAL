import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateTemporaryPassword } from '@/lib/security/password';
import { resolveCrmScope } from '@/lib/crm/scope';
import { requireCrmPermission } from '@/lib/crm/access';
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
import {
  deleteCrmTeamMember,
  getCrmTableData,
  upsertCrmTeamMember,
} from '@/lib/crm/db';

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

async function findAuthUserByEmail(
  supabase: ReturnType<typeof createAdminClient>,
  email: string
) {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;
  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) || null;
}

async function provisionCrmAuthUser(
  supabase: ReturnType<typeof createAdminClient>,
  scope: Awaited<ReturnType<typeof resolveCrmScope>>,
  member: CrmTeamMember,
  existing?: CrmTeamMember,
  forcePassword = false
) {
  if (scope.isDemo || !scope.partnerId) {
    return { member, temporaryPassword: '' };
  }

  const temporaryPassword = forcePassword || !existing?.authUserId ? generateTemporaryPassword(12) : '';
  let authUserId = existing?.authUserId || '';

  if (!authUserId) {
    const existingAuth = await findAuthUserByEmail(supabase, member.email);
    authUserId = existingAuth?.id || '';
  }

  const appMetadata = {
    role: 'partner',
    crm_role: member.role,
    crm_partner_id: scope.partnerId,
    crm_team_member_id: member.id,
    crm_permissions: member.permissions,
    is_temp_password: Boolean(temporaryPassword),
  };
  const userMetadata = {
    full_name: member.name,
    role: 'partner',
    crm_role: member.role,
    crm_partner_id: scope.partnerId,
  };

  if (authUserId) {
    const updatePayload: any = {
      email: member.email,
      email_confirm: true,
      app_metadata: appMetadata,
      user_metadata: userMetadata,
    };
    if (temporaryPassword) updatePayload.password = temporaryPassword;
    const { error } = await supabase.auth.admin.updateUserById(authUserId, updatePayload);
    if (error) throw error;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: member.email,
      password: temporaryPassword,
      email_confirm: true,
      app_metadata: appMetadata,
      user_metadata: userMetadata,
    });
    if (error || !data.user) throw error || new Error('Unable to create CRM auth user');
    authUserId = data.user.id;
  }

  await supabase.from('user_profiles').upsert(
    {
      id: authUserId,
      email: member.email,
      full_name: member.name,
      role: 'partner',
      is_temp_password: Boolean(temporaryPassword),
    },
    { onConflict: 'id', ignoreDuplicates: false }
  );

  return {
    member: {
      ...member,
      authUserId,
      loginEnabled: member.status === 'active',
      credentialsGeneratedAt: temporaryPassword
        ? new Date().toISOString()
        : existing?.credentialsGeneratedAt,
    },
    temporaryPassword,
  };
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
    const { supabase, store, scope } = await getStore(request);
    const tableData = await getCrmTableData(supabase, scope);
    const effectiveStore = tableData ? { ...store, ...tableData } : store;
    const access = requireCrmPermission(scope, effectiveStore, 'team_management');
    if (!access.ok) return jsonError(access.error, access.status);
    return NextResponse.json({
      success: true,
      data: normalizeTeam(effectiveStore.team),
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
    const tableData = await getCrmTableData(supabase, scope);
    const effectiveStore = tableData ? { ...store, ...tableData } : store;
    const access = requireCrmPermission(scope, effectiveStore, 'team_management');
    if (!access.ok) return jsonError(access.error, access.status);
    const team = normalizeTeam(effectiveStore.team);

    if (action === 'delete') {
      const id = cleanString(body.id);
      if (!id) return jsonError('Member is required');
      const target = team.find((member) => member.id === id);
      if (!target) return jsonError('Member not found', 404);
      if (target.role === 'Admin') return jsonError('Admin member cannot be removed', 400);
      const nextTeam = team.filter((member) => member.id !== id);
      await saveStore(supabase, rowId, { ...store, team: nextTeam });
      await deleteCrmTeamMember(supabase, scope, id);
      return NextResponse.json({ success: true, data: nextTeam, scope });
    }

    if (action === 'reset_password') {
      const id = cleanString(body.id);
      if (!id) return jsonError('Member is required');
      const target = team.find((member) => member.id === id);
      if (!target) return jsonError('Member not found', 404);
      const provisioned = await provisionCrmAuthUser(supabase, scope, target, target, true);
      const nextTeam = team.map((member) =>
        member.id === id ? provisioned.member : member
      );
      await saveStore(supabase, rowId, { ...store, team: nextTeam });
      await upsertCrmTeamMember(supabase, scope, provisioned.member);
      return NextResponse.json({
        success: true,
        data: nextTeam,
        member: provisioned.member,
        credentials: {
          email: provisioned.member.email,
          temporaryPassword: provisioned.temporaryPassword,
        },
        scope,
      });
    }

    if (action === 'toggle_status') {
      const id = cleanString(body.id);
      const status = cleanString(body.status) as CrmUserStatus;
      if (!id) return jsonError('Member is required');
      if (!['active', 'inactive'].includes(status)) return jsonError('Valid status is required');
      const nextTeam = team.map((member) =>
        member.id === id ? { ...member, status, loginEnabled: status === 'active' } : member
      );
      await saveStore(supabase, rowId, { ...store, team: nextTeam });
      const changed = nextTeam.find((member) => member.id === id);
      if (changed) await upsertCrmTeamMember(supabase, scope, changed);
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

    const provisioned = await provisionCrmAuthUser(supabase, scope, member, existing);
    const nextTeam = existing
      ? team.map((item) => (item.id === provisioned.member.id ? provisioned.member : item))
      : [provisioned.member, ...team];
    await saveStore(supabase, rowId, { ...store, team: nextTeam });
    await upsertCrmTeamMember(supabase, scope, provisioned.member);
    return NextResponse.json({
      success: true,
      data: nextTeam,
      member: provisioned.member,
      credentials: provisioned.temporaryPassword
        ? { email: provisioned.member.email, temporaryPassword: provisioned.temporaryPassword }
        : null,
      scope,
    });
  } catch (error) {
    console.error('[crm:team] POST failed:', error);
    return jsonError(error instanceof Error ? error.message : 'Unable to save team member', 500);
  }
}
