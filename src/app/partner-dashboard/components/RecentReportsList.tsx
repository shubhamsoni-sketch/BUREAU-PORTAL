'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';

type ReportStatus = 'Success' | 'Failed' | 'Pending';

type ReportEntry = {
  id: string;
  customerName: string;
  panNumber: string;
  mobile: string;
  reportDate: string;
  reportTime: string;
  cibilScore: number | null;
  status: ReportStatus;
  cost: string;
  purpose: string;
};

const recentReports: ReportEntry[] = [
  {
    id: 'report-001',
    customerName: 'Vikram Mehta',
    panNumber: 'ABCVM4321F',
    mobile: '+91 98765 00001',
    reportDate: '01 Apr 2026',
    reportTime: '10:32 AM',
    cibilScore: 762,
    status: 'Success',
    cost: '₹50',
    purpose: 'Home Loan',
  },
  {
    id: 'report-002',
    customerName: 'Sneha Patil',
    panNumber: 'DEFSP8812G',
    mobile: '+91 97654 00002',
    reportDate: '01 Apr 2026',
    reportTime: '09:15 AM',
    cibilScore: 681,
    status: 'Success',
    cost: '₹50',
    purpose: 'Personal Loan',
  },
  {
    id: 'report-003',
    customerName: 'Rohan Gupta',
    panNumber: 'GHIRG5543H',
    mobile: '+91 96543 00003',
    reportDate: '01 Apr 2026',
    reportTime: '08:50 AM',
    cibilScore: null,
    status: 'Failed',
    cost: '₹0',
    purpose: 'Car Loan',
  },
  {
    id: 'report-004',
    customerName: 'Ananya Desai',
    panNumber: 'JKLAD2201J',
    mobile: '+91 95432 00004',
    reportDate: '31 Mar 2026',
    reportTime: '05:45 PM',
    cibilScore: 718,
    status: 'Success',
    cost: '₹50',
    purpose: 'Business Loan',
  },
  {
    id: 'report-005',
    customerName: 'Manoj Tiwari',
    panNumber: 'MNOPT3312K',
    mobile: '+91 94321 00005',
    reportDate: '31 Mar 2026',
    reportTime: '04:22 PM',
    cibilScore: 590,
    status: 'Success',
    cost: '₹50',
    purpose: 'Personal Loan',
  },
  {
    id: 'report-006',
    customerName: 'Pooja Srivastava',
    panNumber: 'QRUPS6654L',
    mobile: '+91 93210 00006',
    reportDate: '31 Mar 2026',
    reportTime: '02:10 PM',
    cibilScore: null,
    status: 'Pending',
    cost: '₹50',
    purpose: 'Gold Loan',
  },
  {
    id: 'report-007',
    customerName: 'Karthik Nambiar',
    panNumber: 'STUVN7765M',
    mobile: '+91 92109 00007',
    reportDate: '30 Mar 2026',
    reportTime: '11:58 AM',
    cibilScore: 800,
    status: 'Success',
    cost: '₹50',
    purpose: 'Home Loan',
  },
  {
    id: 'report-008',
    customerName: 'Divya Krishnan',
    panNumber: 'WXYZK8876N',
    mobile: '+91 91098 00008',
    reportDate: '30 Mar 2026',
    reportTime: '10:05 AM',
    cibilScore: 645,
    status: 'Success',
    cost: '₹50',
    purpose: 'Mortgage',
  },
];

function scoreColor(score: number | null) {
  if (!score) return 'text-muted-foreground';
  if (score >= 750) return 'text-emerald-600';
  if (score >= 650) return 'text-amber-600';
  return 'text-red-600';
}

function scoreBg(score: number | null) {
  if (!score) return 'bg-gray-50';
  if (score >= 750) return 'bg-emerald-50';
  if (score >= 650) return 'bg-amber-50';
  return 'bg-red-50';
}

export default function RecentReportsList() {
  const [searchReport, setSearchReport] = useState('');

  const filtered = recentReports.filter((r) =>
    !searchReport ||
    r.customerName.toLowerCase().includes(searchReport.toLowerCase()) ||
    r.panNumber.toLowerCase().includes(searchReport.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl border border-border shadow-card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Icon name="ClipboardDocumentListIcon" size={18} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Recent Report Pulls</h2>
          <span className="badge badge-blue ml-1">{recentReports.length} total</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Icon name="MagnifyingGlassIcon" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              className="input-base pl-8 h-8 text-xs w-52"
              placeholder="Search by name or PAN..."
              value={searchReport}
              onChange={(e) => setSearchReport(e.target.value)}
              aria-label="Search reports"
            />
          </div>
          <a href="/reports-history" className="btn-secondary text-xs h-8 px-3">
            View All Reports
          </a>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[900px]" role="table">
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              {['Customer Name', 'PAN Number', 'Purpose', 'Date & Time', 'CIBIL Score', 'Status', 'Cost', ''].map((col, i) => (
                <th key={`rth-${i + 1}`} className="table-th">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState
                    iconName="DocumentMagnifyingGlassIcon"
                    title="No reports found"
                    description="No report pulls match your search. Try a different customer name or PAN number."
                  />
                </td>
              </tr>
            ) : (
              filtered.map((report) => (
                <tr
                  key={report.id}
                  className="border-b border-border hover:bg-muted/30 transition-colors duration-150"
                >
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                        {report.customerName.charAt(0)}
                      </div>
                      <span className="font-medium text-foreground">{report.customerName}</span>
                    </div>
                  </td>
                  <td className="table-td">
                    <span className="font-mono text-xs text-muted-foreground">{report.panNumber}</span>
                  </td>
                  <td className="table-td">
                    <span className="text-xs text-muted-foreground">{report.purpose}</span>
                  </td>
                  <td className="table-td">
                    <div>
                      <p className="text-sm text-foreground">{report.reportDate}</p>
                      <p className="text-xs text-muted-foreground">{report.reportTime}</p>
                    </div>
                  </td>
                  <td className="table-td">
                    {report.cibilScore ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-sm font-bold font-tabular ${scoreBg(report.cibilScore)} ${scoreColor(report.cibilScore)}`}>
                        {report.cibilScore}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="table-td">
                    <Badge
                      variant={
                        report.status === 'Success' ? 'active' :
                        report.status === 'Failed'? 'suspended' : 'pending'
                      }
                      dot
                    >
                      {report.status}
                    </Badge>
                  </td>
                  <td className="table-td font-tabular text-sm text-foreground">{report.cost}</td>
                  <td className="table-td text-right">
                    {report.status === 'Success' && (
                      <button
                        className="relative p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-blue-600 transition-all duration-150 group/btn"
                        aria-label={`Download report for ${report.customerName}`}
                      >
                        <Icon name="ArrowDownTrayIcon" size={14} />
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity z-50">
                          Download Report
                        </span>
                      </button>
                    )}
                    {report.status === 'Failed' && (
                      <button
                        className="relative p-1.5 rounded-md text-muted-foreground hover:bg-amber-50 hover:text-amber-600 transition-all duration-150 group/btn"
                        aria-label={`Retry report for ${report.customerName}`}
                      >
                        <Icon name="ArrowPathIcon" size={14} />
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity z-50">
                          Retry Pull
                        </span>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/10">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {recentReports.filter((r) => r.status === 'Success').length} Successful
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            {recentReports.filter((r) => r.status === 'Failed').length} Failed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {recentReports.filter((r) => r.status === 'Pending').length} Pending
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          Total spend this period:{' '}
          <span className="font-semibold text-foreground font-tabular">₹350</span>
        </span>
      </div>
    </div>
  );
}