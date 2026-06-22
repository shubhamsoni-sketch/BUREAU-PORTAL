'use client';
import React, { useState } from 'react';
import Modal from '@/crm/components/ui/Modal';
import StatusBadge from '@/crm/components/ui/StatusBadge';

interface Lender {
  id: string;
  name: string;
  type: 'bank' | 'nbfc';
  products: string[];
  roiMin: number;
  roiMax: number;
  maxLoan: number;
  processingFee: string;
  approvalRate: number;
  activeApps: number;
  scoreCutoff: number;
  maxTenure: number;
  foirLimit: number;
  ltvMax: number;
  status: 'active' | 'inactive';
  contact: string;
  rm: string;
  avgTat: string;
}

const MOCK_LENDERS: Lender[] = [
  {
    id: 'lndr-001',
    name: 'HDFC Bank',
    type: 'bank',
    products: ['home_loan', 'lap', 'personal_loan'],
    roiMin: 8.5,
    roiMax: 12.0,
    maxLoan: 100000000,
    processingFee: '0.50%',
    approvalRate: 84.2,
    activeApps: 28,
    scoreCutoff: 700,
    maxTenure: 360,
    foirLimit: 55,
    ltvMax: 80,
    status: 'active',
    contact: '+91 22 6652 6652',
    rm: 'Sunil Kapoor',
    avgTat: '4–6 days',
  },
  {
    id: 'lndr-002',
    name: 'ICICI Bank',
    type: 'bank',
    products: ['home_loan', 'personal_loan', 'car_loan', 'business_loan'],
    roiMin: 8.75,
    roiMax: 13.5,
    maxLoan: 50000000,
    processingFee: '0.50%',
    approvalRate: 78.6,
    activeApps: 19,
    scoreCutoff: 700,
    maxTenure: 300,
    foirLimit: 50,
    ltvMax: 75,
    status: 'active',
    contact: '+91 22 2653 1414',
    rm: 'Meera Pillai',
    avgTat: '5–7 days',
  },
  {
    id: 'lndr-003',
    name: 'Bajaj Finserv',
    type: 'nbfc',
    products: ['personal_loan', 'business_loan'],
    roiMin: 11.0,
    roiMax: 24.0,
    maxLoan: 4000000,
    processingFee: '1.00–3.00%',
    approvalRate: 91.4,
    activeApps: 34,
    scoreCutoff: 685,
    maxTenure: 84,
    foirLimit: 60,
    ltvMax: 0,
    status: 'active',
    contact: '+91 20 3957 5152',
    rm: 'Rohit Sharma',
    avgTat: '1–2 days',
  },
  {
    id: 'lndr-004',
    name: 'Axis Bank',
    type: 'bank',
    products: ['home_loan', 'car_loan', 'personal_loan', 'lap'],
    roiMin: 8.75,
    roiMax: 14.0,
    maxLoan: 50000000,
    processingFee: '0.25–1.00%',
    approvalRate: 76.3,
    activeApps: 14,
    scoreCutoff: 710,
    maxTenure: 300,
    foirLimit: 50,
    ltvMax: 80,
    status: 'active',
    contact: '+91 22 2425 2525',
    rm: 'Deepa Venkat',
    avgTat: '5–8 days',
  },
  {
    id: 'lndr-005',
    name: 'Kotak Mahindra Bank',
    type: 'bank',
    products: ['home_loan', 'personal_loan', 'business_loan'],
    roiMin: 8.7,
    roiMax: 16.0,
    maxLoan: 75000000,
    processingFee: '0.50%',
    approvalRate: 72.1,
    activeApps: 11,
    scoreCutoff: 720,
    maxTenure: 240,
    foirLimit: 45,
    ltvMax: 80,
    status: 'active',
    contact: '+91 22 6166 0001',
    rm: 'Anand Nair',
    avgTat: '6–9 days',
  },
  {
    id: 'lndr-006',
    name: 'Tata Capital',
    type: 'nbfc',
    products: ['business_loan', 'personal_loan', 'lap'],
    roiMin: 10.99,
    roiMax: 18.0,
    maxLoan: 30000000,
    processingFee: '1.50–2.50%',
    approvalRate: 82.7,
    activeApps: 22,
    scoreCutoff: 680,
    maxTenure: 120,
    foirLimit: 55,
    ltvMax: 70,
    status: 'active',
    contact: '+91 22 6606 5100',
    rm: 'Priya Bhat',
    avgTat: '3–5 days',
  },
  {
    id: 'lndr-007',
    name: 'Fullerton India',
    type: 'nbfc',
    products: ['personal_loan', 'business_loan'],
    roiMin: 14.0,
    roiMax: 24.0,
    maxLoan: 2500000,
    processingFee: '2.00–3.00%',
    approvalRate: 88.9,
    activeApps: 9,
    scoreCutoff: 650,
    maxTenure: 60,
    foirLimit: 65,
    ltvMax: 0,
    status: 'active',
    contact: '+91 44 6656 0000',
    rm: 'Kiran Rao',
    avgTat: '1–2 days',
  },
  {
    id: 'lndr-008',
    name: 'Piramal Finance',
    type: 'nbfc',
    products: ['home_loan', 'lap'],
    roiMin: 9.5,
    roiMax: 15.0,
    maxLoan: 50000000,
    processingFee: '1.00–2.00%',
    approvalRate: 69.4,
    activeApps: 6,
    scoreCutoff: 660,
    maxTenure: 240,
    foirLimit: 55,
    ltvMax: 75,
    status: 'inactive',
    contact: '+91 22 3046 6300',
    rm: 'Sanjay Mehta',
    avgTat: '7–10 days',
  },
];

