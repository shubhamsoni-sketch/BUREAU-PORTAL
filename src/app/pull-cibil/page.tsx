'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
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
  Users,
  Building2,
} from 'lucide-react';
import { useCustomerMaster } from '@/context/CustomerMasterContext';
import Icon from '@/components/ui/AppIcon';


// ─── Types ────────────────────────────────────────────────────────────────────
type ReportType = 'consumer' | 'commercial' | null;
type Step = 1 | 2 | 3 | 4;

interface CustomerDetails {
  fullName?: string;
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

interface CibilResult {
  score: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  keyIssues: string[];
  reportId: string;
  generatedAt: string;
}

interface PartnerRates {
  consumer_credit_rate: number;
  commercial_credit_rate: number;
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
const DEFAULT_CONSUMER_RATE = 10;
const DEFAULT_COMMERCIAL_RATE = 15;

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
  return [details.firstName, details.middleName, details.lastName].map((part) => part.trim()).filter(Boolean).join(' ');
}

function formatDobForApi(dob: string) {
  const [year, month, day] = dob.split('-');
  return `${day}${month}${year}`;
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function PullCibilPage() {
  const { user } = useAuth();
  const { addRecord } = useCustomerMaster();

  // Live wallet balance from Supabase (partners.wallet_balance)
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [rates, setRates] = useState<PartnerRates>({
    consumer_credit_rate: DEFAULT_CONSUMER_RATE,
    commercial_credit_rate: DEFAULT_COMMERCIAL_RATE,
  });
  const [ratesLoading, setRatesLoading] = useState(true);

  const [step, setStep] = useState<Step>(1);
  const [reportType, setReportType] = useState<ReportType>(null);
  const [details, setDetails] = useState<CustomerDetails>(emptyDetails());
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [result, setResult] = useState<CibilResult | null>(null);
  const [lowBalance, setLowBalance] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<CustomerDetails>>({});

  const currentRate = reportType === 'commercial' ? rates.commercial_credit_rate : rates.consumer_credit_rate;
  const LOW_BALANCE_THRESHOLD = 200;

  // Load partner data + rates on mount
  useEffect(() => {
    if (!user?.id) return;

    const loadPartnerData = async () => {
      setRatesLoading(true);
      try {
        // Use service-role API to bypass RLS and get real wallet balance + partner ID
        const res = await fetch(`/api/partner-wallet-data?user_id=${user.id}`);

        const contentType = res.headers.get('content-type') ?? '';
        if (!res.ok || !contentType.includes('application/json')) {
          console.error('[PullCibil] loadPartnerData: non-JSON response', res.status, res.statusText);
          return;
        }

        const data = await res.json();

        if (data?.success) {
          setPartnerId(data.partnerId);
          setWalletBalance(Number(data.balance ?? 0));

          // Get commercial rates for this partner
          if (data.commercials) {
            setRates({
              consumer_credit_rate: Number(
                data.commercials.consumer_credit_rate ??
                data.commercials.credit_rate ??
                DEFAULT_CONSUMER_RATE
              ),
              commercial_credit_rate: Number(
                data.commercials.commercial_credit_rate ??
                data.commercials.credit_rate ??
                DEFAULT_COMMERCIAL_RATE
              ),
            });
          }
        }
      } catch (err) {
        console.error('[PullCibil] loadPartnerData error:', err);
      } finally {
        setRatesLoading(false);
      }
    };

    loadPartnerData();
  }, [user?.id]);

  // Step 1 → 2
  function handleSelectType(type: ReportType) {
    setReportType(type);
    setStep(2);
  }

  // Step 2 validation
  function validateDetails(): boolean {
    const errs: Partial<CustomerDetails> = {};
    if (!details.firstName.trim()) errs.firstName = 'First name is required';
    if (!details.lastName.trim()) errs.lastName = 'Last name is required';
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(details.pan.toUpperCase())) errs.pan = 'Enter valid PAN (e.g. ABCDE1234F)';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(details.dob)) errs.dob = 'Enter DOB as YYYY-MM-DD';
    if (!details.gender) errs.gender = 'Gender is required';
    if (!/^[6-9]\d{9}$/.test(details.mobile)) errs.mobile = 'Enter valid 10-digit mobile number';
    if (!details.addressLine1.trim()) errs.addressLine1 = 'Address Line 1 is required';
    if (!details.city.trim()) errs.city = 'City is required';
    if (!details.state.trim()) errs.state = 'State is required';
    if (!/^\d{6}$/.test(details.pinCode)) errs.pinCode = 'Enter valid 6-digit Pin Code';
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

  async function handleVerifyOtp() {
    if (otpInput !== MOCK_OTP) {
      setOtpError('Invalid OTP. Try 123456 for demo.');
      return;
    }
    setOtpError('');

    const rate = reportType === 'commercial' ? rates.commercial_credit_rate : rates.consumer_credit_rate;

    if (walletBalance < rate) {
      setLowBalance(true);
      return;
    }

    setLoading(true);

    try {
      if (!partnerId || !reportType) {
        throw new Error('Partner or report type missing');
      }

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

      const res = await fetch('/api/pull-cibil-real', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          partner_id: partnerId,
          report_type: reportType,
          firstName: details.firstName,
          middleName: details.middleName,
          lastName: details.lastName,
          birthDate: formatDobForApi(details.dob),
          gender: details.gender,
          idNumber: details.pan,
          state: details.state,
          pinCode: details.pinCode,
          telephoneNumber: details.mobile,
          aadhaar: details.aadhaar,
          city: details.city,
          addressLine1: details.addressLine1,
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

      const fetchedResult = pullResult.result as CibilResult;
      const customerName = getCustomerName(details);
      setWalletBalance(Number(pullResult.new_balance ?? walletBalance - rate));

      addRecord({
        customerName,
        mobile: details.mobile,
        pan: details.pan.toUpperCase(),
        aadhaar: details.aadhaar,
        partnerId,
        partnerName: user?.name ?? 'Partner',
        reportType: reportType === 'commercial' ? 'Commercial CIBIL' : 'Consumer CIBIL',
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
          bureau: 'CIBIL',
          demo: pullResult.demo === true,
          reportId: fetchedResult.reportId,
          keyIssues: fetchedResult.keyIssues,
          generatedAt: fetchedResult.generatedAt,
          customerName,
          pan: details.pan.toUpperCase(),
          raw: pullResult.raw_json,
        },
      });

      setResult(fetchedResult);
      setSuccessMsg(`Bureau report fetched successfully! Rs. ${rate} credits deducted.`);
      setStep(4);
      return;

      const mockResult = reportType === 'commercial' ? MOCK_CIBIL_COMMERCIAL : MOCK_CIBIL_CONSUMER;

      // Call server-side deduction API (uses service role, writes transaction row)
      if (partnerId) {
        const res = await fetch('/api/pull-cibil-deduct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partner_id: partnerId,
            report_type: reportType,
            customer_name: details.fullName,
            report_id: mockResult.reportId,
          }),
        });

        const deductResult = await res.json();

        if (!res.ok) {
          if (res.status === 402) {
            setLowBalance(true);
            setLoading(false);
            return;
          }
          console.error('[PullCibil] deduct error:', deductResult.error);
          // Continue anyway — don't block the report
        } else {
          // Update local balance from server response
          setWalletBalance(deductResult.new_balance ?? walletBalance - rate);
        }
      }

