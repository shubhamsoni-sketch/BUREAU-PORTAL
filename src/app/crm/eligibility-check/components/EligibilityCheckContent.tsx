'use client';
import React, { useState } from 'react';
import Link from 'next/link';

type EmploymentType = 'salaried' | 'self_employed' | 'business' | 'professional';
type LoanType = 'home_loan' | 'personal_loan' | 'business_loan' | 'lap' | 'car_loan';

interface EligibilityForm {
  fullName: string;
  mobile: string;
  email: string;
  dob: string;
  pan: string;
  employmentType: EmploymentType | '';
  monthlyIncome: string;
  otherIncome: string;
  existingEMI: string;
  loanType: LoanType | '';
  loanAmount: string;
  tenure: string;
  city: string;
  pincode: string;
}

interface EligibilityResult {
  eligible: boolean;
  score: number;
  scoreGrade: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  maxLoanAmount: number;
  recommendedEMI: number;
  foir: number;
  remarks: string[];
  matchedLenders: { name: string; roi: string; maxLoan: string }[];
}

const emptyForm: EligibilityForm = {
  fullName: '',
  mobile: '',
  email: '',
  dob: '',
  pan: '',
  employmentType: '',
  monthlyIncome: '',
  otherIncome: '',
  existingEMI: '',
  loanType: '',
  loanAmount: '',
  tenure: '',
  city: '',
  pincode: '',
};

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);