const PRODUCT_LABEL_MAP: Record<string, string> = {
  home_loan: 'Home Loan',
  personal_loan: 'Personal Loan',
  business_loan: 'Business Loan',
  lap: 'LAP',
  car_loan: 'Car Loan',
  credit_card: 'Credit Card',
};

const ALL_PRODUCTS = Object.keys(PRODUCT_LABEL_MAP);

const formatCr = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(0)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(0)}L`;
  return `₹${n}`;
};

const emptyForm = {
  name: '',
  type: "bank' as 'bank' | 'nbfc",
  products: [] as string[],
  roiMin: '',
  roiMax: '',
  maxLoan: '',
  processingFee: '',
  scoreCutoff: '',
  maxTenure: '',
  foirLimit: '',
  ltvMax: '',
  contact: '',
  rm: '',
  avgTat: '',
  status: "active' as 'active' | 'inactive",
};

export default function LenderManagementContent() {
  const [lenders, setLenders] = useState<Lender[]>(MOCK_LENDERS);
  const [selectedLender, setSelectedLender] = useState<Lender | null>(null);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterProduct, setFilterProduct] = useState('all');
  const [search, setSearch] = useState('');
  const [lenderFormOpen, setLenderFormOpen] = useState(false);
  const [editLender, setEditLender] = useState<Lender | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = lenders.filter((l) => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || l.type === filterType;
    const matchProduct = filterProduct === 'all' || l.products.includes(filterProduct);
    return matchSearch && matchType && matchProduct;
  });

  const toggleCompare = (id: string) => {
    setCompareList((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const compareLenders = lenders.filter((l) => compareList.includes(l.id));

  const openAdd = () => {
    setEditLender(null);
    setForm(emptyForm);
    setErrors({});
    setLenderFormOpen(true);
  };

  const openEdit = (l: Lender) => {
    setEditLender(l);
    setForm({
      name: l.name,
      type: l.type,
      products: l.products,
      roiMin: String(l.roiMin),
      roiMax: String(l.roiMax),
      maxLoan: String(l.maxLoan),
      processingFee: l.processingFee,
      scoreCutoff: String(l.scoreCutoff),
      maxTenure: String(l.maxTenure),
      foirLimit: String(l.foirLimit),
      ltvMax: String(l.ltvMax),
      contact: l.contact,
      rm: l.rm,
      avgTat: l.avgTat,
      status: l.status,
    });
    setErrors({});
    setLenderFormOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Lender name is required';
    if (!form.roiMin || isNaN(Number(form.roiMin))) e.roiMin = 'Valid ROI min required';
    if (!form.roiMax || isNaN(Number(form.roiMax))) e.roiMax = 'Valid ROI max required';
    if (!form.maxLoan || isNaN(Number(form.maxLoan))) e.maxLoan = 'Valid max loan required';
    if (!form.rm.trim()) e.rm = 'RM name is required';
    if (form.products.length === 0) e.products = 'Select at least one product';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    const lenderData: Omit<Lender, 'id'> = {
      name: form.name,
      type: form.type as Lender['type'],
      products: form.products,
      roiMin: Number(form.roiMin),
      roiMax: Number(form.roiMax),
      maxLoan: Number(form.maxLoan),
      processingFee: form.processingFee,
      approvalRate: editLender?.approvalRate ?? 75,
      activeApps: editLender?.activeApps ?? 0,
      scoreCutoff: Number(form.scoreCutoff) || 700,
      maxTenure: Number(form.maxTenure) || 120,
      foirLimit: Number(form.foirLimit) || 50,
      ltvMax: Number(form.ltvMax) || 0,
      contact: form.contact,
      rm: form.rm,
      avgTat: form.avgTat,
      status: form.status as Lender['status'],
    };
    if (editLender) {
      setLenders((prev) => prev.map((l) => (l.id === editLender.id ? { ...l, ...lenderData } : l)));
    } else {
      setLenders((prev) => [{ id: `lndr-${Date.now()}`, ...lenderData }, ...prev]);
    }
    setSaving(false);
    setLenderFormOpen(false);
  };

  const toggleProduct = (p: string) => {
    setForm((prev) => ({
      ...prev,
      products: prev.products.includes(p)
        ? prev.products.filter((x) => x !== p)
        : [...prev.products, p],
    }));
  };

  return (
    <div className="px-4 lg:px-6 xl:px-8 py-6 max-w-screen-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-700 text-foreground">Lender Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lenders.filter((l) => l.status === 'active').length} active lenders —{' '}
            {lenders.reduce((s, l) => s + l.activeApps, 0)} live applications
          </p>
        </div>
        <div className="flex items-center gap-2">
          {compareList.length >= 2 && (
            <button
              onClick={() => setCompareOpen(true)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-sm bg-accent text-accent-foreground text-xs font-700 hover:bg-accent/90 active:scale-95 transition-all duration-150"
            >
              Compare {compareList.length} Lenders
            </button>
          )}
          <button
            onClick={openAdd}
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
            Add Lender
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
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search lender name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-3 rounded-sm border border-input bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-8 px-2 rounded-sm border border-input bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
        >
          <option value="all">All Types</option>
          <option value="bank">Banks</option>
          <option value="nbfc">NBFCs</option>
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
        {compareList.length > 0 && (
          <button
            onClick={() => setCompareList([])}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground border border-border rounded-sm hover:bg-muted transition-colors"
          >
            Clear compare ({compareList.length})
          </button>
        )}
      </div>

      <div className="flex gap-5">
        {/* Lender table */}
        <div className="flex-1 min-w-0 bg-card rounded-lg border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="px-3 py-3 w-8" />
                  {[
                    'Lender',
                    'Type',
                    'Products',
                    'ROI Range',
                    'Max Loan',
                    'Processing Fee',
                    'Approval Rate',
                    'Active Apps',
                    'Status',
                    '',
                  ].map((col) => (
                    <th
                      key={`lcol-${col}`}
                      className="px-3 py-3 text-left text-[11px] font-600 uppercase tracking-wide text-muted-foreground whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((lender) => (
                  <tr
                    key={lender.id}
                    className={[
                      'hover:bg-muted/30 transition-colors cursor-pointer group',
                      selectedLender?.id === lender.id ? 'bg-primary/5' : '',
                    ].join(' ')}
                    onClick={() =>
                      setSelectedLender(selectedLender?.id === lender.id ? null : lender)
                    }
                  >
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={compareList.includes(lender.id)}
                        onChange={() => toggleCompare(lender.id)}
                        className="w-3.5 h-3.5 rounded accent-primary"
                        title="Add to comparison"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-sm bg-primary/10 flex items-center justify-center shrink-0">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--primary)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-700 text-foreground">{lender.name}</p>
                          <p className="text-[10px] text-muted-foreground">RM: {lender.rm}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge variant={lender.type} size="sm" />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {lender.products.slice(0, 2).map((p) => (
                          <StatusBadge
                            key={`lp-${lender.id}-${p}`}
                            variant={p as Parameters<typeof StatusBadge>[0]['variant']}
                            size="sm"
                          />
                        ))}
                        {lender.products.length > 2 && (
                          <span className="text-[10px] text-muted-foreground font-600">
                            +{lender.products.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs font-600 text-foreground tabular-nums">
                      {lender.roiMin}–{lender.roiMax}%
                    </td>
                    <td className="px-3 py-3 text-xs font-700 text-foreground inr-value">
                      {formatCr(lender.maxLoan)}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {lender.processingFee}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1 rounded-full bg-border overflow-hidden min-w-[40px]">
                          <div
                            className={[
                              'h-full rounded-full',
                              lender.approvalRate >= 80
                                ? 'bg-success'
                                : lender.approvalRate >= 70
                                  ? 'bg-warning'
                                  : 'bg-danger',
                            ].join(' ')}
                            style={{ width: `${lender.approvalRate}%` }}
                          />
                        </div>
                        <span
                          className={[
                            'text-xs font-700 tabular-nums',
                            lender.approvalRate >= 80
                              ? 'text-success'
                              : lender.approvalRate >= 70
                                ? 'text-warning'
                                : 'text-danger',
                          ].join(' ')}
                        >
                          {lender.approvalRate}%
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs font-700 text-foreground tabular-nums">
                      {lender.activeApps}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge variant={lender.status} size="sm" />
                    </td>
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(lender)}
                          className="w-7 h-7 flex items-center justify-center rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit lender"
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
        </div>

        {/* Lender detail drawer */}
        {selectedLender && (
          <div className="w-72 shrink-0 fade-in">
            <div className="bg-card rounded-lg border border-border shadow-card sticky top-0">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <p className="text-sm font-700 text-foreground">{selectedLender.name}</p>
                <button
                  onClick={() => setSelectedLender(null)}
                  className="w-6 h-6 flex items-center justify-center rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg
                    width="12"
                    height="12"
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
              <div className="p-4 space-y-4 overflow-y-auto scrollbar-thin max-h-[70vh]">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge variant={selectedLender.type} />
                  <StatusBadge variant={selectedLender.status} size="sm" />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-700 uppercase tracking-wider text-muted-foreground">
                    Loan Products
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedLender.products.map((p) => (
                      <StatusBadge
                        key={`drawer-p-${p}`}
                        variant={p as Parameters<typeof StatusBadge>[0]['variant']}
                        size="sm"
                      />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      label: 'ROI Range',
                      value: `${selectedLender.roiMin}–${selectedLender.roiMax}% p.a.`,
                    },
                    { label: 'Max Loan', value: formatCr(selectedLender.maxLoan) },
                    { label: 'Max Tenure', value: `${selectedLender.maxTenure} months` },
                    { label: 'Processing Fee', value: selectedLender.processingFee },
                    { label: 'Score Cutoff', value: `${selectedLender.scoreCutoff}+` },
                    { label: 'FOIR Limit', value: `${selectedLender.foirLimit}%` },
                    {
                      label: 'Max LTV',
                      value: selectedLender.ltvMax > 0 ? `${selectedLender.ltvMax}%` : 'N/A',
                    },
                    { label: 'Avg TAT', value: selectedLender.avgTat },
                  ].map((item) => (
                    <div key={item.label} className="bg-muted/40 rounded-sm p-2">
                      <p className="text-[10px] text-muted-foreground">{item.label}</p>
                      <p className="text-xs font-700 text-foreground mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-700 uppercase tracking-wider text-muted-foreground">
                    Contact
                  </p>
                  <p className="text-xs text-foreground">{selectedLender.contact}</p>
                  <p className="text-xs text-muted-foreground">RM: {selectedLender.rm}</p>
                </div>
                <button
                  onClick={() => openEdit(selectedLender)}
                  className="w-full h-8 rounded-sm border border-border text-xs font-600 text-foreground hover:bg-muted transition-colors"
                >
                  Edit Lender
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compare Modal */}
      <Modal
        isOpen={compareOpen}
        onClose={() => setCompareOpen(false)}
        title={`Comparing ${compareLenders.length} Lenders`}
        size="lg"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pr-4 text-left text-muted-foreground font-600 w-32">
                  Parameter
                </th>
                {compareLenders.map((l) => (
                  <th key={l.id} className="py-2 px-3 text-left font-700 text-foreground">
                    {l.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                { label: 'Type', fn: (l: Lender) => l.type.toUpperCase() },
                { label: 'ROI Range', fn: (l: Lender) => `${l.roiMin}–${l.roiMax}%` },
                { label: 'Max Loan', fn: (l: Lender) => formatCr(l.maxLoan) },
                { label: 'Processing Fee', fn: (l: Lender) => l.processingFee },
                { label: 'Approval Rate', fn: (l: Lender) => `${l.approvalRate}%` },
                { label: 'Score Cutoff', fn: (l: Lender) => `${l.scoreCutoff}+` },
                { label: 'Max Tenure', fn: (l: Lender) => `${l.maxTenure} months` },
                { label: 'FOIR Limit', fn: (l: Lender) => `${l.foirLimit}%` },
                { label: 'Avg TAT', fn: (l: Lender) => l.avgTat },
              ].map((row) => (
                <tr key={row.label} className="hover:bg-muted/30">
                  <td className="py-2 pr-4 text-muted-foreground font-600">{row.label}</td>
                  {compareLenders.map((l) => (
                    <td key={l.id} className="py-2 px-3 font-600 text-foreground">
                      {row.fn(l)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Add/Edit Lender Modal */}
      <Modal
        isOpen={lenderFormOpen}
        onClose={() => setLenderFormOpen(false)}
        title={editLender ? 'Edit Lender' : 'Add New Lender'}
        size="lg"
      >
        <div className="space-y-5">
          {/* Basic Info */}
          <div>
            <h3 className="text-xs font-700 uppercase tracking-wider text-muted-foreground mb-3 pb-2 border-b border-border">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-600 text-foreground">
                  Lender Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="HDFC Bank"
                  className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
                {errors.name && <p className="text-xs text-danger">{errors.name}</p>}
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-600 text-foreground">
                  Type <span className="text-danger">*</span>
                </label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, type: e.target.value as 'bank' | 'nbfc' }))
                  }
                  className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                >
                  <option value="bank">Bank</option>
                  <option value="nbfc">NBFC</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-600 text-foreground">
                  Relationship Manager <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={form.rm}
                  onChange={(e) => setForm((p) => ({ ...p, rm: e.target.value }))}
                  placeholder="Sunil Kapoor"
                  className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
                {errors.rm && <p className="text-xs text-danger">{errors.rm}</p>}
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-600 text-foreground">Contact Number</label>
                <input
                  type="text"
                  value={form.contact}
                  onChange={(e) => setForm((p) => ({ ...p, contact: e.target.value }))}
                  placeholder="+91 22 6652 6652"
                  className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-xs font-700 uppercase tracking-wider text-muted-foreground mb-3 pb-2 border-b border-border">
              Loan Products <span className="text-danger">*</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {ALL_PRODUCTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => toggleProduct(p)}
                  className={[
                    'px-3 py-1.5 rounded-sm text-xs font-600 border transition-colors',
                    form.products.includes(p)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
                  ].join(' ')}
                >
                  {PRODUCT_LABEL_MAP[p]}
                </button>
              ))}
            </div>
            {errors.products && <p className="text-xs text-danger mt-1">{errors.products}</p>}
          </div>

          {/* Rates */}
          <div>
            <h3 className="text-xs font-700 uppercase tracking-wider text-muted-foreground mb-3 pb-2 border-b border-border">
              Rates & Limits
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-600 text-foreground">
                  ROI Min (%) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.roiMin}
                  onChange={(e) => setForm((p) => ({ ...p, roiMin: e.target.value }))}
                  placeholder="8.5"
                  className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
                {errors.roiMin && <p className="text-xs text-danger">{errors.roiMin}</p>}
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-600 text-foreground">
                  ROI Max (%) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.roiMax}
                  onChange={(e) => setForm((p) => ({ ...p, roiMax: e.target.value }))}
                  placeholder="12.0"
                  className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
                {errors.roiMax && <p className="text-xs text-danger">{errors.roiMax}</p>}
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-600 text-foreground">
                  Max Loan (₹) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  value={form.maxLoan}
                  onChange={(e) => setForm((p) => ({ ...p, maxLoan: e.target.value }))}
                  placeholder="10000000"
                  className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
                {errors.maxLoan && <p className="text-xs text-danger">{errors.maxLoan}</p>}
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-600 text-foreground">Processing Fee</label>
                <input
                  type="text"
                  value={form.processingFee}
                  onChange={(e) => setForm((p) => ({ ...p, processingFee: e.target.value }))}
                  placeholder="0.50%"
                  className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-600 text-foreground">Score Cutoff</label>
                <input
                  type="number"
                  value={form.scoreCutoff}
                  onChange={(e) => setForm((p) => ({ ...p, scoreCutoff: e.target.value }))}
                  placeholder="700"
                  className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-600 text-foreground">
                  Max Tenure (months)
                </label>
                <input
                  type="number"
                  value={form.maxTenure}
                  onChange={(e) => setForm((p) => ({ ...p, maxTenure: e.target.value }))}
                  placeholder="360"
                  className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-600 text-foreground">FOIR Limit (%)</label>
                <input
                  type="number"
                  value={form.foirLimit}
                  onChange={(e) => setForm((p) => ({ ...p, foirLimit: e.target.value }))}
                  placeholder="55"
                  className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-600 text-foreground">Max LTV (%)</label>
                <input
                  type="number"
                  value={form.ltvMax}
                  onChange={(e) => setForm((p) => ({ ...p, ltvMax: e.target.value }))}
                  placeholder="80"
                  className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-600 text-foreground">Avg TAT</label>
                <input
                  type="text"
                  value={form.avgTat}
                  onChange={(e) => setForm((p) => ({ ...p, avgTat: e.target.value }))}
                  placeholder="4–6 days"
                  className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-600 text-foreground">Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((p) => ({ ...p, status: e.target.value as 'active' | 'inactive' }))
              }
              className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              onClick={() => setLenderFormOpen(false)}
              className="h-9 px-4 rounded-sm border border-border text-sm font-600 text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-9 px-5 rounded-sm bg-primary text-primary-foreground text-sm font-700 hover:bg-primary/90 active:scale-95 transition-all duration-150 disabled:opacity-60 flex items-center gap-2"
            >
              {saving ? (
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
                  Saving...
                </>
              ) : editLender ? (
                'Save Changes'
              ) : (
                'Add Lender'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
