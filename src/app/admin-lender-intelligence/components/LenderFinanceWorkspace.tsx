'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  BadgeIndianRupee,
  CheckCircle2,
  Download,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { authFetch } from '@/lib/supabase/auth-fetch';
import { useAuth } from '@/context/AuthContext';
import {
  hasLenderIntelligenceClientPermission,
  lenderIntelligenceBackPath,
} from '@/lib/lender-intelligence/client-access';

type Lender = { id: string; display_name: string };
type Program = { id: string; lender_id: string; program_name: string };
type Partner = { id: string; company_name?: string; name?: string };
type PartnerCommissionVersion = {
  id: string;
  partner_id: string;
  version: number;
  status: string;
  commission_basis: string;
  commission_value?: number | null;
  source_reference: string;
  submitted_by?: string | null;
  partners?: { company_name?: string };
};
type PartnerCommissionItem = {
  id: string;
  partner_id: string;
  net_payable: number;
  paid_amount: number;
  status: string;
  due_at: string;
  partners?: { company_name?: string };
  crm_lender_applications?: { customer_name?: string; product?: string };
};
type PartnerPayoutProfile = {
  id: string;
  partner_id: string;
  version: number;
  status: string;
  legal_name: string;
  account_number_last4: string;
  ifsc: string;
  submitted_by?: string | null;
  partners?: { company_name?: string };
};
type PartnerCommissionPaymentRequest = {
  id: string;
  amount: number;
  payment_reference: string;
  request_note: string;
  status: string;
  requested_at: string;
  requested_by?: string | null;
  partner_commission_items?: {
    partner_id?: string;
    net_payable?: number;
    paid_amount?: number;
    partners?: { company_name?: string };
  };
};
type PartnerCommissionRecovery = {
  id: string;
  amount: number;
  trigger_code: string;
  trigger_note: string;
  status: string;
  requested_at: string;
  requested_by?: string | null;
  resolution_reference?: string | null;
  resolution_note?: string | null;
  partner_commission_items?: {
    application_id?: string;
    paid_amount?: number;
    partners?: { company_name?: string };
  };
};
type Commercial = {
  id: string;
  lender_id: string;
  program_id: string | null;
  version: number;
  status: string;
  payout_basis: string;
  payout_value: number | null;
  source_reference: string | null;
  rejection_note?: string | null;
  submitted_by?: string | null;
  lender_master?: { display_name?: string };
  lender_programs?: { program_name?: string };
};
type Reconciliation = {
  id: string;
  partner_id: string;
  expected_amount: number;
  invoiced_amount: number;
  received_amount: number;
  status: string;
  invoice_id: string | null;
  commercial_version_id?: string | null;
  variance_reason?: string | null;
  lender_commercial_versions?: { payout_basis?: string; version?: number } | null;
  lender_outcomes?: {
    lender_id?: string;
    program_id?: string;
    disbursed_amount?: number;
    crm_lender_applications?: { customer_name?: string; product?: string };
  };
};
type Invoice = {
  id: string;
  invoice_number: string;
  lender_id: string;
  direction: string;
  total_amount: number;
  paid_amount: number;
  adjustment_amount?: number;
  status: string;
  due_at: string | null;
  lender_master?: { display_name?: string };
};
type Payment = {
  id: string;
  amount: number;
  reference: string;
  recorded_at: string;
  lender_invoices?: { invoice_number?: string; lender_master?: { display_name?: string } };
};
type Adjustment = {
  id: string;
  adjustment_type: string;
  amount: number;
  reason: string;
  recorded_at: string;
  lender_invoices?: { invoice_number?: string; lender_master?: { display_name?: string } };
};
type Clawback = {
  id: string;
  amount: number;
  trigger_code: string;
  trigger_note: string;
  status: string;
  triggered_at: string;
  recovered_amount?: number | null;
  recovery_reference?: string | null;
  lender_commercial_versions?: { version?: number; lender_master?: { display_name?: string } };
  crm_lender_applications?: { customer_name?: string };
};
type RoutingException = {
  id: string;
  partner_id: string;
  reason_code: string;
  reason_note: string;
  match_status: string;
  status: string;
  requested_at: string;
  requested_by?: string | null;
  lender_master?: { display_name?: string };
  lender_programs?: { program_name?: string; product?: string };
};

const field =
  'h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100';
const primary =
  'inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50';
const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

async function post(payload: Record<string, unknown>) {
  const response = await authFetch('/api/admin-lender-intelligence/operations', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json.success) throw new Error(json.error || 'Operation failed');
  return json.data;
}

function Pill({ value }: { value: string }) {
  const good = ['active', 'paid'].includes(value);
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${good ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}
    >
      {value.replace(/_/g, ' ')}
    </span>
  );
}

