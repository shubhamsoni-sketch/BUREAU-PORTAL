'use client';

import React, { useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import { CachedBureauPull, usePartnerReportsCache } from '@/hooks/usePartnerReportsCache';
import { downloadAuthenticatedFile } from '@/lib/supabase/auth-fetch';
import { ArrowUpDown, BookUser, ChevronRight, Download, RefreshCw, Search, X } from 'lucide-react';
import BureauReportModal from '@/app/reports-history/components/BureauReportModal';

type SourceTab = 'portal' | 'api' | 'failed';
type SortField = 'created_at' | 'credit_score';

function sourceOf(row: CachedBureauPull) {
  return row.raw_json?.source === 'api_hub' ? 'api' : 'portal';
}

function scoreColor(score: number | null) {
  if (!score) return 'text-slate-400';
  if (score >= 750) return 'text-emerald-600';
  if (score >= 650) return 'text-amber-600';
  return 'text-red-600';
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function truncate(value: string | null, max = 24) {
  if (!value) return '-';
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

function sourceBadge(row: CachedBureauPull) {
  if (sourceOf(row) === 'api') {
    return <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">API</span>;
  }
  return <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">Portal</span>;
}

function exportCSV(rows: CachedBureauPull[], tab: SourceTab) {
  const headers = ['Source', 'Member Ref', 'Report ID', 'Name', 'PAN', 'Score', 'Status', 'Loan Types', 'Date'];
  const csvRows = rows.map((row) => [
    sourceOf(row), row.member_ref ?? '', row.report_id ?? '', row.customer_name ?? '', row.pan ?? '', row.credit_score ?? '', row.status,
    row.loan_types ?? '', formatDateTime(row.created_at),
  ]);
  const content = [headers, ...csvRows]
    .map((items) => items.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `customer-master-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function CustomerMasterPage() {
  const { pulls, loading, refresh } = usePartnerReportsCache();
  const [activeTab, setActiveTab] = useState<SourceTab>('portal');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedRow, setSelectedRow] = useState<CachedBureauPull | null>(null);

  const counts = useMemo(() => ({
    portal: pulls.filter((row) => row.status !== 'failed' && sourceOf(row) === 'portal').length,
    api: pulls.filter((row) => row.status !== 'failed' && sourceOf(row) === 'api').length,
    failed: pulls.filter((row) => row.status === 'failed').length,
  }), [pulls]);

  const filtered = useMemo(() => {
    let rows = pulls.filter((row) => {
      if (activeTab === 'failed') return row.status === 'failed';
      return row.status !== 'failed' && sourceOf(row) === activeTab;
    });

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((row) =>
        row.customer_name?.toLowerCase().includes(q) ||
        row.pan?.toLowerCase().includes(q) ||
        row.member_ref?.toLowerCase().includes(q) ||
        row.report_id?.toLowerCase().includes(q)
      );
    }

    rows = [...rows].sort((a, b) => {
      if (sortField === 'credit_score') {
        const left = a.credit_score ?? -1;
        const right = b.credit_score ?? -1;
        return sortDir === 'desc' ? right - left : left - right;
      }
      return sortDir === 'desc'
        ? b.created_at.localeCompare(a.created_at)
        : a.created_at.localeCompare(b.created_at);
    });

    return rows;
  }, [activeTab, pulls, search, sortDir, sortField]);

  const tabs: Array<{ key: SourceTab; label: string }> = [
    { key: 'portal', label: 'Portal Pulls' },
    { key: 'api', label: 'API Pulls' },
    { key: 'failed', label: 'Failed' },
  ];

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((value) => value === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  }

  function downloadPdf(row: CachedBureauPull) {
    const filename = `${row.customer_name || 'bureau-report'}-${row.report_id || row.id}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') + '.pdf';
    downloadAuthenticatedFile(`/api/bureau-report-pdf?source=bureau_pulls&id=${encodeURIComponent(row.id)}`, filename)
      .catch((error) => alert(error.message));
  }

  return (
    <AppLayout role="partner">
      <Topbar title="Customer Master" subtitle="Portal and API pulled customer bureau reports" role="partner" />

      <div className="p-5 fade-in">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookUser size={20} className="text-blue-600" />
            <div>
              <h1 className="text-lg font-semibold text-slate-800">Customer Master</h1>
              <p className="text-xs text-slate-500">{filtered.length} records shown from {pulls.length} total pulls</p>
            </div>
          </div>
          <button
            onClick={() => void refresh(true)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        <div className="mb-4 flex items-center gap-1 border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${activeTab === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, PAN, member ref, report ID..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-8 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"><X size={13} /></button>}
          </div>
          <div className="flex-1" />
          <button
            onClick={() => exportCSV(filtered, activeTab)}
            disabled={!filtered.length}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left font-semibold text-slate-500">
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">PAN / Ref</th>
                  <th className="px-4 py-3">Report Type</th>
                  <th className="px-4 py-3 cursor-pointer" onClick={() => toggleSort('credit_score')}><span className="inline-flex items-center gap-1">Score <ArrowUpDown size={11} /></span></th>
                  <th className="px-4 py-3">Loan Types</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 cursor-pointer" onClick={() => toggleSort('created_at')}><span className="inline-flex items-center gap-1">Date <ArrowUpDown size={11} /></span></th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? [...Array(6)].map((_, index) => (
                  <tr key={index}>{[...Array(9)].map((__, cell) => <td key={cell} className="px-4 py-3"><div className="h-4 rounded bg-slate-100 animate-pulse" /></td>)}</tr>
                )) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="py-16 text-center text-sm text-slate-400">No records found in this tab.</td></tr>
                ) : filtered.map((row) => (
                  <tr key={row.id} className="cursor-pointer hover:bg-blue-50/40" onClick={() => setSelectedRow(row)}>
                    <td className="px-4 py-3">{sourceBadge(row)}</td>
                    <td className="px-4 py-3"><p className="font-semibold text-slate-800">{truncate(row.customer_name)}</p><p className="font-mono text-[11px] text-slate-400">{row.report_id || '-'}</p></td>
                    <td className="px-4 py-3"><p className="font-mono uppercase text-slate-700">{row.pan || '-'}</p><p className="font-mono text-[11px] text-slate-400">{row.member_ref || '-'}</p></td>
                    <td className="px-4 py-3 capitalize text-slate-600">{row.report_type || 'consumer'}</td>
                    <td className={`px-4 py-3 text-sm font-bold tabular-nums ${scoreColor(row.credit_score)}`}>{row.credit_score ?? '-'}</td>
                    <td className="px-4 py-3 text-slate-600" title={row.loan_types ?? ''}>{truncate(row.loan_types, 30)}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">{row.status}</span></td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">{formatDateTime(row.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button type="button" onClick={(event) => { event.stopPropagation(); downloadPdf(row); }} className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:text-blue-600" title="Download PDF"><Download size={13} /></button>
                        <ChevronRight size={14} className="text-slate-300" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedRow && <BureauReportModal pull={selectedRow} onClose={() => setSelectedRow(null)} />}
    </AppLayout>
  );
}
