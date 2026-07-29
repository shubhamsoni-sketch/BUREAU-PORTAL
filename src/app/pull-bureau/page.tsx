'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import { useAuth } from '@/context/AuthContext';
import { getAuthHeaders } from '@/lib/supabase/auth-fetch';
import { updateCachedPartnerWalletData, usePartnerWalletData } from '@/hooks/usePartnerWalletData';
import {
  FileSearch,
  User,
  CheckCircle2,
  ChevronRight,
  Download,
  AlertTriangle,
  Wallet,
  RefreshCw,
  Users,
} from 'lucide-react';
import { useCustomerMaster } from '@/context/CustomerMasterContext';
import Icon from '@/components/ui/AppIcon';


// ─── Types ────────────────────────────────────────────────────────────────────
type ReportType = 'consumer' | 'commercial' | null;
type Step = 1 | 2 | 3;

interface CustomerDetails {
  fullName: string;
  firstName: string;
  middleName: string;
  lastName: string;
  pan: string;
  dob: string;
  gender: string;
  mobile: string;
  addressLine1: string;
  city: string;
  state: string;
  pinCode: string;
  aadhaar: string;
}

interface BureauResult {
  score: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  keyIssues: string[];
  reportId: string;
  generatedAt: string;
}

interface BureauPdfPayload {
  raw_json: unknown;
  report_id: string;
  customer_name: string;
  created_at: string;
}

interface PartnerRates {
  consumer_credit_rate: number;
  commercial_credit_rate: number;
}

const DEFAULT_CONSUMER_RATE = 10;
const DEFAULT_COMMERCIAL_RATE = 15;
const HARD_CODED_CUSTOMER_DETAILS = {
  dob: '2000-01-01',
  gender: 'Male',
  addressLine1: 'CreditTrust Verified Address',
  city: 'Indore',
  state: 'Madhya Pradesh',
  pinCode: '452001',
  aadhaar: '',
};

