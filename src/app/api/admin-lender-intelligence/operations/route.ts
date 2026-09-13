import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';
import { validateCommercialPayoutTerms } from '@/lib/lender-intelligence/commercials';
import { requireLenderIntelligenceCapability } from '@/lib/lender-intelligence/access';

function text(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function number(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function fail(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if ('error' in auth) return fail(auth.error || 'Unauthorized', auth.status);
  const denied = requireLenderIntelligenceCapability(auth.user, 'finance.read');
  if (denied) return fail(denied.error, denied.status);
  const [
    commercials,
    reconciliation,
    invoices,
    payments,
    adjustments,
    clawbacks,
    exceptions,
    partnerCommissionVersions,
    partnerCommissionItems,
    partnerCommissionPayments,
    partnerPayoutProfiles,
    partnerCommissionPaymentRequests,
    partnerCommissionRecoveries,
  ] = await Promise.all([
    auth.supabase
      .from('lender_commercial_versions')
      .select('*,lender_master(display_name),lender_programs(program_name)')
      .order('created_at', { ascending: false }),
    auth.supabase
      .from('lender_reconciliation_items')
      .select(
        '*,lender_commercial_versions(payout_basis,version),lender_outcomes(outcome,disbursed_amount,lender_id,program_id,crm_lender_applications(customer_name,product))'
      )
      .order('created_at', { ascending: false })
      .limit(1000),
    auth.supabase
      .from('lender_invoices')
      .select('*,lender_master(display_name)')
      .order('created_at', { ascending: false })
      .limit(500),
    auth.supabase
      .from('lender_invoice_payments')
      .select('*,lender_invoices(invoice_number,lender_master(display_name))')
      .order('recorded_at', { ascending: false })
      .limit(500),
    auth.supabase
      .from('lender_invoice_adjustments')
      .select('*,lender_invoices(invoice_number,lender_master(display_name))')
      .order('recorded_at', { ascending: false })
      .limit(500),
    auth.supabase
      .from('lender_clawbacks')
      .select(
        '*,lender_commercial_versions(version,lender_master(display_name)),crm_lender_applications(customer_name)'
      )
      .order('triggered_at', { ascending: false })
      .limit(500),
    auth.supabase
      .from('lender_routing_exceptions')
      .select(
        '*,lender_master(display_name),lender_programs(program_name,product,status,capacity_status)'
      )
      .order('requested_at', { ascending: false })
      .limit(500),
    auth.supabase
      .from('partner_commission_versions')
      .select('*,partners(company_name),lender_master(display_name),lender_programs(program_name)')
      .order('created_at', { ascending: false })
      .limit(500),
    auth.supabase
      .from('partner_commission_items')
      .select(
        '*,partners(company_name),lender_master(display_name),lender_programs(program_name),crm_lender_applications(customer_name,product)'
      )
      .order('created_at', { ascending: false })
      .limit(1000),
    auth.supabase
      .from('partner_commission_payments')
      .select('*,partner_commission_items(partner_id,net_payable,partners(company_name))')
      .order('recorded_at', { ascending: false })
      .limit(500),
    auth.supabase
      .from('partner_payout_profile_versions')
      .select('*,partners(company_name)')
      .order('created_at', { ascending: false })
      .limit(500),
    auth.supabase
      .from('partner_commission_payment_requests')
      .select(
        '*,partner_commission_items(partner_id,net_payable,paid_amount,partners(company_name))'
      )
      .order('requested_at', { ascending: false })
      .limit(500),
    auth.supabase
      .from('partner_commission_recoveries')
      .select('*,partner_commission_items(application_id,paid_amount,partners(company_name))')
      .order('requested_at', { ascending: false })
      .limit(500),
  ]);
  const firstError = [
    commercials.error,
    reconciliation.error,
    invoices.error,
    payments.error,
    adjustments.error,
    clawbacks.error,
    exceptions.error,
    partnerCommissionVersions.error,
    partnerCommissionItems.error,
    partnerCommissionPayments.error,
    partnerPayoutProfiles.error,
    partnerCommissionPaymentRequests.error,
    partnerCommissionRecoveries.error,
  ].find(Boolean);
  if (firstError) return fail(firstError.message, 500);
  return NextResponse.json({
    success: true,
    data: {
      commercials: commercials.data || [],
      reconciliation: reconciliation.data || [],
      invoices: invoices.data || [],
      payments: payments.data || [],
      adjustments: adjustments.data || [],
      clawbacks: clawbacks.data || [],
      exceptions: exceptions.data || [],
      partnerCommissionVersions: partnerCommissionVersions.data || [],
      partnerCommissionItems: partnerCommissionItems.data || [],
      partnerCommissionPayments: partnerCommissionPayments.data || [],
      partnerPayoutProfiles: partnerPayoutProfiles.data || [],
      partnerCommissionPaymentRequests: partnerCommissionPaymentRequests.data || [],
      partnerCommissionRecoveries: partnerCommissionRecoveries.data || [],
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if ('error' in auth) return fail(auth.error || 'Unauthorized', auth.status);
  const body = object(await request.json().catch(() => null));
  const action = text(body.action);
  const capability =
    action === 'review_exception'
      ? 'routing.review'
      : action === 'refresh_data_quality'
        ? 'compliance.manage'
        : 'finance.manage';
  const denied = requireLenderIntelligenceCapability(auth.user, capability);
  if (denied) return fail(denied.error, denied.status);

  if (action === 'create_commercial_draft') {
    const lenderId = text(body.lenderId);
    const programId = text(body.programId) || null;
    const partnerId = text(body.partnerId) || null;
    const payoutBasis = text(body.payoutBasis);
    const taxRatePercent = number(body.taxRatePercent);
    const reverseCharge = body.reverseCharge === true;
    const clawbackTerms = object(body.clawbackTerms);
    const clawbackWindowDays = number(clawbackTerms.windowDays);
    const clawbackBasis = text(clawbackTerms.basis);
    const clawbackValue = number(clawbackTerms.value);
    if (!lenderId || !['flat', 'percentage', 'slab', 'custom'].includes(payoutBasis)) {
      return fail('Lender and valid payout basis are required');
    }
    const payoutSlab = Array.isArray(body.payoutSlab) ? body.payoutSlab : [];
    const payoutErrors = validateCommercialPayoutTerms({
      basis: payoutBasis,
      value: body.payoutValue,
      slabs: payoutSlab,
    });
    if (payoutErrors.length) return fail(payoutErrors.join('; '));
    if (taxRatePercent < 0 || taxRatePercent > 100)
      return fail('Tax rate must be between 0 and 100');
    if (
      clawbackWindowDays < 0 ||
      clawbackWindowDays > 3650 ||
      !['full', 'percentage', 'fixed'].includes(clawbackBasis)
    ) {
      return fail('Valid clawback window and basis are required');
    }
    if (
      (clawbackBasis === 'percentage' && (clawbackValue <= 0 || clawbackValue > 100)) ||
      (clawbackBasis === 'fixed' && clawbackValue <= 0)
    ) {
      return fail('Valid clawback percentage or fixed amount is required');
    }
    const { data: lender, error: lenderError } = await auth.supabase
      .from('lender_master')
      .select('id')
      .eq('id', lenderId)
      .maybeSingle();
    if (lenderError || !lender) return fail('Lender not found', 404);
    if (programId) {
      const { data: program, error: programError } = await auth.supabase
        .from('lender_programs')
        .select('id')
        .eq('id', programId)
        .eq('lender_id', lenderId)
        .maybeSingle();
      if (programError || !program)
        return fail('Program does not belong to the selected lender', 409);
    }
    const { data: result, error } = await auth.supabase.rpc('create_lender_commercial_draft', {
      p_commercial: {
        partner_id: partnerId,
        lender_id: lenderId,
        program_id: programId,
        status: 'draft',
        payout_basis: payoutBasis,
        payout_value: ['flat', 'percentage'].includes(payoutBasis)
          ? number(body.payoutValue)
          : null,
        payout_slab: payoutSlab,
        tax_terms: { ...object(body.taxTerms), ratePercent: taxRatePercent, reverseCharge },
        clawback_terms: {
          windowDays: clawbackWindowDays,
          basis: clawbackBasis,
          value: clawbackValue,
        },
        source_reference: text(body.sourceReference) || null,
      },
      p_maker_user_id: auth.user.id,
    });
    if (error) return fail(error.message, 500);
    const data = Array.isArray(result) ? result[0] : result;
    return NextResponse.json({ success: true, data });
  }

  if (action === 'create_partner_commission_draft') {
    const partnerId = text(body.partnerId);
    const basis = text(body.commissionBasis);
    const sourceReference = text(body.sourceReference);
    const taxRate = number(body.taxRate);
    const withholdingRate = number(body.withholdingRate);
    const paymentTermsDays = number(body.paymentTermsDays);
    const slabs = Array.isArray(body.commissionSlab) ? body.commissionSlab : [];
    if (!partnerId || !['flat', 'percentage', 'slab'].includes(basis) || sourceReference.length < 3)
      return fail('Partner, valid commission basis, and source reference are required');
    const commissionErrors = validateCommercialPayoutTerms({
      basis,
      value: body.commissionValue,
      slabs,
    });
    if (commissionErrors.length) return fail(commissionErrors.join('; '));
    if (taxRate < 0 || taxRate > 100 || withholdingRate < 0 || withholdingRate > 100)
      return fail('Tax and withholding rates must be between 0 and 100');
    if (!Number.isInteger(paymentTermsDays) || paymentTermsDays < 0 || paymentTermsDays > 365)
      return fail('Payment terms must be a whole number from 0 to 365 days');
    const { data, error } = await auth.supabase.rpc('create_partner_commission_draft', {
      p_terms: {
        partner_id: partnerId,
        lender_id: text(body.lenderId) || null,
        program_id: text(body.programId) || null,
        commission_basis: basis,
        commission_value: basis === 'slab' ? null : number(body.commissionValue),
        commission_slab: slabs,
        tax_rate: taxRate,
        withholding_rate: withholdingRate,
        payment_terms_days: paymentTermsDays,
        source_reference: sourceReference,
      },
      p_user_id: auth.user.id,
    });
    if (error) return fail(error.message, 409);
    return NextResponse.json({ success: true, data });
  }

  if (action === 'create_partner_payout_profile_draft') {
    const profile = object(body.profile);
    const partnerId = text(profile.partnerId);
    const taxRegistrationStatus = text(profile.taxRegistrationStatus);
    const gstin = text(profile.gstin).toUpperCase();
    const panLast4 = text(profile.panLast4).toUpperCase();
    const accountLast4 = text(profile.accountNumberLast4);
    const ifsc = text(profile.ifsc).toUpperCase();
    if (!partnerId || !['registered', 'unregistered'].includes(taxRegistrationStatus))
      return fail('Partner and tax registration status are required');
    if (
      taxRegistrationStatus === 'registered' &&
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)
    )
      return fail('A valid GSTIN is required for a registered partner');
    if (
      !/^[A-Z0-9]{4}$/.test(panLast4) ||
      !/^\d{4}$/.test(accountLast4) ||
      !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)
    )
      return fail('Valid masked PAN, account last four digits, and IFSC are required');
    const { data, error } = await auth.supabase.rpc('create_partner_payout_profile_draft', {
      p_profile: {
        partner_id: partnerId,
        legal_name: text(profile.legalName),
        tax_registration_status: taxRegistrationStatus,
        gstin: taxRegistrationStatus === 'registered' ? gstin : null,
        pan_last4: panLast4,
        billing_address: text(profile.billingAddress),
        finance_email: text(profile.financeEmail),
        account_holder_name: text(profile.accountHolderName),
        bank_name: text(profile.bankName),
        account_number_last4: accountLast4,
        ifsc,
        beneficiary_reference: text(profile.beneficiaryReference),
        verification_reference: text(profile.verificationReference),
      },
      p_user_id: auth.user.id,
    });
    if (error) return fail(error.message, 409);
    return NextResponse.json({ success: true, data });
  }

  if (action === 'review_partner_payout_profile') {
    const profileId = text(body.profileId);
    const decision = text(body.decision);
    const reason = text(body.reason);
    if (
      !profileId ||
      !['submit', 'verify', 'reject'].includes(decision) ||
      (decision === 'reject' && reason.length < 5)
    )
      return fail(
        'Payout profile, valid decision, and rejection evidence when applicable are required'
      );
    const { data, error } = await auth.supabase.rpc('review_partner_payout_profile', {
      p_profile_id: profileId,
      p_decision: decision,
      p_reason: reason || null,
      p_user_id: auth.user.id,
    });
    if (error) return fail(error.message, 409);
    return NextResponse.json({ success: true, data });
  }

  if (action === 'review_partner_commission') {
    const versionId = text(body.versionId);
    const decision = text(body.decision);
    const reason = text(body.reason);
    if (!versionId || !['submit', 'activate', 'reject'].includes(decision))
      return fail('Commission version and valid lifecycle decision are required');
    if (decision === 'reject' && reason.length < 5)
      return fail('Detailed rejection evidence is required');
    const { data, error } = await auth.supabase.rpc('review_partner_commission', {
      p_version_id: versionId,
      p_decision: decision,
      p_reason: reason || null,
      p_user_id: auth.user.id,
    });
    if (error) return fail(error.message, 409);
    return NextResponse.json({ success: true, data });
  }

  if (action === 'request_partner_commission_payment') {
    const itemId = text(body.itemId);
    const amount = number(body.amount);
    const reference = text(body.reference);
    const idempotencyKey = text(body.idempotencyKey);
    const note = text(body.note);
    if (
      !itemId ||
      amount <= 0 ||
      reference.length < 3 ||
      reference.length > 100 ||
      idempotencyKey.length < 8 ||
      idempotencyKey.length > 200 ||
      note.length < 5 ||
      note.length > 500
    )
      return fail(
        'Payable item, positive amount, reference, idempotency key, and payment evidence are required'
      );
    const { data, error } = await auth.supabase.rpc('request_partner_commission_payment', {
      p_item_id: itemId,
      p_amount: amount,
      p_reference: reference,
      p_idempotency_key: idempotencyKey,
      p_note: note,
      p_user_id: auth.user.id,
    });
    if (error) return fail(error.message, 409);
    return NextResponse.json({ success: true, data });
  }

  if (action === 'review_partner_commission_payment') {
    const requestId = text(body.requestId);
    const decision = text(body.decision);
    const reviewNote = text(body.reviewNote);
    if (
      !requestId ||
      !['approved', 'rejected'].includes(decision) ||
      reviewNote.length < 5 ||
      reviewNote.length > 500
    )
      return fail('Payment request, approval/rejection decision, and review evidence are required');
    const { data, error } = await auth.supabase.rpc('review_partner_commission_payment', {
      p_request_id: requestId,
      p_decision: decision,
      p_review_note: reviewNote,
      p_user_id: auth.user.id,
    });
    if (error) return fail(error.message, 409);
    return NextResponse.json({ success: true, data });
  }

  if (action === 'terminate_partner_commission') {
    const versionId = text(body.versionId);
    const reason = text(body.reason);
    if (!versionId || reason.length < 5)
      return fail('Commission version and termination evidence are required');
    const { data, error } = await auth.supabase.rpc('terminate_partner_commission', {
      p_version_id: versionId,
      p_reason: reason,
      p_user_id: auth.user.id,
    });
    if (error) return fail(error.message, 409);
    return NextResponse.json({ success: true, data });
  }

  if (action === 'manage_partner_commission_item') {
    const itemId = text(body.itemId);
    const itemAction = text(body.itemAction);
    const reason = text(body.reason);
    if (
      !itemId ||
      !['hold', 'dispute', 'release', 'write_off'].includes(itemAction) ||
      reason.length < 5
    )
      return fail('Payable, valid action, and detailed evidence are required');
    const { data, error } = await auth.supabase.rpc('manage_partner_commission_item', {
      p_item_id: itemId,
      p_action: itemAction,
      p_reason: reason,
      p_user_id: auth.user.id,
    });
    if (error) return fail(error.message, 409);
    return NextResponse.json({ success: true, data });
  }

  if (action === 'register_partner_commission_recovery') {
    const itemId = text(body.itemId);
    const amount = number(body.amount);
    const triggerCode = text(body.triggerCode).toUpperCase();
    const triggerNote = text(body.triggerNote);
    if (
      !itemId ||
      amount <= 0 ||
      Math.round(amount * 100) !== amount * 100 ||
      !/^[A-Z][A-Z0-9_]{2,49}$/.test(triggerCode) ||
      triggerNote.length < 5 ||
      triggerNote.length > 500
    )
      return fail(
        'Paid payable, valid amount, canonical trigger code, and recovery evidence are required'
      );
    const { data, error } = await auth.supabase.rpc('register_partner_commission_recovery', {
      p_item_id: itemId,
      p_amount: amount,
      p_trigger_code: triggerCode,
      p_trigger_note: triggerNote,
      p_user_id: auth.user.id,
    });
    if (error) return fail(error.message, 409);
    return NextResponse.json({ success: true, data });
  }

  if (action === 'resolve_partner_commission_recovery') {
    const recoveryId = text(body.recoveryId);
    const status = text(body.status);
    const reference = text(body.reference);
    const note = text(body.note);
    if (
      !recoveryId ||
      !['disputed', 'recovered', 'waived'].includes(status) ||
      note.length < 5 ||
      note.length > 500 ||
      (status === 'recovered' && (reference.length < 3 || reference.length > 100))
    )
      return fail(
        'Recovery, valid resolution, evidence, and collection reference when recovered are required'
      );
    const { data, error } = await auth.supabase.rpc('resolve_partner_commission_recovery', {
      p_recovery_id: recoveryId,
      p_status: status,
      p_reference: reference || null,
      p_note: note,
      p_user_id: auth.user.id,
    });
    if (error) return fail(error.message, 409);
    return NextResponse.json({ success: true, data });
  }

  if (action === 'submit_commercial') {
    const id = text(body.commercialVersionId);
    if (!id) return fail('Commercial version is required');
    const { data, error } = await auth.supabase.rpc('submit_lender_commercial', {
      p_commercial_version_id: id,
      p_maker_user_id: auth.user.id,
    });
    if (error) return fail(error.message, 500);
    return NextResponse.json({ success: true, data });
  }

  if (action === 'reject_commercial') {
    const id = text(body.commercialVersionId);
    const reason = text(body.reason);
    const { data, error } = await auth.supabase.rpc('reject_lender_commercial', {
      p_commercial_version_id: id,
      p_checker_user_id: auth.user.id,
      p_reason: reason,
    });
    if (error) return fail(error.message, 409);
    return NextResponse.json({ success: true, data });
  }

  if (action === 'activate_commercial') {
    const id = text(body.commercialVersionId);
    const effectiveFrom = text(body.effectiveFrom) || new Date().toISOString();
    const { data, error } = await auth.supabase.rpc('activate_lender_commercial', {
      p_commercial_version_id: id,
      p_checker_user_id: auth.user.id,
      p_effective_from: effectiveFrom,
    });
    if (error) return fail(error.message, 409);
    return NextResponse.json({ success: true, data });
  }

  if (action === 'terminate_commercial') {
    const id = text(body.commercialVersionId);
    const reason = text(body.reason);
    if (!id || reason.length < 5) return fail('Commercial and termination evidence are required');
    const terminatedAt = new Date().toISOString();
    const { data, error } = await auth.supabase.rpc('terminate_lender_commercial', {
      p_commercial_version_id: id,
      p_reason: reason,
      p_user_id: auth.user.id,
      p_terminated_at: terminatedAt,
    });
    if (error) return fail(error.message, 409);
    return NextResponse.json({ success: true, data });
  }

  if (action === 'discard_commercial_draft') {
    const id = text(body.commercialVersionId);
    const reason = text(body.reason);
    if (!id || reason.length < 5) return fail('Commercial draft and discard evidence are required');
    const { data, error } = await auth.supabase.rpc('discard_lender_commercial_draft', {
      p_commercial_version_id: id,
      p_reason: reason,
      p_user_id: auth.user.id,
    });
    if (error) return fail(error.message, 409);
    return NextResponse.json({ success: true, data });
  }

  if (action === 'create_invoice') {
    const itemIds = Array.isArray(body.itemIds) ? body.itemIds.map(text).filter(Boolean) : [];
    const partnerId = text(body.partnerId);
    const lenderId = text(body.lenderId);
    const dueAt = text(body.dueAt);
    if (!itemIds.length || !partnerId || !lenderId)
      return fail('Partner, lender, and items are required');
    if (dueAt && (!Number.isFinite(Date.parse(dueAt)) || Date.parse(dueAt) <= Date.now()))
      return fail('Invoice due date must be in the future');
    const { data, error } = await auth.supabase.rpc('create_lender_invoice', {
      p_partner_id: partnerId,
      p_lender_id: lenderId,
      p_direction: 'receivable',
      p_item_ids: itemIds,
      p_due_at: dueAt || null,
      p_user_id: auth.user.id,
    });
    if (error) return fail(error.message, 409);
    return NextResponse.json({ success: true, data });
  }

  if (action === 'set_manual_payout') {
    const itemId = text(body.itemId);
    const amount = number(body.amount);
    const reason = text(body.reason);
    if (!itemId || amount <= 0 || reason.length < 5)
      return fail('Item, positive payout amount, and detailed evidence are required');
    const { data, error } = await auth.supabase.rpc('set_manual_lender_payout', {
      p_item_id: itemId,
      p_amount: amount,
      p_reason: reason,
      p_user_id: auth.user.id,
    });
    if (error) return fail(error.message, 409);
    const item = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({ success: true, data: item });
  }

  if (action === 'raise_invoice') {
    const { data, error } = await auth.supabase.rpc('raise_lender_invoice', {
      p_invoice_id: text(body.invoiceId),
      p_user_id: auth.user.id,
    });
    if (error) return fail(error.message, 409);
    const invoice = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({ success: true, data: invoice });
  }

  if (action === 'record_payment') {
    const idempotencyKey = text(body.idempotencyKey);
    const reference = text(body.reference);
    if (reference.length < 3 || reference.length > 100)
      return fail('Payment reference must be between 3 and 100 characters');
    if (idempotencyKey.length < 8 || idempotencyKey.length > 200)
      return fail('Valid payment idempotency key is required');
    const { data, error } = await auth.supabase.rpc('record_lender_invoice_payment', {
      p_invoice_id: text(body.invoiceId),
      p_amount: number(body.amount),
      p_reference: reference,
      p_user_id: auth.user.id,
      p_idempotency_key: idempotencyKey,
    });
    if (error) return fail(error.message, 409);
    return NextResponse.json({ success: true, data });
  }

  if (action === 'cancel_invoice') {
    const invoiceId = text(body.invoiceId);
    const reason = text(body.reason);
    if (!invoiceId || reason.length < 5)
      return fail('Invoice and detailed cancellation reason are required');
    const { data, error } = await auth.supabase.rpc('cancel_lender_invoice', {
      p_invoice_id: invoiceId,
      p_reason: reason,
      p_user_id: auth.user.id,
    });
    if (error) return fail(error.message, 409);
    const invoice = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({ success: true, data: invoice });
  }

  if (action === 'register_clawback') {
    const itemId = text(body.itemId);
    const triggerCode = text(body.triggerCode).toUpperCase();
    const triggerNote = text(body.triggerNote);
    const triggeredAt = text(body.triggeredAt) || new Date().toISOString();
    if (
      !itemId ||
      triggerCode.length < 3 ||
      triggerNote.length < 5 ||
      !Number.isFinite(Date.parse(triggeredAt))
    ) {
      return fail(
        'Reconciliation item, trigger code, detailed note, and valid trigger date are required'
      );
    }
    const { data: result, error } = await auth.supabase.rpc('register_lender_clawback', {
      p_reconciliation_item_id: itemId,
      p_trigger_code: triggerCode,
      p_trigger_note: triggerNote,
      p_triggered_at: triggeredAt,
      p_user_id: auth.user.id,
    });
    if (error)
      return fail(
        error.code === '23505' ? 'A clawback already exists for this payout' : error.message,
        409
      );
    const data = Array.isArray(result) ? result[0] : result;
    return NextResponse.json({ success: true, data });
  }

  if (action === 'resolve_clawback') {
    const id = text(body.clawbackId);
    const status = text(body.status);
    const resolutionNote = text(body.resolutionNote);
    const recoveryReference = text(body.recoveryReference);
    if (!id || !['recovered', 'waived'].includes(status) || resolutionNote.length < 5)
      return fail('Clawback, resolution, and detailed note are required');
    if (status === 'recovered' && (recoveryReference.length < 3 || recoveryReference.length > 100))
      return fail('Recovery payment reference must be between 3 and 100 characters');
    const { data: result, error } = await auth.supabase.rpc('resolve_lender_clawback', {
      p_clawback_id: id,
      p_status: status,
      p_resolution_note: resolutionNote,
      p_recovery_reference: status === 'recovered' ? recoveryReference : null,
      p_user_id: auth.user.id,
    });
    if (error) return fail(error.message, 409);
    const data = Array.isArray(result) ? result[0] : result;
    return NextResponse.json({ success: true, data });
  }

  if (action === 'review_exception') {
    const exceptionId = text(body.exceptionId);
    const decision = text(body.decision);
    const reviewNote = text(body.reviewNote);
    if (!exceptionId || !['approved', 'rejected'].includes(decision) || reviewNote.length < 5) {
      return fail('Exception, approve/reject decision, and review note are required');
    }
    const { data: result, error } = await auth.supabase.rpc('review_lender_routing_exception', {
      p_exception_id: exceptionId,
      p_decision: decision,
      p_review_note: reviewNote,
      p_reviewer_user_id: auth.user.id,
    });
    if (error) return fail(error.message, 409);
    const data = Array.isArray(result) ? result[0] : result;
    return NextResponse.json({ success: true, data });
  }

  if (action === 'refresh_data_quality') {
    const [readiness, partnerPayables] = await Promise.all([
      auth.supabase.rpc('refresh_lender_data_quality_issues_as_actor', { p_user_id: auth.user.id }),
      auth.supabase.rpc('refresh_partner_commission_issues'),
    ]);
    if (readiness.error || partnerPayables.error)
      return fail(
        (readiness.error || partnerPayables.error)?.message || 'Compliance refresh failed',
        500
      );
    return NextResponse.json({
      success: true,
      data: { refreshedIssues: Number(readiness.data || 0) + Number(partnerPayables.data || 0) },
    });
  }

  if (action === 'update_reconciliation') {
    const itemId = text(body.itemId);
    const status = text(body.status);
    const varianceReason = text(body.varianceReason);
    const receivedAmount = Math.max(0, number(body.receivedAmount));
    if (
      !itemId ||
      !['disputed', 'invoiced', 'paid', 'written_off'].includes(status) ||
      varianceReason.length < 5
    ) {
      return fail('Item, valid resolution status, and detailed reason are required');
    }
    if (status === 'paid' && receivedAmount <= 0)
      return fail('Received amount is required to resolve as paid');
    const { data, error } = await auth.supabase.rpc('resolve_lender_reconciliation', {
      p_item_id: itemId,
      p_status: status,
      p_received_amount: receivedAmount,
      p_reason: varianceReason,
      p_user_id: auth.user.id,
    });
    if (error) return fail(error.message, 409);
    const resolved = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({ success: true, data: resolved });
  }

  return fail('Unsupported operation');
}
