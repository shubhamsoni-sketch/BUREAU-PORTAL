'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import { useCustomerMaster, CustomerRecord, RiskLevel } from '@/context/CustomerMasterContext';
import {
  BookUser,
  Search,
  ChevronRight,
  Filter,
  X,
  ArrowUpDown,
} from 'lucide-react';

// ─── Role simulation (in real app this comes from auth context) ───────────────
// For demo: URL param ?role=admin shows admin view, default is partner view
function useRole(): { role: 'admin' | 'partner'; partnerId: string } {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('role') === 'admin') return { role: 'admin', partnerId: '' };
  }
  return { role: 'partner', partnerId: 'partner-001' };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function riskBadgeClass(level: RiskLevel) {
  if (level === 'Low') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (level === 'Medium') return 'bg-amber-50 text-amber-700 border border-amber-200';
  return 'bg-red-50 text-red-700 border border-red-200';
}

function scoreColor(score: number, reportType: string) {
  if (reportType === 'Commercial Bureau') {
    if (score >= 70) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
  }
  if (score >= 750) return 'text-emerald-600';
  if (score >= 650) return 'text-amber-600';
  return 'text-red-600';
}

// ─── Unique partners for filter dropdown ─────────────────────────────────────
function uniquePartners(records: CustomerRecord[]) {
  const map = new Map<string, string>();
  records.forEach((r) => map.set(r.partnerId, r.partnerName));
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CustomerMasterPage() {
  const { records, getRecordsByPartner } = useCustomerMaster();
  const { role, partnerId } = useRole();

  const baseRecords = role === 'admin' ? records : getRecordsByPartner(partnerId);

  // Filters
  const [search, setSearch] = useState('');
  const [filterPartner, setFilterPartner] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterScoreMin, setFilterScoreMin] = useState('');
  const [filterScoreMax, setFilterScoreMax] = useState('');
  const [filterRisk, setFilterRisk] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<'pulledAt' | 'creditScore'>('pulledAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const partners = useMemo(() => uniquePartners(records), [records]);

  const filtered = useMemo(() => {
    let list = [...baseRecords];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.customerName.toLowerCase().includes(q) ||
          r.pan.toLowerCase().includes(q) ||
          r.mobile.includes(q) ||
          r.reportId.toLowerCase().includes(q)
      );
    }

    if (filterPartner) list = list.filter((r) => r.partnerId === filterPartner);
    if (filterDate) list = list.filter((r) => r.pulledAt.startsWith(filterDate));
    if (filterRisk) list = list.filter((r) => r.riskLevel === filterRisk);
    if (filterScoreMin) list = list.filter((r) => r.creditScore >= Number(filterScoreMin));
    if (filterScoreMax) list = list.filter((r) => r.creditScore <= Number(filterScoreMax));

    list.sort((a, b) => {
      if (sortField === 'pulledAt') {
        return sortDir === 'desc'
          ? b.pulledAt.localeCompare(a.pulledAt)
          : a.pulledAt.localeCompare(b.pulledAt);
      }
      return sortDir === 'desc' ? b.creditScore - a.creditScore : a.creditScore - b.creditScore;
    });

    return list;
  }, [baseRecords, search, filterPartner, filterDate, filterRisk, filterScoreMin, filterScoreMax, sortField, sortDir]);

  function toggleSort(field: 'pulledAt' | 'creditScore') {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('desc'); }
  }

  function clearFilters() {
    setFilterPartner('');
    setFilterDate('');
    setFilterScoreMin('');
    setFilterScoreMax('');
    setFilterRisk('');
    setSearch('');
  }

  const hasActiveFilters = filterPartner || filterDate || filterScoreMin || filterScoreMax || filterRisk;

  return (
    <AppLayout role={role}>
      <Topbar
        title="Customer Master"
        subtitle={role === 'admin' ? 'All customer Bureau records across partners' : 'Your customer Bureau records'}
        role={role}
      />

      <div className="p-6 fade-in">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <BookUser size={20} className="text-primary" />
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {role === 'admin' ? 'All Records' : 'My Customers'}
              </h2>
              <p className="text-xs text-muted-foreground">{filtered.length} record{filtered.length !== 1 ? 's' : ''} found</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {role === 'admin' && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${showFilters || hasActiveFilters ? 'bg-primary text-white border-primary' : 'bg-white border-border text-foreground hover:border-primary'}`}
              >
                <Filter size={13} />
                Filters
                {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-white ml-0.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Search + Filters */}
        <div className="bg-white rounded-xl border border-border p-4 mb-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, PAN, mobile, or report ID..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Admin Filters */}
          {role === 'admin' && showFilters && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
              {/* Partner Filter */}
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Partner</label>
                <select
                  className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                  value={filterPartner}
                  onChange={(e) => setFilterPartner(e.target.value)}
                >
                  <option value="">All Partners</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Date</label>
                <input
                  type="date"
                  className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>

              {/* Score Min */}
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Score Min</label>
                <input
                  type="number"
                  placeholder="e.g. 600"
                  className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                  value={filterScoreMin}
                  onChange={(e) => setFilterScoreMin(e.target.value)}
                />
              </div>

              {/* Score Max */}
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Score Max</label>
                <input
                  type="number"
                  placeholder="e.g. 900"
                  className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                  value={filterScoreMax}
                  onChange={(e) => setFilterScoreMax(e.target.value)}
                />
              </div>

              {/* Risk Filter */}
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Risk Level</label>
                <select
                  className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                  value={filterRisk}
                  onChange={(e) => setFilterRisk(e.target.value)}
                >
                  <option value="">All Levels</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium"
            >
              <X size={12} /> Clear all filters
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">PAN / Mobile</th>
                  {role === 'admin' && (
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Partner</th>
                  )}
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Report Type</th>
                  <th
                    className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground select-none"
                    onClick={() => toggleSort('creditScore')}
                  >
                    <span className="flex items-center gap-1">
                      Score <ArrowUpDown size={11} />
                    </span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Risk</th>
                  <th
                    className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground select-none"
                    onClick={() => toggleSort('pulledAt')}
                  >
                    <span className="flex items-center gap-1">
                      Date / Time <ArrowUpDown size={11} />
                    </span>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={role === 'admin' ? 8 : 7} className="text-center py-12 text-muted-foreground text-sm">
                      No records found. {hasActiveFilters && 'Try clearing filters.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{record.customerName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{record.reportId}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs text-foreground">{record.pan}</p>
                        <p className="text-xs text-muted-foreground">+91 {record.mobile}</p>
                      </td>
                      {role === 'admin' && (
                        <td className="px-4 py-3 text-xs text-foreground">{record.partnerName}</td>
                      )}
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {record.reportType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-base font-bold font-tabular ${scoreColor(record.creditScore, record.reportType)}`}>
                          {record.creditScore}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${riskBadgeClass(record.riskLevel)}`}>
                          {record.riskLevel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{record.pulledAt}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/customer-master/${record.id}${role === 'admin' ? '?role=admin' : ''}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline group-hover:gap-2 transition-all"
                        >
                          View <ChevronRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {filtered.length > 0 && (
            <div className="px-4 py-3 border-t border-border bg-slate-50 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{filtered.length}</span> of{' '}
                <span className="font-semibold text-foreground">{baseRecords.length}</span> records
              </p>
              {role === 'admin' && (
                <p className="text-xs text-muted-foreground">
                  Across <span className="font-semibold text-foreground">{partners.length}</span> partners
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