      // Add to customer master
      addRecord({
        customerName: details.fullName ?? getCustomerName(details),
        mobile: '',
        pan: details.pan.toUpperCase(),
        aadhaar: details.aadhaar,
        partnerId: partnerId ?? user?.id ?? 'unknown',
        partnerName: user?.name ?? 'Partner',
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

      setResult(mockResult);
      setSuccessMsg(`Bureau report fetched successfully! ₹${rate} credits deducted.`);
      setStep(4);
    } catch (err) {
      console.error('[PullCibil] handleVerifyOtp error:', err);
    } finally {
      setLoading(false);
    }
  }

  // Reset
  function handleReset() {
    setStep(1);
    setReportType(null);
    setDetails(emptyDetails());
    setOtpSent(false);
    setOtpInput('');
    setOtpError('');
    setResult(null);
    setLowBalance(false);
    setSuccessMsg('');
    setFormErrors({});
  }

  const isLowBalance = walletBalance < LOW_BALANCE_THRESHOLD;

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
              ₹{walletBalance.toLocaleString('en-IN')}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <button
                onClick={() => handleSelectType('commercial')}
                className="group flex flex-col items-start gap-3 p-5 rounded-xl border-2 border-border hover:border-primary hover:bg-primary-light transition-all duration-150 text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Building2 size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Commercial Bureau</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Business / company credit report (Score 1–100)</p>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs font-semibold text-primary bg-blue-50 px-2 py-0.5 rounded-full">
                    ₹{rates.commercial_credit_rate} per pull
                  </span>
                  <ChevronRight size={13} className="text-primary" />
                </div>
              </button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Rates are set by your admin. Consumer: <span className="font-semibold text-foreground">₹{rates.consumer_credit_rate}</span> · Commercial: <span className="font-semibold text-foreground">₹{rates.commercial_credit_rate}</span>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">First Name</label>
                  <input
                    type="text"
                    className="input-base uppercase"
                    placeholder="HARSHAL"
                    value={details.firstName}
                    onChange={(e) => setDetails({ ...details, firstName: e.target.value.toUpperCase() })}
                  />
                  {formErrors.firstName && <p className="text-xs text-red-500 mt-1">{formErrors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Middle Name</label>
                  <input
                    type="text"
                    className="input-base uppercase"
                    placeholder="ARUN"
                    value={details.middleName}
                    onChange={(e) => setDetails({ ...details, middleName: e.target.value.toUpperCase() })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Last Name</label>
                  <input
                    type="text"
                    className="input-base uppercase"
                    placeholder="PAWAR"
                    value={details.lastName}
                    onChange={(e) => setDetails({ ...details, lastName: e.target.value.toUpperCase() })}
                  />
                  {formErrors.lastName && <p className="text-xs text-red-500 mt-1">{formErrors.lastName}</p>}
                </div>
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
                <label className="block text-xs font-medium text-foreground mb-1">Date of Birth</label>
                <input
                  type="text"
                  className="input-base"
                  placeholder="YYYY-MM-DD"
                  maxLength={10}
                  value={details.dob}
                  onChange={(e) => setDetails({ ...details, dob: e.target.value })}
                />
                {formErrors.dob && <p className="text-xs text-red-500 mt-1">{formErrors.dob}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Gender</label>
                <select
                  className="input-base"
                  value={details.gender}
                  onChange={(e) => setDetails({ ...details, gender: e.target.value })}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                {formErrors.gender && <p className="text-xs text-red-500 mt-1">{formErrors.gender}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Mobile Number</label>
                <input
                  type="text"
                  className="input-base font-mono"
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  value={details.mobile}
                  onChange={(e) => setDetails({ ...details, mobile: e.target.value.replace(/\D/g, '') })}
                />
                {formErrors.mobile && <p className="text-xs text-red-500 mt-1">{formErrors.mobile}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Address Line 1</label>
                <input
                  type="text"
                  className="input-base"
                  placeholder="House/Flat No., Street, Area"
                  value={details.addressLine1}
                  onChange={(e) => setDetails({ ...details, addressLine1: e.target.value })}
                />
                {formErrors.addressLine1 && <p className="text-xs text-red-500 mt-1">{formErrors.addressLine1}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">City</label>
                  <input
                    type="text"
                    className="input-base"
                    placeholder="City"
                    value={details.city}
                    onChange={(e) => setDetails({ ...details, city: e.target.value })}
                  />
                  {formErrors.city && <p className="text-xs text-red-500 mt-1">{formErrors.city}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">State</label>
                  <select
                    className="input-base"
                    value={details.state}
                    onChange={(e) => setDetails({ ...details, state: e.target.value })}
                  >
                    <option value="">Select State</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                    <option value="Assam">Assam</option>
                    <option value="Bihar">Bihar</option>
                    <option value="Chhattisgarh">Chhattisgarh</option>
                    <option value="Goa">Goa</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Haryana">Haryana</option>
                    <option value="Himachal Pradesh">Himachal Pradesh</option>
                    <option value="Jharkhand">Jharkhand</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Kerala">Kerala</option>
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Manipur">Manipur</option>
                    <option value="Meghalaya">Meghalaya</option>
                    <option value="Mizoram">Mizoram</option>
                    <option value="Nagaland">Nagaland</option>
                    <option value="Odisha">Odisha</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Sikkim">Sikkim</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Tripura">Tripura</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Uttarakhand">Uttarakhand</option>
                    <option value="West Bengal">West Bengal</option>
                    <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                    <option value="Chandigarh">Chandigarh</option>
                    <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                    <option value="Ladakh">Ladakh</option>
                    <option value="Lakshadweep">Lakshadweep</option>
                    <option value="Puducherry">Puducherry</option>
                  </select>
                  {formErrors.state && <p className="text-xs text-red-500 mt-1">{formErrors.state}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Pin Code <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="input-base font-mono"
                  placeholder="6-digit Pin Code"
                  maxLength={6}
                  value={details.pinCode}
                  onChange={(e) => setDetails({ ...details, pinCode: e.target.value.replace(/\D/g, '') })}
                />
                {formErrors.pinCode && <p className="text-xs text-red-500 mt-1">{formErrors.pinCode}</p>}
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
              Verify customer identity to proceed with the bureau pull.
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
                  OTP sent successfully
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
                <div><span className="text-muted-foreground">Date of Birth:</span> <span className="font-medium">{details.dob}</span></div>
                <div><span className="text-muted-foreground">Gender:</span> <span className="font-medium">{details.gender}</span></div>
                <div><span className="text-muted-foreground">Mobile:</span> <span className="font-medium font-mono">+91 {details.mobile}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">Address:</span> <span className="font-medium">{[details.addressLine1, details.city, details.state, details.pinCode].filter(Boolean).join(', ')}</span></div>
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
