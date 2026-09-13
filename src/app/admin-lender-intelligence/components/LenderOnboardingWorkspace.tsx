'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  FileCheck2,
  Plus,
  RefreshCw,
  Upload,
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { authFetch } from '@/lib/supabase/auth-fetch';
import { useAuth } from '@/context/AuthContext';
import {
  hasLenderIntelligenceClientPermission,
  lenderIntelligenceBackPath,
} from '@/lib/lender-intelligence/client-access';
import { operatorsForPolicyField, policyFields } from '@/lib/lender-intelligence/policy-schema';

type Lender = {
  id: string;
  display_name: string;
  legal_name: string;
  lender_code: string;
  lender_type: string;
  onboarding_status: string;
  kyc_status: string;
  agreement_status: string;
  agreement_expires_at?: string | null;
  finance_email?: string | null;
  billing_address?: string | null;
  gstin?: string | null;
};

type Program = {
  id: string;
  lender_id: string;
  program_code: string;
  program_name: string;
  product: string;
  status: string;
  capacity_status: string;
  daily_submission_limit?: number | null;
  login_sla_hours?: number;
  sanction_sla_hours?: number;
  disbursal_sla_hours?: number;
};

type Policy = {
  id: string;
  program_id: string;
  version: number;
  status: string;
  source_reference: string | null;
  submitted_by?: string | null;
  lender_policy_rules?: Array<{
    id: string;
    rule_group: string;
    field_key: string;
    operator: string;
    comparison_value: unknown;
    severity: string;
    reason_code: string;
    reason_text: string;
    weight: number;
    priority: number;
    enabled: boolean;
  }>;
};

type AuditLog = {
  id: string;
  actor_email: string | null;
  module: string;
  action: string;
  summary: string | null;
  created_at: string;
};
type PolicyDocument = {
  id: string;
  lender_id: string;
  program_id: string | null;
  document_type: string;
  file_name: string;
  checksum: string | null;
  expires_at: string | null;
  review_status: string;
  review_note?: string | null;
  created_by?: string | null;
  created_at: string;
};
type DataQualityIssue = {
  id: string;
  severity: string;
  title: string;
  detail: string | null;
  status: string;
  due_at: string | null;
  owner_user_id?: string | null;
  resolution_note?: string | null;
};
type RejectionReason = {
  id: string;
  partner_id: string | null;
  code: string;
  category: string;
  label: string;
  description: string | null;
  active: boolean;
  sort_order: number;
};
type Catalog = {
  lenders: Lender[];
  programs: Program[];
  policies: Policy[];
  auditLogs: AuditLog[];
  documents: PolicyDocument[];
  dataQualityIssues: DataQualityIssue[];
  rejectionReasons: RejectionReason[];
  capacityUsage: Array<{
    program_id: string;
    daily_submission_limit: number | null;
    submissions_used: number;
    submissions_remaining: number | null;
    exhausted: boolean;
    operating_date: string;
  }>;
};
type ImportPreview = {
  valid: boolean;
  rows: Array<Record<string, unknown>>;
  preview: Array<{ row: number; lenderCode: string; programCode: string; action: string }>;
  errors: Array<{ row: number; field: string; message: string }>;
};

const inputClass =
  'h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100';
const buttonClass =
  'inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50';

async function postAction(payload: Record<string, unknown>) {
  const response = await authFetch('/api/admin-lender-intelligence/catalog', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json.success) throw new Error(json.error || 'Operation failed');
  return json.data;
}

function Status({ value }: { value: string }) {
  const ready = ['active', 'verified', 'signed', 'published'].includes(value);
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${ready ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}
    >
      {value.replace(/_/g, ' ')}
    </span>
  );
}

