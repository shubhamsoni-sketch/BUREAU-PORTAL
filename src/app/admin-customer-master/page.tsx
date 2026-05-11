'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
  Search,
  Download,
  SlidersHorizontal,
  Columns3,
  ChevronDown,
  X,
  Calendar,
  AlertCircle,
  FileText,
  Eye,
  RefreshCw,
  Building2,
  UserRoundCheck,
} from 'lucide-react';
import BureauReportModal from '@/app/reports-history/components/BureauReportModal';
import type { BureauPull } from '@/app/reports-history/page';

// ─── Extended type with partner info ──────────────────────────────────────────
interface AdminBureauPull extends BureauPull {
  partner_name: string;
  partner_code: string | null;
}

type TabType = 'consumer' | 'commercial' | 'failed' | 'b2c';

interface B2CReportRequest {
  id: string;
  full_name: string | null;
  mobile: string;
  email: string | null;
  pan: string | null;
  dob: string | null;
  gender: string | null;
  address: string | null;
  state: string | null;
  pin_code: string | null;
  consent_given: boolean;
  consent_at: string | null;
  status: string;
  credit_score: number | null;
  report_id: string | null;
  api_status: string | null;
  api_error: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Column definitions (same as Report History + Partner column) ─────────────
const ALL_COLUMNS = [
  { key: 'partner_name', label: 'Partner' },
  { key: 'member_ref', label: 'Member Ref' },
  { key: 'pan', label: 'PAN' },
  { key: 'customer_name', label: 'Name' },
  { key: 'credit_score', label: 'Score' },
  { key: 'occupation_code', label: 'Occ' },
  { key: 'gender', label: 'Gender' },
  { key: 'state', label: 'State' },
  { key: 'total_trades', label: 'Trades' },
  { key: 'loan_types', label: 'Loan Types' },
  { key: 'dpd_tag', label: 'DPD' },
  { key: 'current_balance', label: 'Curr Bal' },
  { key: 'overdue_amount', label: 'Overdue' },
  { key: 'active_trade_lines', label: 'Active TL' },
  { key: 'total_enquiries', label: 'Enq' },
  { key: 'income', label: 'Income' },
  { key: 'dob', label: 'DOB' },
  { key: 'created_at', label: 'Date & Time' },
] as const;

type ColumnKey = typeof ALL_COLUMNS[number]['key'];

const DEFAULT_VISIBLE: ColumnKey[] = [
  'partner_name', 'member_ref', 'pan', 'customer_name', 'credit_score',
  'occupation_code', 'gender', 'state', 'total_trades', 'loan_types',
  'dpd_tag', 'current_balance', 'overdue_amount', 'active_trade_lines',
  'total_enquiries', 'income', 'dob', 'created_at',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function scoreColor(score: number | null) {
  if (!score) return 'text-slate-400';
  if (score >= 750) return 'text-emerald-600 font-bold';
  if (score >= 650) return 'text-amber-600 font-bold';
  return 'text-red-500 font-bold';
}

function dpdBadge(tag: string | null) {
  if (!tag) return null;
  const t = tag.toUpperCase();
  if (t === 'LOW') return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">LOW</span>;
  if (t === 'MED' || t === 'MEDIUM') return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">MED</span>;
  if (t === 'HIGH') return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200">HIGH</span>;
  return <span className="text-xs text-slate-500">{tag}</span>;
}

function formatBalance(val: number | null) {
  if (val === null || val === undefined) return '—';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
  return `₹${val}`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function truncate(str: string | null, max = 22) {
  if (!str) return '—';
  return str.length > max ? str.slice(0, max) + '...' : str;
}

// ─── Export CSV ───────────────────────────────────────────────────────────────
function exportCSV(rows: AdminBureauPull[], visibleCols: ColumnKey[], tab: TabType, dateFrom: string, dateTo: string) {
  const headers = ALL_COLUMNS.filter(c => visibleCols.includes(c.key)).map(c => c.label);
  const csvRows = rows.map(r => {
    return ALL_COLUMNS.filter(c => visibleCols.includes(c.key)).map(c => {
      if (c.key === 'created_at') return formatDateTime(r.created_at);
      if (c.key === 'partner_name') return r.partner_name ?? '';
      const v = r[c.key as keyof BureauPull];
      if (v === null || v === undefined) return '';
      return String(v);
    });
  });

  const content = [headers, ...csvRows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `customer-master-${tab}-${dateFrom || 'all'}-to-${dateTo || 'all'}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportB2CCSV(rows: B2CReportRequest[], dateFrom: string, dateTo: string) {
  const headers = ['Name', 'Mobile', 'Email', 'PAN', 'DOB', 'Gender', 'State', 'PIN', 'Status', 'Consent', 'Score', 'Report ID', 'Created'];
  const csvRows = rows.map(r => [
    r.full_name ?? '',
    r.mobile,
    r.email ?? '',
    r.pan ?? '',
    r.dob ?? '',
    r.gender ?? '',
    r.state ?? '',
    r.pin_code ?? '',
    r.status,
    r.consent_given ? 'Yes' : 'No',
    r.credit_score ?? '',
    r.report_id ?? '',
    formatDateTime(r.created_at),
  ]);

  const content = [headers, ...csvRows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `customer-master-b2c-${dateFrom || 'all'}-to-${dateTo || 'all'}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminCustomerMasterPage() {
  const [activeTab, setActiveTab] = useState<TabType>('consumer');
  const [allData, setAllData] = useState<AdminBureauPull[]>([]);
  const [b2cData, setB2cData] = useState<B2CReportRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showColToggle, setShowColToggle] = useState(false);
  const [visibleCols, setVisibleCols] = useState<ColumnKey[]>(DEFAULT_VISIBLE);

  // Row detail modal
  const [selectedRow, setSelectedRow] = useState<AdminBureauPull | null>(null);
  const [selectedB2C, setSelectedB2C] = useState<B2CReportRequest | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);

      const [res, b2cRes] = await Promise.all([
        fetch(`/api/admin-bureau-pulls?${params.toString()}`),
        fetch(`/api/admin-b2c-reports?${params.toString()}`),
      ]);
      const json = await res.json();
      const b2cJson = await b2cRes.json();

      if (json.success) {
        setAllData((json.pulls as AdminBureauPull[]) ?? []);
      } else {
        console.error('[CustomerMaster] API error:', json.error);
        setAllData([]);
      }
      if (b2cJson.success) {
        setB2cData((b2cJson.reports as B2CReportRequest[]) ?? []);
      } else {
        console.error('[CustomerMaster] B2C API error:', b2cJson.error);
        setB2cData([]);
      }
    } catch (err) {
      console.error('[CustomerMaster] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered rows per tab
  const filteredRows = useMemo(() => {
    let rows = allData;

    if (activeTab === 'failed') {
      rows = rows.filter(r => r.status === 'failed');
    } else {
      rows = rows.filter(r => r.status !== 'failed' && r.report_type === activeTab);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(r =>
        r.customer_name?.toLowerCase().includes(q) ||
        r.pan?.toLowerCase().includes(q) ||
        r.member_ref?.toLowerCase().includes(q) ||
        r.partner_name?.toLowerCase().includes(q)
      );
    }

    return rows;
  }, [allData, activeTab, search]);

  const filteredB2CRows = useMemo(() => {
    let rows = b2cData;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(r =>
        r.full_name?.toLowerCase().includes(q) ||
        r.mobile.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.pan?.toLowerCase().includes(q) ||
        r.report_id?.toLowerCase().includes(q)
      );
    }

    return rows;
  }, [b2cData, search]);

  const consumerCount = allData.filter(r => r.status !== 'failed' && r.report_type === 'consumer').length;
  const commercialCount = allData.filter(r => r.status !== 'failed' && r.report_type === 'commercial').length;
  const failedCount = allData.filter(r => r.status === 'failed').length;
  const b2cCount = b2cData.length;

  const tabCounts: Record<TabType, number> = {
    consumer: consumerCount,
    commercial: commercialCount,
    failed: failedCount,
    b2c: b2cCount,
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'consumer', label: 'Consumer' },
    { key: 'commercial', label: 'Commercial' },
    { key: 'failed', label: 'Failed Pulls' },
    { key: 'b2c', label: 'B2C' },
  ];

  const toggleCol = (key: ColumnKey) => {
    setVisibleCols(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const visibleColDefs = ALL_COLUMNS.filter(c => visibleCols.includes(c.key));

  // Unique partners for display
  const uniquePartnerCount = useMemo(() => {
    return new Set(allData.map(r => r.partner_id)).size;
  }, [allData]);

  function renderCell(row: AdminBureauPull, key: ColumnKey) {
    switch (key) {
      case 'partner_name':
        return (
          <div className="flex items-center gap-1.5">
            <Building2 size={12} className="text-slate-400 flex-shrink-0" />
            <span className="text-xs font-medium text-slate-700" title={row.partner_name}>
              {truncate(row.partner_name, 20)}
            </span>
            {row.partner_code && (
              <span className="text-[10px] text-slate-400 font-mono">({row.partner_code})</span>
            )}
          </div>
        );
      case 'member_ref':
        return <span className="font-mono text-xs text-slate-700">{row.member_ref ?? '—'}</span>;
      case 'pan':
        return <span className="font-mono text-xs text-slate-700 uppercase">{row.pan ?? '—'}</span>;
      case 'customer_name':
        return (
          <span className="font-medium text-slate-800 text-xs" title={row.customer_name ?? ''}>
            {truncate(row.customer_name, 20)}
          </span>
        );
      case 'credit_score':
        return <span className={`tabular-nums text-sm ${scoreColor(row.credit_score)}`}>{row.credit_score ?? '—'}</span>;
      case 'occupation_code':
        return <span className="text-xs text-slate-600">{row.occupation_code ?? '—'}</span>;
      case 'gender':
        return <span className="text-xs text-slate-600">{row.gender ?? '—'}</span>;
      case 'state':
        return <span className="text-xs text-slate-600">{row.state ?? '—'}</span>;
      case 'total_trades':
        return <span className="text-xs tabular-nums text-slate-700">{row.total_trades ?? '—'}</span>;
      case 'loan_types':
        return (
          <span className="text-xs text-slate-600" title={row.loan_types ?? ''}>
            {truncate(row.loan_types, 24)}
          </span>
        );
      case 'dpd_tag':
        return dpdBadge(row.dpd_tag) ?? <span className="text-slate-400 text-xs">—</span>;
      case 'current_balance':
        return <span className="text-xs tabular-nums text-slate-700">{formatBalance(row.current_balance)}</span>;
      case 'overdue_amount':
        return (
          <span className={`text-xs tabular-nums ${row.overdue_amount && row.overdue_amount > 0 ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
            {row.overdue_amount && row.overdue_amount > 0 ? formatBalance(row.overdue_amount) : '—'}
          </span>
        );
      case 'active_trade_lines':
        return <span className="text-xs tabular-nums text-slate-700">{row.active_trade_lines ?? '—'}</span>;
      case 'total_enquiries':
        return <span className="text-xs tabular-nums text-slate-700">{row.total_enquiries ?? '—'}</span>;
      case 'income':
        return <span className="text-xs text-slate-600">{row.income ? `₹${Number(row.income).toLocaleString('en-IN')}` : '—'}</span>;
      case 'dob':
        return <span className="text-xs text-slate-600">{row.dob ?? '—'}</span>;
      case 'created_at':
        return <span className="text-xs text-slate-500 whitespace-nowrap">{formatDateTime(row.created_at)}</span>;
      default:
        return '—';
    }
  }

  return (
    <AdminLayout title="Customer Master">
      <div className="p-5 fade-in">
        {/* Page Header */}
        <div className="mb-4">
          <h1 className="text-lg font-semibold text-slate-800">Customer Master</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Partner reports and B2C customer financial health records - {allData.length + b2cData.length} total records
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4 border-b border-slate-200">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-150 flex items-center gap-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600' :'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                activeTab === tab.key
                  ? tab.key === 'failed' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-700' :'bg-slate-100 text-slate-500'
              }`}>
                {tabCounts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'b2c' ? 'Search name, mobile, PAN, report ID...' : 'Search name, PAN, Member Ref or Partner...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filters toggle */}
          <div className="relative">
            <button
              onClick={() => { setShowFilters(!showFilters); setShowColToggle(false); }}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition-colors ${
                showFilters || dateFrom || dateTo
                  ? 'bg-blue-50 border-blue-300 text-blue-700' :'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal size={14} />
              Filters
              {(dateFrom || dateTo) && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
              <ChevronDown size={12} />
            </button>

            {showFilters && (
              <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg p-4 w-72">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Date Range</p>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">From</label>
                    <div className="relative">
                      <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">To</label>
                    <div className="relative">
                      <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                </div>
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => { setDateFrom(''); setDateTo(''); }}
                    className="mt-3 text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                  >
                    <X size={11} /> Clear dates
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Columns toggle */}
          <div className="relative">
            <button
              onClick={() => { setShowColToggle(!showColToggle); setShowFilters(false); }}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition-colors ${
                showColToggle ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Columns3 size={14} />
              Columns
              <ChevronDown size={12} />
            </button>

            {showColToggle && (
              <div className="absolute top-full right-0 mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg p-4 w-56">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Toggle Columns</p>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {ALL_COLUMNS.map(col => (
                    <label key={col.key} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
                      <input
                        type="checkbox"
                        checked={visibleCols.includes(col.key)}
                        onChange={() => toggleCol(col.key)}
                        className="w-3.5 h-3.5 accent-blue-600"
                      />
                      <span className="text-xs text-slate-700">{col.label}</span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={() => setVisibleCols(DEFAULT_VISIBLE)}
                  className="mt-3 text-xs text-blue-600 hover:text-blue-800"
                >
                  Reset to default
                </button>
              </div>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Row count */}
          <span className="text-xs text-slate-400 font-medium">
            {activeTab === 'b2c' ? filteredB2CRows.length : filteredRows.length} / {tabCounts[activeTab]} records
          </span>

          {/* Export CSV */}
          <button
            onClick={() => activeTab === 'b2c' ? exportB2CCSV(filteredB2CRows, dateFrom, dateTo) : exportCSV(filteredRows, visibleCols, activeTab, dateFrom, dateTo)}
            disabled={activeTab === 'b2c' ? filteredB2CRows.length === 0 : filteredRows.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download size={14} />
            Export CSV
          </button>

          {/* Refresh */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            {activeTab === 'b2c' ? (
              <table className="w-full text-xs min-w-max">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['Name', 'Mobile', 'Email', 'PAN', 'DOB', 'Gender', 'State', 'PIN', 'Score', 'Status', 'Consent', 'Report ID', 'Created', ''].map((label) => (
                      <th key={label} className="px-3 py-3 text-left font-semibold text-slate-500 whitespace-nowrap">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i}>
                        {[...Array(14)].map((__, idx) => (
                          <td key={idx} className="px-3 py-3">
                            <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: `${50 + Math.random() * 50}%` }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filteredB2CRows.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <UserRoundCheck size={28} className="text-slate-300" />
                          <p className="text-sm font-medium">
                            {search ? 'No B2C results match your search' : 'No B2C customer records found'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredB2CRows.map(row => (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedB2C(row)}
                        className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                      >
                        <td className="px-3 py-2.5 whitespace-nowrap font-medium text-slate-800">{truncate(row.full_name, 24)}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap font-mono text-slate-700">{row.mobile}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-slate-600">{truncate(row.email, 24)}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap font-mono text-slate-700 uppercase">{row.pan ?? '-'}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-slate-600">{row.dob ?? '-'}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-slate-600">{row.gender ?? '-'}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-slate-600">{row.state ?? '-'}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap font-mono text-slate-600">{row.pin_code ?? '-'}</td>
                        <td className={`px-3 py-2.5 whitespace-nowrap tabular-nums ${scoreColor(row.credit_score)}`}>{row.credit_score ?? '-'}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{row.status}</span>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-slate-600">{row.consent_given ? 'Yes' : 'No'}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap font-mono text-slate-600">{row.report_id ?? '-'}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">{formatDateTime(row.created_at)}</td>
                        <td className="px-3 py-2.5"><Eye size={13} className="text-slate-300 group-hover:text-blue-500 transition-colors" /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
            <table className="w-full text-xs min-w-max">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {visibleColDefs.map(col => (
                    <th
                      key={col.key}
                      className="px-3 py-3 text-left font-semibold text-slate-500 whitespace-nowrap"
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-left font-semibold text-slate-500 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i}>
                      {visibleColDefs.map(col => (
                        <td key={col.key} className="px-3 py-3">
                          <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: `${50 + Math.random() * 50}%` }} />
                        </td>
                      ))}
                      <td className="px-3 py-3"><div className="h-4 w-6 bg-slate-100 rounded animate-pulse" /></td>
                    </tr>
                  ))
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColDefs.length + 1} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        {activeTab === 'failed' ? (
                          <AlertCircle size={28} className="text-slate-300" />
                        ) : (
                          <FileText size={28} className="text-slate-300" />
                        )}
                        <p className="text-sm font-medium">
                          {search ? 'No results match your search' : `No ${activeTab} reports found`}
                        </p>
                        {search && (
                          <button onClick={() => setSearch('')} className="text-xs text-blue-500 hover:underline">
                            Clear search
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map(row => (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedRow(row)}
                      className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                    >
                      {visibleColDefs.map(col => (
                        <td key={col.key} className="px-3 py-2.5 whitespace-nowrap">
                          {renderCell(row, col.key)}
                        </td>
                      ))}
                      <td className="px-3 py-2.5">
                        <Eye size={13} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            )}
          </div>
          {activeTab === 'b2c' && filteredB2CRows.length > 0 ? (
            <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Showing <span className="font-semibold text-slate-800">{filteredB2CRows.length}</span> of{' '}
                <span className="font-semibold text-slate-800">{b2cData.length}</span> B2C records
              </p>
              <p className="text-xs text-slate-500">Actual PAN and customer details are visible for admin records.</p>
            </div>
          ) : filteredRows.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Showing <span className="font-semibold text-slate-800">{filteredRows.length}</span> of{' '}
                <span className="font-semibold text-slate-800">{allData.length}</span> total records
              </p>
              <p className="text-xs text-slate-500">
                Across <span className="font-semibold text-slate-800">{uniquePartnerCount}</span> partner{uniquePartnerCount !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bureau Report Detail Modal */}
      {selectedRow && (
        <BureauReportModal
          pull={selectedRow}
          onClose={() => setSelectedRow(null)}
        />
      )}

      {selectedB2C && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedB2C(null)}>
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-800">B2C Customer Details</h2>
                <p className="text-xs text-slate-500">{selectedB2C.full_name || 'Customer'} - {selectedB2C.mobile}</p>
              </div>
              <button onClick={() => setSelectedB2C(null)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {[
                ['Full Name', selectedB2C.full_name],
                ['Mobile', selectedB2C.mobile],
                ['Email', selectedB2C.email],
                ['PAN', selectedB2C.pan],
                ['DOB', selectedB2C.dob],
                ['Gender', selectedB2C.gender],
                ['Address', selectedB2C.address],
                ['State', selectedB2C.state],
                ['PIN Code', selectedB2C.pin_code],
                ['Consent', selectedB2C.consent_given ? 'Yes' : 'No'],
                ['Consent At', selectedB2C.consent_at ? formatDateTime(selectedB2C.consent_at) : '-'],
                ['Status', selectedB2C.status],
                ['Credit Score', selectedB2C.credit_score ?? '-'],
                ['Report ID', selectedB2C.report_id],
                ['API Status', selectedB2C.api_status],
                ['API Error', selectedB2C.api_error],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs text-slate-500 mb-1">{label}</p>
                  <p className="font-medium text-slate-800 break-words">{value || '-'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {(showFilters || showColToggle) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => { setShowFilters(false); setShowColToggle(false); }}
        />
      )}
    </AdminLayout>
  );
}
