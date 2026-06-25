'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { crmFetch } from '@/lib/crm/api';

type LenderMatch = {
  name: string;
  roi: string;
  maxLoan: string;
  approvalRate?: number;
  tat?: string;
};

type Lead = {
  id: string;
  name: string;
  mobile: string;
  product: string;
  loanAmount: number;
  city: string;
  assignedAgent: string;
  stage: string;
  eligibilityReportId?: string;
  selectedLender?: string;
};

type Report = {
  id: string;
  borrower_name: string;
  mobile: string;
  loan_type: string;
  loan_amount: number;
  score: number | null;
  eligible: boolean;
  status: string;
  foir: number;
  max_loan_amount: number;
  matched_lenders: LenderMatch[];
  created_at: string;
};

type SelectionRow = {
  lead: Lead;
  report: Report;
};

type CreatedApplication = {
  id: string;
  customerName: string;
  lenderName: string;
};

const formatINR = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const formatProduct = (value: string) => value.replace(/_/g, ' ');

export default function LenderSelectionContent() {
  const [rows, setRows] = useState<SelectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeLeadId, setActiveLeadId] = useState('');
  const [selectionOpen, setSelectionOpen] = useState(false);
  const [submitting, setSubmitting] = useState('');
  const [createdApplication, setCreatedApplication] = useState<CreatedApplication | null>(null);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await crmFetch('/api/crm/eligibility-check', { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || 'Unable to load data');

      const leads = Array.isArray(json.data?.leads) ? (json.data.leads as Lead[]) : [];
      const reports = Array.isArray(json.data?.reports) ? (json.data.reports as Report[]) : [];
      const reportById = new Map(reports.map((report) => [report.id, report]));
      const nextRows = leads
        .filter((lead) => lead.eligibilityReportId)
        .map((lead) => {
          const report = reportById.get(String(lead.eligibilityReportId));
          return report ? { lead, report } : null;
        })
        .filter((item): item is SelectionRow => Boolean(item))
        .filter(
          ({ report }) => Array.isArray(report.matched_lenders) && report.matched_lenders.length > 0
        )
        .sort(
          (a, b) =>
            new Date(b.report.created_at).getTime() - new Date(a.report.created_at).getTime()
        );

      setRows(nextRows);
      setActiveLeadId((current) =>
        current && nextRows.some((row) => row.lead.id === current)
          ? current
          : nextRows[0]?.lead.id || ''
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load lender selection');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const requestedLeadId =
      typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('lead') : '';
    if (requestedLeadId) {
      setActiveLeadId(requestedLeadId);
      setSelectionOpen(true);
    }
    loadData();
  }, []);

  const filteredRows = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return rows;
    return rows.filter(({ lead, report }) =>
      [lead.name, lead.mobile, lead.city, lead.product, report.borrower_name]
        .join(' ')
        .toLowerCase()
        .includes(search)
    );
  }, [query, rows]);

  const activeRow = filteredRows.find((row) => row.lead.id === activeLeadId) || filteredRows[0];
  const pendingCount = rows.filter((row) => !row.lead.selectedLender).length;
  const selectedCount = rows.length - pendingCount;

  const submitToLender = async (leadId: string, lenderName: string) => {
    setSubmitting(`${leadId}-${lenderName}`);
    setCreatedApplication(null);
    setError('');
    try {
      const response = await crmFetch('/api/crm/eligibility-check', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'submit_to_lender', leadId, lenderName }),
      });
      const json = await response.json();
      if (!response.ok || !json.success)
        throw new Error(json.error || 'Unable to create application');
      const application = json.data?.application;
      setCreatedApplication({
        id: application?.id || '',
        customerName: application?.customerName || 'Lead',
        lenderName,
      });
      await loadData();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to select lender');
    } finally {
      setSubmitting('');
    }
  };

  return (
    <div className="px-4 lg:px-6 xl:px-8 py-6 max-w-screen-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-700 text-foreground">Lender Selection</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Select the right lender for eligibility-checked leads
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
          {[
            ['Ready', pendingCount],
            ['Selected', selectedCount],
            ['Total', rows.length],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-sm border border-border bg-card px-3 py-2">
              <p className="text-[10px] font-700 uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className="text-lg font-800 text-foreground tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {createdApplication && (
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-success/20 bg-success/5 p-3">
          <p className="text-xs font-700 text-success">
            File process created for {createdApplication.customerName} with{' '}
            {createdApplication.lenderName}.
          </p>
          <Link
            href={`/crm/loan-application-tracking?application=${encodeURIComponent(createdApplication.id)}`}
            className="inline-flex h-8 items-center justify-center rounded-sm bg-success px-3 text-xs font-700 text-white hover:bg-success/90"
          >
            View File
          </Link>
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-danger/20 bg-danger/5 p-3 text-xs font-700 text-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5">
        <section className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h2 className="text-sm font-700 text-foreground">Eligibility Checked Files</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Use Select Lender to open lender details and move a file to File Process
                </p>
              </div>
              <button
                onClick={loadData}
                className="h-8 px-3 rounded-sm border border-border bg-background text-xs font-700 text-foreground hover:bg-muted"
              >
                Refresh
              </button>
            </div>
            <div className="relative">
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
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
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search lead..."
                className="w-full h-9 pl-8 pr-3 rounded-sm border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            {loading ? (
              <div className="p-6 text-sm text-muted-foreground">Loading lender selection...</div>
            ) : filteredRows.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                No eligibility-checked lead with lender match found.
              </div>
            ) : (
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    {[
                      'File',
                      'Product',
                      'Amount',
                      'Score',
                      'FOIR',
                      'Matches',
                      'Current Lender',
                      'Agent',
                      '',
                    ].map((column) => (
                      <th
                        key={column}
                        className="px-4 py-3 text-left text-[11px] font-700 uppercase tracking-wide text-muted-foreground whitespace-nowrap"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRows.map(({ lead, report }) => (
                    <tr
                      key={lead.id}
                      className={[
                        'hover:bg-muted/30 transition-colors',
                        selectionOpen && activeRow?.lead.id === lead.id ? 'bg-primary/5' : '',
                      ].join(' ')}
                    >
                      <td className="px-4 py-3">
                        <p className="text-xs font-700 text-foreground">{lead.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {lead.mobile} · {lead.city || 'City pending'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs capitalize text-foreground">
                        {formatProduct(lead.product)}
                      </td>
                      <td className="px-4 py-3 text-xs font-700 text-foreground">
                        {formatINR(lead.loanAmount)}
                      </td>
                      <td className="px-4 py-3 text-xs font-800 text-foreground">
                        {report.score || '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {report.foir || 0}%
                      </td>
                      <td className="px-4 py-3 text-xs font-700 text-primary">
                        {report.matched_lenders.length}
                      </td>
                      <td className="px-4 py-3">
                        {lead.selectedLender ? (
                          <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-700 text-success">
                            {lead.selectedLender}
                          </span>
                        ) : (
                          <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-700 text-warning">
                            Ready
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {lead.assignedAgent}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setActiveLeadId(lead.id);
                            setSelectionOpen(true);
                          }}
                          className="h-8 px-3 rounded-sm bg-primary text-primary-foreground text-xs font-700 hover:bg-primary/90"
                        >
                          Select Lender
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {selectionOpen && activeRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm">
          <section className="w-full max-w-5xl max-h-[88vh] overflow-hidden rounded-lg border border-border bg-card shadow-modal">
            <div className="flex items-start justify-between gap-4 border-b border-border p-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-800 text-foreground">{activeRow.lead.name}</h2>
                  {activeRow.lead.selectedLender && (
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-700 text-success">
                      Sent to {activeRow.lead.selectedLender}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeRow.lead.mobile} · {formatProduct(activeRow.lead.product)} ·{' '}
                  {formatINR(activeRow.lead.loanAmount)}
                </p>
              </div>
              <button
                onClick={() => setSelectionOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close lender selection"
              >
                <svg
                  width="14"
                  height="14"
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

            <div className="max-h-[calc(88vh-88px)] overflow-y-auto p-5 scrollbar-thin">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5">
                <MiniStat label="Score" value={activeRow.report.score || '-'} large />
                <MiniStat label="FOIR" value={`${activeRow.report.foir || 0}%`} large />
                <MiniStat
                  label="Max Loan"
                  value={formatINR(activeRow.report.max_loan_amount)}
                  large
                />
              </div>

              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-700 text-foreground">Eligible Lenders</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Choose or change lender, then move the file into File Process
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {activeRow.report.matched_lenders.map((lender, index) => {
                  const isSelected = activeRow.lead.selectedLender === lender.name;
                  const canSwitch = Boolean(activeRow.lead.selectedLender && !isSelected);
                  const submitKey = `${activeRow.lead.id}-${lender.name}`;
                  return (
                    <div
                      key={`${activeRow.lead.id}-${lender.name}`}
                      className={[
                        'rounded-lg border p-4 transition-colors',
                        isSelected
                          ? 'border-success bg-success/5'
                          : 'border-border bg-background hover:border-primary/40',
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-800 text-foreground">{lender.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Option {index + 1} · {lender.tat || 'TAT pending'}
                          </p>
                        </div>
                        {isSelected && (
                          <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-700 text-success">
                            Selected
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 my-4">
                        <MiniStat label="ROI" value={lender.roi} />
                        <MiniStat label="Max Loan" value={lender.maxLoan} />
                        <MiniStat
                          label="Approval"
                          value={
                            typeof lender.approvalRate === 'number'
                              ? `${lender.approvalRate}%`
                              : '-'
                          }
                        />
                      </div>

                      <button
                        onClick={() => submitToLender(activeRow.lead.id, lender.name)}
                        disabled={isSelected || Boolean(submitting)}
                        className={[
                          'w-full h-9 rounded-sm text-xs font-700 transition-colors disabled:opacity-60',
                          isSelected
                            ? 'bg-success/10 text-success'
                            : 'bg-primary text-primary-foreground hover:bg-primary/90',
                        ].join(' ')}
                      >
                        {isSelected
                          ? 'File Created'
                          : submitting === submitKey
                            ? 'Creating...'
                            : canSwitch
                              ? 'Send to This Lender'
                              : 'Create File Process'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  large = false,
}: {
  label: string;
  value: string | number;
  large?: boolean;
}) {
  return (
    <div className="rounded-sm border border-border bg-muted/30 px-2.5 py-2">
      <p className="text-[10px] font-700 uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={[
          'font-800 text-foreground tabular-nums truncate',
          large ? 'text-sm mt-0.5' : 'text-xs mt-0.5',
        ].join(' ')}
      >
        {value}
      </p>
    </div>
  );
}
