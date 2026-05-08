'use client';

import React, { useState, useMemo, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import { Search, RefreshCw, IndianRupee, TrendingUp, CreditCard, User, FileText, Filter, X,  } from 'lucide-react';

interface Payment {
  id: string;
  partner_id: string;
  partner_name: string;
  partner_email: string;
  invoice_id: string | null;
  invoice_number: string;
  amount: number;
  credits_added: number;
  payment_mode: string;
  utr_number: string | null;
  source: string;
  paid_at: string;
  created_at: string;
}

const PAYMENT_MODE_COLORS: Record<string, string> = {
  'Bank Transfer': 'bg-blue-50 text-blue-700 border-blue-200',
  'UPI': 'bg-purple-50 text-purple-700 border-purple-200',
  'NEFT': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'IMPS': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Cheque': 'bg-amber-50 text-amber-700 border-amber-200',
  'Cash': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Stripe': 'bg-violet-50 text-violet-700 border-violet-200',
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch {
    return iso;
  }
}

export default function AdminPaymentsPage() {
  const supabase = createClient();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState('All');
  const [partnerFilter, setPartnerFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  async function fetchPayments() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin-payments-list');
      const json = await res.json();
      if (json.payments) {
        setPayments(json.payments as Payment[]);
      }
    } catch (err) {
      console.error('[AdminPayments] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  const uniquePartners = useMemo(() => {
    const names = [...new Set(payments.map((p) => p.partner_name))].sort();
    return names;
  }, [payments]);

  const uniqueModes = useMemo(() => {
    const modes = [...new Set(payments.map((p) => p.payment_mode))].sort();
    return modes;
  }, [payments]);

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        p.partner_name.toLowerCase().includes(q) ||
        p.invoice_number.toLowerCase().includes(q) ||
        (p.utr_number ?? '').toLowerCase().includes(q);

      const matchMode = modeFilter === 'All' || p.payment_mode === modeFilter;
      const matchPartner = partnerFilter === 'All' || p.partner_name === partnerFilter;

      let matchDate = true;
      if (dateFrom) {
        matchDate = matchDate && new Date(p.paid_at) >= new Date(dateFrom);
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        matchDate = matchDate && new Date(p.paid_at) <= toDate;
      }

      return matchSearch && matchMode && matchPartner && matchDate;
    });
  }, [payments, search, modeFilter, partnerFilter, dateFrom, dateTo]);

  const totalCollected = payments.reduce((s, p) => s + Number(p.amount), 0);
  const thisMonthTotal = payments
    .filter((p) => {
      const d = new Date(p.paid_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, p) => s + Number(p.amount), 0);

  const modeBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    payments.forEach((p) => {
      breakdown[p.payment_mode] = (breakdown[p.payment_mode] || 0) + Number(p.amount);
    });
    return Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
  }, [payments]);

  const hasActiveFilters = modeFilter !== 'All' || partnerFilter !== 'All' || dateFrom || dateTo;

  function clearFilters() {
    setModeFilter('All');
    setPartnerFilter('All');
    setDateFrom('');
    setDateTo('');
  }

  return (
    <AdminLayout title="Payments">
      <div className="p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                <IndianRupee size={14} className="text-emerald-600" />
              </div>
              <p className="text-xs text-slate-500 font-medium">Total Collected</p>
            </div>
            <p className="text-2xl font-bold font-mono text-emerald-600">₹{totalCollected.toLocaleString('en-IN')}</p>
            <p className="text-xs text-slate-400 mt-1">{payments.length} payments</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <TrendingUp size={14} className="text-blue-600" />
              </div>
              <p className="text-xs text-slate-500 font-medium">This Month</p>
            </div>
            <p className="text-2xl font-bold font-mono text-blue-600">₹{thisMonthTotal.toLocaleString('en-IN')}</p>
            <p className="text-xs text-slate-400 mt-1">
              {new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                <User size={14} className="text-purple-600" />
              </div>
              <p className="text-xs text-slate-500 font-medium">Partners Paid</p>
            </div>
            <p className="text-2xl font-bold font-mono text-purple-600">
              {new Set(payments.map((p) => p.partner_id)).size}
            </p>
            <p className="text-xs text-slate-400 mt-1">Unique partners</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                <CreditCard size={14} className="text-amber-600" />
              </div>
              <p className="text-xs text-slate-500 font-medium">Top Mode</p>
            </div>
            <p className="text-2xl font-bold text-amber-600 truncate">
              {modeBreakdown[0]?.[0] ?? '—'}
            </p>
            {modeBreakdown[0] && (
              <p className="text-xs text-slate-400 mt-1">₹{Number(modeBreakdown[0][1]).toLocaleString('en-IN')}</p>
            )}
          </div>
        </div>

        {/* Mode Breakdown */}
        {modeBreakdown.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Payment Mode Breakdown</h3>
            <div className="flex flex-wrap gap-3">
              {modeBreakdown.map(([mode, amount]) => (
                <div key={mode} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${PAYMENT_MODE_COLORS[mode] ?? 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                  <span>{mode}</span>
                  <span className="font-mono font-bold">₹{Number(amount).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search partner, invoice, UTR..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${showFilters || hasActiveFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
            >
              <Filter size={14} />
              Filters
              {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </button>
            <button
              onClick={fetchPayments}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={14} className="text-slate-400" />
            </button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
              <div className="flex flex-col gap-1 min-w-40">
                <label className="text-xs font-medium text-slate-500">Partner</label>
                <select
                  value={partnerFilter}
                  onChange={(e) => setPartnerFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                >
                  <option value="All">All Partners</option>
                  {uniquePartners.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1 min-w-40">
                <label className="text-xs font-medium text-slate-500">Payment Mode</label>
                <select
                  value={modeFilter}
                  onChange={(e) => setModeFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                >
                  <option value="All">All Modes</option>
                  {uniqueModes.map((mode) => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              {hasActiveFilters && (
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <X size={13} />
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-800">Confirmed Payments</h2>
              <p className="text-xs text-slate-400 mt-0.5">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-12 text-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-400">Loading payments...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center">
                <IndianRupee size={28} className="text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No payment records found</p>
                <p className="text-xs text-slate-300 mt-1">Payments appear here when invoices are marked as paid</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Partner</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Invoice</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Mode</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">UTR / Ref</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Paid On</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((pay) => (
                    <tr key={pay.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-slate-800">{pay.partner_name}</p>
                        <p className="text-xs text-slate-400">{pay.partner_email}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <FileText size={12} className="text-slate-400 flex-shrink-0" />
                          <span className="text-xs font-mono text-slate-600">{pay.invoice_number}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{pay.credits_added.toLocaleString('en-IN')} credits</p>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="font-semibold font-mono text-slate-800">₹{Number(pay.amount).toLocaleString('en-IN')}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${PAYMENT_MODE_COLORS[pay.payment_mode] ?? 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                          {pay.payment_mode}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {pay.utr_number ? (
                          <span className="text-xs font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                            {pay.utr_number}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                        {formatDateTime(pay.paid_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
