'use client';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import StatusBadge from '@/crm/components/ui/StatusBadge';
import { crmFetch } from '@/lib/crm/api';
import { canTransitionLenderApplication } from '@/lib/lender-intelligence/lifecycle';

import ApplicationDetailPanel from './ApplicationDetailPanel';

type AppStage =
  | 'case_sent_to_lender'
  | 'login_pending'
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'credit_check'
  | 'conditional_approval'
  | 'final_approval'
  | 'sanctioned'
  | 'disbursal_initiated'
  | 'disbursed'
  | 'rejected'
  | 'rerouted';

type ProductType =
  | 'home_loan'
  | 'personal_loan'
  | 'business_loan'
  | 'lap'
  | 'car_loan'
  | 'credit_card';

type ApplicationDocument = {
  id: string;
  name: string;
  required: boolean;
  status: 'missing' | 'uploaded' | 'verified' | 'rejected';
  fileName?: string;
  uploadedAt?: string;
  verifiedAt?: string;
  rejectedAt?: string;
  note?: string;
};

const DEFAULT_APPLICATION_DOCUMENTS: ApplicationDocument[] = [
  { id: 'aadhaar', name: 'Aadhaar Card', required: true, status: 'missing' },
  { id: 'pan', name: 'PAN Card', required: true, status: 'missing' },
  { id: 'bank_statement', name: 'Bank Statement', required: true, status: 'missing' },
  { id: 'income_proof', name: 'Income Proof', required: true, status: 'missing' },
  { id: 'photo', name: 'Customer Photo', required: false, status: 'missing' },
  { id: 'property_documents', name: 'Property Documents', required: false, status: 'missing' },
];

interface LoanApplication {
  id: string;
  leadId?: string;
  appId: string;
  applicant: string;
  product: ProductType;
  loanAmount: number;
  lender: string;
  stage: AppStage;
  cibil: number;
  emi: number;
  assignedAgent: string;
  lastUpdate: string;
  daysPending: number;
  city: string;
  processingFee: number;
  roi: number;
  tenure: number;
  followUpDate?: string;
  rejectionReason?: string;
  statusHistory?: {
    status: AppStage;
    note: string;
    changedAt: string;
    changedBy: string;
  }[];
  notes?: {
    id: string;
    note: string;
    createdAt: string;
    createdBy: string;
  }[];
  lenderHistory?: {
    lenderName: string;
    status: string;
    changedAt: string;
    note: string;
  }[];
  documents?: ApplicationDocument[];
}

