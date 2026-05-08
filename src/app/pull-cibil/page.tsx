'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import { useWallet } from '@/context/WalletContext';
import { useCustomerMaster } from '@/context/CustomerMasterContext';
import {
  FileSearch,
  User,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Download,
  AlertTriangle,
  Wallet,
  RefreshCw,
} from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


// ─── Types ────────────────────────────────────────────────────────────────────
type ReportType = 'consumer' | 'commercial' | null;
type Step = 1 | 2 | 3 | 4;

interface CustomerDetails {
  fullName: string;
  mobile: string;
  pan: string;
  aadhaar: string;
}

interface CibilResult {
  score: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  keyIssues: string[];
  reportId: string;
  generatedAt: string;
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_CIBIL_CONSUMER: CibilResult = {
  score: 742,
  riskLevel: 'Low',
  keyIssues: ['1 late payment in last 12 months', 'Credit utilisation at 38%'],
  reportId: 'CIB-2026-00847',
  generatedAt: new Date().toLocaleString('en-IN'),
};

const MOCK_CIBIL_COMMERCIAL: CibilResult = {
  score: 68,
  riskLevel: 'Medium',
  keyIssues: ['Outstanding dues on 2 trade lines', 'Overdue amount: ₹1,20,000', 'Recent inquiry spike'],
  reportId: 'COM-2026-00312',
  generatedAt: new Date().toLocaleString('en-IN'),
};

const MOCK_OTP = '123456';

// ─── Step Indicator ────────────────────────────────────────────────────────────
const steps = [
  { id: 1, label: 'Report Type', icon: FileSearch },
  { id: 2, label: 'Customer Details', icon: User },
  { id: 3, label: 'OTP Verify', icon: ShieldCheck },
  { id: 4, label: 'Result', icon: CheckCircle2 },
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

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function PullCibilPage() {
  const { balance, deduct, CREDIT_COST, LOW_BALANCE_THRESHOLD } = useWallet();
  const { addRecord } = useCustomerMaster();

  const [step, setStep] = useState<Step>(1);
  const [reportType, setReportType] = useState<ReportType>(null);
  const [details, setDetails] = useState<CustomerDetails>({ fullName: '', mobile: '', pan: '', aadhaar: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [result, setResult] = useState<CibilResult | null>(null);
  const [lowBalance, setLowBalance] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<CustomerDetails>>({});

  // Step 1 → 2
  function handleSelectType(type: ReportType) {
    setReportType(type);
    setStep(2);
  }

  // Step 2 validation
  function validateDetails(): boolean {
    const errs: Partial<CustomerDetails> = {};
    if (!details.fullName.trim()) errs.fullName = 'Full name is required';
    if (!/^\d{10}$/.test(details.mobile)) errs.mobile = 'Enter valid 10-digit mobile';
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(details.pan.toUpperCase())) errs.pan = 'Enter valid PAN (e.g. ABCDE1234F)';
    if (!/^\d{12}$/.test(details.aadhaar)) errs.aadhaar = 'Enter valid 12-digit Aadhaar';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleDetailsNext() {
    if (validateDetails()) setStep(3);
  }

  // Step 3 — OTP
  function handleSendOtp() {
    setLoading(true);
    setTimeout(() => {
      setOtpSent(true);
      setLoading(false);
    }, 1000);
  }

  function handleVerifyOtp() {
    if (otpInput !== MOCK_OTP) {
      setOtpError('Invalid OTP. Try 123456 for demo.');
      return;
    }
    setOtpError('');
    // Check wallet balance
    if (balance < CREDIT_COST) {
      setLowBalance(true);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const mockResult = reportType === 'commercial' ? MOCK_CIBIL_COMMERCIAL : MOCK_CIBIL_CONSUMER;
      const description = `${reportType === 'commercial' ? 'Commercial' : 'Consumer'} CIBIL Pull – ${details.fullName}`;
      const success = deduct(CREDIT_COST, description);
      if (!success) {
        setLowBalance(true);
        setLoading(false);
        return;
      }
      // ── Create Customer Master record ──────────────────────────────────────
      addRecord({
        customerName: details.fullName,
        mobile: details.mobile,
        pan: details.pan.toUpperCase(),
        aadhaar: details.aadhaar,
        partnerId: 'partner-001',
        partnerName: 'Rajesh Kumar (DSA)',
        reportType: reportType === 'commercial' ? 'Commercial CIBIL' : 'Consumer CIBIL',
        creditScore: mockResult.score,
        riskLevel: mockResult.riskLevel,
        reportId: mockResult.reportId,
        pulledAt: new Date().toLocaleString('en-IN', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', hour12: false,
        }).replace(',', ''),
        rawJson: {
          score: mockResult.score,
          riskLevel: mockResult.riskLevel,
          bureau: 'CIBIL',
          version: reportType === 'commercial' ? '2.0' : '3.1',
          reportId: mockResult.reportId,
          keyIssues: mockResult.keyIssues,
          generatedAt: mockResult.generatedAt,
          customerName: details.fullName,
          pan: details.pan.toUpperCase(),
        },
      });
      // ──────────────────────────────────────────────────────────────────────
      setResult(mockResult);
      setSuccessMsg(`CIBIL report fetched successfully! ₹${CREDIT_COST} credits deducted.`);
      setStep(4);
      setLoading(false);
    }, 1200);
  }

  // Reset
  function handleReset() {
    setStep(1);
    setReportType(null);
    setDetails({ fullName: '', mobile: '', pan: '', aadhaar: '' });
    setOtpSent(false);
    setOtpInput('');
    setOtpError('');
    setResult(null);
    setLowBalance(false);
    setSuccessMsg('');
    setFormErrors({});
  }

  return (
    <AppLayout role="partner">
      <Topbar
        title="Pull CIBIL Report"
        subtitle="Fetch credit report for your customer"
        role="partner"
        actions={
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${balance < CREDIT_COST ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-border'}`}>
            <Wallet size={14} className={balance < CREDIT_COST ? 'text-red-500' : 'text-muted-foreground'} />
            <span className="text-xs text-muted-foreground">Wallet:</span>
            <span className={`text-sm font-semibold ${balance < CREDIT_COST ? 'text-red-600' : 'text-foreground'}`}>
              ₹{balance.toLocaleString('en-IN')}
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
                You need ₹{CREDIT_COST} credits to pull a report. Current balance: ₹{balance}. Please top up your wallet.
              </p>
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
            <p className="text-sm text-muted-foreground mb-5">Choose the type of CIBIL report to pull.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => handleSelectType('consumer')}
                className="group flex flex-col items-start gap-3 p-5 rounded-xl border-2 border-border hover:border-primary hover:bg-primary-light transition-all duration-150 text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <User size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Consumer CIBIL</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Individual credit report (Score 300–900)</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-primary">
                  Select <ChevronRight size={13} />
                </div>
              </button>

              <button
                onClick={() => handleSelectType('commercial')}
                className="group flex flex-col items-start gap-3 p-5 rounded-xl border-2 border-border hover:border-primary hover:bg-primary-light transition-all duration-150 text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <FileSearch size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Commercial CIBIL</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Business / company credit report (Score 1–100)</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-primary">
                  Select <ChevronRight size={13} />
                </div>
              </button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Each report pull costs <span className="font-semibold text-foreground">₹{CREDIT_COST} credits</span> from your wallet.
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
                  Report type: <span className="font-medium text-primary capitalize">{reportType} CIBIL</span>
                </p>
              </div>
              <button onClick={() => setStep(1)} className="text-xs text-muted-foreground hover:text-primary underline">
                Change type
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Full Name</label>
                <input
                  type="text"
                  className="input-base"
                  placeholder="As per PAN card"
                  value={details.fullName}
                  onChange={(e) => setDetails({ ...details, fullName: e.target.value })}
                />
                {formErrors.fullName && <p className="text-xs text-red-500 mt-1">{formErrors.fullName}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Mobile Number</label>
                <input
                  type="tel"
                  className="input-base"
                  placeholder="10-digit mobile number"
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
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  value={details.pan}
                  onChange={(e) => setDetails({ ...details, pan: e.target.value.toUpperCase() })}
                />
                {formErrors.pan && <p className="text-xs text-red-500 mt-1">{formErrors.pan}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Aadhaar Number</label>
                <input
                  type="text"
                  className="input-base font-mono tracking-widest"
                  placeholder="12-digit Aadhaar"
                  maxLength={12}
                  value={details.aadhaar}
                  onChange={(e) => setDetails({ ...details, aadhaar: e.target.value.replace(/\D/g, '') })}
                />
                {formErrors.aadhaar && <p className="text-xs text-red-500 mt-1">{formErrors.aadhaar}</p>}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button onClick={handleDetailsNext} className="btn-primary">
                Continue <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: OTP Verification ── */}
        {step === 3 && (
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="text-base font-semibold text-foreground mb-1">OTP Verification</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Verify customer consent via OTP sent to <span className="font-medium text-foreground">+91 {details.mobile}</span>
            </p>

            {!otpSent ? (
              <div className="flex flex-col items-start gap-4">
                <p className="text-sm text-muted-foreground">
                  Click below to send a one-time password to the customer's registered mobile number.
                </p>
                <button
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="btn-primary disabled:opacity-60"
                >
                  {loading ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                  <CheckCircle2 size={14} />
                  OTP sent successfully to +91 {details.mobile}
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Enter OTP</label>
                  <input
                    type="text"
                    className="input-base font-mono tracking-[0.4em] text-center text-lg max-w-[200px]"
                    placeholder="• • • • • •"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => { setOtpInput(e.target.value.replace(/\D/g, '')); setOtpError(''); }}
                  />
                  {otpError && <p className="text-xs text-red-500 mt-1">{otpError}</p>}
                  <p className="text-xs text-muted-foreground mt-1">Demo OTP: <span className="font-mono font-semibold">123456</span></p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleVerifyOtp}
                    disabled={loading || otpInput.length < 6}
                    className="btn-primary disabled:opacity-60"
                  >
                    {loading ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                    {loading ? 'Verifying...' : 'Verify & Fetch Report'}
                  </button>
                  <button onClick={handleSendOtp} className="text-xs text-primary underline">
                    Resend OTP
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 4: Result ── */}
        {step === 4 && result && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-border p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-foreground">CIBIL Report Summary</h2>
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
                  <p className="text-xs text-muted-foreground mt-1 capitalize">{reportType} CIBIL</p>
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
                <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{details.fullName}</span></div>
                <div><span className="text-muted-foreground">Mobile:</span> <span className="font-medium font-mono">+91 {details.mobile}</span></div>
                <div><span className="text-muted-foreground">PAN:</span> <span className="font-medium font-mono">{details.pan}</span></div>
                <div><span className="text-muted-foreground">Aadhaar:</span> <span className="font-medium font-mono">XXXX XXXX {details.aadhaar.slice(-4)}</span></div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => alert('PDF download will be available once real API is integrated.')}
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
