import { createAdminClient } from '@/lib/supabase/admin';
import {
  CrmApplication,
  CrmApplicationDocument,
  CrmLead,
  createDefaultApplicationDocuments,
  normalizeApplications,
  normalizeLeads,
} from '@/lib/crm/leads';
import { CrmLender, normalizeLenders } from '@/lib/crm/lender-policy';
import { CrmScope } from '@/lib/crm/scope';
import { CrmTeamMember, normalizeTeam } from '@/lib/crm/team';

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

function hasPartner(scope: CrmScope) {
  return Boolean(scope.partnerId && !scope.isDemo);
}

function isMissingTableError(error: unknown) {
  return Boolean(
    error &&
      typeof error === 'object' && 'code' in error &&
      (error as { code?: string }).code === '42P01'
  );
}

function asJsonArray<T>(value: T[] | undefined) {
  return Array.isArray(value) ? value : [];
}

export function canUseCrmTables(scope: CrmScope) {
  return hasPartner(scope);
}

export async function logCrmAudit(
  supabase: SupabaseAdmin,
  scope: CrmScope,
  input: {
    module: string;
    action: string;
    entityType?: string;
    entityId?: string;
    summary?: string;
    metadata?: Record<string, unknown>;
  }
) {
  if (!hasPartner(scope)) return;
  const { error } = await supabase.from('crm_audit_logs').insert({
    partner_id: scope.partnerId,
    actor_user_id: scope.userId,
    actor_email: scope.userEmail,
    module: input.module,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    summary: input.summary,
    metadata: input.metadata || {},
  });
  if (error && !isMissingTableError(error)) throw error;
}

export async function getCrmTableData(supabase: SupabaseAdmin, scope: CrmScope) {
  if (!hasPartner(scope)) return null;

  const [leadsResult, applicationsResult, teamResult, lendersResult, reportsResult] =
    await Promise.all([
      supabase.from('crm_leads').select('*').eq('partner_id', scope.partnerId).order('created_at', { ascending: false }),
      supabase.from('crm_applications').select('*').eq('partner_id', scope.partnerId).order('created_at', { ascending: false }),
      supabase.from('crm_team_members').select('*').eq('partner_id', scope.partnerId).order('created_at', { ascending: true }),
      supabase.from('crm_lenders').select('*').eq('partner_id', scope.partnerId).order('created_at', { ascending: true }),
      supabase.from('crm_eligibility_reports').select('*').eq('partner_id', scope.partnerId).order('created_at', { ascending: false }),
    ]);

  const firstError =
    leadsResult.error ||
    applicationsResult.error ||
    teamResult.error ||
    lendersResult.error ||
    reportsResult.error;

  if (firstError) {
    if (isMissingTableError(firstError)) return null;
    throw firstError;
  }

  const applications = normalizeApplications((applicationsResult.data || []).map(applicationFromRow));
  const documents = await getApplicationDocuments(supabase, scope, applications.map((app) => app.id));

  return {
    leads: normalizeLeads((leadsResult.data || []).map(leadFromRow)),
    applications: applications.map((app) => ({
      ...app,
      documents: documents.get(app.id) || createDefaultApplicationDocuments(app.product),
    })),
    team: normalizeTeam((teamResult.data || []).map(teamFromRow)),
    lenders: normalizeLenders((lendersResult.data || []).map(lenderFromRow)),
    reports: (reportsResult.data || []).map(reportFromRow),
  };
}

async function getApplicationDocuments(
  supabase: SupabaseAdmin,
  scope: CrmScope,
  applicationIds: string[]
) {
  const map = new Map<string, CrmApplicationDocument[]>();
  if (!applicationIds.length || !hasPartner(scope)) return map;
  const { data, error } = await supabase
    .from('crm_application_documents')
    .select('*')
    .eq('partner_id', scope.partnerId)
    .in('application_id', applicationIds);
  if (error) {
    if (isMissingTableError(error)) return map;
    throw error;
  }
  for (const row of data || []) {
    const appId = String(row.application_id || '');
    const current = map.get(appId) || [];
    current.push({
      id: String(row.id || ''),
      name: String(row.name || ''),
      required: Boolean(row.required),
      status: row.status || 'missing',
      fileName: row.file_name || undefined,
      uploadedAt: row.uploaded_at || undefined,
      verifiedAt: row.verified_at || undefined,
      rejectedAt: row.rejected_at || undefined,
      note: row.note || undefined,
    });
    map.set(appId, current);
  }
  return map;
}