export default function LenderOnboardingWorkspace() {
  const { user } = useAuth();
  const canManagePolicy = hasLenderIntelligenceClientPermission(user, 'policy.manage');
  const canManageCompliance = hasLenderIntelligenceClientPermission(user, 'compliance.manage');
  const [catalog, setCatalog] = useState<Catalog>({
    lenders: [],
    programs: [],
    policies: [],
    auditLogs: [],
    documents: [],
    dataQualityIssues: [],
    rejectionReasons: [],
    capacityUsage: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [lenderForm, setLenderForm] = useState({
    id: '',
    displayName: '',
    legalName: '',
    lenderCode: '',
    lenderType: 'bank',
    financeEmail: '',
    billingAddress: '',
    gstin: '',
  });
  const [programForm, setProgramForm] = useState({
    lenderId: '',
    programName: '',
    programCode: '',
    product: 'personal_loan',
    minLoan: '',
    maxLoan: '',
    minTenureMonths: '',
    maxTenureMonths: '',
    indicativeRoiMin: '',
    indicativeRoiMax: '',
    employmentTypes: '',
    channels: 'crm',
    states: '',
    cities: '',
    loginSlaHours: '24',
    sanctionSlaHours: '120',
    disbursalSlaHours: '72',
    dailySubmissionLimit: '',
  });
  const [policyForm, setPolicyForm] = useState({
    programId: '',
    sourceReference: '',
    changeSummary: '',
  });
  const [editingPolicyId, setEditingPolicyId] = useState('');
  const [ruleForm, setRuleForm] = useState({
    fieldKey: 'score',
    operator: 'gte',
    comparisonValue: '',
    severity: 'hard',
    reasonCode: '',
    reasonText: '',
    weight: '0',
  });
  const [documentForm, setDocumentForm] = useState({
    lenderId: '',
    programId: '',
    policyVersionId: '',
    documentType: 'credit_policy',
    expiresAt: '',
    file: null as File | null,
  });
  const [bulkImportText, setBulkImportText] = useState('');
  const [bulkPreview, setBulkPreview] = useState<ImportPreview | null>(null);
  const [reasonForm, setReasonForm] = useState({
    id: '',
    partnerId: '',
    code: '',
    category: 'credit',
    label: '',
    description: '',
    active: true,
    sortOrder: '100',
  });

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [catalogResponse, complianceResponse] = await Promise.all([
        authFetch('/api/admin-lender-intelligence/catalog', { cache: 'no-store' }),
        authFetch('/api/admin-lender-intelligence/compliance', { cache: 'no-store' }),
      ]);
      const [catalogBody, complianceBody] = await Promise.all([
        catalogResponse.json().catch(() => ({})),
        complianceResponse.json().catch(() => ({})),
      ]);
      if (!catalogResponse.ok || !catalogBody.success)
        throw new Error(catalogBody.error || 'Unable to load catalog');
      if (!complianceResponse.ok && complianceResponse.status !== 403)
        throw new Error(complianceBody.error || 'Unable to load compliance evidence');
      const compliance = complianceResponse.ok && complianceBody.success ? complianceBody.data : {};
      setCatalog({
        ...catalogBody.data,
        auditLogs: compliance.auditLogs || [],
        documents: compliance.documents || [],
        dataQualityIssues: compliance.dataQualityIssues || [],
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load catalog');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void loadCatalog(), [loadCatalog]);

  const programsByLender = useMemo(() => {
    const counts = new Map<string, number>();
    catalog.programs.forEach((program) =>
      counts.set(program.lender_id, (counts.get(program.lender_id) || 0) + 1)
    );
    return counts;
  }, [catalog.programs]);
  const capacityByProgram = useMemo(
    () => new Map(catalog.capacityUsage.map((item) => [item.program_id, item])),
    [catalog.capacityUsage]
  );

  const run = async (
    work: () => Promise<unknown>,
    success: string,
    capability: 'policy.manage' | 'compliance.manage' = 'policy.manage'
  ) => {
    const permitted = capability === 'compliance.manage' ? canManageCompliance : canManagePolicy;
    if (!permitted) {
      setError(`This action requires the ${capability} permission.`);
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await work();
      setMessage(success);
      await loadCatalog();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const addLender = (event: FormEvent) => {
    event.preventDefault();
    return run(
      async () => {
        await postAction({ action: 'upsert_lender', lender: lenderForm });
        setLenderForm({
          id: '',
          displayName: '',
          legalName: '',
          lenderCode: '',
          lenderType: 'bank',
          financeEmail: '',
          billingAddress: '',
          gstin: '',
        });
      },
      lenderForm.id ? 'Lender master updated.' : 'Lender onboarding record created.'
    );
  };

  const addProgram = (event: FormEvent) => {
    event.preventDefault();
    return run(async () => {
      await postAction({
        action: 'upsert_program',
        program: {
          ...programForm,
          employmentTypes: programForm.employmentTypes
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          channels: programForm.channels
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          states: programForm.states
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          cities: programForm.cities
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          loginSlaHours: Number(programForm.loginSlaHours),
          sanctionSlaHours: Number(programForm.sanctionSlaHours),
          disbursalSlaHours: Number(programForm.disbursalSlaHours),
          dailySubmissionLimit: programForm.dailySubmissionLimit
            ? Number(programForm.dailySubmissionLimit)
            : null,
        },
      });
      setProgramForm((current) => ({ ...current, programName: '', programCode: '' }));
    }, 'Lender product program created.');
  };

  const addPolicy = (event: FormEvent) => {
    event.preventDefault();
    return run(async () => {
      await postAction({
        action: 'create_policy_draft',
        ...policyForm,
        sourceType: 'lender_document',
      });
      setPolicyForm((current) => ({ ...current, sourceReference: '', changeSummary: '' }));
    }, 'Policy draft created. Add rules before review submission.');
  };

  const addRule = (event: FormEvent) => {
    event.preventDefault();
    const policy = catalog.policies.find((item) => item.id === editingPolicyId);
    if (!policy) return;
    const existingRules = (policy.lender_policy_rules || []).map((rule) => ({
      ruleGroup: rule.rule_group,
      fieldKey: rule.field_key,
      operator: rule.operator,
      comparisonValue: rule.comparison_value,
      severity: rule.severity,
      reasonCode: rule.reason_code,
      reasonText: rule.reason_text,
      weight: rule.weight,
      priority: rule.priority,
      enabled: rule.enabled,
    }));
    let comparisonValue: unknown = ruleForm.comparisonValue;
    if (ruleForm.operator === 'between' || ['in', 'not_in'].includes(ruleForm.operator)) {
      comparisonValue = ruleForm.comparisonValue
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    } else if (
      !Number.isNaN(Number(ruleForm.comparisonValue)) &&
      ruleForm.comparisonValue.trim() !== ''
    ) {
      comparisonValue = Number(ruleForm.comparisonValue);
    }
    return run(async () => {
      await postAction({
        action: 'replace_policy_rules',
        policyVersionId: policy.id,
        rules: [
          ...existingRules,
          {
            ...ruleForm,
            comparisonValue,
            weight: Number(ruleForm.weight),
            priority: (existingRules.length + 1) * 10,
            enabled: true,
          },
        ],
      });
      setRuleForm({
        fieldKey: 'score',
        operator: 'gte',
        comparisonValue: '',
        severity: 'hard',
        reasonCode: '',
        reasonText: '',
        weight: '0',
      });
    }, 'Policy rule saved.');
  };

  const uploadDocument = (event: FormEvent) => {
    event.preventDefault();
    if (!documentForm.file) return;
    return run(async () => {
      const formData = new FormData();
      formData.set('lenderId', documentForm.lenderId);
      formData.set('programId', documentForm.programId);
      formData.set('policyVersionId', documentForm.policyVersionId);
      formData.set('documentType', documentForm.documentType);
      formData.set('expiresAt', documentForm.expiresAt);
      formData.set('file', documentForm.file as File);
      const response = await authFetch('/api/admin-lender-intelligence/documents', {
        method: 'POST',
        body: formData,
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json.success) throw new Error(json.error || 'Document upload failed');
      setDocumentForm((current) => ({ ...current, file: null }));
    }, 'Private compliance document uploaded.');
  };

  const updateLenderStatus = (
    lender: Lender,
    patch: Partial<{ onboardingStatus: string; kycStatus: string; agreementStatus: string }>,
    success: string
  ) => {
    if (
      patch.onboardingStatus &&
      ['active', 'paused', 'offboarded'].includes(patch.onboardingStatus)
    ) {
      return run(
        () =>
          postAction({
            action: 'set_lender_status',
            lenderId: lender.id,
            status: patch.onboardingStatus,
          }),
        success
      );
    }
    return run(
      () =>
        postAction({
          action: 'upsert_lender',
          lender: {
            id: lender.id,
            displayName: lender.display_name,
            legalName: lender.legal_name,
            lenderCode: lender.lender_code,
            lenderType: lender.lender_type,
            onboardingStatus: patch.onboardingStatus || lender.onboarding_status,
            kycStatus: patch.kycStatus || lender.kyc_status,
            agreementStatus: patch.agreementStatus || lender.agreement_status,
            agreementExpiresAt: lender.agreement_expires_at || '',
            financeEmail: lender.finance_email || '',
            billingAddress: lender.billing_address || '',
            gstin: lender.gstin || '',
          },
        }),
      success
    );
  };

  const setProgramStatus = (program: Program, status: string, capacityStatus: string) =>
    run(
      () =>
        postAction({
          action: 'set_program_operating_status',
          programId: program.id,
          status,
          capacityStatus,
        }),
      `Program changed to ${status}/${capacityStatus}.`
    );

  const setProgramDailyCapacity = (program: Program) => {
    const entered = window.prompt(
      'Daily submission limit for the IST operating day. Leave blank to remove the numeric cap.',
      program.daily_submission_limit ? String(program.daily_submission_limit) : ''
    );
    if (entered === null) return;
    const reason = window.prompt(
      'Reason for changing the daily capacity limit (minimum 5 characters):'
    );
    if (reason === null || reason.trim().length < 5) {
      setError('A meaningful capacity-change reason is required.');
      return;
    }
    const value = entered.trim();
    if (value && (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 1_000_000)) {
      setError('Daily capacity must be blank or a whole number from 1 to 1,000,000.');
      return;
    }
    return run(
      () =>
        postAction({
          action: 'set_program_daily_capacity',
          programId: program.id,
          dailySubmissionLimit: value || null,
          reason: reason.trim(),
        }),
      'Program daily capacity updated.'
    );
  };

  const openDocument = async (id: string) => {
    const viewer = window.open('', '_blank');
    if (!viewer) {
      setError('Allow pop-ups for this portal to open private documents.');
      return;
    }
    viewer.opener = null;
    try {
      const response = await authFetch(
        `/api/admin-lender-intelligence/documents?id=${encodeURIComponent(id)}`
      );
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || 'Unable to open document');
      viewer.location.replace(json.data.signedUrl);
    } catch (openError) {
      viewer.close();
      setError(openError instanceof Error ? openError.message : 'Unable to open document');
    }
  };

  const reviewDocument = (document: PolicyDocument, decision: 'verified' | 'rejected') => {
    const note =
      decision === 'rejected'
        ? window.prompt('Rejection reason (minimum 5 characters)')
        : window.prompt('Optional verification note') || '';
    if (note === null || (decision === 'rejected' && note.trim().length < 5)) {
      if (decision === 'rejected' && note !== null)
        setError('Rejection reason must contain at least 5 characters.');
      return;
    }
    return run(
      () =>
        postAction({
          action: 'review_policy_document',
          documentId: document.id,
          decision,
          note: note.trim(),
        }),
      `Document ${decision}.`
    );
  };

  const refreshDataQuality = () =>
    run(async () => {
      const response = await authFetch('/api/admin-lender-intelligence/operations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'refresh_data_quality' }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || 'Compliance scan failed');
    }, 'Lender readiness and compliance scan completed.');

  const manageIssue = (
    issue: DataQualityIssue,
    issueAction: 'claim' | 'resolve' | 'accept' | 'reopen'
  ) => {
    const needsNote = issueAction !== 'claim';
    const note = needsNote
      ? window.prompt(`${issueAction.replace(/_/g, ' ')} evidence:`)?.trim() || ''
      : '';
    const minimum = issueAction === 'accept' ? 10 : 5;
    if (needsNote && note.length < minimum) {
      setError(`Provide at least ${minimum} characters of evidence.`);
      return;
    }
    return run(
      () =>
        postAction({ action: 'manage_data_quality_issue', issueId: issue.id, issueAction, note }),
      `Compliance issue ${{ claim: 'claimed', resolve: 'resolved', accept: 'risk accepted', reopen: 'reopened' }[issueAction]}.`,
      'compliance.manage'
    );
  };

  const previewBulkImport = async () => {
    if (!canManagePolicy) {
      setError('This action requires the policy.manage permission.');
      return;
    }
    setError('');
    setMessage('');
    setBulkPreview(null);
    try {
      const rows = JSON.parse(bulkImportText);
      const preview = (await postAction({ action: 'preview_bulk_import', rows })) as ImportPreview;
      setBulkPreview(preview);
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : 'Invalid import JSON');
    }
  };

  const commitBulkImport = () => {
    if (!bulkPreview?.valid) return;
    return run(async () => {
      const rows = JSON.parse(bulkImportText);
      await postAction({ action: 'commit_bulk_import', rows });
      setBulkImportText('');
      setBulkPreview(null);
    }, `${bulkPreview.rows.length} lender program rows imported atomically.`);
  };

  const saveRejectionReason = (event: FormEvent) => {
    event.preventDefault();
    return run(
      async () => {
        await postAction({
          action: 'save_rejection_reason',
          reason: { ...reasonForm, sortOrder: Number(reasonForm.sortOrder) },
        });
        setReasonForm({
          id: '',
          partnerId: '',
          code: '',
          category: 'credit',
          label: '',
          description: '',
          active: true,
          sortOrder: '100',
        });
      },
      `Rejection reason ${reasonForm.id ? 'updated' : 'created'}.`
    );
  };

  const editRejectionReason = (reason: RejectionReason) =>
    setReasonForm({
      id: reason.id,
      partnerId: reason.partner_id || '',
      code: reason.code,
      category: reason.category,
      label: reason.label,
      description: reason.description || '',
      active: reason.active,
      sortOrder: String(reason.sort_order),
    });

  const createPolicyRestoration = (policy: Policy) => {
    const reason = window.prompt(`Why should policy v${policy.version} be restored?`)?.trim() || '';
    if (reason.length < 5) {
      setError('A meaningful restoration reason is required.');
      return;
    }
    return run(
      () =>
        postAction({
          action: 'create_policy_restoration',
          sourcePolicyVersionId: policy.id,
          restorationReason: reason,
        }),
      `Restoration draft cloned from policy v${policy.version}. Review and submit it for independent approval.`
    );
  };

  const rejectPolicy = (policy: Policy) => {
    const reason =
      window.prompt(`Enter the checker rejection reason for policy v${policy.version}:`)?.trim() ||
      '';
    if (reason.length < 5) {
      setError('A meaningful rejection reason is required.');
      return;
    }
    return run(
      () =>
        postAction({
          action: 'reject_policy',
          policyVersionId: policy.id,
          rejectionReason: reason,
        }),
      `Policy v${policy.version} rejected with checker evidence.`
    );
  };

  const retirePolicy = (policy: Policy) => {
    const reason =
      window.prompt(`Why should published policy v${policy.version} be retired?`)?.trim() || '';
    if (reason.length < 5) {
      setError('Provide policy retirement evidence of at least 5 characters.');
      return;
    }
    return run(
      () => postAction({ action: 'retire_policy', policyVersionId: policy.id, reason }),
      `Policy v${policy.version} retired with audit evidence.`
    );
  };

  const discardPolicyDraft = (policy: Policy) => {
    const reason =
      window.prompt(`Why should policy draft v${policy.version} be discarded?`)?.trim() || '';
    if (reason.length < 5) {
      setError('Provide draft discard evidence of at least 5 characters.');
      return;
    }
    return run(
      () => postAction({ action: 'discard_policy_draft', policyVersionId: policy.id, reason }),
      `Policy draft v${policy.version} discarded.`
    );
  };

  return (
    <AdminLayout title="Lender Onboarding">
      <div
        className={`space-y-5 p-6 ${
          canManagePolicy
            ? ''
            : '[&_form_input]:pointer-events-none [&_form_input]:opacity-60 [&_form_select]:pointer-events-none [&_form_select]:opacity-60 [&_form_textarea]:pointer-events-none [&_form_textarea]:opacity-60 [&_button:not([data-read-action]):not([data-compliance-action])]:pointer-events-none [&_button:not([data-read-action]):not([data-compliance-action])]:opacity-50'
        }`}
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
              Lender Onboarding & Policy Governance
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Create the lender identity, map programs, then move sourced policy through
              maker-checker review.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={refreshDataQuality}
              disabled={saving}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-violet-600 px-4 text-sm font-semibold text-white"
            >
              Run compliance scan
            </button>
            <button
              data-read-action
              onClick={loadCatalog}
              disabled={loading}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
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
        {!canManagePolicy && (
          <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm font-semibold text-blue-700">
            <FileCheck2 size={16} />
            Read-only catalog access. Lender, program, policy, taxonomy, document, and bulk-import
            changes require the policy.manage permission.
          </div>
        )}

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-bold text-slate-900">
                <Upload size={17} className="text-blue-600" />
                Preview-first bulk lender/program import
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Paste a JSON array (maximum 500 rows). Active programs are blocked from overwrite; a
                valid preview is mandatory before atomic commit.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setBulkImportText(
                  JSON.stringify(
                    [
                      {
                        lenderCode: 'BANK001',
                        displayName: 'Example Bank',
                        legalName: 'Example Bank Limited',
                        lenderType: 'bank',
                        programCode: 'BANK001_PL_SALARIED',
                        programName: 'Salaried Personal Loan',
                        product: 'personal_loan',
                        minLoan: 100000,
                        maxLoan: 2500000,
                        indicativeRoiMin: 10.5,
                        indicativeRoiMax: 14,
                        loginSlaHours: 24,
                        sanctionSlaHours: 120,
                        disbursalSlaHours: 72,
                      },
                    ],
                    null,
                    2
                  )
                )
              }
              className="text-xs font-semibold text-blue-600"
            >
              Load template
            </button>
          </div>
          <textarea
            className="mt-4 min-h-44 w-full rounded-md border border-slate-200 bg-slate-950 p-3 font-mono text-xs text-slate-100 outline-none focus:border-blue-400"
            placeholder='[{ "lenderCode": "...", "programCode": "..." }]'
            value={bulkImportText}
            onChange={(event) => {
              setBulkImportText(event.target.value);
              setBulkPreview(null);
            }}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={saving || !bulkImportText.trim()}
              onClick={previewBulkImport}
              className="inline-flex h-9 items-center rounded-md border border-blue-200 px-3 text-xs font-semibold text-blue-700 disabled:opacity-50"
            >
              Validate & preview
            </button>
            <button
              type="button"
              disabled={saving || !bulkPreview?.valid}
              onClick={commitBulkImport}
              className="inline-flex h-9 items-center rounded-md bg-emerald-600 px-3 text-xs font-semibold text-white disabled:opacity-50"
            >
              Commit atomic import
            </button>
            {bulkPreview && (
              <span
                className={`text-xs font-semibold ${bulkPreview.valid ? 'text-emerald-700' : 'text-red-700'}`}
              >
                {bulkPreview.valid
                  ? `${bulkPreview.rows.length} rows ready`
                  : `${bulkPreview.errors.length} validation issue(s)`}
              </span>
            )}
          </div>
          {bulkPreview && (
            <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {bulkPreview.preview?.map((item) => (
                <div
                  key={`${item.row}-${item.programCode}`}
                  className="rounded-md border border-slate-200 px-3 py-2 text-xs"
                >
                  <span className="font-bold">Row {item.row}</span> · {item.lenderCode} /{' '}
                  {item.programCode}
                  <span className="ml-2 uppercase text-slate-500">
                    {item.action.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
              {bulkPreview.errors?.map((item, index) => (
                <div
                  key={`error-${item.row}-${item.field}-${index}`}
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
                >
                  Row {item.row} · {item.field}: {item.message}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <form
            onSubmit={addLender}
            className="space-y-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-blue-600" />
              <h2 className="font-bold text-slate-900">
                1. {lenderForm.id ? 'Edit lender master' : 'Onboard lender'}
              </h2>
            </div>
            <input
              className={inputClass}
              required
              placeholder="Display name"
              value={lenderForm.displayName}
              onChange={(e) => setLenderForm({ ...lenderForm, displayName: e.target.value })}
            />
            <input
              className={inputClass}
              placeholder="Legal name (optional)"
              value={lenderForm.legalName}
              onChange={(e) => setLenderForm({ ...lenderForm, legalName: e.target.value })}
            />
            <input
              className={inputClass}
              required
              placeholder="Unique lender code"
              value={lenderForm.lenderCode}
              onChange={(e) =>
                setLenderForm({ ...lenderForm, lenderCode: e.target.value.toUpperCase() })
              }
            />
            <select
              className={inputClass}
              value={lenderForm.lenderType}
              onChange={(e) => setLenderForm({ ...lenderForm, lenderType: e.target.value })}
            >
              <option value="bank">Bank</option>
              <option value="nbfc">NBFC</option>
              <option value="hfc">HFC</option>
              <option value="fintech">Fintech</option>
              <option value="other">Other</option>
            </select>
            <input
              className={inputClass}
              type="email"
              placeholder="Finance email"
              value={lenderForm.financeEmail}
              onChange={(e) => setLenderForm({ ...lenderForm, financeEmail: e.target.value })}
            />
            <input
              className={inputClass}
              placeholder="GSTIN"
              maxLength={15}
              value={lenderForm.gstin}
              onChange={(e) =>
                setLenderForm({ ...lenderForm, gstin: e.target.value.toUpperCase() })
              }
            />
            <textarea
              className="min-h-20 w-full rounded-md border border-slate-200 p-3 text-sm outline-none focus:border-blue-400"
              placeholder="Registered billing address"
              value={lenderForm.billingAddress}
              onChange={(e) => setLenderForm({ ...lenderForm, billingAddress: e.target.value })}
            />
            <button className={buttonClass} disabled={saving}>
              <Plus size={16} />
              {lenderForm.id ? 'Save lender' : 'Create lender'}
            </button>
          </form>

          <form
            onSubmit={addProgram}
            className="space-y-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <FileCheck2 size={18} className="text-violet-600" />
              <h2 className="font-bold text-slate-900">2. Add product program</h2>
            </div>
            <select
              className={inputClass}
              required
              value={programForm.lenderId}
              onChange={(e) => setProgramForm({ ...programForm, lenderId: e.target.value })}
            >
              <option value="">Select lender</option>
              {catalog.lenders.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.display_name}
                </option>
              ))}
            </select>
            <input
              className={inputClass}
              required
              placeholder="Program name"
              value={programForm.programName}
              onChange={(e) => setProgramForm({ ...programForm, programName: e.target.value })}
            />
            <input
              className={inputClass}
              required
              placeholder="Program code"
              value={programForm.programCode}
              onChange={(e) =>
                setProgramForm({ ...programForm, programCode: e.target.value.toUpperCase() })
              }
            />
            <select
              className={inputClass}
              value={programForm.product}
              onChange={(e) => setProgramForm({ ...programForm, product: e.target.value })}
            >
              <option value="personal_loan">Personal Loan</option>
              <option value="business_loan">Business Loan</option>
              <option value="home_loan">Home Loan</option>
              <option value="lap">LAP</option>
              <option value="car_loan">Car Loan</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input
                className={inputClass}
                type="number"
                min="0"
                step="1"
                placeholder="Min loan amount"
                value={programForm.minLoan}
                onChange={(e) => setProgramForm({ ...programForm, minLoan: e.target.value })}
              />
              <input
                className={inputClass}
                type="number"
                min="0"
                step="1"
                placeholder="Max loan amount"
                value={programForm.maxLoan}
                onChange={(e) => setProgramForm({ ...programForm, maxLoan: e.target.value })}
              />
              <input
                className={inputClass}
                type="number"
                min="1"
                placeholder="Min tenure months"
                value={programForm.minTenureMonths}
                onChange={(e) =>
                  setProgramForm({ ...programForm, minTenureMonths: e.target.value })
                }
              />
              <input
                className={inputClass}
                type="number"
                min="1"
                placeholder="Max tenure months"
                value={programForm.maxTenureMonths}
                onChange={(e) =>
                  setProgramForm({ ...programForm, maxTenureMonths: e.target.value })
                }
              />
              <input
                className={inputClass}
                type="number"
                min="0"
                step="0.01"
                placeholder="Indicative ROI min %"
                value={programForm.indicativeRoiMin}
                onChange={(e) =>
                  setProgramForm({ ...programForm, indicativeRoiMin: e.target.value })
                }
              />
              <input
                className={inputClass}
                type="number"
                min="0"
                step="0.01"
                placeholder="Indicative ROI max %"
                value={programForm.indicativeRoiMax}
                onChange={(e) =>
                  setProgramForm({ ...programForm, indicativeRoiMax: e.target.value })
                }
              />
            </div>
            <input
              className={inputClass}
              placeholder="Employment types, comma-separated"
              value={programForm.employmentTypes}
              onChange={(e) => setProgramForm({ ...programForm, employmentTypes: e.target.value })}
            />
            <input
              className={inputClass}
              placeholder="Channels, comma-separated (for example crm)"
              value={programForm.channels}
              onChange={(e) => setProgramForm({ ...programForm, channels: e.target.value })}
            />
            <input
              className={inputClass}
              placeholder="States, comma-separated"
              value={programForm.states}
              onChange={(e) => setProgramForm({ ...programForm, states: e.target.value })}
            />
            <input
              className={inputClass}
              placeholder="Cities, comma-separated"
              value={programForm.cities}
              onChange={(e) => setProgramForm({ ...programForm, cities: e.target.value })}
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                className={inputClass}
                type="number"
                min="1"
                title="Login SLA hours"
                value={programForm.loginSlaHours}
                onChange={(e) => setProgramForm({ ...programForm, loginSlaHours: e.target.value })}
              />
              <input
                className={inputClass}
                type="number"
                min="1"
                title="Sanction SLA hours"
                value={programForm.sanctionSlaHours}
                onChange={(e) =>
                  setProgramForm({ ...programForm, sanctionSlaHours: e.target.value })
                }
              />
              <input
                className={inputClass}
                type="number"
                min="1"
                title="Disbursal SLA hours"
                value={programForm.disbursalSlaHours}
                onChange={(e) =>
                  setProgramForm({ ...programForm, disbursalSlaHours: e.target.value })
                }
              />
            </div>
            <input
              className={inputClass}
              type="number"
              min="1"
              max="1000000"
              step="1"
              placeholder="Daily submission limit (optional, IST day)"
              value={programForm.dailySubmissionLimit}
              onChange={(e) =>
                setProgramForm({ ...programForm, dailySubmissionLimit: e.target.value })
              }
            />
            <button className={buttonClass} disabled={saving || !catalog.lenders.length}>
              <Plus size={16} />
              Create program
            </button>
          </form>

          <form
            onSubmit={addPolicy}
            className="space-y-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <FileCheck2 size={18} className="text-emerald-600" />
              <h2 className="font-bold text-slate-900">3. Start policy version</h2>
            </div>
            <select
              className={inputClass}
              required
              value={policyForm.programId}
              onChange={(e) => setPolicyForm({ ...policyForm, programId: e.target.value })}
            >
              <option value="">Select program</option>
              {catalog.programs.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.program_name}
                </option>
              ))}
            </select>
            <input
              className={inputClass}
              required
              placeholder="Source document/reference"
              value={policyForm.sourceReference}
              onChange={(e) => setPolicyForm({ ...policyForm, sourceReference: e.target.value })}
            />
            <input
              className={inputClass}
              placeholder="Change summary"
              value={policyForm.changeSummary}
              onChange={(e) => setPolicyForm({ ...policyForm, changeSummary: e.target.value })}
            />
            <p className="text-xs text-slate-500">
              A draft is immutable after it enters review. Another admin must publish it.
            </p>
            <button className={buttonClass} disabled={saving || !catalog.programs.length}>
              <Plus size={16} />
              Create policy draft
            </button>
          </form>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.7fr)]">
          <form
            onSubmit={saveRejectionReason}
            className="space-y-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div>
              <h2 className="font-bold text-slate-900">Rejection taxonomy</h2>
              <p className="mt-1 text-xs text-slate-500">
                Create a stable global reason or enter a partner UUID for an override.
              </p>
            </div>
            <input
              className={inputClass}
              placeholder="Partner UUID (blank = global)"
              value={reasonForm.partnerId}
              disabled={Boolean(reasonForm.id)}
              onChange={(e) => setReasonForm({ ...reasonForm, partnerId: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                required
                className={inputClass}
                placeholder="Reason code"
                value={reasonForm.code}
                disabled={Boolean(reasonForm.id)}
                onChange={(e) =>
                  setReasonForm({ ...reasonForm, code: e.target.value.toUpperCase() })
                }
              />
              <input
                required
                className={inputClass}
                placeholder="Category"
                value={reasonForm.category}
                onChange={(e) =>
                  setReasonForm({ ...reasonForm, category: e.target.value.toLowerCase() })
                }
              />
            </div>
            <input
              required
              className={inputClass}
              placeholder="User-facing label"
              value={reasonForm.label}
              onChange={(e) => setReasonForm({ ...reasonForm, label: e.target.value })}
            />
            <textarea
              className="min-h-20 w-full rounded-md border border-slate-200 p-3 text-sm outline-none focus:border-blue-400"
              placeholder="Description (optional)"
              value={reasonForm.description}
              onChange={(e) => setReasonForm({ ...reasonForm, description: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                required
                type="number"
                min="0"
                max="100000"
                className={inputClass}
                value={reasonForm.sortOrder}
                onChange={(e) => setReasonForm({ ...reasonForm, sortOrder: e.target.value })}
              />
              <label className="flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={reasonForm.active}
                  onChange={(e) => setReasonForm({ ...reasonForm, active: e.target.checked })}
                />{' '}
                Active
              </label>
            </div>
            <div className="flex gap-2">
              <button disabled={saving} className={buttonClass}>
                <Plus size={15} /> {reasonForm.id ? 'Save changes' : 'Add reason'}
              </button>
              {reasonForm.id && (
                <button
                  type="button"
                  className="h-10 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-600"
                  onClick={() =>
                    setReasonForm({
                      id: '',
                      partnerId: '',
                      code: '',
                      category: 'credit',
                      label: '',
                      description: '',
                      active: true,
                      sortOrder: '100',
                    })
                  }
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold text-slate-900">Canonical reason register</h2>
              <p className="text-sm text-slate-500">
                Codes remain stable; deactivate obsolete reasons to preserve reporting history.
              </p>
            </div>
            <div className="max-h-[430px] overflow-auto divide-y divide-slate-100">
              {(catalog.rejectionReasons || []).map((reason) => (
                <div key={reason.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700">
                        {reason.code}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">{reason.label}</span>
                      <Status value={reason.active ? 'active' : 'inactive'} />
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {reason.partner_id ? `Partner ${reason.partner_id}` : 'Global'} ·{' '}
                      {reason.category} · order {reason.sort_order}
                      {reason.description ? ` · ${reason.description}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => editRejectionReason(reason)}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-blue-700"
                  >
                    Edit
                  </button>
                </div>
              ))}
              {!loading && !(catalog.rejectionReasons || []).length && (
                <p className="p-5 text-sm text-slate-500">No rejection reasons configured.</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-900">Onboarding pipeline</h2>
            <p className="text-sm text-slate-500">
              Operational readiness across lender identity and programs.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-left">Lender</th>
                  <th className="px-5 py-3 text-left">Type</th>
                  <th className="px-5 py-3 text-left">Onboarding</th>
                  <th className="px-5 py-3 text-left">KYC</th>
                  <th className="px-5 py-3 text-left">Agreement</th>
                  <th className="px-5 py-3 text-right">Programs</th>
                  <th className="px-5 py-3 text-right">Next action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {catalog.lenders.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{item.display_name}</p>
                      <p className="text-xs text-slate-400">{item.lender_code}</p>
                      {item.onboarding_status !== 'offboarded' && (
                        <button
                          type="button"
                          className="mt-1 text-xs font-semibold text-blue-600"
                          onClick={() => {
                            setLenderForm({
                              id: item.id,
                              displayName: item.display_name,
                              legalName: item.legal_name,
                              lenderCode: item.lender_code,
                              lenderType: item.lender_type,
                              financeEmail: item.finance_email || '',
                              billingAddress: item.billing_address || '',
                              gstin: item.gstin || '',
                            });
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          Edit master
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-4 uppercase text-slate-600">{item.lender_type}</td>
                    <td className="px-5 py-4">
                      <Status value={item.onboarding_status} />
                    </td>
                    <td className="px-5 py-4">
                      <Status value={item.kyc_status} />
                    </td>
                    <td className="px-5 py-4">
                      <Status value={item.agreement_status} />
                    </td>
                    <td className="px-5 py-4 text-right font-semibold">
                      {programsByLender.get(item.id) || 0}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {item.onboarding_status === 'draft' ? (
                        <button
                          disabled={saving}
                          className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold"
                          onClick={() =>
                            updateLenderStatus(
                              item,
                              { onboardingStatus: 'due_diligence' },
                              'Due diligence started.'
                            )
                          }
                        >
                          Start DD
                        </button>
                      ) : item.kyc_status !== 'verified' ? (
                        <button
                          disabled={saving}
                          className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold"
                          onClick={() =>
                            updateLenderStatus(
                              item,
                              { kycStatus: 'verified' },
                              'KYC marked verified.'
                            )
                          }
                        >
                          Verify KYC
                        </button>
                      ) : item.agreement_status !== 'signed' ? (
                        <button
                          disabled={saving}
                          className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold"
                          onClick={() =>
                            updateLenderStatus(
                              item,
                              { agreementStatus: 'signed' },
                              'Agreement marked signed.'
                            )
                          }
                        >
                          Sign agreement
                        </button>
                      ) : item.onboarding_status === 'paused' ? (
                        <button
                          disabled={saving}
                          className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white"
                          onClick={() =>
                            updateLenderStatus(
                              item,
                              { onboardingStatus: 'active' },
                              'Lender resumed.'
                            )
                          }
                        >
                          Resume
                        </button>
                      ) : item.onboarding_status !== 'active' ? (
                        <button
                          disabled={saving}
                          className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white"
                          onClick={() =>
                            updateLenderStatus(
                              item,
                              { onboardingStatus: 'active' },
                              'Lender activated.'
                            )
                          }
                        >
                          Activate
                        </button>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <button
                            disabled={saving}
                            className="rounded-md border border-amber-200 px-2 py-1 text-xs font-semibold text-amber-700"
                            onClick={() =>
                              updateLenderStatus(
                                item,
                                { onboardingStatus: 'paused' },
                                'Lender and routing paused.'
                              )
                            }
                          >
                            Pause
                          </button>
                          <button
                            disabled={saving}
                            className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-700"
                            onClick={() => {
                              if (
                                window.confirm(
                                  'Offboard this lender? Active files must be resolved first.'
                                )
                              )
                                void updateLenderStatus(
                                  item,
                                  { onboardingStatus: 'offboarded' },
                                  'Lender offboarded.'
                                );
                            }}
                          >
                            Offboard
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && !catalog.lenders.length && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No lenders onboarded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-900">Program operating controls</h2>
            <p className="text-sm text-slate-500">
              Activation requires an active lender and current published policy.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-left">Program</th>
                  <th className="px-5 py-3 text-left">Product</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Capacity</th>
                  <th className="px-5 py-3 text-left">SLAs</th>
                  <th className="px-5 py-3 text-right">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {catalog.programs.map((program) => (
                  <tr key={program.id}>
                    <td className="px-5 py-4 font-semibold">
                      {program.program_name}
                      <p className="text-xs font-normal text-slate-400">{program.program_code}</p>
                    </td>
                    <td className="px-5 py-4 capitalize">{program.product.replace(/_/g, ' ')}</td>
                    <td className="px-5 py-4">
                      <Status value={program.status} />
                    </td>
                    <td className="px-5 py-4">
                      <Status value={program.capacity_status} />
                      <p className="mt-1 text-[11px] text-slate-500">
                        {program.daily_submission_limit
                          ? `${capacityByProgram.get(program.id)?.submissions_used || 0}/${program.daily_submission_limit} used · ${capacityByProgram.get(program.id)?.submissions_remaining ?? 0} left (IST)`
                          : 'No numeric daily cap'}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      Login {program.login_sla_hours || 24}h · Sanction{' '}
                      {program.sanction_sla_hours || 120}h · Disbursal{' '}
                      {program.disbursal_sla_hours || 72}h
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        {program.status !== 'retired' && (
                          <button
                            disabled={saving}
                            onClick={() => setProgramDailyCapacity(program)}
                            className="rounded-md border border-blue-200 px-2 py-1 text-xs font-semibold text-blue-700"
                          >
                            Set daily cap
                          </button>
                        )}
                        {program.status !== 'active' && program.status !== 'retired' && (
                          <button
                            disabled={saving}
                            onClick={() => setProgramStatus(program, 'active', 'open')}
                            className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white"
                          >
                            Activate
                          </button>
                        )}
                        {program.status === 'active' && program.capacity_status !== 'paused' && (
                          <button
                            disabled={saving}
                            onClick={() => setProgramStatus(program, 'active', 'paused')}
                            className="rounded-md border border-amber-200 px-2 py-1 text-xs font-semibold text-amber-700"
                          >
                            Pause capacity
                          </button>
                        )}
                        {program.status === 'active' && program.capacity_status === 'paused' && (
                          <button
                            disabled={saving}
                            onClick={() => setProgramStatus(program, 'active', 'open')}
                            className="rounded-md border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-700"
                          >
                            Open capacity
                          </button>
                        )}
                        <button
                          disabled={saving || program.status === 'retired'}
                          onClick={() => setProgramStatus(program, 'retired', 'paused')}
                          className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-700"
                        >
                          Retire
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-900">Policy governance queue</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {catalog.policies.map((policy) => {
              const program = catalog.programs.find((item) => item.id === policy.program_id);
              return (
                <div key={policy.id} className="rounded-md border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">
                      {program?.program_name || 'Program'}
                    </p>
                    <Status value={policy.status} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Version {policy.version} · {policy.lender_policy_rules?.length || 0} rules
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-400">
                    {policy.source_reference || 'Source pending'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {policy.status === 'draft' && (
                      <>
                        <button
                          onClick={() => setEditingPolicyId(policy.id)}
                          className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold"
                        >
                          Add rule
                        </button>
                        <button
                          disabled={saving || !policy.lender_policy_rules?.length}
                          onClick={() =>
                            run(
                              () =>
                                postAction({ action: 'submit_policy', policyVersionId: policy.id }),
                              'Policy submitted for checker review.'
                            )
                          }
                          className="rounded-md bg-blue-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          Submit review
                        </button>
                        <button
                          disabled={saving}
                          onClick={() => discardPolicyDraft(policy)}
                          className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-700"
                        >
                          Discard draft
                        </button>
                      </>
                    )}
                    {policy.status === 'in_review' && (
                      <>
                        <button
                          disabled={saving || policy.submitted_by === user?.id}
                          title={
                            policy.submitted_by === user?.id
                              ? 'An independent checker must publish this policy.'
                              : undefined
                          }
                          onClick={() =>
                            run(
                              () =>
                                postAction({
                                  action: 'publish_policy',
                                  policyVersionId: policy.id,
                                }),
                              'Policy published and previous version retired.'
                            )
                          }
                          className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white"
                        >
                          Approve & publish
                        </button>
                        <button
                          disabled={saving || policy.submitted_by === user?.id}
                          title={
                            policy.submitted_by === user?.id
                              ? 'An independent checker must reject this policy.'
                              : undefined
                          }
                          onClick={() => rejectPolicy(policy)}
                          className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {policy.status === 'retired' && (
                      <button
                        disabled={saving}
                        onClick={() => createPolicyRestoration(policy)}
                        className="rounded-md border border-violet-200 bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700"
                      >
                        Create restoration draft
                      </button>
                    )}
                    {policy.status === 'published' && (
                      <button
                        disabled={saving || program?.status === 'active'}
                        title={
                          program?.status === 'active'
                            ? 'Pause or retire the program first'
                            : undefined
                        }
                        onClick={() => retirePolicy(policy)}
                        className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 disabled:opacity-40"
                      >
                        Retire policy
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {!loading && !catalog.policies.length && (
              <p className="text-sm text-slate-500">No policy versions created yet.</p>
            )}
          </div>
        </div>

        {editingPolicyId && (
          <form
            onSubmit={addRule}
            className="rounded-lg border border-blue-200 bg-blue-50/40 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">Add policy rule</h2>
                <p className="text-xs text-slate-500">
                  Rules remain editable only while the policy is in draft.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPolicyId('')}
                className="text-xs font-semibold text-slate-500"
              >
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              <select
                className={inputClass}
                value={ruleForm.fieldKey}
                onChange={(e) => {
                  const fieldKey = e.target.value;
                  const operators = operatorsForPolicyField(fieldKey);
                  setRuleForm({
                    ...ruleForm,
                    fieldKey,
                    operator: operators.some((operator) => operator === ruleForm.operator)
                      ? ruleForm.operator
                      : operators[0] || 'eq',
                  });
                }}
              >
                {policyFields.map((field) => (
                  <option key={field.key} value={field.key}>
                    {field.label}
                  </option>
                ))}
              </select>
              <select
                className={inputClass}
                value={ruleForm.operator}
                onChange={(e) => setRuleForm({ ...ruleForm, operator: e.target.value })}
              >
                {operatorsForPolicyField(ruleForm.fieldKey).map((operator) => (
                  <option key={operator} value={operator}>
                    {operator.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <input
                className={inputClass}
                required={!['exists', 'not_exists'].includes(ruleForm.operator)}
                placeholder="Value; comma for list/range"
                value={ruleForm.comparisonValue}
                onChange={(e) => setRuleForm({ ...ruleForm, comparisonValue: e.target.value })}
              />
              <select
                className={inputClass}
                value={ruleForm.severity}
                onChange={(e) => setRuleForm({ ...ruleForm, severity: e.target.value })}
              >
                <option value="hard">Hard exclusion</option>
                <option value="soft">Soft preference</option>
                <option value="warning">Warning only</option>
              </select>
              <input
                className={inputClass}
                required
                placeholder="Reason code"
                value={ruleForm.reasonCode}
                onChange={(e) =>
                  setRuleForm({ ...ruleForm, reasonCode: e.target.value.toUpperCase() })
                }
              />
              <input
                className={inputClass}
                required
                placeholder="Customer-safe reason"
                value={ruleForm.reasonText}
                onChange={(e) => setRuleForm({ ...ruleForm, reasonText: e.target.value })}
              />
            </div>
            {ruleForm.severity === 'soft' && (
              <input
                className={`${inputClass} mt-3 max-w-xs`}
                type="number"
                min="0"
                max="100"
                placeholder="Ranking penalty weight"
                value={ruleForm.weight}
                onChange={(e) => setRuleForm({ ...ruleForm, weight: e.target.value })}
              />
            )}
            <button disabled={saving} className={`${buttonClass} mt-3`}>
              Save rule
            </button>
          </form>
        )}

        <div className="grid gap-5 xl:grid-cols-3">
          <form
            onSubmit={uploadDocument}
            className="space-y-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="font-bold text-slate-900">Compliance evidence</h2>
            <select
              required
              className={inputClass}
              value={documentForm.lenderId}
              onChange={(e) =>
                setDocumentForm({
                  ...documentForm,
                  lenderId: e.target.value,
                  programId: '',
                  policyVersionId: '',
                })
              }
            >
              <option value="">Select lender</option>
              {catalog.lenders.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.display_name}
                </option>
              ))}
            </select>
            <select
              className={inputClass}
              value={documentForm.programId}
              onChange={(e) =>
                setDocumentForm({ ...documentForm, programId: e.target.value, policyVersionId: '' })
              }
            >
              <option value="">Lender-level document</option>
              {catalog.programs
                .filter((item) => item.lender_id === documentForm.lenderId)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.program_name}
                  </option>
                ))}
            </select>
            <select
              className={inputClass}
              value={documentForm.policyVersionId}
              onChange={(e) =>
                setDocumentForm({ ...documentForm, policyVersionId: e.target.value })
              }
            >
              <option value="">No policy version link</option>
              {catalog.policies
                .filter(
                  (item) => !documentForm.programId || item.program_id === documentForm.programId
                )
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    Policy v{item.version} · {item.status}
                  </option>
                ))}
            </select>
            <select
              className={inputClass}
              value={documentForm.documentType}
              onChange={(e) => setDocumentForm({ ...documentForm, documentType: e.target.value })}
            >
              <option value="credit_policy">Credit policy</option>
              <option value="agreement">Agreement</option>
              <option value="kyc">KYC</option>
              <option value="commercial">Commercial terms</option>
              <option value="other">Other</option>
            </select>
            <input
              className={inputClass}
              type="date"
              value={documentForm.expiresAt}
              onChange={(e) => setDocumentForm({ ...documentForm, expiresAt: e.target.value })}
            />
            <input
              required
              className="block w-full text-xs text-slate-600"
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              onChange={(e) =>
                setDocumentForm({ ...documentForm, file: e.target.files?.[0] || null })
              }
            />
            <button disabled={saving || !documentForm.file} className={buttonClass}>
              Upload privately
            </button>
          </form>
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm xl:col-span-2">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold text-slate-900">Document register</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {(catalog.documents || []).slice(0, 12).map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {document.file_name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {document.document_type.replace(/_/g, ' ')} · SHA-256{' '}
                      {document.checksum?.slice(0, 12) || '-'} ·{' '}
                      {document.expires_at
                        ? `expires ${new Date(document.expires_at).toLocaleDateString('en-IN')}`
                        : 'no expiry'}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Status value={document.review_status} />
                      {document.review_note && (
                        <span className="truncate text-xs text-slate-500">
                          {document.review_note}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      data-read-action
                      type="button"
                      onClick={() => openDocument(document.id)}
                      className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-blue-600"
                    >
                      Open
                    </button>
                    {document.review_status === 'pending' && (
                      <>
                        <button
                          type="button"
                          disabled={saving || document.created_by === user?.id}
                          title={
                            document.created_by === user?.id
                              ? 'An independent checker must review this document.'
                              : undefined
                          }
                          onClick={() => reviewDocument(document, 'rejected')}
                          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          disabled={saving || document.created_by === user?.id}
                          title={
                            document.created_by === user?.id
                              ? 'An independent checker must review this document.'
                              : undefined
                          }
                          onClick={() => reviewDocument(document, 'verified')}
                          className="rounded-md border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700"
                        >
                          Verify
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {!loading && !(catalog.documents || []).length && (
                <p className="p-5 text-sm text-slate-500">
                  No policy or compliance documents uploaded.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-900">Governance audit trail</h2>
            <p className="text-sm text-slate-500">
              Append-only history of lender and policy changes.
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {(catalog.auditLogs || []).slice(0, 15).map((log) => (
              <div
                key={log.id}
                className="flex flex-col gap-1 px-5 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {log.summary || log.action.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-slate-400">
                    {log.module} · {log.actor_email || 'System admin'}
                  </p>
                </div>
                <time className="text-xs text-slate-400">
                  {new Date(log.created_at).toLocaleString('en-IN')}
                </time>
              </div>
            ))}
            {!loading && !(catalog.auditLogs || []).length && (
              <p className="p-5 text-sm text-slate-500">
                No lender governance changes recorded yet.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-900">Readiness & compliance issues</h2>
            <p className="text-sm text-slate-500">
              Automated controls for policy, KYC, agreement and document freshness.
            </p>
          </div>
          <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
            {(catalog.dataQualityIssues || []).map((issue) => (
              <div
                key={issue.id}
                className={`rounded-md border p-4 ${issue.severity === 'critical' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-900">{issue.title}</p>
                  <div className="flex gap-1">
                    <span className="text-xs font-bold uppercase">{issue.severity}</span>
                    <Status value={issue.status} />
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-600">{issue.detail || 'Review required.'}</p>
                {issue.due_at && (
                  <p className="mt-2 text-xs text-slate-500">
                    Due {new Date(issue.due_at).toLocaleDateString('en-IN')}
                  </p>
                )}
                {issue.resolution_note && (
                  <p className="mt-2 text-xs text-slate-500">Evidence: {issue.resolution_note}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {issue.status === 'open' && (
                    <button
                      data-compliance-action
                      disabled={saving || !canManageCompliance}
                      onClick={() => manageIssue(issue, 'claim')}
                      className="rounded-md border border-blue-200 px-2 py-1 text-xs font-semibold text-blue-700"
                    >
                      Claim
                    </button>
                  )}
                  {['open', 'in_progress'].includes(issue.status) && (
                    <>
                      <button
                        data-compliance-action
                        disabled={saving || !canManageCompliance}
                        onClick={() => manageIssue(issue, 'resolve')}
                        className="rounded-md border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-700"
                      >
                        Resolve
                      </button>
                      <button
                        data-compliance-action
                        disabled={saving || !canManageCompliance}
                        onClick={() => manageIssue(issue, 'accept')}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700"
                      >
                        Accept risk
                      </button>
                    </>
                  )}
                  {['accepted', 'resolved'].includes(issue.status) && (
                    <button
                      data-compliance-action
                      disabled={saving || !canManageCompliance}
                      onClick={() => manageIssue(issue, 'reopen')}
                      className="rounded-md border border-amber-300 px-2 py-1 text-xs font-semibold text-amber-700"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </div>
            ))}
            {!loading && !(catalog.dataQualityIssues || []).length && (
              <p className="text-sm text-slate-500">
                No open readiness issues. Run a scan after policy or document changes.
              </p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
