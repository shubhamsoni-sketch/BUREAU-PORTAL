import { createAdminClient } from '@/lib/supabase/admin';
import { CrmScope } from '@/lib/crm/scope';
import { PolicyProgram, PolicyRule, rankPrograms } from './engine';

type SupabaseAdmin = ReturnType<typeof createAdminClient>;
type DailyCapacitySnapshot = {
  program_id: string;
  daily_submission_limit: number | null;
  submissions_used: number;
  submissions_remaining: number | null;
  exhausted: boolean;
  operating_date: string;
};

function missingTable(error: unknown) {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code?: string }).code === '42P01'
  );
}

function list<T>(value: T[] | null | undefined) {
  return Array.isArray(value) ? value : [];
}

export async function matchPublishedPrograms(
  supabase: SupabaseAdmin,
  scope: CrmScope,
  input: Record<string, unknown>
) {
  const now = new Date().toISOString();
  let programQuery = supabase
    .from('lender_programs')
    .select(
      'id,lender_id,program_name,product,priority,capacity_status,daily_submission_limit,indicative_roi_min,indicative_roi_max,min_loan,max_loan,min_tenure_months,max_tenure_months,employment_types,channels,states,cities,metadata'
    )
    .eq('status', 'active')
    .neq('capacity_status', 'paused');
  programQuery = scope.partnerId
    ? programQuery.or(`partner_id.is.null,partner_id.eq.${scope.partnerId}`)
    : programQuery.is('partner_id', null);
  const programsResult = await programQuery;
  if (programsResult.error) {
    if (missingTable(programsResult.error)) return null;
    throw programsResult.error;
  }
  const programRows = list(programsResult.data);
  if (!programRows.length) return null;

  const lenderIds = [...new Set(programRows.map((row) => row.lender_id))];
  const programIds = programRows.map((row) => row.id);
  const [lendersResult, policiesResult, capacityResult] = await Promise.all([
    supabase
      .from('lender_master')
      .select(
        'id,display_name,onboarding_status,kyc_status,agreement_status,agreement_expires_at,finance_email,billing_address,gstin'
      )
      .in('id', lenderIds)
      .eq('onboarding_status', 'active')
      .eq('kyc_status', 'verified')
      .eq('agreement_status', 'signed')
      .not('finance_email', 'is', null)
      .not('billing_address', 'is', null)
      .not('gstin', 'is', null)
      .or(`agreement_expires_at.is.null,agreement_expires_at.gt.${now}`),
    supabase
      .from('lender_policy_versions')
      .select('id,program_id,version,effective_from,effective_to')
      .in('program_id', programIds)
      .eq('status', 'published')
      .lte('effective_from', now)
      .or(`effective_to.is.null,effective_to.gt.${now}`)
      .order('effective_from', { ascending: false })
      .order('version', { ascending: false }),
    supabase.rpc('get_lender_program_daily_capacity_usage', {
      p_program_ids: programIds,
      p_as_of: now,
      p_actor_user_id: scope.userId,
    }),
  ]);
  if (lendersResult.error) throw lendersResult.error;
  if (policiesResult.error) throw policiesResult.error;
  if (capacityResult.error) throw capacityResult.error;

  const dailyCapacity = new Map(
    list(capacityResult.data as DailyCapacitySnapshot[] | null).map((snapshot) => [
      String(snapshot.program_id),
      snapshot,
    ])
  );

  const policyRows = list(policiesResult.data);
  if (!policyRows.length) return null;
  const { data: ruleRows, error: rulesError } = await supabase
    .from('lender_policy_rules')
    .select(
      'id,policy_version_id,field_key,operator,comparison_value,severity,reason_code,reason_text,weight,priority,enabled'
    )
    .in(
      'policy_version_id',
      policyRows.map((row) => row.id)
    )
    .eq('enabled', true);
  if (rulesError) throw rulesError;

  const lenders = new Map(list(lendersResult.data).map((row) => [row.id, row]));
  const policies = new Map<string, (typeof policyRows)[number]>();
  for (const policy of policyRows) {
    if (!policies.has(policy.program_id)) policies.set(policy.program_id, policy);
  }
  const rulesByPolicy = new Map<string, PolicyRule[]>();
  for (const row of list(ruleRows)) {
    const current = rulesByPolicy.get(row.policy_version_id) || [];
    current.push({
      id: row.id,
      fieldKey: row.field_key,
      operator: row.operator,
      comparisonValue: row.comparison_value,
      severity: row.severity,
      reasonCode: row.reason_code,
      reasonText: row.reason_text,
      weight: Number(row.weight || 0),
      priority: Number(row.priority || 100),
      enabled: Boolean(row.enabled),
    } as PolicyRule);
    rulesByPolicy.set(row.policy_version_id, current);
  }

  const programs: PolicyProgram[] = programRows.flatMap((row) => {
    const lender = lenders.get(row.lender_id);
    const policy = policies.get(row.id);
    if (!lender || !policy) return [];
    return [
      {
        lenderId: lender.id,
        lenderName: lender.display_name,
        programId: row.id,
        programName: row.program_name,
        product: row.product,
        priority: Number(row.priority || 100),
        policyVersionId: policy.id,
        policyVersion: Number(policy.version),
        roiMin: row.indicative_roi_min === null ? null : Number(row.indicative_roi_min),
        roiMax: row.indicative_roi_max === null ? null : Number(row.indicative_roi_max),
        maxLoan: row.max_loan === null ? null : Number(row.max_loan),
        capacityStatus:
          dailyCapacity.get(row.id)?.exhausted === true ? 'paused' : row.capacity_status,
        minLoan: row.min_loan === null ? null : Number(row.min_loan),
        minTenureMonths: row.min_tenure_months === null ? null : Number(row.min_tenure_months),
        maxTenureMonths: row.max_tenure_months === null ? null : Number(row.max_tenure_months),
        employmentTypes: list(row.employment_types),
        channels: list(row.channels),
        states: list(row.states),
        cities: list(row.cities),
        avgTat: typeof row.metadata?.avg_tat === 'string' ? row.metadata.avg_tat : undefined,
        rules: rulesByPolicy.get(policy.id) || [],
      },
    ];
  });
  return rankPrograms(programs, input);
}

export async function saveRoutingDecision(
  supabase: SupabaseAdmin,
  scope: CrmScope,
  input: {
    leadId?: string;
    eligibilityReportId: string;
    engineVersion: string;
    inputSnapshot: Record<string, unknown>;
    results: unknown[];
  }
) {
  if (!scope.partnerId || scope.isDemo) return false;
  const { error } = await supabase.rpc('register_lender_routing_decision', {
    p_partner_id: scope.partnerId,
    p_lead_id: input.leadId || null,
    p_eligibility_report_id: input.eligibilityReportId,
    p_engine_version: input.engineVersion,
    p_input_snapshot: input.inputSnapshot,
    p_result_snapshot: input.results,
    p_actor_user_id: scope.userId,
  });
  if (error) {
    if (
      missingTable(error) ||
      ['PGRST202', '42883'].includes(String((error as { code?: string }).code))
    )
      return false;
    throw error;
  }
  return true;
}