// ─── Step Indicator ────────────────────────────────────────────────────────────
const steps = [
  { id: 1, label: 'Report Type', icon: FileSearch },
  { id: 2, label: 'Customer Details', icon: User },
  { id: 3, label: 'Result', icon: CheckCircle2 },
];

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, idx) => {
        const Icon = s.icon;
        const done = current > s.id;
        const active = current === s.id;
        return (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-200
                  ${done ? 'bg-emerald-500 border-emerald-500 text-white' : active ? 'bg-primary border-primary text-white' : 'bg-white border-border text-muted-foreground'}`}
              >
                {done ? <CheckCircle2 size={16} /> : <Icon size={16} />}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap ${active ? 'text-primary' : done ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                {s.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-5 rounded ${current > s.id ? 'bg-emerald-400' : 'bg-border'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Score Color ───────────────────────────────────────────────────────────────
function scoreColor(score: number, type: ReportType) {
  if (type === 'commercial') {
    if (score >= 70) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
  }
  if (score >= 750) return 'text-emerald-600';
  if (score >= 650) return 'text-amber-600';
  return 'text-red-600';
}

function riskBadge(level: string) {
  if (level === 'Low') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (level === 'Medium') return 'bg-amber-50 text-amber-700 border border-amber-200';
  return 'bg-red-50 text-red-700 border border-red-200';
}

function emptyDetails(): CustomerDetails {
  return {
    fullName: '',
    firstName: '',
    middleName: '',
    lastName: '',
    pan: '',
    dob: '',
    gender: '',
    mobile: '',
    addressLine1: '',
    city: '',
    state: '',
    pinCode: '',
    aadhaar: '',
  };
}

function getCustomerName(details: CustomerDetails) {
  return details.fullName?.trim() || [details.firstName, details.middleName, details.lastName].map((part) => part.trim()).filter(Boolean).join(' ');
}

function formatDobForApi(dob: string) {
  const [year, month, day] = dob.split('-');
  return `${day}${month}${year}`;
}

function splitFullName(name: string) {
  const parts = name.trim().toUpperCase().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    middleName: parts.length > 2 ? parts.slice(1, -1).join(' ') : '',
    lastName: parts.length > 1 ? parts[parts.length - 1] : '',
  };
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function PullBureauPage() {
  const { user } = useAuth();
  const { addRecord } = useCustomerMaster();
  const { data: walletData, loading: walletDataLoading } = usePartnerWalletData();

  const partnerId = walletData?.partnerId ?? null;
  const walletBalance = walletData?.balance ?? 0;
  const rates: PartnerRates = {
    consumer_credit_rate: Number(
      walletData?.commercials?.consumer_credit_rate ??
      walletData?.commercials?.credit_rate ??
      DEFAULT_CONSUMER_RATE
    ),
    commercial_credit_rate: Number(
      walletData?.commercials?.commercial_credit_rate ??
      walletData?.commercials?.credit_rate ??
      DEFAULT_COMMERCIAL_RATE
    ),
  };
  const ratesLoading = walletDataLoading && !walletData;

  const [step, setStep] = useState<Step>(1);
  const [reportType, setReportType] = useState<ReportType>(null);
  const [details, setDetails] = useState<CustomerDetails>(emptyDetails());
  const [result, setResult] = useState<BureauResult | null>(null);
  const [pdfPayload, setPdfPayload] = useState<BureauPdfPayload | null>(null);
  const [lowBalance, setLowBalance] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<CustomerDetails>>({});

  const currentRate = reportType === 'commercial' ? rates.commercial_credit_rate : rates.consumer_credit_rate;
  const LOW_BALANCE_THRESHOLD = 200;

  // Step 1 → 2
  function handleSelectType(type: ReportType) {
    setReportType(type);
    setStep(2);
  }

  // Step 2 validation
  function validateDetails(): boolean {
    const errs: Partial<CustomerDetails> = {};
    if (details.fullName.trim().split(/\s+/).filter(Boolean).length < 2) {
      errs.fullName = 'Enter full name with first and last name';
    }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(details.pan.toUpperCase())) errs.pan = 'Enter valid PAN (e.g. ABCDE1234F)';
    if (!/^[6-9]\d{9}$/.test(details.mobile)) errs.mobile = 'Enter valid 10-digit mobile number';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleDetailsNext() {
    if (validateDetails()) void handleFetchReport();
  }

  async function handleFetchReport() {
    const rate = reportType === 'commercial' ? rates.commercial_credit_rate : rates.consumer_credit_rate;

    if (walletBalance < rate) {
      setLowBalance(true);
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (!partnerId || !reportType) {
        throw new Error('Partner or report type missing');
      }
      const nameParts = splitFullName(details.fullName);

      const res = await fetch('/api/pull-bureau-real', {
        method: 'POST',
        headers: await getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          partner_id: partnerId,
          report_type: reportType,
          firstName: nameParts.firstName,
          middleName: nameParts.middleName,
          lastName: nameParts.lastName,
          birthDate: formatDobForApi(HARD_CODED_CUSTOMER_DETAILS.dob),
          gender: HARD_CODED_CUSTOMER_DETAILS.gender,
          idNumber: details.pan,
          state: HARD_CODED_CUSTOMER_DETAILS.state,
          pinCode: HARD_CODED_CUSTOMER_DETAILS.pinCode,
          telephoneNumber: details.mobile,
          aadhaar: HARD_CODED_CUSTOMER_DETAILS.aadhaar,
          city: HARD_CODED_CUSTOMER_DETAILS.city,
          addressLine1: HARD_CODED_CUSTOMER_DETAILS.addressLine1,
        }),
      });

      const pullResult = await res.json();

      if (!res.ok || !pullResult.success) {
        if (res.status === 402) {
          setLowBalance(true);
          return;
        }
        throw new Error(pullResult.error ?? 'Unable to fetch bureau report');
      }

      const fetchedResult = pullResult.result as BureauResult;
      const displayCustomer = pullResult.display_customer && typeof pullResult.display_customer === 'object'
        ? pullResult.display_customer as { name?: string; mobile?: string; pan?: string }
        : null;
      const customerName = displayCustomer?.name || getCustomerName(details);
      const customerMobile = displayCustomer?.mobile || details.mobile;
      const customerPan = (displayCustomer?.pan || details.pan).toUpperCase();
      const nextBalance = Number(pullResult.new_balance ?? walletBalance - rate);
      updateCachedPartnerWalletData(user?.id, (current) => current ? { ...current, balance: nextBalance } : current);
      const pulledAtIso = new Date().toISOString();

      addRecord({
        customerName,
        mobile: customerMobile,
        pan: customerPan,
        aadhaar: HARD_CODED_CUSTOMER_DETAILS.aadhaar,
        partnerId,
        partnerName: user?.name ?? 'Partner',
        reportType: reportType === 'commercial' ? 'Commercial Bureau' : 'Consumer Bureau',
        creditScore: fetchedResult.score,
        riskLevel: fetchedResult.riskLevel,
        reportId: fetchedResult.reportId,
        pulledAt: new Date().toLocaleString('en-IN', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', hour12: false,
        }).replace(',', ''),
        rawJson: {
          score: fetchedResult.score,
          riskLevel: fetchedResult.riskLevel,
          bureau: 'Bureau',
          demo: pullResult.demo === true,
          reportId: fetchedResult.reportId,
          keyIssues: fetchedResult.keyIssues,
          generatedAt: fetchedResult.generatedAt,
          customerName,
          pan: customerPan,
          raw: pullResult.raw_json,
        },
      });

      setResult(fetchedResult);
      setPdfPayload({
        raw_json: pullResult.raw_json,
        report_id: fetchedResult.reportId,
        customer_name: customerName,
        created_at: pulledAtIso,
      });
      setSuccessMsg(`Bureau report fetched successfully! Rs. ${rate} credits deducted.`);
      setStep(3);
    } catch (err) {
      console.error('[PullBureau] handleFetchReport error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Unable to fetch bureau report');
    } finally {
      setLoading(false);
    }
  }

  // Reset
  function handleReset() {
    setStep(1);
    setReportType(null);
    setDetails(emptyDetails());
    setResult(null);
    setPdfPayload(null);
    setLowBalance(false);
    setSuccessMsg('');
    setErrorMsg('');
    setFormErrors({});
  }

  async function handleDownloadPdf() {
    if (!pdfPayload) return;
    setErrorMsg('');
    try {
      const response = await fetch('/api/bureau-report-pdf', {
        method: 'POST',
        headers: await getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(pdfPayload),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error || 'Unable to generate PDF');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${pdfPayload.customer_name || 'bureau-report'}-${pdfPayload.report_id}`.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setSuccessMsg('PDF downloaded successfully.');
    } catch (error) {
      console.error('[PullBureau] PDF download error:', error);
      setErrorMsg(error instanceof Error ? error.message : 'Unable to generate PDF');
    }
  }

  const hasWalletData = Boolean(walletData);
  const isLowBalance = hasWalletData && walletBalance < LOW_BALANCE_THRESHOLD;

  return (
    <AppLayout role="partner">
      <Topbar
        title="Pull Bureau Report"
        subtitle="Fetch credit report for your customer"
        role="partner"
        actions={
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isLowBalance ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-border'}`}>
            <Wallet size={14} className={isLowBalance ? 'text-red-500' : 'text-muted-foreground'} />
            <span className="text-xs text-muted-foreground">Wallet:</span>
            <span className={`text-sm font-semibold ${isLowBalance ? 'text-red-600' : 'text-foreground'}`}>
              {walletDataLoading && !hasWalletData ? '—' : `₹${walletBalance.toLocaleString('en-IN')}`}
            </span>
          </div>
        }
      />

      <div className="p-6 max-w-2xl mx-auto fade-in">
        {/* Step Indicator */}
        <StepIndicator current={step} />

        {/* Low Balance Warning */}
        {lowBalance && (
          <div className="mb-5 flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
            <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">Insufficient Wallet Balance</p>
              <p className="text-xs text-red-600 mt-0.5">
                You need ₹{currentRate} credits to pull this report. Current balance: ₹{walletBalance}. Please contact your admin to recharge.
              </p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mb-5 flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
            <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">Report pull failed</p>
              <p className="text-xs text-red-600 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMsg && (
          <div className="mb-5 flex items-start gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
            <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-emerald-700">{successMsg}</p>
          </div>
        )}

        {/* ── STEP 1: Select Report Type ── */}
        {step === 1 && (
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="text-base font-semibold text-foreground mb-1">Select Report Type</h2>
            <p className="text-sm text-muted-foreground mb-5">Choose the type of Bureau report to pull.</p>
            {ratesLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <RefreshCw size={14} className="animate-spin" /> Loading your rates...
              </div>
            ) : null}
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => handleSelectType('consumer')}
                className="group flex flex-col items-start gap-3 p-5 rounded-xl border-2 border-border hover:border-primary hover:bg-primary-light transition-all duration-150 text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Users size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Consumer Bureau</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Individual credit report (Score 300–900)</p>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs font-semibold text-primary bg-blue-50 px-2 py-0.5 rounded-full">
                    ₹{rates.consumer_credit_rate} per pull
                  </span>
                  <ChevronRight size={13} className="text-primary" />
                </div>
              </button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Rate is set by your admin: <span className="font-semibold text-foreground">₹{rates.consumer_credit_rate}</span> per pull.
            </p>
          </div>
        )}

        {/* ── STEP 2: Customer Details ── */}
        {step === 2 && (
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-foreground">Customer Details</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Report type: <span className="font-medium text-primary capitalize">{reportType} Bureau</span>
                  <span className="ml-2 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                    ₹{currentRate} per pull
                  </span>
                </p>
              </div>
              <button onClick={() => setStep(1)} className="text-xs text-muted-foreground hover:text-primary underline">
                Change type
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Customer Name</label>
                <input
	                  type="text"
	                  className="input-base uppercase"
	                  placeholder=""
	                  value={details.fullName}
                  onChange={(e) => setDetails({ ...details, fullName: e.target.value.toUpperCase() })}
                />
                {formErrors.fullName && <p className="text-xs text-red-500 mt-1">{formErrors.fullName}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Mobile Number</label>
                <input
	                  type="text"
	                  className="input-base font-mono"
	                  placeholder=""
                  maxLength={10}
                  value={details.mobile}
                  onChange={(e) => setDetails({ ...details, mobile: e.target.value.replace(/\D/g, '') })}
                />
                {formErrors.mobile && <p className="text-xs text-red-500 mt-1">{formErrors.mobile}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">PAN Number</label>
                <input
	                  type="text"
	                  className="input-base font-mono tracking-widest uppercase"
	                  placeholder=""
                  maxLength={10}
                  value={details.pan}
                  onChange={(e) => setDetails({ ...details, pan: e.target.value.toUpperCase() })}
                />
                {formErrors.pan && <p className="text-xs text-red-500 mt-1">{formErrors.pan}</p>}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button onClick={handleDetailsNext} disabled={loading} className="btn-primary disabled:opacity-60">
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <ChevronRight size={15} />}
                {loading ? 'Fetching Report...' : 'Fetch Report'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Result ── */}
        {step === 3 && result && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-border p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Bureau Report Summary</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Report ID: <span className="font-mono font-medium">{result.reportId}</span> · {result.generatedAt}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${riskBadge(result.riskLevel)}`}>
                  {result.riskLevel} Risk
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="p-4 rounded-lg bg-slate-50 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Credit Score</p>
                  <p className={`text-4xl font-bold font-tabular ${scoreColor(result.score, reportType)}`}>
                    {result.score}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {reportType === 'commercial' ? 'Range: 1–100' : 'Range: 300–900'}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Risk Level</p>
                  <p className={`text-2xl font-bold ${result.riskLevel === 'Low' ? 'text-emerald-600' : result.riskLevel === 'Medium' ? 'text-amber-600' : 'text-red-600'}`}>
                    {result.riskLevel}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 capitalize">{reportType} Bureau</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">Key Issues</p>
                <ul className="space-y-1.5">
                  {result.keyIssues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <AlertTriangle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-border p-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Customer Details</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{getCustomerName(details)}</span></div>
                <div><span className="text-muted-foreground">PAN:</span> <span className="font-medium font-mono">{details.pan}</span></div>
                <div><span className="text-muted-foreground">Mobile:</span> <span className="font-medium font-mono">+91 {details.mobile}</span></div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadPdf}
                disabled={!pdfPayload}
                className="btn-primary"
              >
                <Download size={15} />
                Download PDF
              </button>
              <button onClick={handleReset} className="btn-secondary">
                <RefreshCw size={14} />
                Pull Another Report
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
