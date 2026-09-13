import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';
import { validateLenderProgramImport } from '@/lib/lender-intelligence/import';
import { validatePolicyRule } from '@/lib/lender-intelligence/policy-schema';
import { requireLenderIntelligenceCapability } from '@/lib/lender-intelligence/access';

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function text(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function optionalNumber(value: unknown) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function hasValue(value: unknown) {
  return value !== '' && value !== null && value !== undefined;
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.map(text).filter(Boolean) : [];
}

function errorResponse(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if ('error' in auth) return errorResponse(auth.error || 'Unauthorized', auth.status);
  const denied = requireLenderIntelligenceCapability(auth.user, 'catalog.read');
  if (denied) return errorResponse(denied.error, denied.status);

  const [lenders, programs, policies, rejectionReasons, partners, schemaHealth] = await Promise.all(
    [
      auth.supabase.from('lender_master').select('*').order('display_name'),
      auth.supabase.from('lender_programs').select('*').order('priority').order('program_name'),
      auth.supabase
        .from('lender_policy_versions')
        .select('*,lender_policy_rules(*)')
        .order('created_at', { ascending: false }),
      auth.supabase.from('lender_rejection_reasons').select('*').order('sort_order').order('code'),
      auth.supabase.from('partners').select('id,company_name,name').order('company_name'),
      auth.supabase.rpc('verify_lender_intelligence_schema'),
    ]
  );
  const firstError = [
    lenders.error,
    programs.error,
    policies.error,
    rejectionReasons.error,
    partners.error,
    schemaHealth.error,
  ].find(Boolean);
  if (firstError) return errorResponse(firstError.message, 500);
  const programIds = (programs.data || []).map((program) => program.id);
  const capacityUsage = programIds.length
    ? await auth.supabase.rpc('get_lender_program_daily_capacity_usage', {
        p_program_ids: programIds,
        p_as_of: new Date().toISOString(),
        p_actor_user_id: auth.user.id,
      })
    : { data: [], error: null };
  if (capacityUsage.error) return errorResponse(capacityUsage.error.message, 500);

  return NextResponse.json({
    success: true,
    data: {
      lenders: lenders.data || [],
      programs: programs.data || [],
      policies: policies.data || [],
      rejectionReasons: rejectionReasons.data || [],
      capacityUsage: capacityUsage.data || [],
      partners: partners.data || [],
      schemaHealth: schemaHealth.data,
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if ('error' in auth) return errorResponse(auth.error || 'Unauthorized', auth.status);

  const body: unknown = await request.json().catch(() => null);
  if (!isObject(body)) return errorResponse('Request body must be JSON');
  const action = text(body.action);
  const capability = action === 'manage_data_quality_issue' ? 'compliance.manage' : 'policy.manage';
  const denied = requireLenderIntelligenceCapability(auth.user, capability);
  if (denied) return errorResponse(denied.error, denied.status);

  if (action === 'save_rejection_reason') {
    const reason = isObject(body.reason) ? body.reason : {};
    const code = text(reason.code).toUpperCase();
    const category = text(reason.category).toLowerCase();
    const label = text(reason.label);
    const sortOrder = optionalNumber(reason.sortOrder) ?? 100;
    if (!code || !category || !label)
      return errorResponse('Reason code, category, and label are required');
    if (!Number.isInteger(sortOrder)) return errorResponse('Sort order must be a whole number');
    const { data: result, error } = await auth.supabase.rpc('save_lender_rejection_reason', {
      p_reason_id: text(reason.id) || null,
      p_partner_id: text(reason.partnerId) || null,
      p_code: code,
      p_category: category,
      p_label: label,
      p_description: text(reason.description) || null,
      p_active: reason.active !== false,
      p_sort_order: sortOrder,
      p_user_id: auth.user.id,
    });
    if (error) return errorResponse(error.message, 409);
    const data = Array.isArray(result) ? result[0] : result;
    return NextResponse.json({ success: true, data });
  }

  if (action === 'review_policy_document') {
    const documentId = text(body.documentId);
    const decision = text(body.decision);
    const note = text(body.note);
    if (!documentId || !['verified', 'rejected'].includes(decision))
      return errorResponse('Document and valid review decision are required');
    if (decision === 'rejected' && note.length < 5)
      return errorResponse('A rejection note of at least 5 characters is required');
    const { data, error } = await auth.supabase.rpc('review_lender_policy_document', {
      p_document_id: documentId,
      p_decision: decision,
      p_note: note,
      p_reviewer_user_id: auth.user.id,
    });
    if (error) return errorResponse(error.message, 409);
    const document = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({ success: true, data: document });
  }

  if (action === 'manage_data_quality_issue') {
    const issueId = text(body.issueId);
    const issueAction = text(body.issueAction);
    const note = text(body.note);
    if (!issueId || !['claim', 'resolve', 'accept', 'reopen'].includes(issueAction)) {
      return errorResponse('Issue and valid lifecycle action are required');
    }
    const { data, error } = await auth.supabase.rpc('manage_lender_data_quality_issue', {
      p_issue_id: issueId,
      p_action: issueAction,
      p_note: note,
      p_user_id: auth.user.id,
    });
    if (error) return errorResponse(error.message, 409);
    const issue = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({ success: true, data: issue });
  }

  if (action === 'preview_bulk_import' || action === 'commit_bulk_import') {
    const validation = validateLenderProgramImport(body.rows);
    if (validation.errors.length) {
      return NextResponse.json({
        success: true,
        data: { valid: false, rows: validation.rows, errors: validation.errors },
      });
    }
    const programCodes = validation.rows.map((row) => row.programCode);
    const { data: existingPrograms, error: existingError } = await auth.supabase
      .from('lender_programs')
      .select('id,program_code,program_name,status,lender_id')
      .is('partner_id', null)
      .in('program_code', programCodes);
    if (existingError) return errorResponse(existingError.message, 500);
    const existingByCode = new Map(
      (existingPrograms || []).map((program) => [text(program.program_code).toUpperCase(), program])
    );
    const preview = validation.rows.map((row, index) => {
      const existing = existingByCode.get(row.programCode);
      return {
        row: index + 1,
        lenderCode: row.lenderCode,
        programCode: row.programCode,
        action:
          existing?.status === 'active' ? 'blocked_active' : existing ? 'update_draft' : 'create',
        existingProgramId: existing?.id || null,
      };
    });
    const blocked = preview.filter((item) => item.action === 'blocked_active');
    if (action === 'preview_bulk_import') {
      return NextResponse.json({
        success: true,
        data: {
          valid: !blocked.length,
          rows: validation.rows,
          preview,
          errors: blocked.map((item) => ({
            row: item.row,
            field: 'programCode',
            message:
              'Active programs cannot be overwritten by bulk import; create a new governed version instead',
          })),
        },
      });
    }
    if (blocked.length)
      return errorResponse('Bulk import contains active programs and cannot be committed', 409);
    const { data, error } = await auth.supabase.rpc('bulk_import_lender_programs', {
      p_rows: validation.rows,
      p_user_id: auth.user.id,
    });
    if (error) return errorResponse(error.message, 409);
    return NextResponse.json({ success: true, data: { valid: true, result: data, preview } });
  }

  if (action === 'upsert_lender') {
    const lender = isObject(body.lender) ? body.lender : {};
    const lenderId = text(lender.id);
    let existing: JsonObject | null = null;
    if (lenderId) {
      const { data, error } = await auth.supabase
        .from('lender_master')
        .select('*')
        .eq('id', lenderId)
        .single();
      if (error) return errorResponse('Lender not found', 404);
      existing = data;
    }
    const displayName = text(lender.displayName);
    const legalName = text(lender.legalName) || displayName;
    const lenderCode = text(lender.lenderCode).toUpperCase();
    const lenderType = text(lender.lenderType).toLowerCase();
    if (!displayName || !lenderCode)
      return errorResponse('Display name and lender code are required');
    if (!['bank', 'nbfc', 'hfc', 'fintech', 'other'].includes(lenderType)) {
      return errorResponse('Valid lender type is required');
    }
    const onboardingStatus =
      text(lender.onboardingStatus) || existing?.onboarding_status || 'draft';
    const kycStatus = text(lender.kycStatus) || existing?.kyc_status || 'pending';
    const agreementStatus = text(lender.agreementStatus) || existing?.agreement_status || 'pending';
    const agreementExpiresAt =
      text(lender.agreementExpiresAt) || text(existing?.agreement_expires_at) || null;
    const financeEmail = text(lender.financeEmail) || existing?.finance_email || null;
    const billingAddress = text(lender.billingAddress) || existing?.billing_address || null;
    const gstin = (text(lender.gstin) || text(existing?.gstin)).toUpperCase() || null;
    if (onboardingStatus === 'active') {
      if (kycStatus !== 'verified' || agreementStatus !== 'signed') {
        return errorResponse(
          'Verified KYC and signed agreement are required before activation',
          409
        );
      }
      if (agreementExpiresAt && Date.parse(agreementExpiresAt) <= Date.now()) {
        return errorResponse('Expired lender agreement cannot be activated', 409);
      }
      if (!financeEmail || !billingAddress || !gstin) {
        return errorResponse(
          'Finance email, billing address, and GSTIN are required before activation',
          409
        );
      }
    }

    const row = {
      ...(lenderId ? { id: lenderId } : {}),
      partner_id: text(lender.partnerId) || existing?.partner_id || null,
      legal_name: legalName,
      display_name: displayName,
      lender_code: lenderCode,
      lender_type: lenderType,
      website: text(lender.website) || existing?.website || null,
      support_email: text(lender.supportEmail) || existing?.support_email || null,
      support_mobile: text(lender.supportMobile) || existing?.support_mobile || null,
      finance_email: financeEmail,
      billing_address: billingAddress,
      gstin,
      onboarding_status: onboardingStatus,
      kyc_status: kycStatus,
      agreement_status: agreementStatus,
      agreement_expires_at: agreementExpiresAt,
      owner_user_id: text(lender.ownerUserId) || existing?.owner_user_id || null,
      metadata: isObject(lender.metadata) ? lender.metadata : existing?.metadata || {},
      updated_by: auth.user.id,
      ...(!lenderId ? { created_by: auth.user.id } : {}),
    };
    const { data, error } = await auth.supabase.rpc('save_lender_master', {
      p_lender: row,
      p_user_id: auth.user.id,
    });
    if (error) return errorResponse(error.message, 500);
    return NextResponse.json({ success: true, data });
  }

  if (action === 'upsert_program') {
    const program = isObject(body.program) ? body.program : {};
    const programId = text(program.id);
    const lenderId = text(program.lenderId);
    const programCode = text(program.programCode).toUpperCase();
    const programName = text(program.programName);
    const product = text(program.product).toLowerCase();
    if (!lenderId || !programCode || !programName || !product) {
      return errorResponse('Lender, program code, program name, and product are required');
    }
    let existingProgram: JsonObject | null = null;
    if (programId) {
      const { data, error } = await auth.supabase
        .from('lender_programs')
        .select('*')
        .eq('id', programId)
        .single();
      if (error || !data) return errorResponse('Lender program not found', 404);
      if (data.status !== 'draft')
        return errorResponse(
          'Only draft programs can be edited; use governed operating-status actions',
          409
        );
      if (data.lender_id !== lenderId)
        return errorResponse('A program cannot be moved to another lender', 409);
      existingProgram = data;
    }
    const minLoan = optionalNumber(program.minLoan);
    const maxLoan = optionalNumber(program.maxLoan);
    const minTenureMonths = optionalNumber(program.minTenureMonths);
    const maxTenureMonths = optionalNumber(program.maxTenureMonths);
    const indicativeRoiMin = optionalNumber(program.indicativeRoiMin);
    const indicativeRoiMax = optionalNumber(program.indicativeRoiMax);
    const dailySubmissionLimit = optionalNumber(program.dailySubmissionLimit);
    const numericInputs = [
      ['minimum loan', program.minLoan, minLoan],
      ['maximum loan', program.maxLoan, maxLoan],
      ['minimum tenure', program.minTenureMonths, minTenureMonths],
      ['maximum tenure', program.maxTenureMonths, maxTenureMonths],
      ['minimum ROI', program.indicativeRoiMin, indicativeRoiMin],
      ['maximum ROI', program.indicativeRoiMax, indicativeRoiMax],
      ['daily submission limit', program.dailySubmissionLimit, dailySubmissionLimit],
    ] as const;
    const malformed = numericInputs.find(([, raw, parsed]) => hasValue(raw) && parsed === null);
    if (malformed) return errorResponse(`Program ${malformed[0]} must be numeric`);
    const numericValues = [
      minLoan,
      maxLoan,
      minTenureMonths,
      maxTenureMonths,
      indicativeRoiMin,
      indicativeRoiMax,
      dailySubmissionLimit,
    ];
    if (numericValues.some((value) => value !== null && value < 0))
      return errorResponse('Program numeric limits cannot be negative');
    if (
      (minTenureMonths !== null && !Number.isInteger(minTenureMonths)) ||
      (maxTenureMonths !== null && !Number.isInteger(maxTenureMonths)) ||
      (dailySubmissionLimit !== null && !Number.isInteger(dailySubmissionLimit))
    )
      return errorResponse('Program tenure and daily submission limits must be whole numbers');
    if (
      dailySubmissionLimit !== null &&
      (dailySubmissionLimit < 1 || dailySubmissionLimit > 1_000_000)
    )
      return errorResponse('Daily submission limit must be between 1 and 1,000,000');
    if (minLoan !== null && maxLoan !== null && minLoan > maxLoan)
      return errorResponse('Minimum loan cannot exceed maximum loan');
    if (minTenureMonths !== null && maxTenureMonths !== null && minTenureMonths > maxTenureMonths)
      return errorResponse('Minimum tenure cannot exceed maximum tenure');
    if (
      indicativeRoiMin !== null &&
      indicativeRoiMax !== null &&
      indicativeRoiMin > indicativeRoiMax
    )
      return errorResponse('Minimum ROI cannot exceed maximum ROI');
    const capacityStatus =
      text(program.capacityStatus) || text(existingProgram?.capacity_status) || 'open';
    if (!['open', 'limited', 'paused'].includes(capacityStatus))
      return errorResponse('Valid program capacity status is required');
    const row = {
      ...(programId ? { id: programId } : {}),
      lender_id: lenderId,
      partner_id: text(program.partnerId) || existingProgram?.partner_id || null,
      program_code: programCode,
      program_name: programName,
      product,
      borrower_segment: text(program.borrowerSegment) || 'all',
      employment_types: stringList(program.employmentTypes),
      channels: stringList(program.channels),
      states: stringList(program.states).map((item) => item.toUpperCase()),
      cities: stringList(program.cities),
      min_loan: minLoan,
      max_loan: maxLoan,
      min_tenure_months: minTenureMonths,
      max_tenure_months: maxTenureMonths,
      indicative_roi_min: indicativeRoiMin,
      indicative_roi_max: indicativeRoiMax,
      processing_fee_text: text(program.processingFeeText) || null,
      capacity_status: capacityStatus,
      daily_submission_limit: dailySubmissionLimit,
      status: 'draft',
      priority: optionalNumber(program.priority) ?? 100,
      login_sla_hours: optionalNumber(program.loginSlaHours) ?? 24,
      sanction_sla_hours: optionalNumber(program.sanctionSlaHours) ?? 120,
      disbursal_sla_hours: optionalNumber(program.disbursalSlaHours) ?? 72,
      metadata: isObject(program.metadata) ? program.metadata : {},
      updated_by: auth.user.id,
      ...(!programId ? { created_by: auth.user.id } : {}),
    };
    const { data, error } = await auth.supabase.rpc('save_lender_program', {
      p_program: row,
      p_user_id: auth.user.id,
    });
    if (error) return errorResponse(error.message, 500);
    return NextResponse.json({ success: true, data });
  }

  if (action === 'set_lender_status') {
    const lenderId = text(body.lenderId);
    const status = text(body.status);
    const { data, error } = await auth.supabase.rpc('set_lender_operating_status', {
      p_lender_id: lenderId,
      p_status: status,
      p_user_id: auth.user.id,
    });
    if (error) return errorResponse(error.message, 409);
    return NextResponse.json({ success: true, data });
  }

  if (action === 'set_program_operating_status') {
    const programId = text(body.programId);
    const status = text(body.status);
    const capacityStatus = text(body.capacityStatus);
    if (
      !programId ||
      !['draft', 'active', 'paused', 'retired'].includes(status) ||
      !['open', 'limited', 'paused'].includes(capacityStatus)
    ) {
      return errorResponse('Program and valid operating states are required');
    }
    const { data: result, error } = await auth.supabase.rpc('set_lender_program_operating_status', {
      p_program_id: programId,
      p_status: status,
      p_capacity_status: capacityStatus,
      p_user_id: auth.user.id,
    });
    if (error) return errorResponse(error.message, 409);
    const data = Array.isArray(result) ? result[0] : result;
    return NextResponse.json({ success: true, data });
  }

  if (action === 'set_program_daily_capacity') {
    const programId = text(body.programId);
    const reason = text(body.reason);
    const rawLimit = body.dailySubmissionLimit;
    const dailySubmissionLimit = hasValue(rawLimit) ? optionalNumber(rawLimit) : null;
    if (!programId || reason.length < 5 || reason.length > 2000) {
      return errorResponse('Program and a meaningful capacity-change reason are required');
    }
    if (
      dailySubmissionLimit !== null &&
      (!Number.isInteger(dailySubmissionLimit) ||
        dailySubmissionLimit < 1 ||
        dailySubmissionLimit > 1_000_000)
    )
      return errorResponse(
        'Daily submission limit must be blank or a whole number from 1 to 1,000,000'
      );
    const { data: result, error } = await auth.supabase.rpc('set_lender_program_daily_capacity', {
      p_program_id: programId,
      p_daily_submission_limit: dailySubmissionLimit,
      p_reason: reason,
      p_user_id: auth.user.id,
    });
    if (error) return errorResponse(error.message, 409);
    const data = Array.isArray(result) ? result[0] : result;
    return NextResponse.json({ success: true, data });
  }

  if (action === 'create_policy_draft') {
    const programId = text(body.programId);
    const sourceType = text(body.sourceType) || 'manual';
    const sourceReference = text(body.sourceReference);
    if (!programId) return errorResponse('Program is required');
    const { data: result, error } = await auth.supabase.rpc('create_lender_policy_draft', {
      p_program_id: programId,
      p_source_type: sourceType,
      p_source_reference: sourceReference || null,
      p_source_checksum: text(body.sourceChecksum) || null,
      p_change_summary: text(body.changeSummary) || null,
      p_review_due_at:
        text(body.reviewDueAt) || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      p_maker_user_id: auth.user.id,
    });
    if (error) return errorResponse(error.message, 500);
    const data = Array.isArray(result) ? result[0] : result;
    return NextResponse.json({ success: true, data });
  }

  if (action === 'create_policy_restoration') {
    const sourcePolicyVersionId = text(body.sourcePolicyVersionId);
    const restorationReason = text(body.restorationReason);
    if (!sourcePolicyVersionId) return errorResponse('Historical policy version is required');
    if (restorationReason.length < 5)
      return errorResponse('A meaningful restoration reason is required');
    const { data, error } = await auth.supabase.rpc('create_lender_policy_restoration', {
      p_source_policy_version_id: sourcePolicyVersionId,
      p_reason: restorationReason,
      p_maker_user_id: auth.user.id,
    });
    if (error) return errorResponse(error.message, 409);
    const restored = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({ success: true, data: restored });
  }

  if (action === 'replace_policy_rules') {
    const policyVersionId = text(body.policyVersionId);
    const rules = Array.isArray(body.rules) ? body.rules.filter(isObject) : [];
    if (!policyVersionId || !rules.length)
      return errorResponse('Policy version and rules are required');
    const rows = rules.map((rule, index) => ({
      policy_version_id: policyVersionId,
      rule_group: text(rule.ruleGroup) || 'base',
      field_key: text(rule.fieldKey),
      operator: text(rule.operator),
      comparison_value: rule.comparisonValue ?? null,
      severity: text(rule.severity) || 'hard',
      reason_code: text(rule.reasonCode).toUpperCase(),
      reason_text: text(rule.reasonText),
      weight: optionalNumber(rule.weight) ?? 0,
      priority: optionalNumber(rule.priority) ?? (index + 1) * 10,
      enabled: rule.enabled !== false,
      created_by: auth.user.id,
    }));
    if (
      rows.some((row) => !row.field_key || !row.operator || !row.reason_code || !row.reason_text)
    ) {
      return errorResponse('Every rule needs field, operator, reason code, and reason text');
    }
    const validationErrors = rules.flatMap((rule, index) =>
      validatePolicyRule({
        fieldKey: text(rule.fieldKey),
        operator: text(rule.operator),
        comparisonValue: rule.comparisonValue,
        severity: text(rule.severity) || 'hard',
        reasonCode: text(rule.reasonCode),
        reasonText: text(rule.reasonText),
        weight: rule.weight,
      }).map((message) => `Rule ${index + 1}: ${message}`)
    );
    if (validationErrors.length) return errorResponse(validationErrors.join('; '));
    const { data, error } = await auth.supabase.rpc('replace_lender_policy_rules', {
      p_policy_version_id: policyVersionId,
      p_rules: rows,
      p_user_id: auth.user.id,
    });
    if (error) return errorResponse(error.message, 500);
    return NextResponse.json({ success: true, data });
  }

  if (action === 'submit_policy') {
    const policyVersionId = text(body.policyVersionId);
    if (!policyVersionId) return errorResponse('Policy version is required');
    const { data, error } = await auth.supabase.rpc('submit_lender_policy', {
      p_policy_version_id: policyVersionId,
      p_maker_user_id: auth.user.id,
    });
    if (error) return errorResponse(error.message, 500);
    return NextResponse.json({ success: true, data });
  }

  if (action === 'publish_policy') {
    const policyVersionId = text(body.policyVersionId);
    const effectiveFrom = text(body.effectiveFrom) || new Date().toISOString();
    if (!policyVersionId) return errorResponse('Policy version is required');
    if (!Number.isFinite(Date.parse(effectiveFrom)))
      return errorResponse('Valid effective date is required');
    const { data, error } = await auth.supabase.rpc('publish_lender_policy', {
      p_policy_version_id: policyVersionId,
      p_checker_user_id: auth.user.id,
      p_effective_from: effectiveFrom,
    });
    if (error) return errorResponse(error.message, 500);
    return NextResponse.json({ success: true, data });
  }

  if (action === 'reject_policy') {
    const policyVersionId = text(body.policyVersionId);
    const rejectionReason = text(body.rejectionReason);
    if (!policyVersionId) return errorResponse('Policy version is required');
    if (rejectionReason.length < 5)
      return errorResponse('A meaningful rejection reason is required');
    const { data, error } = await auth.supabase.rpc('reject_lender_policy', {
      p_policy_version_id: policyVersionId,
      p_reason: rejectionReason,
      p_checker_user_id: auth.user.id,
    });
    if (error) return errorResponse(error.message, 409);
    const rejected = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({ success: true, data: rejected });
  }

  if (action === 'retire_policy') {
    const policyVersionId = text(body.policyVersionId);
    const reason = text(body.reason);
    if (!policyVersionId || reason.length < 5)
      return errorResponse('Published policy and retirement evidence are required');
    const retiredAt = new Date().toISOString();
    const { data, error } = await auth.supabase.rpc('retire_lender_policy', {
      p_policy_version_id: policyVersionId,
      p_reason: reason,
      p_user_id: auth.user.id,
      p_retired_at: retiredAt,
    });
    if (error) return errorResponse(error.message, 409);
    return NextResponse.json({ success: true, data });
  }

  if (action === 'discard_policy_draft') {
    const policyVersionId = text(body.policyVersionId);
    const reason = text(body.reason);
    if (!policyVersionId || reason.length < 5)
      return errorResponse('Policy draft and discard evidence are required');
    const { data, error } = await auth.supabase.rpc('discard_lender_policy_draft', {
      p_policy_version_id: policyVersionId,
      p_reason: reason,
      p_user_id: auth.user.id,
    });
    if (error) return errorResponse(error.message, 409);
    return NextResponse.json({ success: true, data });
  }

  return errorResponse('Unsupported action');
}
