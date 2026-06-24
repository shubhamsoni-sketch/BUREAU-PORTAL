'use client';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import StatusBadge from '@/crm/components/ui/StatusBadge';

import ApplicationDetailPanel from './ApplicationDetailPanel';

type AppStage =
  | 'login_pending'
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'credit_check'
  | 'conditional_approval'
  | 'final_approval'
  | 'disbursal_initiated'
  | 'disbursed'
  | 'rejected';

type ProductType =
  | 'home_loan'
  | 'personal_loan'
  | 'business_loan'
  | 'lap'
  | 'car_loan'
  | 'credit_card';

interface LoanApplication {
  id: string;
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
}

const MOCK_APPS: LoanApplication[] = [
  {
    id: 'app-001',
    appId: 'DSA-HL-2026-0841',
    applicant: 'Ramesh Gupta',
    product: 'home_loan',
    loanAmount: 4200000,
    lender: 'HDFC Bank',
    stage: 'final_approval',
    cibil: 748,
    emi: 34820,
    assignedAgent: 'Priya Sharma',
    lastUpdate: '21 Jun 2026',
    daysPending: 1,
    city: 'Mumbai',
    processingFee: 12600,
    roi: 8.65,
    tenure: 240,
  },
  {
    id: 'app-002',
    appId: 'DSA-PL-2026-0842',
    applicant: 'Neha Kulkarni',
    product: 'personal_loan',
    loanAmount: 850000,
    lender: 'Bajaj Finserv',
    stage: 'disbursed',
    cibil: 792,
    emi: 19240,
    assignedAgent: 'Anil Mehta',
    lastUpdate: '22 Jun 2026',
    daysPending: 0,
    city: 'Pune',
    processingFee: 8500,
    roi: 13.5,
    tenure: 48,
  },
  {
    id: 'app-003',
    appId: 'DSA-BL-2026-0843',
    applicant: 'Suresh Patel',
    product: 'business_loan',
    loanAmount: 2500000,
    lender: 'Tata Capital',
    stage: 'credit_check',
    cibil: 712,
    emi: 56420,
    assignedAgent: 'Priya Sharma',
    lastUpdate: '17 Jun 2026',
    daysPending: 5,
    city: 'Ahmedabad',
    processingFee: 25000,
    roi: 16.0,
    tenure: 60,
  },
  {
    id: 'app-004',
    appId: 'DSA-LAP-2026-0844',
    applicant: 'Kavya Reddy',
    product: 'lap',
    loanAmount: 3800000,
    lender: 'ICICI Bank',
    stage: 'under_review',
    cibil: 731,
    emi: 42180,
    assignedAgent: 'Kavitha Nair',
    lastUpdate: '15 Jun 2026',
    daysPending: 7,
    city: 'Hyderabad',
    processingFee: 19000,
    roi: 9.8,
    tenure: 120,
  },
  {
    id: 'app-005',
    appId: 'DSA-HL-2026-0845',
    applicant: 'Preethi Kumar',
    product: 'home_loan',
    loanAmount: 3200000,
    lender: 'Axis Bank',
    stage: 'conditional_approval',
    cibil: 756,
    emi: 27840,
    assignedAgent: 'Sunita Rao',
    lastUpdate: '19 Jun 2026',
    daysPending: 3,
    city: 'Coimbatore',
    processingFee: 9600,
    roi: 8.9,
    tenure: 180,
  },
  {
    id: 'app-006',
    appId: 'DSA-PL-2026-0846',
    applicant: 'Arjun Sharma',
    product: 'personal_loan',
    loanAmount: 500000,
    lender: 'Kotak Mahindra',
    stage: 'submitted',
    cibil: 681,
    emi: 11820,
    assignedAgent: 'Vikram Joshi',
    lastUpdate: '22 Jun 2026',
    daysPending: 0,
    city: 'Jaipur',
    processingFee: 5000,
    roi: 14.5,
    tenure: 48,
  },
  {
    id: 'app-007',
    appId: 'DSA-BL-2026-0847',
    applicant: 'Fatima Sheikh',
    product: 'business_loan',
    loanAmount: 1200000,
    lender: 'Bajaj Finserv',
    stage: 'disbursal_initiated',
    cibil: 724,
    emi: 27140,
    assignedAgent: 'Kavitha Nair',
    lastUpdate: '21 Jun 2026',
    daysPending: 1,
    city: 'Mumbai',
    processingFee: 12000,
    roi: 15.5,
    tenure: 60,
  },
  {
    id: 'app-008',
    appId: 'DSA-HL-2026-0848',
    applicant: 'Ganesh Iyer',
    product: 'home_loan',
    loanAmount: 6500000,
    lender: 'HDFC Bank',
    stage: 'under_review',
    cibil: 782,
    emi: 53920,
    assignedAgent: 'Anil Mehta',
    lastUpdate: '14 Jun 2026',
    daysPending: 8,
    city: 'Chennai',
    processingFee: 19500,
    roi: 8.5,
    tenure: 240,
  },
  {
    id: 'app-009',
    appId: 'DSA-CAR-2026-0849',
    applicant: 'Anita Singh',
    product: 'car_loan',
    loanAmount: 720000,
    lender: 'Axis Bank',
    stage: 'disbursed',
    cibil: 768,
    emi: 14820,
    assignedAgent: 'Sunita Rao',
    lastUpdate: '22 Jun 2026',
    daysPending: 0,
    city: 'Bangalore',
    processingFee: 3600,
    roi: 9.25,
    tenure: 60,
  },
  {
    id: 'app-010',
    appId: 'DSA-PL-2026-0850',
    applicant: 'Mohan Das',
    product: 'personal_loan',
    loanAmount: 500000,
    lender: 'ICICI Bank',
    stage: 'rejected',
    cibil: 612,
    emi: 0,
    assignedAgent: 'Anil Mehta',
    lastUpdate: '17 Jun 2026',
    daysPending: 5,
    city: 'Delhi',
    processingFee: 0,
    roi: 0,
    tenure: 0,
  },
];

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

