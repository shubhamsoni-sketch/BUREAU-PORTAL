'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { crmFetch } from '@/lib/crm/api';
import { downloadAuthenticatedFile } from '@/lib/supabase/auth-fetch';

interface EligibilityReport {
  id: string;
  borrowerName: string;
  pan: string;
  mobile: string;
  loanType: string;
  loanAmount: number;
  creditScore: number;
  scoreGrade: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  foir: number;
  eligible: boolean;
  matchedLenders: { name: string; roi: string; maxLoan: string }[];
  checkedBy: string;
  checkedOn: string;
  status: 'eligible' | 'not_eligible' | 'pending';
  isLive?: boolean;
}

const formatINR = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${(n / 1000).toFixed(0)}K`;
};

const SCORE_GRADE_COLORS: Record<string, string> = {
  Excellent: 'bg-success/10 text-success',
  Good: 'bg-blue-100 text-blue-700',
  Fair: 'bg-warning/10 text-warning',
  Poor: 'bg-danger/10 text-danger',
};

const STATUS_COLORS: Record<string, string> = {
  eligible: 'bg-success/10 text-success',
  not_eligible: 'bg-danger/10 text-danger',
  pending: 'bg-warning/10 text-warning',
};

const STATUS_LABELS: Record<string, string> = {
  eligible: 'Eligible',
  not_eligible: 'Not Eligible',
  pending: 'Pending',
};

export default function EligibilityReportContent({ embedded = false }: { embedded?: boolean }) {
  const [reports, setReports] = useState<EligibilityReport[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedReport, setSelectedReport] = useState<EligibilityReport | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadReports = async () => {
      try {
        const response = await crmFetch('/api/crm/eligibility-check', { cache: 'no-store' });
        const json = await response.json();
        const liveReports = json?.data?.reports;
        if (!cancelled && Array.isArray(liveReports)) {
          setReports(
            liveReports.map((report: any) => ({
              id: String(report.id || report.request_id),
              borrowerName: String(report.borrower_name || 'Customer'),
              pan: String(report.pan || ''),
              mobile: String(report.mobile || ''),
              loanType: String(report.loan_type || ''),
              loanAmount: Number(report.loan_amount || 0),
              creditScore: Number(report.score || 0),
              scoreGrade:
                Number(report.score || 0) >= 800
                  ? 'Excellent'
                  : Number(report.score || 0) >= 720
                    ? 'Good'
                    : Number(report.score || 0) >= 660
                      ? 'Fair'
                      : 'Poor',
              foir: 0,
              eligible: Boolean(report.eligible),
              matchedLenders: Array.isArray(report.matched_lenders)
                ? report.matched_lenders.map((lender: any) => ({
                    name: String(lender.name || ''),
                    roi: String(lender.roi || ''),
                    maxLoan: String(lender.maxLoan || lender.max_loan || ''),
                  }))
                : [],
              checkedBy: 'CreditTrust CRM',
              checkedOn: report.created_at
                ? new Date(report.created_at).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '',
              status: report.eligible ? 'eligible' : report.score ? 'not_eligible' : 'pending',
              isLive: true,
            }))
          );
        }
      } catch {
        if (!cancelled) setReports([]);
      }
    };
    loadReports();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = reports.filter((r) => {
    const matchSearch =
      r.borrowerName.toLowerCase().includes(search.toLowerCase()) ||
      r.pan.toLowerCase().includes(search.toLowerCase()) ||
      r.mobile.includes(search);
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const scoredReports = reports.filter((r) => r.creditScore > 0);
  const downloadPdf = (report: EligibilityReport) => {
    if (!report.isLive) return;
    const filename = `${report.borrowerName || 'crm-eligibility-report'}-${report.id}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') + '.pdf';
    downloadAuthenticatedFile(
      `/api/bureau-report-pdf?source=crm_eligibility_reports&id=${encodeURIComponent(report.id)}`,
      filename
    ).catch((error) => alert(error.message));
  };
  const stats = {
    total: reports.length,
    eligible: reports.filter((r) => r.status === 'eligible').length,
    notEligible: reports.filter((r) => r.status === 'not_eligible').length,
    pending: reports.filter((r) => r.status === 'pending').length,
    averageScore: scoredReports.length
      ? Math.round(
          scoredReports.reduce((sum, report) => sum + report.creditScore, 0) / scoredReports.length
        )
      : 0,
  };

  return (
    <div className={embedded ? '' : 'px-4 lg:px-6 xl:px-8 py-6 max-w-screen-2xl mx-auto'}>
      {/* Header */}
      {!embedded && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-700 text-foreground">Eligibility Reports</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {stats.total} assessments — {stats.eligible} eligible, {stats.notEligible} not
              eligible
            </p>
          </div>
          <Link
            href="/crm/eligibility-check"
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
            New Check
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Checks', value: stats.total, color: 'text-foreground' },
          { label: 'Eligible', value: stats.eligible, color: 'text-success' },
          { label: 'Not Eligible', value: stats.notEligible, color: 'text-danger' },
          { label: 'Avg Score', value: stats.averageScore || '-', color: 'text-primary' },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-card rounded-lg border border-border shadow-card px-4 py-3"
          >
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-700 mt-1 ${s.color}`}>{s.value}</p>
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
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, PAN, or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-3 rounded-sm border border-input bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-8 px-2 rounded-sm border border-input bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
        >
          <option value="all">All Status</option>
          <option value="eligible">Eligible</option>
          <option value="not_eligible">Not Eligible</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <div className="flex gap-5">
        {/* Table */}
        <div className="flex-1 min-w-0 bg-card rounded-lg border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  {[
                    'Borrower',
                    'PAN',
                    'Loan Type',
                    'Amount',
                    'Credit Score',
                    'FOIR',
                    'Status',
                    'Checked By',
                    'Date',
                    '',
                  ].map((col) => (
                    <th
                      key={col}
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
                      colSpan={10}
                      className="px-4 py-12 text-center text-sm text-muted-foreground"
                    >
                      No reports found
                    </td>
                  </tr>
                ) : (
                  filtered.map((report) => (
                    <tr
                      key={report.id}
                      className={[
                        'hover:bg-muted/30 transition-colors cursor-pointer group',
                        selectedReport?.id === report.id ? 'bg-primary/5' : '',
                      ].join(' ')}
                      onClick={() =>
                        setSelectedReport(selectedReport?.id === report.id ? null : report)
                      }
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-xs font-700 text-foreground">{report.borrowerName}</p>
                          <p className="text-[10px] text-muted-foreground">{report.mobile}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                        {report.pan}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{report.loanType}</td>
                      <td className="px-4 py-3 text-xs font-700 text-foreground">
                        {formatINR(report.loanAmount)}
                      </td>
                      <td className="px-4 py-3">
                        {report.creditScore > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-xs font-700 tabular-nums ${report.creditScore >= 750 ? 'text-success' : report.creditScore >= 680 ? 'text-warning' : 'text-danger'}`}
                            >
                              {report.creditScore}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full font-600 ${SCORE_GRADE_COLORS[report.scoreGrade]}`}
                            >
                              {report.scoreGrade}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {report.foir > 0 ? (
                          <span
                            className={`text-xs font-700 tabular-nums ${report.foir <= 40 ? 'text-success' : report.foir <= 55 ? 'text-warning' : 'text-danger'}`}
                          >
                            {report.foir}%
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-700 ${STATUS_COLORS[report.status]}`}
                        >
                          {STATUS_LABELS[report.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {report.checkedBy}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {report.checkedOn}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              downloadPdf(report);
                            }}
                            disabled={!report.isLive}
                            className="w-7 h-7 flex items-center justify-center rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title={report.isLive ? 'Download report' : 'Sample report'}
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
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
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

        {/* Detail drawer */}
        {selectedReport && (
          <div className="w-72 shrink-0 fade-in">
            <div className="bg-card rounded-lg border border-border shadow-card sticky top-0">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <p className="text-sm font-700 text-foreground">{selectedReport.borrowerName}</p>
                <button
                  onClick={() => setSelectedReport(null)}
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
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-700 ${STATUS_COLORS[selectedReport.status]}`}
                >
                  {STATUS_LABELS[selectedReport.status]}
                </span>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'PAN', value: selectedReport.pan },
                    { label: 'Mobile', value: selectedReport.mobile },
                    { label: 'Loan Type', value: selectedReport.loanType },
                    { label: 'Loan Amount', value: formatINR(selectedReport.loanAmount) },
                    {
                      label: 'Credit Score',
                      value:
                        selectedReport.creditScore > 0
                          ? `${selectedReport.creditScore} (${selectedReport.scoreGrade})`
                          : 'Pending',
                    },
                    {
                      label: 'FOIR',
                      value: selectedReport.foir > 0 ? `${selectedReport.foir}%` : '—',
                    },
                    { label: 'Checked By', value: selectedReport.checkedBy },
                    { label: 'Date', value: selectedReport.checkedOn },
                  ].map((item) => (
                    <div key={item.label} className="bg-muted/40 rounded-sm p-2">
                      <p className="text-[10px] text-muted-foreground">{item.label}</p>
                      <p className="text-xs font-700 text-foreground mt-0.5 break-all">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => downloadPdf(selectedReport)}
                  disabled={!selectedReport.isLive}
                  className="w-full h-8 rounded-sm border border-border text-xs font-600 text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:hover:bg-card"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download PDF Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
