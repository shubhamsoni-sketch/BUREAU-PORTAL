'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Modal from '@/crm/components/ui/Modal';
import StatusBadge from '@/crm/components/ui/StatusBadge';
import AddLeadForm from './AddLeadForm';
import LeadKanban from './LeadKanban';

type LeadStage =
  | 'new'
  | 'contacted'
  | 'eligibility_pending'
  | 'eligibility_done'
  | 'submitted_to_lender'
  | 'sanctioned'
  | 'rejected'
  | 'disbursed'
  | 'lost';
type ProductType =
  | 'home_loan'
  | 'personal_loan'
  | 'business_loan'
  | 'lap'
  | 'car_loan'
  | 'credit_card';
type LeadSource = 'web' | 'reference' | 'walk_in' | 'campaign' | 'social';

export interface Lead {
  id: string;
  name: string;
  mobile: string;
  email: string;
  product: ProductType;
  loanAmount: number;
  source: LeadSource;
  stage: LeadStage;
  assignedAgent: string;
  lastContact: string;
  nextFollowUp: string;
  daysInStage: number;
  city: string;
  notes?: string;
  eligibilityReportId?: string;
  selectedLender?: string;
}

const MOCK_LEADS: Lead[] = [
  {
    id: 'lead-001',
    name: 'Ramesh Gupta',
    mobile: '9876543210',
    email: 'ramesh.g@gmail.com',
    product: 'home_loan',
    loanAmount: 4200000,
    source: 'reference',
    stage: 'eligibility_pending',
    assignedAgent: 'Priya Sharma',
    lastContact: '20 Jun 2026',
    nextFollowUp: '23 Jun 2026',
    daysInStage: 3,
    city: 'Mumbai',
  },
  {
    id: 'lead-002',
    name: 'Neha Kulkarni',
    mobile: '9765432109',
    email: 'neha.k@yahoo.com',
    product: 'personal_loan',
    loanAmount: 850000,
    source: 'web',
    stage: 'eligibility_done',
    assignedAgent: 'Anil Mehta',
    lastContact: '21 Jun 2026',
    nextFollowUp: '22 Jun 2026',
    daysInStage: 1,
    city: 'Pune',
  },
  {
    id: 'lead-003',
    name: 'Suresh Patel',
    mobile: '9654321098',
    email: 'suresh.p@gmail.com',
    product: 'business_loan',
    loanAmount: 2500000,
    source: 'walk_in',
    stage: 'submitted_to_lender',
    assignedAgent: 'Priya Sharma',
    lastContact: '18 Jun 2026',
    nextFollowUp: '22 Jun 2026',
    daysInStage: 4,
    city: 'Ahmedabad',
  },
  {
    id: 'lead-004',
    name: 'Anita Singh',
    mobile: '9543210987',
    email: 'anita.s@outlook.com',
    product: 'car_loan',
    loanAmount: 720000,
    source: 'campaign',
    stage: 'disbursed',
    assignedAgent: 'Sunita Rao',
    lastContact: '22 Jun 2026',
    nextFollowUp: '-',
    daysInStage: 0,
    city: 'Bangalore',
  },
  {
    id: 'lead-005',
    name: 'Deepak Nair',
    mobile: '9432109876',
    email: 'deepak.n@gmail.com',
    product: 'home_loan',
    loanAmount: 5500000,
    source: 'walk_in',
    stage: 'new',
    assignedAgent: 'Vikram Joshi',
    lastContact: '22 Jun 2026',
    nextFollowUp: '24 Jun 2026',
    daysInStage: 0,
    city: 'Chennai',
  },
  {
    id: 'lead-006',
    name: 'Kavya Reddy',
    mobile: '9321098765',
    email: 'kavya.r@gmail.com',
    product: 'lap',
    loanAmount: 3800000,
    source: 'reference',
    stage: 'eligibility_pending',
    assignedAgent: 'Kavitha Nair',
    lastContact: '19 Jun 2026',
    nextFollowUp: '23 Jun 2026',
    daysInStage: 5,
    city: 'Hyderabad',
  },
  {
    id: 'lead-007',
    name: 'Mohan Das',
    mobile: '9210987654',
    email: 'mohan.d@gmail.com',
    product: 'personal_loan',
    loanAmount: 500000,
    source: 'web',
    stage: 'rejected',
    assignedAgent: 'Anil Mehta',
    lastContact: '17 Jun 2026',
    nextFollowUp: '-',
    daysInStage: 5,
    city: 'Delhi',
  },
  {
    id: 'lead-008',
    name: 'Ravi Desai',
    mobile: '9109876543',
    email: 'ravi.d@gmail.com',
    product: 'business_loan',
    loanAmount: 1800000,
    source: 'social',
    stage: 'contacted',
    assignedAgent: 'Vikram Joshi',
    lastContact: '20 Jun 2026',
    nextFollowUp: '23 Jun 2026',
    daysInStage: 2,
    city: 'Surat',
  },
  {
    id: 'lead-009',
    name: 'Preethi Kumar',
    mobile: '9098765432',
    email: 'preethi.k@gmail.com',
    product: 'home_loan',
    loanAmount: 3200000,
    source: 'campaign',
    stage: 'submitted_to_lender',
    assignedAgent: 'Sunita Rao',
    lastContact: '21 Jun 2026',
    nextFollowUp: '25 Jun 2026',
    daysInStage: 6,
    city: 'Coimbatore',
  },
  {
    id: 'lead-010',
    name: 'Arjun Sharma',
    mobile: '9987654321',
    email: 'arjun.s@gmail.com',
    product: 'credit_card',
    loanAmount: 200000,
    source: 'web',
    stage: 'new',
    assignedAgent: 'Priya Sharma',
    lastContact: '22 Jun 2026',
    nextFollowUp: '24 Jun 2026',
    daysInStage: 0,
    city: 'Jaipur',
  },
  {
    id: 'lead-011',
    name: 'Fatima Sheikh',
    mobile: '9876512345',
    email: 'fatima.s@gmail.com',
    product: 'business_loan',
    loanAmount: 1200000,
    source: 'reference',
    stage: 'eligibility_pending',
    assignedAgent: 'Kavitha Nair',
    lastContact: '20 Jun 2026',
    nextFollowUp: '23 Jun 2026',
    daysInStage: 3,
    city: 'Mumbai',
  },
  {
    id: 'lead-012',
    name: 'Ganesh Iyer',
    mobile: '9765123456',
    email: 'ganesh.i@gmail.com',
    product: 'home_loan',
    loanAmount: 6500000,
    source: 'reference',
    stage: 'eligibility_pending',
    assignedAgent: 'Anil Mehta',
    lastContact: '21 Jun 2026',
    nextFollowUp: '24 Jun 2026',
    daysInStage: 1,
    city: 'Chennai',
  },
];