export default function LenderFinanceWorkspace() {
  const { user } = useAuth();
  const canReadCompliance = hasLenderIntelligenceClientPermission(user, 'compliance.read');
  const canManageFinance = hasLenderIntelligenceClientPermission(user, 'finance.manage');
  const canReviewRouting = hasLenderIntelligenceClientPermission(user, 'routing.review');
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [commercials, setCommercials] = useState<Commercial[]>([]);
  const [items, setItems] = useState<Reconciliation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [clawbacks, setClawbacks] = useState<Clawback[]>([]);
  const [exceptions, setExceptions] = useState<RoutingException[]>([]);
  const [partnerCommissionVersions, setPartnerCommissionVersions] = useState<
    PartnerCommissionVersion[]
  >([]);
  const [partnerCommissionItems, setPartnerCommissionItems] = useState<PartnerCommissionItem[]>([]);
  const [partnerPayoutProfiles, setPartnerPayoutProfiles] = useState<PartnerPayoutProfile[]>([]);
  const [partnerCommissionPaymentRequests, setPartnerCommissionPaymentRequests] = useState<
    PartnerCommissionPaymentRequest[]
  >([]);
  const [partnerCommissionRecoveries, setPartnerCommissionRecoveries] = useState<
    PartnerCommissionRecovery[]
  >([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    lenderId: '',
    programId: '',
    payoutBasis: 'percentage',
    payoutValue: '',
    payoutSlabText:
      '[{"min":0,"max":500000,"basis":"flat","value":2000},{"min":500001,"max":null,"basis":"percentage","value":1}]',
    taxRatePercent: '18',
    reverseCharge: false,
    clawbackWindowDays: '90',
    clawbackBasis: 'full',
    clawbackValue: '',
    sourceReference: '',
  });
  const [commissionForm, setCommissionForm] = useState({
    partnerId: '',
    lenderId: '',
    programId: '',
    commissionBasis: 'percentage',
    commissionValue: '',
    taxRate: '18',
    withholdingRate: '10',
    paymentTermsDays: '30',
    sourceReference: '',
  });
  const [payoutProfileForm, setPayoutProfileForm] = useState({
    partnerId: '',
    legalName: '',
    taxRegistrationStatus: 'registered',
    gstin: '',
    panLast4: '',
    billingAddress: '',
    financeEmail: '',
    accountHolderName: '',
    bankName: '',
    accountNumberLast4: '',
    ifsc: '',
    beneficiaryReference: '',
    verificationReference: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [catalogResponse, operationsResponse] = await Promise.all([
        authFetch('/api/admin-lender-intelligence/catalog', { cache: 'no-store' }),
        authFetch('/api/admin-lender-intelligence/operations', { cache: 'no-store' }),
      ]);
      const [catalog, operations] = await Promise.all([
        catalogResponse.json().catch(() => ({})),
        operationsResponse.json().catch(() => ({})),
      ]);
      if (!operationsResponse.ok || !operations.success)
        throw new Error(operations.error || 'Unable to load lender operations');
      if (!catalogResponse.ok && catalogResponse.status !== 403)
        throw new Error(catalog.error || 'Unable to load lender catalog');
      const catalogData = catalogResponse.ok && catalog.success ? catalog.data : {};
      setLenders(catalogData.lenders || []);
      setPartners(catalogData.partners || []);
      setPrograms(catalogData.programs || []);
      setCommercials(operations.data.commercials || []);
      setItems(operations.data.reconciliation || []);
      setInvoices(operations.data.invoices || []);
      setPayments(operations.data.payments || []);
      setAdjustments(operations.data.adjustments || []);
      setClawbacks(operations.data.clawbacks || []);
      setExceptions(operations.data.exceptions || []);
      setPartnerCommissionVersions(operations.data.partnerCommissionVersions || []);
      setPartnerCommissionItems(operations.data.partnerCommissionItems || []);
      setPartnerPayoutProfiles(operations.data.partnerPayoutProfiles || []);
      setPartnerCommissionPaymentRequests(operations.data.partnerCommissionPaymentRequests || []);
      setPartnerCommissionRecoveries(operations.data.partnerCommissionRecoveries || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load finance workspace');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => void load(), [load]);

  const act = async (
    job: () => Promise<unknown>,
    success: string,
    capability: 'finance.manage' | 'routing.review' = 'finance.manage'
  ) => {
    const permitted = capability === 'routing.review' ? canReviewRouting : canManageFinance;
    if (!permitted) {
      setError(`This action requires the ${capability} permission.`);
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await job();
      setMessage(success);
      setSelected([]);
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Operation failed');
    } finally {
      setBusy(false);
    }
  };

  const filteredPrograms = programs.filter((item) => item.lender_id === form.lenderId);
  const commissionPrograms = programs.filter((item) => item.lender_id === commissionForm.lenderId);
  const selectedRows = items.filter((item) => selected.includes(item.id));
  const selectionValid =
    selectedRows.length > 0 &&
    selectedRows.every(
      (item) =>
        item.partner_id === selectedRows[0].partner_id &&
        item.lender_outcomes?.lender_id === selectedRows[0].lender_outcomes?.lender_id &&
        !item.invoice_id &&
        item.status === 'invoice_ready'
    );
  const outstanding = useMemo(
    () =>
      invoices.reduce(
        (sum, item) =>
          sum +
          Math.max(
            0,
            Number(item.total_amount) -
              Number(item.adjustment_amount || 0) -
              Number(item.paid_amount)
          ),
        0
      ),
    [invoices]
  );

  const createCommercial = (event: FormEvent) => {
    event.preventDefault();
    let payoutSlab: unknown[] = [];
    if (form.payoutBasis === 'slab') {
      try {
        const parsed = JSON.parse(form.payoutSlabText);
        if (!Array.isArray(parsed)) throw new Error();
        payoutSlab = parsed;
      } catch {
        setError('Payout slabs must be a valid JSON array.');
        return;
      }
    }
    return act(
      () =>
        post({
          action: 'create_commercial_draft',
          ...form,
          payoutValue: form.payoutValue,
          payoutSlab,
          clawbackTerms: {
            windowDays: Number(form.clawbackWindowDays),
            basis: form.clawbackBasis,
            value: Number(form.clawbackValue || 0),
          },
        }),
      'Commercial draft created. Submit it for independent review.'
    );
  };

  const createPartnerCommission = (event: FormEvent) => {
    event.preventDefault();
    return act(
      () =>
        post({
          action: 'create_partner_commission_draft',
          ...commissionForm,
          commissionValue: Number(commissionForm.commissionValue),
          commissionSlab: [],
          taxRate: Number(commissionForm.taxRate),
          withholdingRate: Number(commissionForm.withholdingRate),
          paymentTermsDays: Number(commissionForm.paymentTermsDays),
        }),
      'Partner commission draft created for independent review.'
    );
  };

  const createPayoutProfile = (event: FormEvent) => {
    event.preventDefault();
    return act(
      () => post({ action: 'create_partner_payout_profile_draft', profile: payoutProfileForm }),
      'Masked payout profile draft created for independent verification.'
    );
  };

  const advancePayoutProfile = (
    item: PartnerPayoutProfile,
    decision: 'submit' | 'verify' | 'reject'
  ) => {
    const reason =
      decision === 'reject'
        ? window.prompt('Payout profile rejection evidence:')?.trim() || ''
        : '';
    if (decision === 'reject' && reason.length < 5) {
      setError('Provide detailed rejection evidence.');
      return;
    }
    return act(
      () => post({ action: 'review_partner_payout_profile', profileId: item.id, decision, reason }),
      `Payout profile ${decision === 'submit' ? 'submitted' : decision === 'verify' ? 'verified' : 'rejected'}.`
    );
  };

  const advancePartnerCommission = (
    item: PartnerCommissionVersion,
    decision: 'submit' | 'activate' | 'reject'
  ) => {
    const reason =
      decision === 'reject' ? window.prompt('Commission rejection evidence:')?.trim() || '' : '';
    if (decision === 'reject' && reason.length < 5) {
      setError('Provide detailed rejection evidence.');
      return;
    }
    return act(
      () => post({ action: 'review_partner_commission', versionId: item.id, decision, reason }),
      `Partner commission ${decision === 'submit' ? 'submitted' : decision + 'd'}.`
    );
  };

  const terminatePartnerCommission = (item: PartnerCommissionVersion) => {
    const reason = window.prompt('Why should this commission contract terminate?')?.trim() || '';
    if (reason.length < 5) {
      setError('Provide detailed termination evidence.');
      return;
    }
    return act(
      () => post({ action: 'terminate_partner_commission', versionId: item.id, reason }),
      'Partner commission contract terminated.'
    );
  };

  const managePartnerPayable = (
    item: PartnerCommissionItem,
    itemAction: 'hold' | 'dispute' | 'release' | 'write_off'
  ) => {
    const reason = window.prompt(`${itemAction.replace('_', ' ')} evidence:`)?.trim() || '';
    if (reason.length < 5) {
      setError('Provide payable action evidence of at least 5 characters.');
      return;
    }
    return act(
      () => post({ action: 'manage_partner_commission_item', itemId: item.id, itemAction, reason }),
      `Partner payable ${itemAction.replace('_', ' ')} recorded.`
    );
  };

  const payPartnerCommission = (item: PartnerCommissionItem) => {
    const open = Number(item.net_payable) - Number(item.paid_amount);
    const amountText = window.prompt('Partner payment amount:', open.toFixed(2))?.trim() || '';
    const reference = window.prompt('Payment UTR/reference:')?.trim() || '';
    const note =
      window.prompt('Payment initiation evidence / instruction reference:')?.trim() || '';
    const amount = Number(amountText);
    if (
      !/^\d+(?:\.\d{1,2})?$/.test(amountText) ||
      amount <= 0 ||
      amount > open ||
      reference.length < 3 ||
      note.length < 5
    ) {
      setError('Enter a valid payable amount, payment reference, and initiation evidence.');
      return;
    }
    return act(
      () =>
        post({
          action: 'request_partner_commission_payment',
          itemId: item.id,
          amount,
          reference,
          note,
          idempotencyKey: `${item.id}:${reference.toUpperCase()}`,
        }),
      'Partner payment submitted for independent approval.'
    );
  };

  const reviewPartnerPayment = (
    item: PartnerCommissionPaymentRequest,
    decision: 'approved' | 'rejected'
  ) => {
    const reviewNote = window.prompt(`${decision} review evidence:`)?.trim() || '';
    if (reviewNote.length < 5) {
      setError('Provide payment review evidence of at least 5 characters.');
      return;
    }
    return act(
      () =>
        post({
          action: 'review_partner_commission_payment',
          requestId: item.id,
          decision,
          reviewNote,
        }),
      `Partner payment ${decision}.`
    );
  };

  const registerPartnerRecovery = (item: PartnerCommissionItem) => {
    const amountText =
      window
        .prompt(
          'Recovery amount (cannot exceed paid commission):',
          Number(item.paid_amount).toFixed(2)
        )
        ?.trim() || '';
    const triggerCode =
      window.prompt('Canonical trigger code (for example EARLY_CLOSURE):')?.trim().toUpperCase() ||
      '';
    const triggerNote = window.prompt('Recovery evidence:')?.trim() || '';
    const amount = Number(amountText);
    if (
      !/^\d+(?:\.\d{1,2})?$/.test(amountText) ||
      amount <= 0 ||
      amount > Number(item.paid_amount) ||
      !/^\w{3,50}$/.test(triggerCode) ||
      triggerNote.length < 5
    ) {
      setError('Enter a valid recovery amount, canonical trigger code, and evidence.');
      return;
    }
    return act(
      () =>
        post({
          action: 'register_partner_commission_recovery',
          itemId: item.id,
          amount,
          triggerCode,
          triggerNote,
        }),
      'Partner commission recovery registered for independent resolution.'
    );
  };

  const resolvePartnerRecovery = (
    item: PartnerCommissionRecovery,
    status: 'disputed' | 'recovered' | 'waived'
  ) => {
    const reference =
      status === 'recovered' ? window.prompt('Collection reference:')?.trim() || '' : '';
    const note = window.prompt(`${status} resolution evidence:`)?.trim() || '';
    if ((status === 'recovered' && reference.length < 3) || note.length < 5) {
      setError('Provide the required collection reference and resolution evidence.');
      return;
    }
    return act(
      () =>
        post({
          action: 'resolve_partner_commission_recovery',
          recoveryId: item.id,
          status,
          reference,
          note,
        }),
      `Partner recovery ${status}.`
    );
  };

  const rejectCommercial = (commercial: Commercial) => {
    const reason = window.prompt('Commercial rejection reason:')?.trim() || '';
    if (reason.length < 5) {
      setError('Provide a rejection reason of at least 5 characters.');
      return;
    }
    return act(
      () => post({ action: 'reject_commercial', commercialVersionId: commercial.id, reason }),
      'Commercial rejected with review evidence.'
    );
  };

  const terminateCommercial = (commercial: Commercial) => {
    const reason =
      window.prompt('Why are these active commercial terms being terminated?')?.trim() || '';
    if (reason.length < 5) {
      setError('Provide termination evidence of at least 5 characters.');
      return;
    }
    return act(
      () => post({ action: 'terminate_commercial', commercialVersionId: commercial.id, reason }),
      'Commercial terminated with audit evidence.'
    );
  };

  const discardCommercialDraft = (commercial: Commercial) => {
    const reason = window.prompt('Why should this commercial draft be discarded?')?.trim() || '';
    if (reason.length < 5) {
      setError('Provide draft discard evidence of at least 5 characters.');
      return;
    }
    return act(
      () =>
        post({ action: 'discard_commercial_draft', commercialVersionId: commercial.id, reason }),
      'Commercial draft discarded.'
    );
  };

  const createInvoice = () => {
    const first = selectedRows[0];
    if (!first || !selectionValid) return;
    const defaultDueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const dueDate = window.prompt('Invoice due date (YYYY-MM-DD):', defaultDueDate)?.trim() || '';
    const dueAt = new Date(`${dueDate}T23:59:59.999Z`);
    if (!dueDate || !Number.isFinite(dueAt.getTime()) || dueAt.getTime() <= Date.now()) {
      setError('Provide a valid future invoice due date.');
      return;
    }
    return act(
      () =>
        post({
          action: 'create_invoice',
          itemIds: selected,
          partnerId: first.partner_id,
          lenderId: first.lender_outcomes?.lender_id,
          dueAt: dueAt.toISOString(),
        }),
      'Draft lender invoice created.'
    );
  };

  const reviewException = (exception: RoutingException, decision: 'approved' | 'rejected') => {
    const reviewNote =
      window.prompt(`${decision === 'approved' ? 'Approval' : 'Rejection'} note:`)?.trim() || '';
    if (reviewNote.length < 5) {
      setError('Provide a review note of at least 5 characters.');
      return;
    }
    return act(
      () => post({ action: 'review_exception', exceptionId: exception.id, decision, reviewNote }),
      `Exception ${decision}.`,
      'routing.review'
    );
  };

  const updateReconciliation = (
    item: Reconciliation,
    status: 'disputed' | 'invoiced' | 'paid' | 'written_off'
  ) => {
    const varianceReason = window.prompt(`${status.replace(/_/g, ' ')} reason:`)?.trim() || '';
    if (varianceReason.length < 5) {
      setError('Provide a reason of at least 5 characters.');
      return;
    }
    const receivedAmount =
      status === 'paid'
        ? Number(
            window.prompt(
              'Confirmed amount received:',
              String(item.invoiced_amount || item.expected_amount)
            ) || 0
          )
        : 0;
    return act(
      () =>
        post({
          action: 'update_reconciliation',
          itemId: item.id,
          status,
          varianceReason,
          receivedAmount,
        }),
      `Reconciliation ${status}.`
    );
  };

  const setManualPayout = (item: Reconciliation) => {
    const amount = Number(window.prompt('Approved manual payout amount:') || 0);
    const reason =
      window.prompt('Commercial calculation evidence / approval reference:')?.trim() || '';
    if (!(amount > 0) || reason.length < 5) {
      setError('Provide a positive payout amount and evidence of at least 5 characters.');
      return;
    }
    return act(
      () => post({ action: 'set_manual_payout', itemId: item.id, amount, reason }),
      'Custom payout valued and moved to invoice-ready.'
    );
  };

  const cancelInvoice = (invoice: Invoice) => {
    const reason =
      window
        .prompt(`Cancel ${invoice.invoice_number} and release its items? Provide reason:`)
        ?.trim() || '';
    if (reason.length < 5) {
      setError('Provide a cancellation reason of at least 5 characters.');
      return;
    }
    return act(
      () => post({ action: 'cancel_invoice', invoiceId: invoice.id, reason }),
      'Invoice cancelled and reconciliation items released.'
    );
  };

  const recordInvoicePayment = (invoice: Invoice) => {
    const outstanding =
      Number(invoice.total_amount) -
      Number(invoice.adjustment_amount || 0) -
      Number(invoice.paid_amount);
    const amountText =
      window.prompt('Payment amount received:', outstanding.toFixed(2))?.trim() || '';
    const amount = Number(amountText);
    const reference = window.prompt('Payment reference / UTR:')?.trim() || '';
    if (!/^\d+(?:\.\d{1,2})?$/.test(amountText) || !(amount > 0) || amount > outstanding) {
      setError(
        `Enter a positive payment up to ${money.format(outstanding)} with at most 2 decimals.`
      );
      return;
    }
    if (reference.length < 3 || reference.length > 100) {
      setError('Provide a payment reference / UTR between 3 and 100 characters.');
      return;
    }
    const idempotencyKey = `${invoice.id}:${reference.toLocaleUpperCase('en-IN')}`;
    return act(
      () =>
        post({
          action: 'record_payment',
          invoiceId: invoice.id,
          amount,
          reference,
          idempotencyKey,
        }),
      amount === outstanding ? 'Invoice payment settled.' : 'Partial payment recorded.'
    );
  };

  const downloadInvoice = async (invoice: Invoice) => {
    setBusy(true);
    setError('');
    try {
      const response = await authFetch(
        `/api/admin-lender-intelligence/invoices/${encodeURIComponent(invoice.id)}`
      );
      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json.error || 'Unable to generate invoice PDF');
      }
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${invoice.invoice_number}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage('Audited invoice PDF downloaded.');
    } catch (downloadError) {
      setError(
        downloadError instanceof Error ? downloadError.message : 'Unable to generate invoice PDF'
      );
    } finally {
      setBusy(false);
    }
  };

  const downloadRegister = async (
    dataset:
      | 'audit'
      | 'compliance'
      | 'lender-reconciliation'
      | 'lender-invoices'
      | 'partner-payables'
      | 'partner-payment-requests'
      | 'partner-recoveries'
  ) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await authFetch(`/api/admin-lender-intelligence/export?dataset=${dataset}`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json.error || `Unable to export ${dataset} register`);
      }
      const disposition = response.headers.get('content-disposition') || '';
      const fileName = disposition.match(/filename="([^"]+)"/i)?.[1] || `lender-${dataset}.csv`;
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage(`Audited ${dataset} register exported.`);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error ? downloadError.message : 'Unable to export register'
      );
    } finally {
      setBusy(false);
    }
  };

  const registerClawback = (item: Reconciliation) => {
    const triggerCode =
      window.prompt('Clawback trigger code (for example EARLY_CLOSURE):')?.trim() || '';
    const triggerNote = window.prompt('Clawback evidence / reason:')?.trim() || '';
    if (triggerCode.length < 3 || triggerNote.length < 5) {
      setError('Provide a trigger code and detailed evidence.');
      return;
    }
    return act(
      () =>
        post({
          action: 'register_clawback',
          itemId: item.id,
          triggerCode,
          triggerNote,
          triggeredAt: new Date().toISOString(),
        }),
      'Contractual clawback registered.'
    );
  };

  const resolveClawback = (clawback: Clawback, status: 'recovered' | 'waived') => {
    const resolutionNote = window.prompt(`${status} evidence:`)?.trim() || '';
    if (resolutionNote.length < 5) {
      setError('Provide resolution evidence of at least 5 characters.');
      return;
    }
    const recoveryReference =
      status === 'recovered'
        ? window.prompt('Recovery payment / UTR reference:')?.trim() || ''
        : '';
    if (
      status === 'recovered' &&
      (recoveryReference.length < 3 || recoveryReference.length > 100)
    ) {
      setError('Provide a recovery reference between 3 and 100 characters.');
      return;
    }
    return act(
      () =>
        post({
          action: 'resolve_clawback',
          clawbackId: clawback.id,
          status,
          resolutionNote,
          recoveryReference,
        }),
      `Clawback ${status}.`
    );
  };

  return (
    <AdminLayout title="Lender Finance & Compliance">
      <div
        className={`space-y-5 p-6 ${
          canManageFinance
            ? ''
            : '[&_form_input]:pointer-events-none [&_form_input]:opacity-60 [&_form_select]:pointer-events-none [&_form_select]:opacity-60 [&_form_textarea]:pointer-events-none [&_form_textarea]:opacity-60 [&_button:not([data-read-action]):not([data-routing-action])]:pointer-events-none [&_button:not([data-read-action]):not([data-routing-action])]:opacity-50'
        } ${canReviewRouting ? '' : '[&_button[data-routing-action]]:pointer-events-none [&_button[data-routing-action]]:opacity-50'}`}
      >
        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href={lenderIntelligenceBackPath(user)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600"
            >
              <ArrowLeft size={14} />{' '}
              {lenderIntelligenceBackPath(user) === '/admin-lender-intelligence'
                ? 'Intelligence overview'
                : 'Admin dashboard'}
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-slate-950">
              Commercials, Invoicing & Reconciliation
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Version payout terms, convert disbursals into invoices, and settle every rupee against
              source files.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canReadCompliance && (
              <Link
                href="/admin-lender-intelligence/compliance"
                className="inline-flex h-10 items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 text-sm font-semibold text-blue-700"
              >
                <ShieldCheck size={16} />
                Compliance evidence
              </Link>
            )}
            {canReadCompliance && (
              <>
                <button
                  data-read-action
                  type="button"
                  onClick={() => void downloadRegister('compliance')}
                  disabled={busy}
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-semibold"
                >
                  <Download size={16} />
                  Compliance CSV
                </button>
                <button
                  data-read-action
                  type="button"
                  onClick={() => void downloadRegister('audit')}
                  disabled={busy}
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-semibold"
                >
                  <Download size={16} />
                  Audit CSV
                </button>
              </>
            )}
            <button
              data-read-action
              type="button"
              onClick={() => void downloadRegister('lender-reconciliation')}
              disabled={busy}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-semibold"
            >
              <Download size={16} />
              Reconciliation CSV
            </button>
            <button
              data-read-action
              type="button"
              onClick={() => void downloadRegister('lender-invoices')}
              disabled={busy}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-semibold"
            >
              <Download size={16} />
              Invoices CSV
            </button>
            <button
              data-read-action
              type="button"
              onClick={() => void downloadRegister('partner-payables')}
              disabled={busy}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-semibold"
            >
              <Download size={16} />
              Payables CSV
            </button>
            <button
              data-read-action
              type="button"
              onClick={() => void downloadRegister('partner-payment-requests')}
              disabled={busy}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-semibold"
            >
              <Download size={16} />
              Payment approvals CSV
            </button>
            <button
              data-read-action
              type="button"
              onClick={() => void downloadRegister('partner-recoveries')}
              disabled={busy}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-semibold"
            >
              <Download size={16} />
              Recoveries CSV
            </button>
            <button
              data-read-action
              onClick={load}
              disabled={loading}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-semibold"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
        {error && (
          <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        {message && (
          <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
            <CheckCircle2 size={16} />
            {message}
          </div>
        )}
        {!canManageFinance && (
          <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm font-semibold text-blue-700">
            <ShieldCheck size={16} />
            Read-only finance access. You can inspect and export records, but finance changes
            require the finance.manage permission.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">Invoice-ready items</p>
            <p className="mt-2 text-2xl font-bold">
              {items.filter((item) => item.status === 'invoice_ready').length}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">Active commercials</p>
            <p className="mt-2 text-2xl font-bold">
              {commercials.filter((item) => item.status === 'active').length}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">Outstanding</p>
            <p className="mt-2 text-2xl font-bold">{money.format(outstanding)}</p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <form
            onSubmit={createPayoutProfile}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="font-bold">Partner payout beneficiary</h2>
            <p className="mt-1 text-sm text-slate-500">
              Only masked PAN/account identity is stored; full credentials stay with the approved
              payment provider.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <select
                required
                className={field}
                value={payoutProfileForm.partnerId}
                onChange={(e) =>
                  setPayoutProfileForm({ ...payoutProfileForm, partnerId: e.target.value })
                }
              >
                <option value="">Partner</option>
                {partners.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.company_name || item.name || item.id}
                  </option>
                ))}
              </select>
              <input
                required
                className={field}
                placeholder="Legal beneficiary name"
                value={payoutProfileForm.legalName}
                onChange={(e) =>
                  setPayoutProfileForm({ ...payoutProfileForm, legalName: e.target.value })
                }
              />
              <select
                className={field}
                value={payoutProfileForm.taxRegistrationStatus}
                onChange={(e) =>
                  setPayoutProfileForm({
                    ...payoutProfileForm,
                    taxRegistrationStatus: e.target.value,
                    gstin: '',
                  })
                }
              >
                <option value="registered">GST registered</option>
                <option value="unregistered">GST unregistered</option>
              </select>
              {payoutProfileForm.taxRegistrationStatus === 'registered' && (
                <input
                  required
                  maxLength={15}
                  className={field}
                  placeholder="GSTIN"
                  value={payoutProfileForm.gstin}
                  onChange={(e) =>
                    setPayoutProfileForm({
                      ...payoutProfileForm,
                      gstin: e.target.value.toUpperCase(),
                    })
                  }
                />
              )}
              <input
                required
                maxLength={4}
                className={field}
                placeholder="PAN last 4"
                value={payoutProfileForm.panLast4}
                onChange={(e) =>
                  setPayoutProfileForm({
                    ...payoutProfileForm,
                    panLast4: e.target.value.toUpperCase(),
                  })
                }
              />
              <input
                required
                type="email"
                className={field}
                placeholder="Finance email"
                value={payoutProfileForm.financeEmail}
                onChange={(e) =>
                  setPayoutProfileForm({ ...payoutProfileForm, financeEmail: e.target.value })
                }
              />
              <input
                required
                className={`${field} md:col-span-2`}
                placeholder="Billing address"
                value={payoutProfileForm.billingAddress}
                onChange={(e) =>
                  setPayoutProfileForm({ ...payoutProfileForm, billingAddress: e.target.value })
                }
              />
              <input
                required
                className={field}
                placeholder="Account holder"
                value={payoutProfileForm.accountHolderName}
                onChange={(e) =>
                  setPayoutProfileForm({ ...payoutProfileForm, accountHolderName: e.target.value })
                }
              />
              <input
                required
                className={field}
                placeholder="Bank name"
                value={payoutProfileForm.bankName}
                onChange={(e) =>
                  setPayoutProfileForm({ ...payoutProfileForm, bankName: e.target.value })
                }
              />
              <input
                required
                maxLength={4}
                inputMode="numeric"
                className={field}
                placeholder="Account last 4"
                value={payoutProfileForm.accountNumberLast4}
                onChange={(e) =>
                  setPayoutProfileForm({
                    ...payoutProfileForm,
                    accountNumberLast4: e.target.value.replace(/\D/g, ''),
                  })
                }
              />
              <input
                required
                maxLength={11}
                className={field}
                placeholder="IFSC"
                value={payoutProfileForm.ifsc}
                onChange={(e) =>
                  setPayoutProfileForm({ ...payoutProfileForm, ifsc: e.target.value.toUpperCase() })
                }
              />
              <input
                required
                className={field}
                placeholder="Provider beneficiary ID"
                value={payoutProfileForm.beneficiaryReference}
                onChange={(e) =>
                  setPayoutProfileForm({
                    ...payoutProfileForm,
                    beneficiaryReference: e.target.value,
                  })
                }
              />
              <input
                required
                className={field}
                placeholder="Verification/source reference"
                value={payoutProfileForm.verificationReference}
                onChange={(e) =>
                  setPayoutProfileForm({
                    ...payoutProfileForm,
                    verificationReference: e.target.value,
                  })
                }
              />
            </div>
            <button disabled={busy} className={`${primary} mt-4`} type="submit">
              Create beneficiary draft
            </button>
          </form>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold">Beneficiary verification</h2>
            <div className="mt-3 space-y-2">
              {partnerPayoutProfiles.slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-md border p-3 text-sm"
                >
                  <div>
                    <p className="font-semibold">
                      {item.partners?.company_name || item.legal_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      v{item.version} · {item.ifsc} · ••••{item.account_number_last4}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill value={item.status} />
                    {item.status === 'draft' && (
                      <button
                        type="button"
                        className={primary}
                        disabled={busy}
                        onClick={() => advancePayoutProfile(item, 'submit')}
                      >
                        Submit
                      </button>
                    )}
                    {item.status === 'in_review' && (
                      <>
                        <button
                          type="button"
                          className="text-xs font-semibold text-red-600"
                          disabled={busy || item.submitted_by === user?.id}
                          title={
                            item.submitted_by === user?.id
                              ? 'An independent checker must review this beneficiary.'
                              : undefined
                          }
                          onClick={() => advancePayoutProfile(item, 'reject')}
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          className={primary}
                          disabled={busy || item.submitted_by === user?.id}
                          title={
                            item.submitted_by === user?.id
                              ? 'An independent checker must review this beneficiary.'
                              : undefined
                          }
                          onClick={() => advancePayoutProfile(item, 'verify')}
                        >
                          Verify
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {!partnerPayoutProfiles.length && (
                <p className="text-sm text-slate-500">No payout beneficiary profiles.</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <form
            onSubmit={createPartnerCommission}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="font-bold">Partner commission contract</h2>
            <p className="mt-1 text-sm text-slate-500">
              Independent payable terms; never sourced from lender invoices.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <select
                required
                className={field}
                value={commissionForm.partnerId}
                onChange={(e) =>
                  setCommissionForm({ ...commissionForm, partnerId: e.target.value })
                }
              >
                <option value="">Partner</option>
                {partners.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.company_name || item.name || item.id}
                  </option>
                ))}
              </select>
              <select
                className={field}
                value={commissionForm.lenderId}
                onChange={(e) =>
                  setCommissionForm({ ...commissionForm, lenderId: e.target.value, programId: '' })
                }
              >
                <option value="">All lenders</option>
                {lenders.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.display_name}
                  </option>
                ))}
              </select>
              <select
                className={field}
                value={commissionForm.programId}
                onChange={(e) =>
                  setCommissionForm({ ...commissionForm, programId: e.target.value })
                }
              >
                <option value="">All programs</option>
                {commissionPrograms.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.program_name}
                  </option>
                ))}
              </select>
              <select
                className={field}
                value={commissionForm.commissionBasis}
                onChange={(e) =>
                  setCommissionForm({ ...commissionForm, commissionBasis: e.target.value })
                }
              >
                <option value="percentage">Disbursal percentage</option>
                <option value="flat">Flat amount</option>
              </select>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                className={field}
                placeholder="Commission value"
                value={commissionForm.commissionValue}
                onChange={(e) =>
                  setCommissionForm({ ...commissionForm, commissionValue: e.target.value })
                }
              />
              <input
                required
                type="number"
                min="0"
                max="100"
                step="0.01"
                className={field}
                placeholder="GST %"
                value={commissionForm.taxRate}
                onChange={(e) => setCommissionForm({ ...commissionForm, taxRate: e.target.value })}
              />
              <input
                required
                type="number"
                min="0"
                max="100"
                step="0.01"
                className={field}
                placeholder="TDS %"
                value={commissionForm.withholdingRate}
                onChange={(e) =>
                  setCommissionForm({ ...commissionForm, withholdingRate: e.target.value })
                }
              />
              <input
                required
                type="number"
                min="0"
                max="365"
                className={field}
                placeholder="Payment terms days"
                value={commissionForm.paymentTermsDays}
                onChange={(e) =>
                  setCommissionForm({ ...commissionForm, paymentTermsDays: e.target.value })
                }
              />
              <input
                required
                className={`${field} md:col-span-2`}
                placeholder="Reviewed agreement/source reference"
                value={commissionForm.sourceReference}
                onChange={(e) =>
                  setCommissionForm({ ...commissionForm, sourceReference: e.target.value })
                }
              />
            </div>
            <button disabled={busy} className={`${primary} mt-4`} type="submit">
              Create commission draft
            </button>
          </form>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold">Commission contract review</h2>
            <div className="mt-3 space-y-2">
              {partnerCommissionVersions.slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-md border p-3 text-sm"
                >
                  <div>
                    <p className="font-semibold">
                      {item.partners?.company_name || item.partner_id}
                    </p>
                    <p className="text-xs text-slate-500">
                      v{item.version} · {item.commission_basis} · {item.source_reference}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill value={item.status} />
                    {item.status === 'draft' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => advancePartnerCommission(item, 'submit')}
                        className={primary}
                      >
                        Submit
                      </button>
                    )}
                    {item.status === 'in_review' && (
                      <>
                        <button
                          type="button"
                          disabled={busy || item.submitted_by === user?.id}
                          title={
                            item.submitted_by === user?.id
                              ? 'An independent checker must review this commission.'
                              : undefined
                          }
                          onClick={() => advancePartnerCommission(item, 'reject')}
                          className="text-xs font-semibold text-red-600"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          disabled={busy || item.submitted_by === user?.id}
                          title={
                            item.submitted_by === user?.id
                              ? 'An independent checker must review this commission.'
                              : undefined
                          }
                          onClick={() => advancePartnerCommission(item, 'activate')}
                          className={primary}
                        >
                          Activate
                        </button>
                      </>
                    )}
                    {item.status === 'active' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => terminatePartnerCommission(item)}
                        className="text-xs font-semibold text-red-600"
                      >
                        Terminate
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {!partnerCommissionVersions.length && (
                <p className="text-sm text-slate-500">No partner commission contracts.</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold">Partner payable ledger</h2>
          <div className="mt-3 space-y-2">
            {partnerCommissionItems.slice(0, 20).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <div>
                  <p className="font-semibold">
                    {item.partners?.company_name || item.partner_id} ·{' '}
                    {item.crm_lender_applications?.customer_name ||
                      item.crm_lender_applications?.product ||
                      'Application'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Due {new Date(item.due_at).toLocaleDateString('en-IN')} · paid{' '}
                    {money.format(item.paid_amount)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <strong>{money.format(item.net_payable)}</strong>
                  <Pill value={item.status} />
                  {['payable_ready', 'part_paid'].includes(item.status) && (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => managePartnerPayable(item, 'hold')}
                        className="text-xs font-semibold text-amber-700"
                      >
                        Hold
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => managePartnerPayable(item, 'dispute')}
                        className="text-xs font-semibold text-red-600"
                      >
                        Dispute
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => payPartnerCommission(item)}
                        className={primary}
                      >
                        Request payment
                      </button>
                    </>
                  )}
                  {Number(item.paid_amount) > 0 && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => registerPartnerRecovery(item)}
                      className="text-xs font-semibold text-violet-700"
                    >
                      Recover
                    </button>
                  )}
                  {['held', 'disputed'].includes(item.status) && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => managePartnerPayable(item, 'release')}
                      className={primary}
                    >
                      Release
                    </button>
                  )}
                  {['payable_ready', 'part_paid', 'held', 'disputed'].includes(item.status) && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => managePartnerPayable(item, 'write_off')}
                      className="text-xs font-semibold text-slate-600"
                    >
                      Write off
                    </button>
                  )}
                </div>
              </div>
            ))}
            {!partnerCommissionItems.length && (
              <p className="text-sm text-slate-500">No payable commissions materialized yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold">Partner payment approval queue</h2>
          <p className="mt-1 text-sm text-slate-500">
            Outgoing settlements require a different admin to verify and approve the payment
            instruction.
          </p>
          <div className="mt-3 space-y-2">
            {partnerCommissionPaymentRequests.slice(0, 20).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <div>
                  <p className="font-semibold">
                    {item.partner_commission_items?.partners?.company_name || 'Partner'} ·{' '}
                    {money.format(item.amount)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.payment_reference} · {item.request_note}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Pill value={item.status} />
                  {item.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        disabled={busy || item.requested_by === user?.id}
                        title={
                          item.requested_by === user?.id
                            ? 'An independent checker must review this payment.'
                            : undefined
                        }
                        onClick={() => reviewPartnerPayment(item, 'rejected')}
                        className="text-xs font-semibold text-red-600"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={busy || item.requested_by === user?.id}
                        title={
                          item.requested_by === user?.id
                            ? 'An independent checker must review this payment.'
                            : undefined
                        }
                        onClick={() => reviewPartnerPayment(item, 'approved')}
                        className={primary}
                      >
                        Approve & settle
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {!partnerCommissionPaymentRequests.length && (
              <p className="text-sm text-slate-500">No partner payment requests.</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold">Partner commission recovery register</h2>
          <p className="mt-1 text-sm text-slate-500">
            Post-payment recovery is capped by paid commission and resolved by an independent
            checker.
          </p>
          <div className="mt-3 space-y-2">
            {partnerCommissionRecoveries.slice(0, 20).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <div>
                  <p className="font-semibold">
                    {item.partner_commission_items?.partners?.company_name || 'Partner'} ·{' '}
                    {money.format(item.amount)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.trigger_code.replace(/_/g, ' ')} · {item.trigger_note}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Pill value={item.status} />
                  {['open', 'disputed'].includes(item.status) && (
                    <>
                      <button
                        type="button"
                        disabled={busy || item.requested_by === user?.id}
                        title={
                          item.requested_by === user?.id
                            ? 'An independent checker must resolve this recovery.'
                            : undefined
                        }
                        onClick={() => resolvePartnerRecovery(item, 'waived')}
                        className="text-xs font-semibold text-slate-600"
                      >
                        Waive
                      </button>
                      {item.status === 'open' && (
                        <button
                          type="button"
                          disabled={busy || item.requested_by === user?.id}
                          title={
                            item.requested_by === user?.id
                              ? 'An independent checker must resolve this recovery.'
                              : undefined
                          }
                          onClick={() => resolvePartnerRecovery(item, 'disputed')}
                          className="text-xs font-semibold text-red-600"
                        >
                          Dispute
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy || item.requested_by === user?.id}
                        title={
                          item.requested_by === user?.id
                            ? 'An independent checker must resolve this recovery.'
                            : undefined
                        }
                        onClick={() => resolvePartnerRecovery(item, 'recovered')}
                        className={primary}
                      >
                        Record recovery
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {!partnerCommissionRecoveries.length && (
              <p className="text-sm text-slate-500">No partner commission recoveries.</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold">Routing exception queue</h2>
            <p className="text-sm text-slate-500">
              Independent review for programs outside direct policy eligibility.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-left">Lender / program</th>
                  <th className="px-5 py-3 text-left">Reason</th>
                  <th className="px-5 py-3 text-left">Match state</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exceptions.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4 font-semibold">
                      {item.lender_master?.display_name || 'Lender'}
                      <p className="text-xs font-normal text-slate-400">
                        {item.lender_programs?.program_name || '-'}
                      </p>
                    </td>
                    <td className="max-w-sm px-5 py-4">
                      <p className="font-semibold text-slate-700">{item.reason_code}</p>
                      <p className="truncate text-xs text-slate-500">{item.reason_note}</p>
                    </td>
                    <td className="px-5 py-4">
                      <Pill value={item.match_status} />
                    </td>
                    <td className="px-5 py-4">
                      <Pill value={item.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      {item.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            data-routing-action
                            disabled={busy || !canReviewRouting || item.requested_by === user?.id}
                            title={
                              item.requested_by === user?.id
                                ? 'An independent checker must review this exception.'
                                : undefined
                            }
                            onClick={() => reviewException(item, 'rejected')}
                            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600"
                          >
                            Reject
                          </button>
                          <button
                            data-routing-action
                            disabled={busy || !canReviewRouting || item.requested_by === user?.id}
                            title={
                              item.requested_by === user?.id
                                ? 'An independent checker must review this exception.'
                                : undefined
                            }
                            onClick={() => reviewException(item, 'approved')}
                            className={primary}
                          >
                            Approve
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && !exceptions.length && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">
                      No routing exceptions.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <form
          onSubmit={createCommercial}
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <BadgeIndianRupee size={18} className="text-blue-600" />
            <h2 className="font-bold">New commercial version</h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-6">
            <select
              required
              className={field}
              value={form.lenderId}
              onChange={(e) => setForm({ ...form, lenderId: e.target.value, programId: '' })}
            >
              <option value="">Lender</option>
              {lenders.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.display_name}
                </option>
              ))}
            </select>
            <select
              className={field}
              value={form.programId}
              onChange={(e) => setForm({ ...form, programId: e.target.value })}
            >
              <option value="">All programs</option>
              {filteredPrograms.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.program_name}
                </option>
              ))}
            </select>
            <select
              className={field}
              value={form.payoutBasis}
              onChange={(e) => setForm({ ...form, payoutBasis: e.target.value })}
            >
              <option value="percentage">Percentage</option>
              <option value="flat">Flat</option>
              <option value="slab">Slab</option>
              <option value="custom">Custom</option>
            </select>
            {!['slab', 'custom'].includes(form.payoutBasis) && (
              <input
                required
                type="number"
                min="0"
                step="0.01"
                className={field}
                placeholder={form.payoutBasis === 'percentage' ? 'Payout %' : 'Payout value'}
                value={form.payoutValue}
                onChange={(e) => setForm({ ...form, payoutValue: e.target.value })}
              />
            )}
            <input
              required
              type="number"
              min="0"
              max="100"
              step="0.01"
              className={field}
              placeholder="GST %"
              value={form.taxRatePercent}
              onChange={(e) => setForm({ ...form, taxRatePercent: e.target.value })}
            />
            <input
              required
              className={field}
              placeholder="Agreement/source ref"
              value={form.sourceReference}
              onChange={(e) => setForm({ ...form, sourceReference: e.target.value })}
            />
            <input
              required
              type="number"
              min="0"
              max="3650"
              className={field}
              placeholder="Clawback window days"
              value={form.clawbackWindowDays}
              onChange={(e) => setForm({ ...form, clawbackWindowDays: e.target.value })}
            />
            <select
              className={field}
              value={form.clawbackBasis}
              onChange={(e) => setForm({ ...form, clawbackBasis: e.target.value })}
            >
              <option value="full">Full clawback</option>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed amount</option>
            </select>
            {form.clawbackBasis !== 'full' && (
              <input
                required
                type="number"
                min="0"
                step="0.01"
                className={field}
                placeholder={form.clawbackBasis === 'percentage' ? 'Clawback %' : 'Clawback amount'}
                value={form.clawbackValue}
                onChange={(e) => setForm({ ...form, clawbackValue: e.target.value })}
              />
            )}
          </div>
          {form.payoutBasis === 'slab' && (
            <textarea
              className="mt-3 min-h-24 w-full rounded-md border border-slate-200 p-3 font-mono text-xs"
              aria-label="Payout slabs JSON"
              value={form.payoutSlabText}
              onChange={(e) => setForm({ ...form, payoutSlabText: e.target.value })}
            />
          )}
          <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.reverseCharge}
              onChange={(e) => setForm({ ...form, reverseCharge: e.target.checked })}
            />
            Reverse-charge tax (invoice tax will be zero)
          </label>
          <button disabled={busy} className={`${primary} mt-3`}>
            Create draft
          </button>
        </form>

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold">Commercial governance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-left">Lender / program</th>
                  <th className="px-5 py-3">Version</th>
                  <th className="px-5 py-3">Payout</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {commercials.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4 font-semibold">
                      {item.lender_master?.display_name || 'Lender'}
                      <p className="text-xs font-normal text-slate-400">
                        {item.lender_programs?.program_name || 'All programs'}
                      </p>
                      {item.rejection_note && (
                        <p className="mt-1 text-xs text-red-600">{item.rejection_note}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">v{item.version}</td>
                    <td className="px-5 py-4 text-center">
                      {item.payout_basis} {item.payout_value ?? ''}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <Pill value={item.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      {item.status === 'draft' && (
                        <div className="flex justify-end gap-2">
                          <button
                            disabled={busy}
                            onClick={() => discardCommercialDraft(item)}
                            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600"
                          >
                            Discard
                          </button>
                          <button
                            disabled={busy}
                            onClick={() =>
                              act(
                                () =>
                                  post({
                                    action: 'submit_commercial',
                                    commercialVersionId: item.id,
                                  }),
                                'Commercial submitted for review.'
                              )
                            }
                            className={primary}
                          >
                            Submit review
                          </button>
                        </div>
                      )}
                      {item.status === 'in_review' && (
                        <div className="flex justify-end gap-2">
                          <button
                            disabled={busy || item.submitted_by === user?.id}
                            title={
                              item.submitted_by === user?.id
                                ? 'An independent checker must review this commercial.'
                                : undefined
                            }
                            onClick={() => rejectCommercial(item)}
                            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600"
                          >
                            Reject
                          </button>
                          <button
                            disabled={busy || item.submitted_by === user?.id}
                            title={
                              item.submitted_by === user?.id
                                ? 'An independent checker must review this commercial.'
                                : undefined
                            }
                            onClick={() =>
                              act(
                                () =>
                                  post({
                                    action: 'activate_commercial',
                                    commercialVersionId: item.id,
                                  }),
                                'Commercial activated.'
                              )
                            }
                            className={primary}
                          >
                            Approve & activate
                          </button>
                        </div>
                      )}
                      {item.status === 'active' && (
                        <button
                          disabled={busy}
                          onClick={() => terminateCommercial(item)}
                          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600"
                        >
                          Terminate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-bold">Reconciliation queue</h2>
              <p className="text-sm text-slate-500">
                Value custom payouts, then select invoice-ready items from one partner and lender.
              </p>
            </div>
            <button disabled={busy || !selectionValid} onClick={createInvoice} className={primary}>
              Create invoice ({selected.length})
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3"></th>
                  <th className="px-5 py-3 text-left">Customer</th>
                  <th className="px-5 py-3 text-left">Product</th>
                  <th className="px-5 py-3 text-right">Disbursed</th>
                  <th className="px-5 py-3 text-right">Expected</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-right">Variance / recovery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4">
                      <input
                        type="checkbox"
                        disabled={Boolean(item.invoice_id) || item.status !== 'invoice_ready'}
                        checked={selected.includes(item.id)}
                        onChange={() =>
                          setSelected((current) =>
                            current.includes(item.id)
                              ? current.filter((id) => id !== item.id)
                              : [...current, item.id]
                          )
                        }
                      />
                    </td>
                    <td className="px-5 py-4 font-semibold">
                      {item.lender_outcomes?.crm_lender_applications?.customer_name || '-'}
                    </td>
                    <td className="px-5 py-4">
                      {item.lender_outcomes?.crm_lender_applications?.product?.replace(/_/g, ' ') ||
                        '-'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {money.format(item.lender_outcomes?.disbursed_amount || 0)}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold">
                      {money.format(item.expected_amount)}
                    </td>
                    <td className="px-5 py-4">
                      <Pill value={item.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        {item.status === 'unbilled' &&
                          item.lender_commercial_versions?.payout_basis === 'custom' && (
                            <button
                              disabled={busy}
                              onClick={() => setManualPayout(item)}
                              className="rounded-md border border-indigo-200 px-2 py-1 text-xs font-semibold text-indigo-700"
                            >
                              Set payout
                            </button>
                          )}
                        {!['paid', 'written_off', 'disputed'].includes(item.status) && (
                          <button
                            disabled={busy}
                            onClick={() => updateReconciliation(item, 'disputed')}
                            className="rounded-md border border-amber-200 px-2 py-1 text-xs font-semibold text-amber-700"
                          >
                            Dispute
                          </button>
                        )}
                        {item.status === 'disputed' && item.invoice_id && (
                          <button
                            disabled={busy}
                            onClick={() => updateReconciliation(item, 'invoiced')}
                            className="rounded-md border border-blue-200 px-2 py-1 text-xs font-semibold text-blue-700"
                          >
                            Resolve valid
                          </button>
                        )}
                        {item.status === 'disputed' && !item.invoice_id && (
                          <button
                            disabled={busy}
                            onClick={() => updateReconciliation(item, 'paid')}
                            className="rounded-md border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-700"
                          >
                            Resolve paid
                          </button>
                        )}
                        {item.status === 'disputed' && (
                          <button
                            disabled={busy}
                            onClick={() => updateReconciliation(item, 'written_off')}
                            className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-700"
                          >
                            Write off
                          </button>
                        )}
                        {item.status === 'paid' && (
                          <button
                            disabled={busy}
                            onClick={() => registerClawback(item)}
                            className="rounded-md border border-violet-200 px-2 py-1 text-xs font-semibold text-violet-700"
                          >
                            Clawback
                          </button>
                        )}
                      </div>
                      {item.variance_reason && (
                        <p className="mt-1 max-w-xs text-right text-xs text-slate-500">
                          {item.variance_reason}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold">Lender invoices</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-left">Invoice</th>
                  <th className="px-5 py-3 text-left">Lender</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3 text-right">Adjustments</th>
                  <th className="px-5 py-3 text-right">Paid</th>
                  <th className="px-5 py-3 text-left">Due</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-5 py-4 font-mono text-xs">{invoice.invoice_number}</td>
                    <td className="px-5 py-4 font-semibold">
                      {invoice.lender_master?.display_name || 'Lender'}
                    </td>
                    <td className="px-5 py-4 text-right">{money.format(invoice.total_amount)}</td>
                    <td className="px-5 py-4 text-right">
                      {money.format(invoice.adjustment_amount || 0)}
                    </td>
                    <td className="px-5 py-4 text-right">{money.format(invoice.paid_amount)}</td>
                    <td
                      className={`px-5 py-4 text-sm ${invoice.due_at && new Date(invoice.due_at).getTime() < Date.now() && !['paid', 'cancelled'].includes(invoice.status) ? 'font-semibold text-red-600' : ''}`}
                    >
                      {invoice.due_at ? new Date(invoice.due_at).toLocaleDateString('en-IN') : '—'}
                      {invoice.due_at &&
                        new Date(invoice.due_at).getTime() < Date.now() &&
                        !['paid', 'cancelled'].includes(invoice.status) && (
                          <span className="ml-1 text-xs">Overdue</span>
                        )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <Pill value={invoice.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {invoice.status !== 'cancelled' && (
                          <button
                            data-read-action
                            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
                            disabled={busy}
                            onClick={() => void downloadInvoice(invoice)}
                          >
                            PDF
                          </button>
                        )}
                        {invoice.status === 'draft' && (
                          <button
                            className={primary}
                            disabled={busy}
                            onClick={() =>
                              act(
                                () => post({ action: 'raise_invoice', invoiceId: invoice.id }),
                                'Invoice raised.'
                              )
                            }
                          >
                            Raise
                          </button>
                        )}
                        {['raised', 'part_paid'].includes(invoice.status) && (
                          <button
                            className={primary}
                            disabled={busy}
                            onClick={() => recordInvoicePayment(invoice)}
                          >
                            Record payment
                          </button>
                        )}
                        {['draft', 'raised', 'disputed'].includes(invoice.status) &&
                          Number(invoice.paid_amount) === 0 &&
                          Number(invoice.adjustment_amount || 0) === 0 && (
                            <button
                              className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600"
                              disabled={busy}
                              onClick={() => cancelInvoice(invoice)}
                            >
                              Cancel
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold">Payment ledger</h2>
              <p className="text-sm text-slate-500">Immutable UTR-wise receipts.</p>
            </div>
            <div className="max-h-80 overflow-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Invoice</th>
                    <th className="px-4 py-3 text-left">Reference</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs">
                          {payment.lender_invoices?.invoice_number || '-'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {payment.lender_invoices?.lender_master?.display_name || 'Lender'}
                        </p>
                      </td>
                      <td className="px-4 py-3">{payment.reference}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {money.format(payment.amount)}
                      </td>
                    </tr>
                  ))}
                  {!loading && !payments.length && (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-slate-500">
                        No payments recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold">Adjustment ledger</h2>
              <p className="text-sm text-slate-500">Immutable write-offs and corrections.</p>
            </div>
            <div className="max-h-80 overflow-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Invoice</th>
                    <th className="px-4 py-3 text-left">Reason</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adjustments.map((adjustment) => (
                    <tr key={adjustment.id}>
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs">
                          {adjustment.lender_invoices?.invoice_number || '-'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {adjustment.adjustment_type.replace(/_/g, ' ')}
                        </p>
                      </td>
                      <td className="max-w-xs px-4 py-3">
                        <p className="truncate">{adjustment.reason}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {money.format(adjustment.amount)}
                      </td>
                    </tr>
                  ))}
                  {!loading && !adjustments.length && (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-slate-500">
                        No adjustments recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold">Clawback register</h2>
            <p className="text-sm text-slate-500">
              Post-disbursal recoveries validated against the active commercial version.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-left">Customer / lender</th>
                  <th className="px-5 py-3 text-left">Trigger</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clawbacks.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4 font-semibold">
                      {item.crm_lender_applications?.customer_name || '-'}
                      <p className="text-xs font-normal text-slate-400">
                        {item.lender_commercial_versions?.lender_master?.display_name || 'Lender'} ·
                        v{item.lender_commercial_versions?.version || '-'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold">{item.trigger_code.replace(/_/g, ' ')}</p>
                      <p className="max-w-sm truncate text-xs text-slate-500">
                        {item.trigger_note}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold">
                      {money.format(item.amount)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <Pill value={item.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      {item.status === 'open' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            disabled={busy}
                            onClick={() => resolveClawback(item, 'waived')}
                            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold"
                          >
                            Waive
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => resolveClawback(item, 'recovered')}
                            className={primary}
                          >
                            Recovered
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {item.status === 'recovered' && item.recovery_reference
                            ? `Recovered · ${item.recovery_reference}`
                            : 'Closed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && !clawbacks.length && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">
                      No clawbacks registered.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
