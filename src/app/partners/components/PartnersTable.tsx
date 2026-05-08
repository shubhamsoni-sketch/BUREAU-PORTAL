'use client';

import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Search, Filter, ChevronUp, ChevronDown, ChevronsUpDown, Eye, Edit2, Wallet, CheckCircle2, XCircle, Clock, Ban, Trash2, ChevronLeft, ChevronRight, X, ToggleLeft, ToggleRight, AlertTriangle,  } from 'lucide-react';


// Backend integration point: replace mock data with GET /api/admin/partners
const ALL_PARTNERS = [
  {
    id: 'partner-001',
    name: 'Rajesh Kumar',
    mobile: '+91 98765 43210',
    email: 'rajesh.kumar@dsa.in',
    city: 'Mumbai',
    plan: 'Pro',
    walletBalance: 350,
    reportsPulled: 1248,
    agreementStatus: 'Signed',
    mode: 'Live',
    status: 'Active',
    joinedDate: '12 Jan 2025',
    panVerified: true,
  },
  {
    id: 'partner-002',
    name: 'Priya Mehta Finance',
    mobile: '+91 87654 32109',
    email: 'priya.mehta@pmfinance.co',
    city: 'Ahmedabad',
    plan: 'Enterprise',
    walletBalance: 8200,
    reportsPulled: 4390,
    agreementStatus: 'Signed',
    mode: 'Live',
    status: 'Active',
    joinedDate: '03 Nov 2024',
    panVerified: true,
  },
  {
    id: 'partner-003',
    name: 'Suresh DSA Services',
    mobile: '+91 76543 21098',
    email: 'suresh@dsaservices.in',
    city: 'Pune',
    plan: 'Basic',
    walletBalance: 180,
    reportsPulled: 312,
    agreementStatus: 'Signed',
    mode: 'Live',
    status: 'Active',
    joinedDate: '22 Feb 2025',
    panVerified: true,
  },
  {
    id: 'partner-004',
    name: 'Kiran Mehta',
    mobile: '+91 65432 10987',
    email: 'kiran.mehta@gmail.com',
    city: 'Delhi',
    plan: 'Basic',
    walletBalance: 0,
    reportsPulled: 0,
    agreementStatus: 'Pending',
    mode: 'Demo',
    status: 'Pending',
    joinedDate: '28 Mar 2025',
    panVerified: false,
  },
  {
    id: 'partner-005',
    name: 'Anita Loans Pvt Ltd',
    mobile: '+91 54321 09876',
    email: 'ops@anitaloanspvt.com',
    city: 'Hyderabad',
    plan: 'Enterprise',
    walletBalance: 15000,
    reportsPulled: 7821,
    agreementStatus: 'Signed',
    mode: 'Live',
    status: 'Active',
    joinedDate: '14 Aug 2024',
    panVerified: true,
  },
  {
    id: 'partner-006',
    name: 'Mohit Kapoor',
    mobile: '+91 43210 98765',
    email: 'mohit.kapoor@finserv.in',
    city: 'Jaipur',
    plan: 'Pro',
    walletBalance: 1400,
    reportsPulled: 893,
    agreementStatus: 'Signed',
    mode: 'Live',
    status: 'Active',
    joinedDate: '05 Dec 2024',
    panVerified: true,
  },
  {
    id: 'partner-007',
    name: 'Deepa Credit Solutions',
    mobile: '+91 32109 87654',
    email: 'deepa@creditsol.in',
    city: 'Chennai',
    plan: 'Pro',
    walletBalance: 620,
    reportsPulled: 2104,
    agreementStatus: 'Signed',
    mode: 'Live',
    status: 'Suspended',
    joinedDate: '19 Sep 2024',
    panVerified: true,
  },
  {
    id: 'partner-008',
    name: 'Vikas Nair',
    mobile: '+91 21098 76543',
    email: 'vikas.nair@vikasdsa.com',
    city: 'Kochi',
    plan: 'Basic',
    walletBalance: 50,
    reportsPulled: 67,
    agreementStatus: 'Pending',
    mode: 'Demo',
    status: 'Pending',
    joinedDate: '30 Mar 2025',
    panVerified: false,
  },
  {
    id: 'partner-009',
    name: 'Sunita Bansal',
    mobile: '+91 10987 65432',
    email: 'sunita.bansal@bansalfintech.in',
    city: 'Lucknow',
    plan: 'Enterprise',
    walletBalance: 9800,
    reportsPulled: 5612,
    agreementStatus: 'Signed',
    mode: 'Live',
    status: 'Active',
    joinedDate: '11 Jul 2024',
    panVerified: true,
  },
  {
    id: 'partner-010',
    name: 'Harish Gupta DSA',
    mobile: '+91 99887 76655',
    email: 'harish@hgdsa.co.in',
    city: 'Bhopal',
    plan: 'Basic',
    walletBalance: 0,
    reportsPulled: 14,
    agreementStatus: 'Expired',
    mode: 'Demo',
    status: 'Deactivated',
    joinedDate: '02 May 2024',
    panVerified: true,
  },
  {
    id: 'partner-011',
    name: 'Rekha Sharma Finserv',
    mobile: '+91 88776 65544',
    email: 'rekha@rsfinserv.in',
    city: 'Nagpur',
    plan: 'Pro',
    walletBalance: 3100,
    reportsPulled: 1876,
    agreementStatus: 'Signed',
    mode: 'Live',
    status: 'Active',
    joinedDate: '17 Oct 2024',
    panVerified: true,
  },
  {
    id: 'partner-012',
    name: 'Arun Bajaj Credit',
    mobile: '+91 77665 54433',
    email: 'arun@bajajcredit.in',
    city: 'Surat',
    plan: 'Pro',
    walletBalance: 4500,
    reportsPulled: 2930,
    agreementStatus: 'Signed',
    mode: 'Live',
    status: 'Active',
    joinedDate: '29 Jun 2024',
    panVerified: true,
  },
];

