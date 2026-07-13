'use client';

import React from 'react';
import { X, FileText, User, TrendingUp, CreditCard, AlertTriangle, XCircle, Download } from 'lucide-react';
import type { BureauPull } from '../page';
import { downloadAuthenticatedFile } from '@/lib/supabase/auth-fetch';

interface Props {
  pull: BureauPull;
  onClose: () => void;
}

function scoreColor(score: number | null) {
  if (!score) return 'text-slate-400';
  if (score >= 750) return 'text-emerald-600';
  if (score >= 650) return 'text-amber-600';
  return 'text-red-500';
}

function scoreBg(score: number | null) {
  if (!score) return 'bg-slate-50 border-slate-200';
  if (score >= 750) return 'bg-emerald-50 border-emerald-200';
  if (score >= 650) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}

function dpdColor(tag: string | null) {
  if (!tag) return 'bg-slate-50 text-slate-500 border-slate-200';
  const t = tag.toUpperCase();
  if (t === 'LOW') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (t === 'MED' || t === 'MEDIUM') return 'bg-orange-50 text-orange-700 border-orange-200';
  if (t === 'HIGH') return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-slate-50 text-slate-500 border-slate-200';
}

function formatBalance(val: number | null) {
  if (val === null || val === undefined) return '—';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
  return `₹${val}`;
}

function shortMemberRef(value: string | null) {
  if (!value) return '—';
  if (/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value)) {
    return `CT-${value.replace(/-/g, '').slice(-6).toUpperCase()}`;
  }
  if (/^(LIVE|DEMO)-\d+$/i.test(value)) {
    return `CT-${value.slice(-6)}`;
  }
  return value;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-500 font-medium w-36 flex-shrink-0">{label}</span>
      <span className="text-xs text-slate-800 text-right flex-1">{value ?? '—'}</span>
    </div>
  );
}

export default function BureauReportModal({ pull, onClose }: Props) {
  const isFailed = pull.status === 'failed';
  const isCommercial = pull.report_type === 'commercial';
  const downloadFilename = `${pull.customer_name || 'bureau-report'}-${pull.report_id || pull.id}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') + '.pdf';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-start justify-between z-10 rounded-t-2xl">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <FileText size={16} className="text-blue-600" />
              <h2 className="text-base font-semibold text-slate-800">Bureau Report Detail</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                isFailed
                  ? 'bg-red-50 text-red-600 border-red-200' :'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {isFailed ? 'Failed' : 'Success'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold capitalize">
                {pull.report_type}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {pull.report_id ? `Report ID: ${pull.report_id} · ` : ''}
              {new Date(pull.created_at).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: false,
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Failed state */}
          {isFailed && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
              <XCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">Pull Failed</p>
                <p className="text-xs text-red-600 mt-0.5">
                  {pull.error_message ?? 'Bureau returned an error for this pull. No report data available.'}
                </p>
              </div>
            </div>
          )}

          {/* Score card */}
          {!isFailed && pull.credit_score && (
            <div className={`flex items-center gap-5 p-5 rounded-xl border ${scoreBg(pull.credit_score)}`}>
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-1">Bureau Score</p>
                <p className={`text-5xl font-bold tabular-nums ${scoreColor(pull.credit_score)}`}>
                  {pull.credit_score}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {isCommercial ? 'Range: 1–100' : 'Range: 300–900'}
                </p>
              </div>
              <div className="flex-1 space-y-2">
                {pull.dpd_tag && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-20">DPD Status</span>
                    <span className={`text-xs px-2.5 py-1 rounded font-semibold border ${dpdColor(pull.dpd_tag)}`}>
                      {pull.dpd_tag.toUpperCase()}
                    </span>
                  </div>
                )}
                {pull.loan_types && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-slate-500 w-20 flex-shrink-0">Loan Types</span>
                    <span className="text-xs text-slate-700">{pull.loan_types}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Customer Info */}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <User size={14} className="text-slate-500" />
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Customer Information</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <div>
                <InfoRow label="Name" value={pull.customer_name} />
                <InfoRow label="PAN" value={<span className="font-mono uppercase">{pull.pan}</span>} />
                <InfoRow label="Member Ref" value={<span className="font-mono" title={pull.member_ref ?? ''}>{shortMemberRef(pull.member_ref)}</span>} />
                <InfoRow label="Date of Birth" value={pull.dob} />
              </div>
              <div>
                <InfoRow label="Gender" value={pull.gender} />
                <InfoRow label="Occupation Code" value={pull.occupation_code} />
                <InfoRow label="State" value={pull.state} />
                <InfoRow label="Income" value={pull.income ? `₹${Number(pull.income).toLocaleString('en-IN')}` : null} />
              </div>
            </div>
          </div>

          {/* Trade Line Summary */}
          {!isFailed && (
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-slate-500" />
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Trade Line Summary</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Trades', value: pull.total_trades },
                  { label: 'Active TL', value: pull.active_trade_lines },
                  { label: 'Enquiries', value: pull.total_enquiries },
                  { label: 'DPD Tag', value: pull.dpd_tag },
                ].map(item => (
                  <div key={item.label} className="bg-white rounded-lg p-3 border border-slate-200 text-center">
                    <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                    <p className="text-base font-bold text-slate-800">{item.value ?? '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financial Summary */}
          {!isFailed && (
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard size={14} className="text-slate-500" />
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Financial Summary</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <p className="text-xs text-slate-400 mb-1">Current Balance</p>
                  <p className="text-lg font-bold text-slate-800">{formatBalance(pull.current_balance)}</p>
                </div>
                <div className={`bg-white rounded-lg p-3 border ${pull.overdue_amount && pull.overdue_amount > 0 ? 'border-red-200' : 'border-slate-200'}`}>
                  <p className="text-xs text-slate-400 mb-1">Overdue Amount</p>
                  <p className={`text-lg font-bold ${pull.overdue_amount && pull.overdue_amount > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                    {pull.overdue_amount && pull.overdue_amount > 0 ? formatBalance(pull.overdue_amount) : '—'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Raw JSON (collapsible) */}
          {pull.raw_json && Object.keys(pull.raw_json).length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2 py-2 hover:text-slate-700">
                <FileText size={13} />
                Raw Bureau JSON
                <span className="text-slate-400 font-normal normal-case">(click to expand)</span>
              </summary>
              <pre className="mt-2 p-4 bg-slate-900 text-emerald-400 text-xs rounded-xl overflow-x-auto max-h-64 font-mono leading-relaxed">
                {JSON.stringify(pull.raw_json, null, 2)}
              </pre>
            </details>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              {isFailed ? (
                <><AlertTriangle size={12} className="text-red-400" /> Pull failed — no credits deducted</>
              ) : (
                <></>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isFailed && (
                <button
                  type="button"
                  onClick={() => downloadAuthenticatedFile(`/api/bureau-report-pdf?source=bureau_pulls&id=${encodeURIComponent(pull.id)}`, downloadFilename).catch((error) => alert(error.message))}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download size={14} />
                  Download PDF
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