export async function upsertCrmLead(
  supabase: SupabaseAdmin,
  scope: CrmScope,
  lead: CrmLead
) {
  if (!hasPartner(scope)) return false;
  const { error } = await supabase.from('crm_leads').upsert(leadToRow(scope, lead), {
    onConflict: 'id',
    ignoreDuplicates: false,
  });
  if (error) {
    if (isMissingTableError(error)) return false;
    throw error;
  }
  await logCrmAudit(supabase, scope, {
    module: 'lead_management',
    action: 'upsert_lead',
    entityType: 'lead',
    entityId: lead.id,
    summary: `${lead.name} lead saved`,
  });
  return true;
}

export async function upsertCrmTeamMember(
  supabase: SupabaseAdmin,
  scope: CrmScope,
  member: CrmTeamMember
) {
  if (!hasPartner(scope)) return false;
  const { error } = await supabase.from('crm_team_members').upsert(teamToRow(scope, member), {
    onConflict: 'id',
    ignoreDuplicates: false,
  });
  if (error) {
    if (isMissingTableError(error)) return false;
    throw error;
  }
  await logCrmAudit(supabase, scope, {
    module: 'team_management',
    action: 'upsert_member',
    entityType: 'team_member',
    entityId: member.id,
    summary: `${member.name} team member saved`,
  });
  return true;
}

export async function deleteCrmTeamMember(
  supabase: SupabaseAdmin,
  scope: CrmScope,
  memberId: string
) {
  if (!hasPartner(scope)) return false;
  const { error } = await supabase
    .from('crm_team_members')
    .delete()
    .eq('partner_id', scope.partnerId)
    .eq('id', memberId);
  if (error) {
    if (isMissingTableError(error)) return false;
    throw error;
  }
  await logCrmAudit(supabase, scope, {
    module: 'team_management',
    action: 'delete_member',
    entityType: 'team_member',
    entityId: memberId,
    summary: 'Team member removed',
  });
  return true;
}

export async function upsertCrmLender(
  supabase: SupabaseAdmin,
  scope: CrmScope,
  lender: CrmLender
) {
  if (!hasPartner(scope)) return false;
  const { error } = await supabase.from('crm_lenders').upsert(lenderToRow(scope, lender), {
    onConflict: 'id',
    ignoreDuplicates: false,
  });
  if (error) {
    if (isMissingTableError(error)) return false;
    throw error;
  }
  await logCrmAudit(supabase, scope, {
    module: 'lender_management',
    action: 'upsert_lender',
    entityType: 'lender',
    entityId: lender.id,
    summary: `${lender.name} lender saved`,
  });
  return true;
}

