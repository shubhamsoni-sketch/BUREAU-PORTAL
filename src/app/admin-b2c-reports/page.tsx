'use client';

import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Search, RefreshCw, Eye, X, IndianRupee, Users, FileText, AlertCircle } from 'lucide-react';

interface B2CReport {
  id: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
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

function formatDateTime(iso: string | null) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function statusBadge(status: string) {
  if (status.includes('generated')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status.includes('failed')) return 'bg-red-50 text-red-700 border-red-200';
  if (status.includes('payment')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (status.includes('consent')) return 'bg-purple-50 text-purple-700 border-purple-200';
  return 'bg-slate-50 text-slate-700 border-slate-200';
}

export default function AdminB2CReportsPage() {
  const [reports, setReports] = useState<B2CReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selected, setSelected] = useState<B2CReport | null>(null);

  async function fetchReports() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin-b2c-reports');
      const json = await res.json();
      setReports((json.reports as B2CReport[]) ?? []);
    } catch (error) {
      console.error('[AdminB2CReports] fetch error:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReports();
  }, []);

  const statuses = useMemo(() => [...new Set(reports.map((r) => r.status))].sort(), [reports]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.filter((r) => {
      const matchStatus = statusFilter === 'All' || r.status === statusFilter;
      const matchSearch = !q ||
        (r.full_name ?? '').toLowerCase().includes(q) ||
        r.mobile.toLowerCase().includes(q) ||
        (r.email ?? '').toLowerCase().includes(q) ||
        (r.pan ?? '').toLowerCase().includes(q) ||
        (r.report_id ?? '').toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [reports, search, statusFilter]);

  const paidCount = reports.filter((r) => ['payment_success', 'report_processing', 'report_generated'].includes(r.status)).length;
  const generatedCount = reports.filter((r) => r.status === 'report_generated').length;
  const revenue = paidCount * 199;

  return (
    <AdminLayout title="B2C Reports">
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <Users size={18} className="text-blue-600 mb-3" />
            <p className="text-xs text-slate-500">Total Requests</p>
            <p className="text-2xl font-bold text-slate-800">{reports.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <IndianRupee size={18} className="text-emerald-600 mb-3" />
            <p className="text-xs text-slate-500">B2C Revenue</p>
            <p className="text-2xl font-bold text-emerald-600">₹{revenue.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <FileText size={18} className="text-purple-600 mb-3" />
            <p className="text-xs text-slate-500">Reports Generated</p>
            <p className="text-2xl font-bold text-purple-600">{generatedCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <AlertCircle size={18} className="text-amber-600 mb-3" />
            <p className="text-xs text-slate-500">Pending / In Journey</p>
            <p className="text-2xl font-bold text-amber-600">{Math.max(reports.length - generatedCount, 0)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, mobile, email, PAN, report ID..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
            <option value="All">All Status</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={fetchReports} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50">
            <RefreshCw size={14} className={loading ? 'animate-spin text-blue-600' : 'text-slate-500'} />
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-800">Customer Report Requests</h2>
            <p className="text-xs text-slate-400 mt-0.5">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-12 text-center text-sm text-slate-400">Loading B2C reports...</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">No B2C report records found</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Customer', 'Mobile', 'PAN', 'Score', 'Status', 'Consent', 'Report ID', 'Created', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{row.full_name || '-'}</p>
                        <p className="text-xs text-slate-400">{row.email || '-'}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">{row.mobile}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">{row.pan || '-'}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{row.credit_score ?? '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full border text-xs font-medium ${statusBadge(row.status)}`}>{row.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{row.consent_given ? formatDateTime(row.consent_at) : '-'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">{row.report_id || '-'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDateTime(row.created_at)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setSelected(row)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600">
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[86vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800">B2C Report Detail</h3>
                <p className="text-xs text-slate-400">{selected.id}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-full hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[72vh] grid sm:grid-cols-2 gap-4 text-sm">
              {[
                ['Full Name', selected.full_name],
                ['Mobile', selected.mobile],
                ['Email', selected.email],
                ['PAN', selected.pan],
                ['DOB', selected.dob],
                ['Gender', selected.gender],
                ['Address', selected.address],
                ['State', selected.state],
                ['PIN Code', selected.pin_code],
                ['Consent At', formatDateTime(selected.consent_at)],
                ['Status', selected.status],
                ['Credit Score', selected.credit_score?.toString()],
                ['Report ID', selected.report_id],
                ['API Status', selected.api_status],
                ['API Error', selected.api_error],
                ['Created At', formatDateTime(selected.created_at)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs text-slate-400 mb-1">{label}</p>
                  <p className="font-medium text-slate-800 break-words">{value || '-'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
