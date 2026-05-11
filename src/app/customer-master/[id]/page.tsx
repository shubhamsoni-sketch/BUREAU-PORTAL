'use client';

import React, { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import { useCustomerMaster } from '@/context/CustomerMasterContext';
import {
  ArrowLeft,
  User,
  Phone,
  CreditCard,
  Shield,
  Calendar,
  Building2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

function riskBadgeClass(level: string) {
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

function scoreBg(score: number, reportType: string) {
  if (reportType === 'Commercial Bureau') {
    if (score >= 70) return 'bg-emerald-50 border-emerald-200';
    if (score >= 50) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  }
  if (score >= 750) return 'bg-emerald-50 border-emerald-200';
  if (score >= 650) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { records } = useCustomerMaster();
  const [showRaw, setShowRaw] = useState(false);

  const role = searchParams.get('role') === 'admin' ? 'admin' : 'partner';
  const record = records.find((r) => r.id === params.id);

  if (!record) {
    return (
      <AppLayout role={role}>
        <Topbar title="Customer Detail" role={role} />
        <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AlertTriangle size={40} className="text-amber-400" />
          <p className="text-base font-semibold text-foreground">Record not found</p>
          <p className="text-sm text-muted-foreground">This customer record may have been removed or the ID is invalid.</p>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft size={15} /> Go back
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role={role}>
      <Topbar
        title="Customer Detail"
        subtitle={`Record: ${record.reportId}`}
        role={role}
      />

      <div className="p-6 max-w-3xl mx-auto fade-in space-y-5">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft size={15} /> Back to Customer Master
        </button>

        {/* Score Hero */}
        <div className={`rounded-xl border p-6 flex flex-col sm:flex-row sm:items-center gap-5 ${scoreBg(record.creditScore, record.reportType)}`}>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                {record.reportType}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${riskBadgeClass(record.riskLevel)}`}>
                {record.riskLevel} Risk
              </span>
            </div>
            <h2 className="text-xl font-bold text-foreground mt-2">{record.customerName}</h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{record.reportId}</p>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-xs text-muted-foreground mb-1">Credit Score</p>
            <p className={`text-5xl font-bold font-tabular ${scoreColor(record.creditScore, record.reportType)}`}>
              {record.creditScore}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {record.reportType === 'Commercial Bureau' ? 'Range: 1–100' : 'Range: 300–900'}
            </p>
          </div>
        </div>

        {/* Customer Details */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Customer Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <User size={15} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Full Name</p>
                <p className="text-sm font-semibold text-foreground">{record.customerName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Phone size={15} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Mobile</p>
                <p className="text-sm font-semibold text-foreground font-mono">+91 {record.mobile}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <CreditCard size={15} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">PAN Number</p>
                <p className="text-sm font-semibold text-foreground font-mono tracking-widest">{record.pan}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Shield size={15} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Aadhaar</p>
                <p className="text-sm font-semibold text-foreground font-mono">XXXX XXXX {record.aadhaar.slice(-4)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Report Meta */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Report Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <FileText size={15} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Report ID</p>
                <p className="text-sm font-semibold text-foreground font-mono">{record.reportId}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Calendar size={15} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pulled At</p>
                <p className="text-sm font-semibold text-foreground">{record.pulledAt}</p>
              </div>
            </div>

            {role === 'admin' && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Building2 size={15} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Partner</p>
                  <p className="text-sm font-semibold text-foreground">{record.partnerName}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={15} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Status</p>
                <p className="text-sm font-semibold text-emerald-600">Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Raw JSON */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
          >
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Raw Report JSON</p>
              <p className="text-xs text-muted-foreground mt-0.5">Mock bureau response data</p>
            </div>
            {showRaw ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
          </button>
          {showRaw && (
            <div className="border-t border-border px-5 py-4 bg-slate-950">
              <pre className="text-xs text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(record.rawJson, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