export async function saveCrmApplicationDocuments(
  supabase: SupabaseAdmin,
  scope: CrmScope,
  application: CrmApplication
) {
  if (!hasPartner(scope) || !application.documents?.length) return false;
  const rows = application.documents.map((document) => ({
    id: document.id,
    partner_id: scope.partnerId,
    application_id: application.id,
    name: document.name,
    required: document.required,
    status: document.status,
    file_name: document.fileName,
    uploaded_at: document.uploadedAt,
    verified_at: document.verifiedAt,
    rejected_at: document.rejectedAt,
    note: document.note,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from('crm_application_documents').upsert(rows, {
    onConflict: 'id',
    ignoreDuplicates: false,
  });
  if (error) {
    if (isMissingTableError(error)) return false;
    throw error;
  }
  return true;
}

export async function upsertCrmApplication(
  supabase: SupabaseAdmin,
  scope: CrmScope,
  application: CrmApplication
) {
  if (!hasPartner(scope)) return false;
  const { error } = await supabase.from('crm_applications').upsert(applicationToRow(scope, application), {
    onConflict: 'id',
    ignoreDuplicates: false,
  });
  if (error) {
    if (isMissingTableError(error)) return false;
    throw error;
  }
  await saveCrmApplicationDocuments(supabase, scope, application);
  await logCrmAudit(supabase, scope, {
    module: 'file_process',
    action: 'upsert_application',
    entityType: 'application',
    entityId: application.id,
    summary: `${application.customerName} file saved for ${application.lenderName}`,
    metadata: { status: application.status },
  });
  return true;
}

export async function insertCrmEligibilityReport(
  supabase: SupabaseAdmin,
  scope: CrmScope,
  report: Record<string, any>,
  leadId?: string
) {
  if (!hasPartner(scope)) return false;
  const { error } = await supabase.from('crm_eligibility_reports').upsert(
    {
      id: report.id,
      partner_id: scope.partnerId,
      lead_id: leadId || null,
      request_id: report.request_id,
      borrower_name: report.borrower_name,
      pan: report.pan,
      mobile: report.mobile,
      loan_type: report.loan_type,
      loan_amount: report.loan_amount || 0,
      score: report.score,
      status: report.status || 'completed',
      foir: report.foir,
      max_loan_amount: report.max_loan_amount,
      matched_lenders: report.matched_lenders || [],
      cibil_payload: report.cibil_payload || {},
      raw_response: report.bureau_response || report.raw_response || {},
      created_by: scope.userId,
      created_at: report.created_at || new Date().toISOString(),
    },
    { onConflict: 'id', ignoreDuplicates: false }
  );
  if (error) {
    if (isMissingTableError(error)) return false;
    throw error;
  }
  await logCrmAudit(supabase, scope, {
    module: 'eligibility_check',
    action: 'run_eligibility',
    entityType: 'eligibility_report',
    entityId: String(report.id || ''),
    summary: `Eligibility checked for ${report.borrower_name || 'customer'}`,
    metadata: { score: report.score, status: report.status },
  });
  return true;
}

export async function upsertCrmReminder(
  supabase: SupabaseAdmin,
  scope: CrmScope,
  input: {
    leadId?: string;
    applicationId?: string;
    title: string;
    dueAt: string;
    assignedTo?: string;
  }
) {
  if (!hasPartner(scope) || !input.dueAt) return false;
  const { error } = await supabase.from('crm_reminders').insert({
    partner_id: scope.partnerId,
    lead_id: input.leadId,
    application_id: input.applicationId,
    assigned_to: input.assignedTo,
    title: input.title,
    due_at: input.dueAt,
    created_by: scope.userId,
  });
  if (error) {
    if (isMissingTableError(error)) return false;
    throw error;
  }
  return true;
}

function leadFromRow(row: Record<string, any>): CrmLead {
  return {
    id: String(row.id || ''),
    name: String(row.name || ''),
    mobile: String(row.mobile || ''),
    email: String(row.email || ''),
    product: String(row.product || 'personal_loan'),
    loanAmount: Number(row.loan_amount || 0),
    source: String(row.source || 'walk_in'),
    stage: row.stage || 'eligibility_pending',
    assignedAgent: String(row.assigned_agent || 'Unassigned'),
    lastContact: String(row.last_contact || '-'),
    nextFollowUp: String(row.next_follow_up || '-'),
    daysInStage: Number(row.days_in_stage || 0),
    city: String(row.city || ''),
    notes: String(row.notes || ''),
    eligibilityReportId: row.eligibility_report_id || undefined,
    selectedLender: row.selected_lender || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function leadToRow(scope: CrmScope, lead: CrmLead) {
  return {
    id: lead.id,
    partner_id: scope.partnerId,
    name: lead.name,
    mobile: lead.mobile,
    email: lead.email,
    product: lead.product,
    loan_amount: lead.loanAmount,
    source: lead.source,
    stage: lead.stage,
    assigned_agent: lead.assignedAgent,
    last_contact: lead.lastContact,
    next_follow_up: lead.nextFollowUp,
    days_in_stage: lead.daysInStage,
    city: lead.city,
    notes: lead.notes,
    eligibility_report_id: lead.eligibilityReportId,
    selected_lender: lead.selectedLender,
    updated_by: scope.userId,
    updated_at: new Date().toISOString(),
  };
}

function teamFromRow(row: Record<string, any>): CrmTeamMember {
  return {
    id: String(row.id || ''),
    authUserId: row.auth_user_id || undefined,
    name: String(row.name || ''),
    email: String(row.email || ''),
    mobile: String(row.mobile || ''),
    role: row.role || 'DSA Agent',
    zone: String(row.zone || ''),
    leadsAssigned: Number(row.leads_assigned || 0),
    leadsConverted: Number(row.leads_converted || 0),
    joinedDate: String(row.joined_date || ''),
    status: row.status || 'active',
    avatar: String(row.avatar || ''),
    permissions: Array.isArray(row.permissions) ? row.permissions : [],
    loginEnabled: row.login_enabled !== false,
    credentialsGeneratedAt: row.credentials_generated_at || undefined,
  };
}

function teamToRow(scope: CrmScope, member: CrmTeamMember) {
  return {
    id: member.id,
    partner_id: scope.partnerId,
    auth_user_id: member.authUserId,
    name: member.name,
    email: member.email,
    mobile: member.mobile,
    role: member.role,
    zone: member.zone,
    permissions: member.permissions,
    leads_assigned: member.leadsAssigned,
    leads_converted: member.leadsConverted,
    joined_date: member.joinedDate,
    status: member.status,
    avatar: member.avatar,
    login_enabled: member.loginEnabled !== false,
    credentials_generated_at: member.credentialsGeneratedAt,
    updated_at: new Date().toISOString(),
  };
}

function lenderFromRow(row: Record<string, any>): CrmLender {
  return {
    id: String(row.id || ''),
    name: String(row.name || ''),
    type: row.type === 'nbfc' ? 'nbfc' : 'bank',
    products: Array.isArray(row.products) ? row.products : [],
    roiMin: Number(row.roi_min || 0),
    roiMax: Number(row.roi_max || 0),
    minLoan: Number(row.min_loan || 0),
    maxLoan: Number(row.max_loan || 0),
    processingFee: String(row.processing_fee || ''),
    approvalRate: Number(row.approval_rate || 0),
    activeApps: Number(row.active_apps || 0),
    scoreCutoff: Number(row.score_cutoff || 0),
    minIncome: Number(row.min_income || 0),
    maxTenure: Number(row.max_tenure || 0),
    foirLimit: Number(row.foir_limit || 0),
    ltvMax: Number(row.ltv_max || 0),
    states: Array.isArray(row.states) ? row.states : [],
    status: row.status || 'active',
    contact: String(row.contact || ''),
    rm: String(row.rm || ''),
    avgTat: String(row.avg_tat || ''),
  };
}

function lenderToRow(scope: CrmScope, lender: CrmLender) {
  return {
    id: lender.id,
    partner_id: scope.partnerId,
    name: lender.name,
    type: lender.type,
    products: lender.products,
    roi_min: lender.roiMin,
    roi_max: lender.roiMax,
    min_loan: lender.minLoan,
    max_loan: lender.maxLoan,
    processing_fee: lender.processingFee,
    approval_rate: lender.approvalRate,
    active_apps: lender.activeApps,
    score_cutoff: lender.scoreCutoff,
    min_income: lender.minIncome,
    max_tenure: lender.maxTenure,
    foir_limit: lender.foirLimit,
    ltv_max: lender.ltvMax,
    states: lender.states,
    status: lender.status,
    contact: lender.contact,
    rm: lender.rm,
    avg_tat: lender.avgTat,
    updated_at: new Date().toISOString(),
  };
}

function applicationFromRow(row: Record<string, any>): CrmApplication {
  return {
    id: String(row.id || ''),
    leadId: String(row.lead_id || ''),
    customerName: String(row.customer_name || ''),
    mobile: String(row.mobile || ''),
    lenderName: String(row.lender_name || ''),
    product: String(row.product || 'personal_loan'),
    loanAmount: Number(row.loan_amount || 0),
    status: row.status || 'case_sent_to_lender',
    statusHistory: asJsonArray(row.status_history),
    notes: asJsonArray(row.notes),
    lenderHistory: asJsonArray(row.lender_history),
    documents: [],
    followUpDate: row.follow_up_date || undefined,
    rejectionReason: row.rejection_reason || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function applicationToRow(scope: CrmScope, application: CrmApplication) {
  return {
    id: application.id,
    partner_id: scope.partnerId,
    lead_id: application.leadId,
    customer_name: application.customerName,
    mobile: application.mobile,
    lender_name: application.lenderName,
    product: application.product,
    loan_amount: application.loanAmount,
    status: application.status,
    status_history: application.statusHistory || [],
    notes: application.notes || [],
    lender_history: application.lenderHistory || [],
    follow_up_date: application.followUpDate,
    rejection_reason: application.rejectionReason,
    created_by: scope.userId,
    updated_by: scope.userId,
    created_at: application.createdAt,
    updated_at: application.updatedAt || new Date().toISOString(),
  };
}

function reportFromRow(row: Record<string, any>) {
  return {
    id: String(row.id || ''),
    request_id: row.request_id || '',
    borrower_name: row.borrower_name || '',
    pan: row.pan || '',
    mobile: row.mobile || '',
    loan_type: row.loan_type || '',
    loan_amount: Number(row.loan_amount || 0),
    score: row.score,
    eligible: Boolean(row.score && Number(row.score) >= 680),
    status: row.status || 'completed',
    foir: row.foir,
    max_loan_amount: row.max_loan_amount,
    matched_lenders: Array.isArray(row.matched_lenders) ? row.matched_lenders : [],
    credits_deducted: 0,
    cibil_payload: row.cibil_payload || {},
    bureau_response: row.raw_response || {},
    raw_response: row.raw_response || {},
    created_at: row.created_at,
  };
}