type SortKey = 'name' | 'walletBalance' | 'reportsPulled' | 'joinedDate';
type SortDir = 'asc' | 'desc';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  Active: { label: 'Active', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 },
  Pending: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
  Suspended: { label: 'Suspended', bg: 'bg-red-50', text: 'text-red-700', icon: Ban },
  Deactivated: { label: 'Deactivated', bg: 'bg-slate-100', text: 'text-slate-500', icon: XCircle },
};

const PLAN_CONFIG: Record<string, { bg: string; text: string }> = {
  Basic: { bg: 'bg-slate-100', text: 'text-slate-600' },
  Pro: { bg: 'bg-blue-50', text: 'text-blue-700' },
  Enterprise: { bg: 'bg-purple-50', text: 'text-purple-700' },
};

const AGREEMENT_CONFIG: Record<string, { bg: string; text: string }> = {
  Signed: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  Pending: { bg: 'bg-amber-50', text: 'text-amber-700' },
  Expired: { bg: 'bg-red-50', text: 'text-red-700' },
};

export default function PartnersTable() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [planFilter, setPlanFilter] = useState('All');
  const [modeFilter, setModeFilter] = useState('All');
  const [sortKey, setSortKey] = useState<SortKey>('joinedDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(8);
  const [partners, setPartners] = useState(ALL_PARTNERS);
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [topUpModal, setTopUpModal] = useState<string | null>(null);
  const [topUpAmount, setTopUpAmount] = useState('');

  const statusOptions = ['All', 'Active', 'Pending', 'Suspended', 'Deactivated'];
  const planOptions = ['All', 'Basic', 'Pro', 'Enterprise'];
  const modeOptions = ['All', 'Live', 'Demo'];

  const filtered = useMemo(() => {
    let data = partners.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.mobile.includes(q) || p.city.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchPlan = planFilter === 'All' || p.plan === planFilter;
      const matchMode = modeFilter === 'All' || p.mode === modeFilter;
      return matchSearch && matchStatus && matchPlan && matchMode;
    });

    data = [...data].sort((a, b) => {
      let av: string | number = a[sortKey];
      let bv: string | number = b[sortKey];
      if (sortKey === 'walletBalance' || sortKey === 'reportsPulled') {
        return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });

    return data;
  }, [partners, search, statusFilter, planFilter, modeFilter, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronsUpDown size={12} className="text-slate-400" />;
    return sortDir === 'asc' ? <ChevronUp size={12} className="text-blue-600" /> : <ChevronDown size={12} className="text-blue-600" />;
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    setSelected(selected.length === paginated.length ? [] : paginated.map((p) => p.id));
  };

  const changeStatus = (partnerId: string, newStatus: string) => {
    setPartners((prev) => prev.map((p) => p.id === partnerId ? { ...p, status: newStatus } : p));
    setStatusDropdown(null);
    toast.success(`Partner status updated to ${newStatus}`);
  };

  const toggleMode = (partnerId: string) => {
    setPartners((prev) =>
      prev.map((p) => p.id === partnerId ? { ...p, mode: p.mode === 'Live' ? 'Demo' : 'Live' } : p)
    );
    const partner = partners.find((p) => p.id === partnerId);
    toast.success(`${partner?.name} switched to ${partner?.mode === 'Live' ? 'Demo' : 'Live'} mode`);
  };

  const handleTopUp = () => {
    const amt = parseFloat(topUpAmount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    setPartners((prev) =>
      prev.map((p) => p.id === topUpModal ? { ...p, walletBalance: p.walletBalance + amt } : p)
    );
    toast.success(`Wallet topped up with ₹${amt.toLocaleString('en-IN')}`);
    setTopUpModal(null);
    setTopUpAmount('');
  };

  const handleDelete = (id: string) => {
    setPartners((prev) => prev.filter((p) => p.id !== id));
    setDeleteConfirm(null);
    toast.success('Partner removed from platform');
  };

  const handleBulkActivate = () => {
    setPartners((prev) => prev.map((p) => selected.includes(p.id) ? { ...p, status: 'Active' } : p));
    toast.success(`${selected.length} partners activated`);
    setSelected([]);
  };

  const handleBulkSuspend = () => {
    setPartners((prev) => prev.map((p) => selected.includes(p.id) ? { ...p, status: 'Suspended' } : p));
    toast.success(`${selected.length} partners suspended`);
    setSelected([]);
  };

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Table Toolbar */}
        <div className="px-5 py-4 border-b border-slate-100 space-y-3">
          {/* Row 1: Search + Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, city, mobile..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-8 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all placeholder:text-slate-400"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Status filter chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {statusOptions.map((s) => (
                <button
                  key={`sf-${s}`}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-150 ${
                    statusFilter === s
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Plan + Mode filters + result count */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Filter size={13} className="text-slate-400" />
              <span className="text-xs text-slate-500">Plan:</span>
              {planOptions.map((p) => (
                <button
                  key={`pf-${p}`}
                  onClick={() => { setPlanFilter(p); setPage(1); }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    planFilter === p ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">Mode:</span>
              {modeOptions.map((m) => (
                <button
                  key={`mf-${m}`}
                  onClick={() => { setModeFilter(m); setPage(1); }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    modeFilter === m ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <span className="ml-auto text-xs text-slate-500 font-medium">
              Showing {filtered.length} of {partners.length} partners
            </span>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selected.length > 0 && (
          <div className="px-5 py-2.5 bg-blue-50 border-b border-blue-100 flex items-center gap-3 animate-slide-up">
            <span className="text-sm font-semibold text-blue-800">{selected.length} selected</span>
            <button
              onClick={handleBulkActivate}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition-colors"
            >
              Activate All
            </button>
            <button
              onClick={handleBulkSuspend}
              className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
            >
              Suspend All
            </button>
            <button
              onClick={() => setSelected([])}
              className="ml-auto text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              <X size={12} /> Clear
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.length === paginated.length && paginated.length > 0}
                    onChange={toggleAll}
                    className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                  />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-600 cursor-pointer select-none whitespace-nowrap"
                  onClick={() => toggleSort('name')}
                >
                  <div className="flex items-center gap-1.5">Partner Name <SortIcon k="name" /></div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">City</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">Plan</th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-600 cursor-pointer select-none whitespace-nowrap"
                  onClick={() => toggleSort('walletBalance')}
                >
                  <div className="flex items-center gap-1.5">Wallet Balance <SortIcon k="walletBalance" /></div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-600 cursor-pointer select-none whitespace-nowrap"
                  onClick={() => toggleSort('reportsPulled')}
                >
                  <div className="flex items-center gap-1.5">Reports Pulled <SortIcon k="reportsPulled" /></div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">Agreement</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">Mode</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">Joined</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <Search size={20} className="text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-700">No partners found</p>
                      <p className="text-xs text-slate-400">Try adjusting your search or filter criteria</p>
                      <button
                        onClick={() => { setSearch(''); setStatusFilter('All'); setPlanFilter('All'); setModeFilter('All'); }}
                        className="mt-2 text-xs text-blue-600 hover:underline"
                      >
                        Clear all filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((partner) => {
                  const sc = STATUS_CONFIG[partner.status];
                  const pc = PLAN_CONFIG[partner.plan];
                  const ac = AGREEMENT_CONFIG[partner.agreementStatus];
                  const isLowWallet = partner.walletBalance < 500 && partner.walletBalance > 0;
                  const isZeroWallet = partner.walletBalance === 0;
                  const StatusIcon = sc.icon;

                  return (
                    <tr
                      key={partner.id}
                      className={`group hover:bg-slate-50/80 transition-colors duration-100 ${selected.includes(partner.id) ? 'bg-blue-50/50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(partner.id)}
                          onChange={() => toggleSelect(partner.id)}
                          className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                        />
                      </td>

                      {/* Partner Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                            {partner.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate max-w-[140px]">{partner.name}</p>
                            {!partner.panVerified && (
                              <span className="text-[10px] text-amber-600 font-medium">KYC Pending</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3">
                        <p className="text-xs text-slate-700 font-mono">{partner.mobile}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[160px]">{partner.email}</p>
                      </td>

                      {/* City */}
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-700">{partner.city}</span>
                      </td>

                      {/* Plan */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${pc.bg} ${pc.text}`}>
                          {partner.plan}
                        </span>
                      </td>

                      {/* Wallet Balance */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {isZeroWallet ? (
                            <span className="text-sm font-bold text-red-600 font-mono tabular-nums">₹0</span>
                          ) : (
                            <span className={`text-sm font-semibold font-mono tabular-nums ${isLowWallet ? 'text-amber-600' : 'text-slate-800'}`}>
                              ₹{partner.walletBalance.toLocaleString('en-IN')}
                            </span>
                          )}
                          {(isLowWallet || isZeroWallet) && (
                            <AlertTriangle size={12} className={isZeroWallet ? 'text-red-500' : 'text-amber-500'} />
                          )}
                        </div>
                      </td>

                      {/* Reports Pulled */}
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-slate-800 font-mono tabular-nums">
                          {partner.reportsPulled.toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Agreement */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${ac.bg} ${ac.text}`}>
                          {partner.agreementStatus}
                        </span>
                      </td>

                      {/* Mode Toggle */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleMode(partner.id)}
                          className="flex items-center gap-1.5 group/mode"
                          title={`Switch to ${partner.mode === 'Live' ? 'Demo' : 'Live'} mode`}
                        >
                          {partner.mode === 'Live' ? (
                            <ToggleRight size={20} className="text-emerald-500 group-hover/mode:text-emerald-600 transition-colors" />
                          ) : (
                            <ToggleLeft size={20} className="text-slate-400 group-hover/mode:text-slate-600 transition-colors" />
                          )}
                          <span className={`text-[11px] font-semibold ${partner.mode === 'Live' ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {partner.mode}
                          </span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 relative">
                        <button
                          onClick={() => setStatusDropdown(statusDropdown === partner.id ? null : partner.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer hover:opacity-80 transition-opacity ${sc.bg} ${sc.text}`}
                        >
                          <StatusIcon size={11} />
                          {sc.label}
                        </button>

                        {statusDropdown === partner.id && (
                          <div className="absolute left-0 top-10 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1 animate-fade-in">
                            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                              const Ico = cfg.icon;
                              return (
                                <button
                                  key={`sdrop-${key}`}
                                  onClick={() => changeStatus(partner.id, key)}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-slate-50 transition-colors ${key === partner.status ? 'opacity-40 cursor-default' : ''}`}
                                >
                                  <Ico size={12} className={cfg.text} />
                                  <span className={cfg.text}>{cfg.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-500">{partner.joinedDate}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button
                            title="View partner details"
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            title="Edit partner"
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            title="Top-up wallet"
                            onClick={() => setTopUpModal(partner.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-all"
                          >
                            <Wallet size={14} />
                          </button>
                          <button
                            title="Delete partner — this cannot be undone"
                            onClick={() => setDeleteConfirm(partner.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-slate-500">
            Showing {Math.min((page - 1) * perPage + 1, filtered.length)}–{Math.min(page * perPage, filtered.length)} of {filtered.length} partners
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={`page-${p}`}
                onClick={() => setPage(p)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                  page === p ? 'bg-blue-600 text-white shadow-sm' : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Top-Up Modal */}
      {topUpModal && (() => {
        const p = partners.find((x) => x.id === topUpModal);
        return (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center animate-fade-in" onClick={() => setTopUpModal(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-5 border-b border-slate-100">
                <h3 className="text-base font-semibold text-slate-900">Top-Up Wallet</h3>
                <p className="text-sm text-slate-500 mt-0.5">{p?.name}</p>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm text-slate-600">Current Balance</span>
                  <span className="text-sm font-bold text-slate-900 font-mono">₹{p?.walletBalance.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Add Amount (₹)</label>
                  <input
                    type="number"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    placeholder="e.g. 1000"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 font-mono"
                  />
                  <div className="flex gap-2 mt-2">
                    {['500', '1000', '2000', '5000'].map((amt) => (
                      <button
                        key={`quick-${amt}`}
                        onClick={() => setTopUpAmount(amt)}
                        className="flex-1 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setTopUpModal(null)}
                  className="flex-1 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTopUp}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Add Credits
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (() => {
        const p = partners.find((x) => x.id === deleteConfirm);
        return (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center animate-fade-in" onClick={() => setDeleteConfirm(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-5">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <Trash2 size={20} className="text-red-600" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Remove Partner?</h3>
                <p className="text-sm text-slate-500 mt-1.5">
                  This will permanently remove <span className="font-semibold text-slate-700">{p?.name}</span> from the platform. All their reports and wallet data will be archived. This cannot be undone.
                </p>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
                >
                  Remove Partner
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}