const PRODUCT_LABELS: Record<ProductType, string> = {
  home_loan: 'Home Loan',
  personal_loan: 'Personal Loan',
  business_loan: 'Business Loan',
  lap: 'LAP',
  car_loan: 'Car Loan',
  credit_card: 'Credit Card',
};

const formatINR = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${(n / 1000).toFixed(0)}K`;
};

export default function LeadManagementContent() {
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [filterProduct, setFilterProduct] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [filterAgent, setFilterAgent] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [stageDropdownId, setStageDropdownId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'done' | 'error'>(
    'idle'
  );
  const [uploadCount, setUploadCount] = useState(0);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/crm/leads', { cache: 'no-store' });
      const json = await response.json();
      if (json.success && Array.isArray(json.data)) setLeads(json.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const stageOptions: LeadStage[] = [
    'new',
    'contacted',
    'eligibility_pending',
    'eligibility_done',
    'submitted_to_lender',
    'sanctioned',
    'rejected',
    'disbursed',
    'lost',
  ];
  const agents = Array.from(new Set(leads.map((l) => l.assignedAgent)));

  const filtered = leads.filter((l) => {
    const matchSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) || l.mobile.includes(search);
    const matchProduct = filterProduct === 'all' || l.product === filterProduct;
    const matchStage = filterStage === 'all' || l.stage === filterStage;
    const matchAgent = filterAgent === 'all' || l.assignedAgent === filterAgent;
    return matchSearch && matchProduct && matchStage && matchAgent;
  });

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    setSelectedRows(selectedRows.length === filtered.length ? [] : filtered.map((l) => l.id));
  };

  const changeStage = (leadId: string, newStage: LeadStage) => {
    const lead = leads.find((item) => item.id === leadId);
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage: newStage, daysInStage: 0 } : l))
    );
    if (lead) {
      fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...lead, stage: newStage, daysInStage: 0 }),
      }).catch(() => undefined);
    }
    setStageDropdownId(null);
  };

  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (
      file &&
      (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))
    ) {
      setUploadedFile(file);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file);
  };

  const handleBulkUpload = async () => {
    if (!uploadedFile) return;
    setUploadStatus('processing');
    await new Promise((r) => setTimeout(r, 1500));
    // Simulate parsing — in production, parse CSV/XLSX and POST to API
    const count = Math.floor(Math.random() * 20) + 5;
    setUploadCount(count);
    setUploadStatus('done');
  };

  const closeBulkUpload = () => {
    setBulkUploadOpen(false);
    setUploadedFile(null);
    setUploadStatus('idle');
    setUploadCount(0);
  };

  return (
    <div className="px-4 lg:px-6 xl:px-8 py-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-700 text-foreground">Lead Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading
              ? 'Loading leads...'
              : `${filtered.length} leads — ${leads.filter((l) => l.stage === 'new').length} new today`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div className="flex items-center rounded-sm border border-border bg-muted p-0.5">
            {(['table', 'kanban'] as const).map((v) => (
              <button
                key={`view-${v}`}
                onClick={() => setView(v)}
                className={[
                  'px-3 py-1.5 text-xs font-600 rounded-sm transition-all duration-150',
                  view === v
                    ? 'bg-card text-foreground shadow-card'
                    : 'text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                {v === 'table' ? (
                  <span className="flex items-center gap-1">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 9h18M9 21V9" />
                    </svg>
                    Table
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="3" width="5" height="18" rx="1" />
                      <rect x="10" y="3" width="5" height="18" rx="1" />
                      <rect x="17" y="3" width="5" height="18" rx="1" />
                    </svg>
                    Kanban
                  </span>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={() => setBulkUploadOpen(true)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-sm border border-border bg-card text-xs font-600 text-foreground hover:bg-muted active:scale-95 transition-all duration-150"
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
            Bulk Upload
          </button>
          <button
            onClick={() => setAddLeadOpen(true)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-sm bg-primary text-primary-foreground text-xs font-600 hover:bg-primary/90 active:scale-95 transition-all duration-150"
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
            Add Lead
          </button>
        </div>
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
            placeholder="Search by name or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-3 rounded-sm border border-input bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <select
          value={filterProduct}
          onChange={(e) => setFilterProduct(e.target.value)}
          className="h-8 px-2 rounded-sm border border-input bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
        >
          <option value="all">All Products</option>
          {(Object.keys(PRODUCT_LABELS) as ProductType[]).map((p) => (
            <option key={`prod-${p}`} value={p}>
              {PRODUCT_LABELS[p]}
            </option>
          ))}
        </select>
        <select
          value={filterStage}
          onChange={(e) => setFilterStage(e.target.value)}
          className="h-8 px-2 rounded-sm border border-input bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
        >
          <option value="all">All Stages</option>
          {stageOptions.map((s) => (
            <option key={`stage-${s}`} value={s}>
              {s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>
        <select
          value={filterAgent}
          onChange={(e) => setFilterAgent(e.target.value)}
          className="h-8 px-2 rounded-sm border border-input bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
        >
          <option value="all">All Agents</option>
          {agents.map((a) => (
            <option key={`agent-filter-${a}`} value={a}>
              {a}
            </option>
          ))}
        </select>
        {(filterProduct !== 'all' || filterStage !== 'all' || filterAgent !== 'all' || search) && (
          <button
            onClick={() => {
              setFilterProduct('all');
              setFilterStage('all');
              setFilterAgent('all');
              setSearch('');
            }}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground border border-border rounded-sm hover:bg-muted transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {view === 'kanban' ? (
        <LeadKanban leads={filtered} onStageChange={changeStage} />
      ) : (
        <>
          <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    <th className="px-4 py-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={selectedRows.length === filtered.length && filtered.length > 0}
                        onChange={toggleAll}
                        className="w-3.5 h-3.5 rounded accent-primary"
                      />
                    </th>
                    {[
                      'Lead',
                      'Mobile',
                      'Product',
                      'Loan Amount',
                      'Source',
                      'Stage',
                      'Assigned To',
                      'Last Contact',
                      'Next Follow-up',
                      'Days in Stage',
                      '',
                    ].map((col) => (
                      <th
                        key={`th-${col}`}
                        className="px-4 py-3 text-left text-[11px] font-600 uppercase tracking-wide text-muted-foreground whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={11}
                        className="px-4 py-12 text-center text-sm text-muted-foreground"
                      >
                        No leads match the current filters
                      </td>
                    </tr>
                  ) : (
                    filtered.map((lead) => (
                      <tr
                        key={lead.id}
                        className={[
                          'hover:bg-muted/30 transition-colors group',
                          selectedRows.includes(lead.id) ? 'bg-primary/5' : '',
                        ].join(' ')}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(lead.id)}
                            onChange={() => toggleRow(lead.id)}
                            className="w-3.5 h-3.5 rounded accent-primary"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-600 text-foreground text-xs">{lead.name}</p>
                            <p className="text-[10px] text-muted-foreground">{lead.city}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                          {lead.mobile}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge variant={lead.product} size="sm" />
                        </td>
                        <td className="px-4 py-3 text-xs font-700 text-foreground inr-value">
                          {formatINR(lead.loanAmount)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge variant={lead.source} size="sm" />
                        </td>
                        <td className="px-4 py-3 relative">
                          <button
                            onClick={() =>
                              setStageDropdownId(stageDropdownId === lead.id ? null : lead.id)
                            }
                            className="cursor-pointer"
                          >
                            <StatusBadge variant={lead.stage} size="sm" />
                          </button>
                          {stageDropdownId === lead.id && (
                            <div className="absolute left-0 top-full mt-1 z-20 bg-card border border-border rounded-lg shadow-modal w-44 py-1 scale-in">
                              {stageOptions.map((s) => (
                                <button
                                  key={`stage-opt-${s}`}
                                  onClick={() => changeStage(lead.id, s)}
                                  className={[
                                    'w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors',
                                    s === lead.stage ? 'font-700 text-primary' : 'text-foreground',
                                  ].join(' ')}
                                >
                                  {s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {lead.assignedAgent}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {lead.lastContact}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {lead.nextFollowUp}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={[
                              'text-xs font-700 tabular-nums',
                              lead.daysInStage > 7
                                ? 'text-danger'
                                : lead.daysInStage > 3
                                  ? 'text-warning'
                                  : 'text-muted-foreground',
                            ].join(' ')}
                          >
                            {lead.daysInStage}d
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              className="w-7 h-7 flex items-center justify-center rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              title="Edit lead"
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
          </div>
          {selectedRows.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-foreground text-background px-4 py-2.5 rounded-lg shadow-modal text-sm font-600 z-30 fade-in">
              <span>{selectedRows.length} leads selected</span>
              <button
                onClick={() => setSelectedRows([])}
                className="text-background/60 hover:text-background transition-colors text-xs"
              >
                Clear
              </button>
            </div>
          )}
        </>
      )}

      {/* Add Lead Modal */}
      <Modal
        isOpen={addLeadOpen}
        onClose={() => setAddLeadOpen(false)}
        title="Add New Lead"
        size="lg"
      >
        <AddLeadForm
          onSuccess={() => {
            setAddLeadOpen(false);
            loadLeads();
          }}
          onCancel={() => setAddLeadOpen(false)}
        />
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal isOpen={bulkUploadOpen} onClose={closeBulkUpload} title="Bulk Lead Upload" size="md">
        <div className="space-y-4">
          {uploadStatus === 'done' ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--success)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-lg font-700 text-foreground">{uploadCount} leads imported!</p>
              <p className="text-sm text-muted-foreground">
                All leads have been added to the pipeline and assigned for review.
              </p>
              <button
                onClick={closeBulkUpload}
                className="h-9 px-5 rounded-sm bg-primary text-primary-foreground text-sm font-700 hover:bg-primary/90 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="bg-muted/40 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-700 text-foreground text-sm">File format requirements</p>
                <p>
                  • Accepted formats:{' '}
                  <span className="font-600 text-foreground">.csv, .xlsx, .xls</span>
                </p>
                <p>
                  • Required columns:{' '}
                  <span className="font-600 text-foreground">
                    Name, Mobile, Email, City, Product, Loan Amount, Source
                  </span>
                </p>
                <p>
                  • Maximum rows:{' '}
                  <span className="font-600 text-foreground">500 leads per upload</span>
                </p>
              </div>

              <div
                onDrop={handleFileDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                className={[
                  'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                  dragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50',
                ].join(' ')}
              >
                {uploadedFile ? (
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mx-auto">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--success)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <p className="text-sm font-700 text-foreground">{uploadedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </p>
                    <button
                      onClick={() => setUploadedFile(null)}
                      className="text-xs text-danger hover:underline"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mx-auto">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-muted-foreground"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-600 text-foreground">Drag & drop your file here</p>
                      <p className="text-xs text-muted-foreground mt-0.5">or click to browse</p>
                    </div>
                    <label className="inline-flex items-center gap-1.5 h-8 px-3 rounded-sm border border-border text-xs font-600 text-foreground hover:bg-muted cursor-pointer transition-colors">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Browse File
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  onClick={closeBulkUpload}
                  className="h-9 px-4 rounded-sm border border-border text-sm font-600 text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkUpload}
                  disabled={!uploadedFile || uploadStatus === 'processing'}
                  className="h-9 px-5 rounded-sm bg-primary text-primary-foreground text-sm font-700 hover:bg-primary/90 active:scale-95 transition-all duration-150 disabled:opacity-60 flex items-center gap-2"
                >
                  {uploadStatus === 'processing' ? (
                    <>
                      <svg
                        className="animate-spin"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Upload & Import'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