export default function EligibilityCheckContent() {
  const [form, setForm] = useState<EligibilityForm>(emptyForm);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  const setField = (key: keyof EligibilityForm, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => {
      const n = { ...p };
      delete n[key];
      return n;
    });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.mobile || !/^[6-9]\d{9}$/.test(form.mobile)) e.mobile = '10-digit mobile required';
    if (!form.pan || !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.pan.toUpperCase()))
      e.pan = 'Valid PAN required (e.g. ABCDE1234F)';
    if (!form.employmentType) e.employmentType = 'Select employment type';
    if (!form.monthlyIncome || isNaN(Number(form.monthlyIncome)))
      e.monthlyIncome = 'Monthly income required';
    if (!form.loanType) e.loanType = 'Select loan type';
    if (!form.loanAmount || isNaN(Number(form.loanAmount))) e.loanAmount = 'Loan amount required';
    if (!form.tenure || isNaN(Number(form.tenure))) e.tenure = 'Tenure required';
    return e;
  };

  const handleCheck = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setChecking(true);
    setResult(null);
    setServerError('');
    try {
      const response = await fetch('/api/crm/eligibility-check', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...form, consent: true }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Eligibility check failed');
      }
      setResult(json.data as EligibilityResult);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Eligibility check failed');
    } finally {
      setChecking(false);
    }
  };

  const scoreColor = result
    ? result.score >= 750
      ? 'text-success'
      : result.score >= 680
        ? 'text-warning'
        : 'text-danger'
    : '';
  const scoreBarColor = result
    ? result.score >= 750
      ? 'bg-success'
      : result.score >= 680
        ? 'bg-warning'
        : 'bg-danger'
    : '';

  return (
    <div className="px-4 lg:px-6 xl:px-8 py-6 max-w-screen-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-700 text-foreground">Eligibility Check</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Assess borrower eligibility and get matched lender recommendations
          </p>
        </div>
        <Link
          href="/crm/eligibility-report"
          className="flex items-center gap-1.5 h-8 px-3 rounded-sm border border-border bg-card text-xs font-600 text-foreground hover:bg-muted transition-colors"
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
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          View Reports
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-3 bg-card rounded-lg border border-border shadow-card p-5 space-y-5">
          {/* Personal Info */}
          <div>
            <h3 className="text-xs font-700 uppercase tracking-wider text-muted-foreground mb-3 pb-2 border-b border-border">
              Borrower Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-600 text-foreground">
                  Full Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setField('fullName', e.target.value)}
                  placeholder="Ramesh Gupta"
                  className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
                {errors.fullName && <p className="text-xs text-danger">{errors.fullName}</p>}
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-600 text-foreground">
                  Mobile <span className="text-danger">*</span>
                </label>
                <input
                  type="tel"
                  value={form.mobile}
                  onChange={(e) => setField('mobile', e.target.value)}
                  placeholder="9876543210"
                  className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
                {errors.mobile && <p className="text-xs text-danger">{errors.mobile}</p>}
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-600 text-foreground">
                  PAN Number <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={form.pan}
                  onChange={(e) => setField('pan', e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 uppercase"
                />
                {errors.pan && <p className="text-xs text-danger">{errors.pan}</p>}
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-600 text-foreground">Date of Birth</label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => setField('dob', e.target.value)}
                  className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-600 text-foreground">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setField('city', e.target.value)}
                  placeholder="Mumbai"
                  className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-600 text-foreground">Pincode</label>
                <input
                  type="text"
                  value={form.pincode}
                  onChange={(e) => setField('pincode', e.target.value)}
                  placeholder="400001"
                  maxLength={6}
                  className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
            </div>
          </div>

          {/* Financial Info */}
          <div>
            <h3 className="text-xs font-700 uppercase tracking-wider text-muted-foreground mb-3 pb-2 border-b border-border">
              Financial Profile
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-600 text-foreground">
                  Employment Type <span className="text-danger">*</span>
                </label>
                <select
                  value={form.employmentType}
                  onChange={(e) => setField('employmentType', e.target.value)}
                  className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                >
                  <option value="">Select type</option>
                  <option value="salaried">Salaried</option>
                  <option value="self_employed">Self Employed</option>
                  <option value="business">Business Owner</option>
                  <option value="professional">Professional (CA/Doctor)</option>
                </select>
                {errors.employmentType && (
                  <p className="text-xs text-danger">{errors.employmentType}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-600 text-foreground">
                  Monthly Income (₹) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  value={form.monthlyIncome}
                  onChange={(e) => setField('monthlyIncome', e.target.value)}
                  placeholder="75000"
                  className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
                {errors.monthlyIncome && (
                  <p className="text-xs text-danger">{errors.monthlyIncome}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-600 text-foreground">
                  Other Monthly Income (₹)
                </label>
                <input
                  type="number"
                  value={form.otherIncome}
                  onChange={(e) => setField('otherIncome', e.target.value)}
                  placeholder="0"
                  className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-600 text-foreground">
                  Existing EMI Obligations (₹/month)
                </label>
                <input
                  type="number"
                  value={form.existingEMI}
                  onChange={(e) => setField('existingEMI', e.target.value)}
                  placeholder="0"
                  className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
            </div>
          </div>

          {/* Loan Details */}
          <div>
            <h3 className="text-xs font-700 uppercase tracking-wider text-muted-foreground mb-3 pb-2 border-b border-border">
              Loan Requirements
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-600 text-foreground">
                  Loan Type <span className="text-danger">*</span>
                </label>
                <select
                  value={form.loanType}
                  onChange={(e) => setField('loanType', e.target.value)}
                  className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                >
                  <option value="">Select loan type</option>
                  <option value="home_loan">Home Loan</option>
                  <option value="personal_loan">Personal Loan</option>
                  <option value="business_loan">Business Loan</option>
                  <option value="lap">Loan Against Property</option>
                  <option value="car_loan">Car Loan</option>
                </select>
                {errors.loanType && <p className="text-xs text-danger">{errors.loanType}</p>}
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-600 text-foreground">
                  Required Loan Amount (₹) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  value={form.loanAmount}
                  onChange={(e) => setField('loanAmount', e.target.value)}
                  placeholder="2500000"
                  className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
                {errors.loanAmount && <p className="text-xs text-danger">{errors.loanAmount}</p>}
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-600 text-foreground">
                  Tenure (months) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  value={form.tenure}
                  onChange={(e) => setField('tenure', e.target.value)}
                  placeholder="60"
                  className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
                {errors.tenure && <p className="text-xs text-danger">{errors.tenure}</p>}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <div className="bg-muted/40 rounded-lg p-3 mb-4 text-xs text-muted-foreground">
              <p className="font-600 text-foreground mb-1">How it works</p>
              <p>
                CreditTrust uses eligibility credits to run the configured Bureau API engine and
                saves the report in CRM history.
              </p>
            </div>
            {serverError && (
              <div className="bg-danger/5 border border-danger/20 rounded-sm p-3 mb-4 text-xs font-600 text-danger">
                {serverError}
              </div>
            )}
            <button
              onClick={handleCheck}
              disabled={checking}
              className="w-full h-10 rounded-sm bg-primary text-primary-foreground text-sm font-700 hover:bg-primary/90 active:scale-95 transition-all duration-150 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {checking ? (
                <>
                  <svg
                    className="animate-spin"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Checking Eligibility...
                </>
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Check Eligibility
                </>
              )}
            </button>
          </div>
        </div>

        {/* Result Panel */}
        <div className="lg:col-span-2 space-y-4">
          {result ? (
            <>
              {/* Eligibility verdict */}
              <div
                className={`rounded-lg border p-5 ${result.eligible ? 'bg-success/5 border-success/20' : 'bg-danger/5 border-danger/20'}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${result.eligible ? 'bg-success/10' : 'bg-danger/10'}`}
                  >
                    {result.eligible ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--success)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--danger)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p
                      className={`text-base font-700 ${result.eligible ? 'text-success' : 'text-danger'}`}
                    >
                      {result.eligible ? 'Eligible for Loan' : 'Not Eligible'}
                    </p>
                    <p className="text-xs text-muted-foreground">{form.fullName}</p>
                  </div>
                </div>
                {result.eligible && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-background/60 rounded-sm p-2">
                      <p className="text-[10px] text-muted-foreground">Max Eligible Loan</p>
                      <p className="text-sm font-700 text-foreground">
                        {formatINR(result.maxLoanAmount)}
                      </p>
                    </div>
                    <div className="bg-background/60 rounded-sm p-2">
                      <p className="text-[10px] text-muted-foreground">Est. Monthly EMI</p>
                      <p className="text-sm font-700 text-foreground">
                        {formatINR(result.recommendedEMI)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Credit Score */}
              <div className="bg-card rounded-lg border border-border shadow-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-700 text-foreground">Credit Score</p>
                  <span
                    className={`text-xs font-700 px-2 py-0.5 rounded-full ${result.score >= 750 ? 'bg-success/10 text-success' : result.score >= 680 ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'}`}
                  >
                    {result.scoreGrade}
                  </span>
                </div>
                <div className="flex items-end gap-3 mb-2">
                  <span className={`text-4xl font-700 tabular-nums ${scoreColor}`}>
                    {result.score}
                  </span>
                  <span className="text-xs text-muted-foreground mb-1">/ 900</span>
                </div>
                <div className="h-2 rounded-full bg-border overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${scoreBarColor}`}
                    style={{ width: `${((result.score - 300) / 600) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>300</span>
                  <span>Poor</span>
                  <span>Fair</span>
                  <span>Good</span>
                  <span>900</span>
                </div>
              </div>

              {/* FOIR */}
              <div className="bg-card rounded-lg border border-border shadow-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-700 text-foreground">
                    FOIR (Fixed Obligation to Income Ratio)
                  </p>
                  <span
                    className={`text-sm font-700 tabular-nums ${result.foir <= 40 ? 'text-success' : result.foir <= 55 ? 'text-warning' : 'text-danger'}`}
                  >
                    {result.foir}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-border overflow-hidden">
                  <div
                    className={`h-full rounded-full ${result.foir <= 40 ? 'bg-success' : result.foir <= 55 ? 'bg-warning' : 'bg-danger'}`}
                    style={{ width: `${Math.min(100, result.foir)}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Ideal: ≤ 40% | Acceptable: ≤ 55%
                </p>
              </div>

              {/* Remarks */}
              <div className="bg-card rounded-lg border border-border shadow-card p-4">
                <p className="text-sm font-700 text-foreground mb-3">Assessment Remarks</p>
                <ul className="space-y-2">
                  {result.remarks.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0 mt-0.5"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Matched Lenders */}
              {result.matchedLenders.length > 0 && (
                <div className="bg-card rounded-lg border border-border shadow-card p-4">
                  <p className="text-sm font-700 text-foreground mb-3">Matched Lenders</p>
                  <div className="space-y-2">
                    {result.matchedLenders.map((l) => (
                      <div
                        key={l.name}
                        className="flex items-center justify-between p-2.5 rounded-sm bg-muted/40 border border-border"
                      >
                        <p className="text-xs font-700 text-foreground">{l.name}</p>
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground">ROI: {l.roi}</p>
                          <p className="text-[10px] font-600 text-foreground">Up to {l.maxLoan}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-card rounded-lg border border-border shadow-card p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <p className="text-sm font-600 text-foreground">Fill in borrower details</p>
              <p className="text-xs text-muted-foreground mt-1">
                Complete the form and click Check Eligibility to get the assessment
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