const formatINR = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${(n / 1000).toFixed(0)}K`;
};

const CIBILBadge = ({ score }: { score: number }) => {
  if (!score) return <span className="text-xs font-700 text-muted-foreground">—</span>;
  const color = score >= 750 ? 'text-success' : score >= 700 ? 'text-warning' : 'text-danger';
  return <span className={`text-xs font-700 tabular-nums ${color}`}>{score}</span>;
};

const getDocumentProgress = (documents?: ApplicationDocument[]) => {
  const source = documents?.length ? documents : DEFAULT_APPLICATION_DOCUMENTS;
  const required = source.filter((document) => document.required);
  const verified = required.filter((document) => document.status === 'verified');
  return {
    required: required.length,
    verified: verified.length,
    ready: required.length === 0 || verified.length === required.length,
  };
};

export default function LoanApplicationContent() {
  const [apps, setApps] = useState<LoanApplication[]>([]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectedApp, setSelectedApp] = useState<LoanApplication | null>(null);
  const [filterStage, setFilterStage] = useState('all');
  const [quickStageFilter, setQuickStageFilter] = useState('all');
  const [filterProduct, setFilterProduct] = useState('all');
  const [filterLender, setFilterLender] = useState('all');
  const [search, setSearch] = useState('');
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [applicationLoadError, setApplicationLoadError] = useState('');
  const [rejectionReasons, setRejectionReasons] = useState<Array<{ code: string; label: string }>>(
    []
  );

  useEffect(() => {
    const highlightedApplicationId =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('application')
        : '';

    const loadApplications = async () => {
      setLoadingApplications(true);
      setApplicationLoadError('');
      try {
        const response = await crmFetch('/api/crm/leads', { cache: 'no-store' });
        const json = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(json.error || 'Unable to load lender applications');
        const applications = Array.isArray(json.applications) ? json.applications : [];
        const leads = Array.isArray(json.data) ? json.data : [];
        setRejectionReasons(
          Array.isArray(json.rejectionReasons)
            ? json.rejectionReasons.filter(
                (reason: unknown): reason is { code: string; label: string } =>
                  Boolean(
                    reason &&
                    typeof reason === 'object' &&
                    typeof (reason as { code?: unknown }).code === 'string' &&
                    typeof (reason as { label?: unknown }).label === 'string'
                  )
              )
            : []
        );
        const liveApps: LoanApplication[] = applications.map(
          (application: {
            id: string;
            leadId: string;
            customerName: string;
            mobile: string;
            lenderName: string;
            product: ProductType;
            loanAmount: number;
            status: AppStage;
            createdAt: string;
            followUpDate?: string;
            rejectionReason?: string;
            statusHistory?: LoanApplication['statusHistory'];
            notes?: LoanApplication['notes'];
            lenderHistory?: LoanApplication['lenderHistory'];
            documents?: LoanApplication['documents'];
          }) => {
            const lead = leads.find((item: { id: string }) => item.id === application.leadId);
            const created = application.createdAt ? new Date(application.createdAt) : new Date();
            const daysPending = Math.max(
              0,
              Math.floor((Date.now() - created.getTime()) / 86400000)
            );
            return {
              id: application.id,
              leadId: application.leadId,
              appId: `CT-${application.product.replace(/_/g, '').toUpperCase().slice(0, 3)}-${created.getFullYear()}-${application.id.slice(0, 4).toUpperCase()}`,
              applicant: application.customerName,
              product: application.product,
              loanAmount: Number(application.loanAmount || 0),
              lender: application.lenderName,
              stage: application.status || 'login_pending',
              cibil: 0,
              emi: 0,
              assignedAgent: lead?.assignedAgent || 'Unassigned',
              lastUpdate: created.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }),
              daysPending,
              city: lead?.city || '-',
              processingFee: 0,
              roi: 0,
              tenure: 0,
              followUpDate: application.followUpDate,
              rejectionReason: application.rejectionReason,
              statusHistory: Array.isArray(application.statusHistory)
                ? application.statusHistory
                : [],
              notes: Array.isArray(application.notes) ? application.notes : [],
              lenderHistory: Array.isArray(application.lenderHistory)
                ? application.lenderHistory
                : [],
              documents: Array.isArray(application.documents) ? application.documents : [],
            };
          }
        );
        const nextApps = liveApps;
        setApps(nextApps);
        if (highlightedApplicationId) {
          const highlightedApp = nextApps.find((app) => app.id === highlightedApplicationId);
          if (highlightedApp) {
            setSelectedApp(highlightedApp);
            setSearch(highlightedApp.applicant);
          }
        }
      } catch (loadError) {
        setApps([]);
        setApplicationLoadError(
          loadError instanceof Error ? loadError.message : 'Unable to load lender applications'
        );
      } finally {
        setLoadingApplications(false);
      }
    };

    loadApplications();
  }, []);

  const lenders = Array.from(new Set(apps.map((a) => a.lender)));

  const filtered = apps.filter((a) => {
    const matchSearch =
      a.applicant.toLowerCase().includes(search.toLowerCase()) ||
      a.appId.toLowerCase().includes(search.toLowerCase());
    const matchStage =
      filterStage === 'all'
        ? true
        : filterStage === 'in_progress'
          ? !['disbursed', 'rejected', 'rerouted'].includes(a.stage)
          : filterStage === 'case_sent_to_lender'
            ? ['case_sent_to_lender', 'login_pending'].includes(a.stage)
            : a.stage === filterStage;
    const matchProduct = filterProduct === 'all' || a.product === filterProduct;
    const matchLender = filterLender === 'all' || a.lender === filterLender;
    return matchSearch && matchStage && matchProduct && matchLender;
  });

  const toggleRow = (id: string) =>
    setSelectedRows((p) => (p.includes(id) ? p.filter((r) => r !== id) : [...p, id]));
  const toggleAll = () =>
    setSelectedRows(selectedRows.length === filtered.length ? [] : filtered.map((a) => a.id));

  const stageOptions: AppStage[] = [
    'case_sent_to_lender',
    'login_pending',
    'draft',
    'submitted',
    'under_review',
    'credit_check',
    'conditional_approval',
    'final_approval',
    'sanctioned',
    'disbursal_initiated',
    'disbursed',
    'rejected',
    'rerouted',
  ];
  const quickFilters = [
    {
      key: 'in_progress',
      label: 'In Progress',
      count: apps.filter((a) => !['disbursed', 'rejected', 'rerouted'].includes(a.stage)).length,
      color: 'bg-info-bg text-info border-info/20',
      active: 'ring-info/25 border-info/50',
    },
    {
      key: 'disbursed',
      label: 'Disbursed (MTD)',
      count: apps.filter((a) => a.stage === 'disbursed').length,
      color: 'bg-success-bg text-success border-success/20',
      active: 'ring-success/25 border-success/50',
    },
    {
      key: 'rejected',
      label: 'Rejected',
      count: apps.filter((a) => a.stage === 'rejected').length,
      color: 'bg-danger-bg text-danger border-danger/20',
      active: 'ring-danger/25 border-danger/50',
    },
    {
      key: 'case_sent_to_lender',
      label: 'Case Sent',
      count: apps.filter((a) => a.stage === 'case_sent_to_lender' || a.stage === 'login_pending')
        .length,
      color: 'bg-warning-bg text-warning border-warning/20',
      active: 'ring-warning/25 border-warning/50',
    },
  ];

  const updateApplicationStatus = async (
    applicationId: string,
    status: AppStage,
    options: {
      note?: string;
      rejectionReason?: string;
      rejectionReasonCode?: string;
      sanctionedAmount?: number;
      disbursedAmount?: number;
      approvedRoi?: number;
      approvedTenureMonths?: number;
    } = {}
  ) => {
    const targetApp = apps.find((app) => app.id === applicationId);
    if (!targetApp || !canTransitionLenderApplication(targetApp.stage, status)) {
      toast.error('Select a valid next lender stage');
      return;
    }
    const documentProgress = getDocumentProgress(targetApp?.documents);
    if (status === 'submitted' && !documentProgress.ready) {
      toast.error('Verify required documents before submission');
      return;
    }

    const previousApps = apps;
    const now = new Date().toISOString();
    const nextApps = apps.map((app) =>
      app.id === applicationId
        ? {
            ...app,
            stage: status,
            rejectionReason:
              status === 'rejected'
                ? options.rejectionReason || app.rejectionReason || options.note
                : app.rejectionReason,
            statusHistory: [
              {
                status,
                note: options.note || `Status changed to ${status.replace(/_/g, ' ')}`,
                changedAt: now,
                changedBy: 'Admin',
              },
              ...(app.statusHistory || []),
            ],
          }
        : app
    );
    setApps(nextApps);
    setSelectedApp((current) =>
      current?.id === applicationId ? { ...current, stage: status } : current
    );
    try {
      const response = await crmFetch('/api/crm/eligibility-check', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'update_application_status',
          applicationId,
          status,
          note: options.note,
          rejectionReason: options.rejectionReason,
          rejectionReasonCode: options.rejectionReasonCode,
          sanctionedAmount: options.sanctionedAmount,
          disbursedAmount: options.disbursedAmount,
          approvedRoi: options.approvedRoi,
          approvedTenureMonths: options.approvedTenureMonths,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || 'Unable to update status');
      toast.success('File status updated');
    } catch (statusError) {
      setApps(previousApps);
      setSelectedApp(previousApps.find((app) => app.id === applicationId) || null);
      toast.error(statusError instanceof Error ? statusError.message : 'Unable to update status');
    }
  };

  const addApplicationNote = async (applicationId: string, note: string) => {
    const cleanNote = note.trim();
    if (!cleanNote) return;
    const previousApps = apps;
    const now = new Date().toISOString();
    const nextApps = apps.map((app) =>
      app.id === applicationId
        ? {
            ...app,
            notes: [
              { id: `local-${Date.now()}`, note: cleanNote, createdAt: now, createdBy: 'Admin' },
              ...(app.notes || []),
            ],
          }
        : app
    );
    setApps(nextApps);
    setSelectedApp(nextApps.find((app) => app.id === applicationId) || null);
    try {
      const response = await crmFetch('/api/crm/eligibility-check', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'add_application_note', applicationId, note: cleanNote }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || 'Unable to add note');
      toast.success('Note added');
    } catch (noteError) {
      setApps(previousApps);
      setSelectedApp(previousApps.find((app) => app.id === applicationId) || null);
      toast.error(noteError instanceof Error ? noteError.message : 'Unable to add note');
    }
  };

  const updateApplicationFollowUp = async (applicationId: string, followUpDate: string) => {
    const previousApps = apps;
    const nextApps = apps.map((app) => (app.id === applicationId ? { ...app, followUpDate } : app));
    setApps(nextApps);
    setSelectedApp(nextApps.find((app) => app.id === applicationId) || null);
    try {
      const response = await crmFetch('/api/crm/eligibility-check', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'update_application_followup',
          applicationId,
          followUpDate,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success)
        throw new Error(json.error || 'Unable to update follow-up');
      toast.success('Follow-up updated');
    } catch (followUpError) {
      setApps(previousApps);
      setSelectedApp(previousApps.find((app) => app.id === applicationId) || null);
      toast.error(
        followUpError instanceof Error ? followUpError.message : 'Unable to update follow-up'
      );
    }
  };

  const updateApplicationDocument = async (
    applicationId: string,
    documentId: string,
    status: ApplicationDocument['status'],
    options: { fileName?: string; note?: string } = {}
  ) => {
    const previousApps = apps;
    const now = new Date().toISOString();
    const nextApps = apps.map((app) =>
      app.id === applicationId
        ? {
            ...app,
            documents: (app.documents || []).map((document) =>
              document.id === documentId
                ? {
                    ...document,
                    status,
                    fileName: options.fileName || document.fileName,
                    uploadedAt: status === 'uploaded' ? now : document.uploadedAt,
                    verifiedAt: status === 'verified' ? now : document.verifiedAt,
                    rejectedAt: status === 'rejected' ? now : document.rejectedAt,
                    note: options.note || document.note,
                  }
                : document
            ),
            notes: [
              {
                id: `local-doc-${Date.now()}`,
                note: options.note || `Document marked ${status.replace(/_/g, ' ')}`,
                createdAt: now,
                createdBy: 'System',
              },
              ...(app.notes || []),
            ],
          }
        : app
    );
    setApps(nextApps);
    setSelectedApp(nextApps.find((app) => app.id === applicationId) || null);
    try {
      const response = await crmFetch('/api/crm/eligibility-check', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'update_application_document',
          applicationId,
          documentId,
          status,
          fileName: options.fileName,
          note: options.note,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || 'Unable to update document');
      toast.success('Document updated');
    } catch (documentError) {
      setApps(previousApps);
      setSelectedApp(previousApps.find((app) => app.id === applicationId) || null);
      toast.error(
        documentError instanceof Error ? documentError.message : 'Unable to update document'
      );
    }
  };

  return (
    <div className="px-4 lg:px-6 xl:px-8 py-6 max-w-screen-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-700 text-foreground">File Process</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} files — {apps.filter((a) => a.daysPending >= 5).length} require urgent
            attention
          </p>
        </div>
        <Link
          href="/crm/eligibility-check"
          className="flex items-center gap-1.5 h-8 px-3 rounded-sm bg-primary text-primary-foreground text-xs font-600 hover:bg-primary/90 active:scale-95 transition-all duration-150 self-start sm:self-auto"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New File
        </Link>
      </div>

      {applicationLoadError && (
        <div
          role="alert"
          className="mb-4 flex items-center justify-between gap-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>File Process data could not be loaded: {applicationLoadError}</span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="shrink-0 font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {quickFilters.map((pill) => (
          <button
            key={`pill-${pill.label}`}
            onClick={() => {
              const nextFilter = quickStageFilter === pill.key ? 'all' : pill.key;
              setQuickStageFilter(nextFilter);
              setFilterStage(nextFilter);
            }}
            className={[
              'flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-600 transition-all hover:shadow-card',
              pill.color,
              quickStageFilter === pill.key ? `ring-2 ${pill.active}` : '',
            ].join(' ')}
          >
            <span>{pill.label}</span>
            <span className="font-800">{pill.count}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by applicant or App ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-3 rounded-sm border border-input bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <select
          value={filterStage}
          onChange={(e) => {
            setFilterStage(e.target.value);
            setQuickStageFilter(e.target.value);
          }}
          className="h-8 px-2 rounded-sm border border-input bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
        >
          <option value="all">All Stages</option>
          <option value="in_progress">In Progress</option>
          {stageOptions.map((s) => (
            <option key={`fs-${s}`} value={s}>
              {s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>
        <select
          value={filterProduct}
          onChange={(e) => setFilterProduct(e.target.value)}
          className="h-8 px-2 rounded-sm border border-input bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
        >
          <option value="all">All Products</option>
          <option value="home_loan">Home Loan</option>
          <option value="personal_loan">Personal Loan</option>
          <option value="business_loan">Business Loan</option>
          <option value="lap">LAP</option>
          <option value="car_loan">Car Loan</option>
        </select>
        <select
          value={filterLender}
          onChange={(e) => setFilterLender(e.target.value)}
          className="h-8 px-2 rounded-sm border border-input bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
        >
          <option value="all">All Lenders</option>
          {lenders.map((l) => (
            <option key={`fl-${l}`} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-5">
        {/* Table */}
        <div className="flex-1 min-w-0 bg-card rounded-lg border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm min-w-[1100px]">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="px-3 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedRows.length === filtered.length && filtered.length > 0}
                      onChange={toggleAll}
                      className="w-3.5 h-3.5 rounded accent-primary"
                    />
                  </th>
                  {[
                    'File ID',
                    'Applicant',
                    'Product',
                    'Amount',
                    'Lender',
                    'Stage',
                    'Score',
                    'EMI/mo',
                    'Agent',
                    'Follow-up',
                    'Docs',
                    'Days Pending',
                    'Change Lender',
                    '',
                  ].map((col) => (
                    <th
                      key={`app-col-${col}`}
                      className="px-3 py-3 text-left text-[11px] font-600 uppercase tracking-wide text-muted-foreground whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loadingApplications ? (
                  <tr>
                    <td
                      colSpan={15}
                      className="px-4 py-12 text-center text-sm text-muted-foreground"
                    >
                      Loading lender applications…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={15}
                      className="px-4 py-12 text-center text-sm text-muted-foreground"
                    >
                      {applicationLoadError
                        ? 'Applications are unavailable. Retry after the data service recovers.'
                        : 'No files found'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((app) => (
                    <tr
                      key={app.id}
                      className={[
                        'hover:bg-muted/30 transition-colors cursor-pointer group',
                        selectedRows.includes(app.id) ? 'bg-primary/5' : '',
                        selectedApp?.id === app.id
                          ? 'bg-primary/8 border-l-2 border-l-primary'
                          : '',
                      ].join(' ')}
                      onClick={() => setSelectedApp(selectedApp?.id === app.id ? null : app)}
                    >
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(app.id)}
                          onChange={() => toggleRow(app.id)}
                          className="w-3.5 h-3.5 rounded accent-primary"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-[11px] font-700 text-primary font-mono">
                          {app.appId}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div>
                          <p className="text-xs font-600 text-foreground">{app.applicant}</p>
                          <p className="text-[10px] text-muted-foreground">{app.city}</p>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge variant={app.product} size="sm" />
                      </td>
                      <td className="px-3 py-3 text-xs font-700 text-foreground inr-value">
                        {formatINR(app.loanAmount)}
                      </td>
                      <td className="px-3 py-3 text-xs text-foreground font-600 whitespace-nowrap">
                        {app.lender}
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={app.stage}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => {
                            const nextStatus = event.target.value as AppStage;
                            const rejectionReason =
                              nextStatus === 'rejected'
                                ? window.prompt('Lender rejection detail?')?.trim() || ''
                                : '';
                            const rejectionReasonCode =
                              nextStatus === 'rejected'
                                ? window
                                    .prompt(
                                      `Rejection code (${rejectionReasons.map((reason) => reason.code).join(', ')}):`,
                                      rejectionReasons[0]?.code || 'OTHER'
                                    )
                                    ?.trim()
                                    .toUpperCase() || ''
                                : undefined;
                            const sanctionedAmount =
                              nextStatus === 'sanctioned'
                                ? Number(
                                    window.prompt(
                                      'Sanctioned amount (₹):',
                                      String(app.loanAmount)
                                    ) || 0
                                  )
                                : undefined;
                            const approvedRoi =
                              nextStatus === 'sanctioned'
                                ? Number(window.prompt('Approved annual ROI (%):') || 0)
                                : undefined;
                            const approvedTenureMonths =
                              nextStatus === 'sanctioned'
                                ? Number(window.prompt('Approved tenure (months):') || 0)
                                : undefined;
                            const disbursedAmount =
                              nextStatus === 'disbursed'
                                ? Number(
                                    window.prompt(
                                      'Disbursed amount (₹):',
                                      String(app.loanAmount)
                                    ) || 0
                                  )
                                : undefined;
                            if (nextStatus === 'rejected' && !rejectionReason) {
                              toast.error('Rejection detail is required');
                              return;
                            }
                            if (
                              nextStatus === 'rejected' &&
                              !rejectionReasons.some(
                                (reason) => reason.code === rejectionReasonCode
                              )
                            ) {
                              toast.error('Select a valid active rejection reason');
                              return;
                            }
                            if (
                              nextStatus === 'sanctioned' &&
                              (!sanctionedAmount || sanctionedAmount <= 0)
                            ) {
                              toast.error('Valid sanctioned amount is required');
                              return;
                            }
                            if (
                              nextStatus === 'sanctioned' &&
                              (!approvedRoi || approvedRoi <= 0 || approvedRoi > 100)
                            ) {
                              toast.error('Approved ROI must be greater than 0 and at most 100%');
                              return;
                            }
                            if (
                              nextStatus === 'sanctioned' &&
                              (!approvedTenureMonths ||
                                !Number.isInteger(approvedTenureMonths) ||
                                approvedTenureMonths <= 0 ||
                                approvedTenureMonths > 1200)
                            ) {
                              toast.error('Approved tenure must be 1 to 1200 whole months');
                              return;
                            }
                            if (
                              nextStatus === 'disbursed' &&
                              (!disbursedAmount || disbursedAmount <= 0)
                            ) {
                              toast.error('Valid disbursed amount is required');
                              return;
                            }
                            updateApplicationStatus(app.id, nextStatus, {
                              rejectionReason,
                              note: rejectionReason,
                              rejectionReasonCode,
                              sanctionedAmount,
                              disbursedAmount,
                              approvedRoi,
                              approvedTenureMonths,
                            });
                          }}
                          className="h-7 rounded-full border border-border bg-background px-2 text-[10px] font-700 text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                        >
                          {stageOptions
                            .filter(
                              (stage) =>
                                stage === app.stage ||
                                canTransitionLenderApplication(app.stage, stage)
                            )
                            .map((stage) => (
                              <option key={`${app.id}-${stage}`} value={stage}>
                                {stage.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                              </option>
                            ))}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <CIBILBadge score={app.cibil} />
                      </td>
                      <td className="px-3 py-3 text-xs text-foreground font-600 inr-value tabular-nums">
                        {app.emi > 0 ? `₹${app.emi.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {app.assignedAgent.split(' ')[0]}
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {app.followUpDate || '-'}
                      </td>
                      <td className="px-3 py-3">
                        {(() => {
                          const progress = getDocumentProgress(app.documents);
                          return (
                            <span
                              className={[
                                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-700',
                                progress.ready
                                  ? 'bg-success-bg text-success'
                                  : 'bg-warning-bg text-warning',
                              ].join(' ')}
                            >
                              {progress.verified}/{progress.required || 0}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={[
                            'inline-flex items-center justify-center w-7 h-6 rounded-sm text-[10px] font-700',
                            app.daysPending >= 7
                              ? 'bg-danger-bg text-danger'
                              : app.daysPending >= 4
                                ? 'bg-warning-bg text-warning'
                                : 'bg-muted text-muted-foreground',
                          ].join(' ')}
                        >
                          {app.daysPending}d
                        </span>
                      </td>
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        {app.leadId ? (
                          <Link
                            href={`/crm/lender-selection?lead=${encodeURIComponent(app.leadId)}`}
                            className="inline-flex h-7 items-center justify-center rounded-sm border border-border bg-background px-2 text-[10px] font-700 text-foreground hover:bg-muted"
                          >
                            Change
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="w-7 h-7 flex items-center justify-center rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Upload document for this application"
                          >
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                          </button>
                          <button
                            className="w-7 h-7 flex items-center justify-center rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit application details"
                          >
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length} of {apps.length} applications
            </p>
            <div className="flex items-center gap-1">
              {[1, 2].map((p) => (
                <button
                  key={`apppage-${p}`}
                  className={[
                    'w-7 h-7 text-xs font-600 rounded-sm transition-colors',
                    p === 1
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-muted-foreground',
                  ].join(' ')}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Detail panel */}
        {selectedApp && (
          <div className="w-80 shrink-0">
            <ApplicationDetailPanel
              app={selectedApp}
              rejectionReasons={rejectionReasons}
              onClose={() => setSelectedApp(null)}
              onAddNote={addApplicationNote}
              onUpdateFollowUp={updateApplicationFollowUp}
              onUpdateStatus={updateApplicationStatus}
              onUpdateDocument={updateApplicationDocument}
            />
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {selectedRows.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-foreground text-background px-5 py-3 rounded-xl shadow-modal slide-up">
          <span className="text-sm font-600">
            {selectedRows.length} application{selectedRows.length > 1 ? 's' : ''} selected
          </span>
          <div className="w-px h-4 bg-background/20" />
          <button
            className="text-xs font-600 hover:text-accent transition-colors"
            onClick={() => {
              toast.success(`Status updated for ${selectedRows.length} applications`);
              setSelectedRows([]);
            }}
          >
            Update Status
          </button>
          <button
            className="text-xs font-600 hover:text-accent transition-colors"
            onClick={() => {
              toast.success(`Reminder sent for ${selectedRows.length} applications`);
              setSelectedRows([]);
            }}
          >
            Send Reminder
          </button>
          <button
            onClick={() => setSelectedRows([])}
            className="ml-1 text-background/60 hover:text-background transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