export default function LoanApplicationContent() {
  const [apps, setApps] = useState<LoanApplication[]>(MOCK_APPS);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectedApp, setSelectedApp] = useState<LoanApplication | null>(null);
  const [filterStage, setFilterStage] = useState('all');
  const [filterProduct, setFilterProduct] = useState('all');
  const [filterLender, setFilterLender] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const highlightedApplicationId =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('application')
        : '';

    const loadApplications = async () => {
      try {
        const response = await fetch('/api/crm/leads', { cache: 'no-store' });
        const json = await response.json();
        const applications = Array.isArray(json.applications) ? json.applications : [];
        const leads = Array.isArray(json.data) ? json.data : [];
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
          }) => {
            const lead = leads.find((item: { id: string }) => item.id === application.leadId);
            const created = application.createdAt ? new Date(application.createdAt) : new Date();
            const daysPending = Math.max(
              0,
              Math.floor((Date.now() - created.getTime()) / 86400000)
            );
            return {
              id: application.id,
              appId: `DSA-${application.product.replace(/_/g, '').toUpperCase().slice(0, 3)}-${created.getFullYear()}-${application.id.slice(0, 4).toUpperCase()}`,
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
            };
          }
        );
        const nextApps = liveApps.length ? [...liveApps, ...MOCK_APPS] : MOCK_APPS;
        setApps(nextApps);
        if (highlightedApplicationId) {
          const highlightedApp = nextApps.find((app) => app.id === highlightedApplicationId);
          if (highlightedApp) {
            setSelectedApp(highlightedApp);
            setSearch(highlightedApp.applicant);
          }
        }
      } catch {
        setApps(MOCK_APPS);
      }
    };

    loadApplications();
  }, []);

  const lenders = Array.from(new Set(apps.map((a) => a.lender)));

  const filtered = apps.filter((a) => {
    const matchSearch =
      a.applicant.toLowerCase().includes(search.toLowerCase()) ||
      a.appId.toLowerCase().includes(search.toLowerCase());
    const matchStage = filterStage === 'all' || a.stage === filterStage;
    const matchProduct = filterProduct === 'all' || a.product === filterProduct;
    const matchLender = filterLender === 'all' || a.lender === filterLender;
    return matchSearch && matchStage && matchProduct && matchLender;
  });

  const toggleRow = (id: string) =>
    setSelectedRows((p) => (p.includes(id) ? p.filter((r) => r !== id) : [...p, id]));
  const toggleAll = () =>
    setSelectedRows(selectedRows.length === filtered.length ? [] : filtered.map((a) => a.id));

  const stageOptions: AppStage[] = [
    'login_pending',
    'draft',
    'submitted',
    'under_review',
    'credit_check',
    'conditional_approval',
    'final_approval',
    'disbursal_initiated',
    'disbursed',
    'rejected',
  ];

  return (
    <div className="px-4 lg:px-6 xl:px-8 py-6 max-w-screen-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-700 text-foreground">Loan Application Tracking</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} applications — {apps.filter((a) => a.daysPending >= 5).length} require
            urgent attention
          </p>
        </div>
        <button className="flex items-center gap-1.5 h-8 px-3 rounded-sm bg-primary text-primary-foreground text-xs font-600 hover:bg-primary/90 active:scale-95 transition-all duration-150 self-start sm:self-auto">
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
          New Application
        </button>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          {
            label: 'In Progress',
            count: apps.filter((a) => !['disbursed', 'rejected'].includes(a.stage)).length,
            color: 'bg-info-bg text-info border-info/20',
          },
          {
            label: 'Disbursed (MTD)',
            count: apps.filter((a) => a.stage === 'disbursed').length,
            color: 'bg-success-bg text-success border-success/20',
          },
          {
            label: 'Rejected',
            count: apps.filter((a) => a.stage === 'rejected').length,
            color: 'bg-danger-bg text-danger border-danger/20',
          },
          {
            label: 'Login Pending',
            count: apps.filter((a) => a.stage === 'login_pending').length,
            color: 'bg-warning-bg text-warning border-warning/20',
          },
        ].map((pill) => (
          <div
            key={`pill-${pill.label}`}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-600 ${pill.color}`}
          >
            <span>{pill.label}</span>
            <span className="font-800">{pill.count}</span>
          </div>
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
          onChange={(e) => setFilterStage(e.target.value)}
          className="h-8 px-2 rounded-sm border border-input bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
        >
          <option value="all">All Stages</option>
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
                    'App ID',
                    'Applicant',
                    'Product',
                    'Amount',
                    'Lender',
                    'Stage',
                    'Score',
                    'EMI/mo',
                    'Agent',
                    'Days Pending',
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
                {filtered.map((app) => (
                  <tr
                    key={app.id}
                    className={[
                      'hover:bg-muted/30 transition-colors cursor-pointer group',
                      selectedRows.includes(app.id) ? 'bg-primary/5' : '',
                      selectedApp?.id === app.id ? 'bg-primary/8 border-l-2 border-l-primary' : '',
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
                      <StatusBadge variant={app.stage} size="sm" />
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
                ))}
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
            <ApplicationDetailPanel app={selectedApp} onClose={() => setSelectedApp(null)} />
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
