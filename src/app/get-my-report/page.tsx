'use client';

import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import AppLogo from '@/components/ui/AppLogo';

type Step = 'mobile' | 'otp' | 'educate' | 'details' | 'consent' | 'payment' | 'preparing' | 'report';

const states = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

const educationCards = [
  {
    title: 'Know your credit score meaning',
    desc: 'Understand whether your profile looks strong, average, or needs attention before you apply.',
    icon: 'ChartBarIcon',
  },
  {
    title: 'Check loan readiness',
    desc: 'See signals that can influence approval conversations with lenders and advisors.',
    icon: 'BanknotesIcon',
  },
  {
    title: 'Spot repayment signals',
    desc: 'Find patterns around missed payments, overdue behavior, and consistency.',
    icon: 'CalendarDaysIcon',
  },
  {
    title: 'Understand utilization',
    desc: 'See whether credit usage and account mix are helping or hurting your profile.',
    icon: 'ScaleIcon',
  },
  {
    title: 'Review risk factors',
    desc: 'Get a simple explanation of the issues that may need attention.',
    icon: 'ShieldExclamationIcon',
  },
  {
    title: 'Follow improvement actions',
    desc: 'Walk away with practical next steps, not a confusing raw report.',
    icon: 'SparklesIcon',
  },
];

const reportIncludes = [
  'Credit score interpretation',
  'Loan readiness summary',
  'Repayment behavior review',
  'Risk factor analysis',
  'Improvement roadmap',
  'Secure report access',
];

const preparationSteps = [
  'Verifying your secure request',
  'Reading financial health signals',
  'Calculating score indicators',
  'Preparing recommendations',
];

type Details = {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  pan: string;
  dob: string;
  gender: string;
  address: string;
  state: string;
  pinCode: string;
};

const initialDetails: Details = {
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  pan: '',
  dob: '',
  gender: '',
  address: '',
  state: '',
  pinCode: '',
};

const fieldClass =
  'h-11 w-full rounded-xl border border-white/10 bg-white/[0.045] px-3.5 text-sm text-fg outline-none transition-all placeholder:text-fg-subtle/70 focus:border-primary/50 focus:bg-white/[0.07] focus:ring-2 focus:ring-primary/10';

const selectClass =
  'h-11 w-full rounded-xl border border-white/10 bg-[#081625] px-3.5 text-sm text-fg outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/10';

const areaClass =
  'h-20 w-full rounded-xl border border-white/10 bg-white/[0.045] px-3.5 py-3 text-sm text-fg outline-none transition-all placeholder:text-fg-subtle/70 focus:border-primary/50 focus:bg-white/[0.07] focus:ring-2 focus:ring-primary/10';

function StepPill({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-2.5 w-2.5 rounded-full ${active || done ? 'bg-primary shadow-glow-sm' : 'bg-white/20'}`}
      />
      <span className={active || done ? 'text-fg text-xs font-semibold' : 'text-fg-subtle text-xs font-medium'}>{label}</span>
    </div>
  );
}

function ReportPreview({ locked = true }: { locked?: boolean }) {
  return (
    <div className="glass-card rounded-4xl p-5 sm:p-6 relative overflow-hidden">
      <div className={locked ? 'blur-[1.5px] select-none pointer-events-none' : ''}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs text-fg-subtle uppercase tracking-wider font-bold">Financial Health Report</p>
            <h3 className="text-xl font-bold text-fg mt-1">Report snapshot</h3>
          </div>
          <span className="tag tag-primary">Score View</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            ['742', 'Credit Score'],
            ['Good', 'Loan Readiness'],
            ['3', 'Action Points'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-3xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-lg font-bold gradient-text-primary">{value}</p>
              <p className="text-[11px] text-fg-muted mt-1">{label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {[
            ['Repayment consistency', '86%', 'primary'],
            ['Utilization signal', '42%', 'accent'],
            ['Risk review', '68%', 'primary'],
          ].map(([label, width, tone]) => (
            <div key={label} className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.035)' }}>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-fg-muted">{label}</span>
                <span className={tone === 'accent' ? 'text-accent font-bold' : 'text-primary font-bold'}>{width}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-white/10">
                <div className="h-full rounded-full" style={{ width, background: tone === 'accent' ? '#F5A623' : '#00D4AA' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg/35 backdrop-blur-[2px]">
          <div className="text-center px-6">
            <div className="h-12 w-12 rounded-2xl bg-primary text-bg flex items-center justify-center mx-auto mb-3">
              <Icon name="LockClosedIcon" size={22} />
            </div>
            <p className="text-fg font-bold">Your full report preview is protected</p>
            <p className="text-fg-muted text-xs mt-1">Continue the secure journey to view details</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GetMyReportPage() {
  const [step, setStep] = useState<Step>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [details, setDetails] = useState<Details>(initialDetails);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState('');
  const [requestId, setRequestId] = useState('');
  const [reportId, setReportId] = useState('');
  const [loading, setLoading] = useState(false);

  const fullName = useMemo(
    () => [details.firstName, details.middleName, details.lastName].filter(Boolean).join(' '),
    [details.firstName, details.middleName, details.lastName],
  );

  const stepIndex = ['mobile', 'otp', 'educate', 'details', 'consent', 'payment', 'preparing', 'report'].indexOf(step);

  async function saveRequest(stage: string, extra: Record<string, unknown> = {}) {
    const res = await fetch('/api/customer-report/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request_id: requestId || undefined,
        mobile,
        stage,
        ...extra,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error ?? 'Unable to save request.');
    if (data.request?.id) setRequestId(data.request.id);
    return data.request;
  }

  const sendOtp = async () => {
    setError('');
    if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    try {
      await saveRequest('mobile_started');
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start request.');
    }
  };

  const verifyOtp = async () => {
    setError('');
    if (otp.trim() !== '123456') {
      setError('Enter the demo OTP 123456 to continue.');
      return;
    }
    try {
      await saveRequest('mobile_verified');
      setStep('educate');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify request.');
    }
  };

  const continueDetails = async () => {
    setError('');
    if (!details.firstName.trim() || !details.lastName.trim() || !details.email.trim() || !details.pan.trim() || !details.dob || !details.gender || !details.address.trim() || !details.state || !details.pinCode.trim()) {
      setError('Please complete all required details.');
      return;
    }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(details.pan.trim().toUpperCase())) {
      setError('Enter a valid PAN format, for example ABCDE1234F.');
      return;
    }
    if (!/^\d{6}$/.test(details.pinCode.trim())) {
      setError('Enter a valid 6-digit PIN code.');
      return;
    }
    try {
      await saveRequest('details_submitted', {
        first_name: details.firstName,
        middle_name: details.middleName,
        last_name: details.lastName,
        email: details.email,
        pan: details.pan,
        dob: details.dob,
        gender: details.gender,
        address: details.address,
        state: details.state,
        pin_code: details.pinCode,
      });
      setStep('consent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save details.');
    }
  };

  const createOrder = async () => {
    setError('');
    if (!consent) {
      setError('Please provide consent to continue.');
      return;
    }
    setLoading(true);
    try {
      const saved = await saveRequest('consent_given', { consent_given: true });
      const res = await fetch('/api/customer-report/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: saved.id ?? requestId, mobile, name: fullName, pan: details.pan }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? 'Unable to create payment order.');
      setOrderId(data.order.order_id);
      setStep('payment');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create payment order.');
    } finally {
      setLoading(false);
    }
  };

  const completePayment = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/customer-report/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, request_id: requestId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? 'Payment verification failed.');
      setReportId(data.report_id);
      setStep('preparing');
      window.setTimeout(() => setStep('report'), 2600);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const updateDetails = (key: keyof Details, value: string) => {
    setDetails((prev) => ({ ...prev, [key]: key === 'pan' ? value.toUpperCase() : value }));
  };

  return (
    <div className="landing-page min-h-screen bg-bg text-fg">
      <div className="grain-overlay" aria-hidden />
      <header className="border-b border-white/5 bg-bg/90 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <AppLogo size={42} width={170} height={40} />
          </Link>
          <Link href="/" className="btn-ghost px-4 py-2 text-sm">Back Home</Link>
        </div>
      </header>

      <main className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden style={{ background: 'radial-gradient(ellipse 90% 60% at 50% -10%, rgba(0,212,170,0.12), transparent 55%)' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 relative">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8 lg:gap-10 items-start">
            <aside className="space-y-6 lg:sticky lg:top-24">
              <div>
                <span className="tag tag-primary mb-5 inline-flex">Private Financial Health Journey</span>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
                  Get clarity before your next financial decision.
                </h1>
                <p className="text-fg-muted mt-5 text-lg leading-relaxed">
                  Verify your mobile, understand what the report can reveal, and add your details securely when you are ready.
                </p>
              </div>

              <div className="glass-card rounded-4xl p-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-4">
                  {['Mobile', 'Benefits', 'Consent', 'Report'].map((label, index) => (
                    <StepPill key={label} label={label} active={Math.min(stepIndex, 6) === index * 2 || (index === 1 && step === 'educate')} done={stepIndex > index * 2} />
                  ))}
                </div>
              </div>

              <ReportPreview locked={step !== 'report'} />
            </aside>

            <section className="glass-card rounded-3xl p-4 sm:p-6 lg:p-7 min-h-[520px]">
              {error && (
                <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              {step === 'mobile' && (
                <div className="space-y-5">
                  <div>
                    <span className="tag tag-accent mb-4 inline-flex">Step 1</span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-fg">Start with mobile verification</h2>
                    <p className="text-fg-muted mt-2 text-sm sm:text-base">We verify your number first so your report journey stays private and secure.</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-fg">Mobile number</label>
                    <div className="mt-2 flex h-12 rounded-xl border border-white/10 bg-white/[0.045] overflow-hidden transition-all focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
                      <span className="flex items-center px-3.5 text-sm text-fg-muted border-r border-white/10">+91</span>
                      <input
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="9876543210"
                        className="flex-1 bg-transparent px-3.5 outline-none text-fg text-sm placeholder:text-fg-subtle/70"
                      />
                    </div>
                  </div>
                  <button onClick={sendOtp} className="btn-primary w-full justify-center py-3 text-sm">Send OTP</button>
                  <div className="grid sm:grid-cols-3 gap-2.5">
                    {['Private report journey', 'Secure mobile verification', 'Guided experience'].map((item) => (
                      <div key={item} className="rounded-xl px-3 py-2.5 text-xs text-fg-muted border border-white/5 bg-white/[0.03]">{item}</div>
                    ))}
                  </div>
                </div>
              )}

              {step === 'otp' && (
                <div className="space-y-5">
                  <div>
                    <span className="tag tag-accent mb-4 inline-flex">Step 2</span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-fg">Verify OTP</h2>
                    <p className="text-fg-muted mt-2 text-sm sm:text-base">Enter the OTP sent to {mobile}. Demo OTP is <span className="text-primary font-bold">123456</span>.</p>
                  </div>
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 text-center text-lg tracking-[0.32em] text-fg outline-none transition-all placeholder:tracking-normal placeholder:text-sm placeholder:text-fg-subtle/70 focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                  />
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    <button onClick={() => setStep('mobile')} className="btn-ghost justify-center py-3 text-sm">Change Mobile</button>
                    <button onClick={verifyOtp} className="btn-primary justify-center py-3 text-sm">Verify & Continue</button>
                  </div>
                </div>
              )}

              {step === 'educate' && (
                <div className="space-y-7">
                  <div>
                    <span className="tag tag-primary mb-4 inline-flex">Your Report Benefits</span>
                    <h2 className="text-3xl font-bold text-fg">Here is what your report helps you understand</h2>
                    <p className="text-fg-muted mt-3">Understand the value first. Your full report details stay protected until the final step.</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {educationCards.map((card) => (
                      <div key={card.title} className="rounded-3xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <Icon name={card.icon} size={22} className="text-primary mb-4" />
                        <h3 className="font-bold text-fg">{card.title}</h3>
                        <p className="text-sm text-fg-muted mt-2 leading-relaxed">{card.desc}</p>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setStep('details')} className="btn-primary w-full justify-center py-4">Continue Securely</button>
                </div>
              )}

              {step === 'details' && (
                <div className="space-y-5">
                  <div>
                    <span className="tag tag-accent mb-4 inline-flex">Secure Details</span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-fg">Prepare your report accurately</h2>
                    <p className="text-fg-muted mt-2 text-sm sm:text-base">These details help prepare the correct financial health analysis for you.</p>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-2.5">
                    {[
                      ['firstName', 'First name *'],
                      ['middleName', 'Middle name'],
                      ['lastName', 'Last name *'],
                    ].map(([key, label]) => (
                      <input key={key} value={details[key as keyof Details]} onChange={(e) => updateDetails(key as keyof Details, e.target.value)} placeholder={label} className={fieldClass} />
                    ))}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    <input value={details.email} onChange={(e) => updateDetails('email', e.target.value)} placeholder="Email address *" className={fieldClass} />
                    <input value={details.pan} onChange={(e) => updateDetails('pan', e.target.value)} placeholder="PAN number *" maxLength={10} className={`${fieldClass} uppercase`} />
                    <input type="date" value={details.dob} onChange={(e) => updateDetails('dob', e.target.value)} className={fieldClass} />
                    <select value={details.gender} onChange={(e) => updateDetails('gender', e.target.value)} className={selectClass}>
                      <option value="">Gender *</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <textarea value={details.address} onChange={(e) => updateDetails('address', e.target.value)} placeholder="Current address *" rows={2} className={`${areaClass} resize-none`} />
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    <select value={details.state} onChange={(e) => updateDetails('state', e.target.value)} className={selectClass}>
                      <option value="">State *</option>
                      {states.map((state) => <option key={state}>{state}</option>)}
                    </select>
                    <input value={details.pinCode} onChange={(e) => updateDetails('pinCode', e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="PIN code *" className={fieldClass} />
                  </div>
                  <button onClick={continueDetails} className="btn-primary w-full justify-center py-3 text-sm">Review Consent</button>
                </div>
              )}

              {step === 'consent' && (
                <div className="space-y-7">
                  <div>
                    <span className="tag tag-primary mb-4 inline-flex">Consent & Privacy</span>
                    <h2 className="text-3xl font-bold text-fg">What you are authorizing</h2>
                    <p className="text-fg-muted mt-3">We will process your details only to prepare your financial health analysis report.</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {reportIncludes.map((item) => (
                      <div key={item} className="flex items-center gap-3 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <Icon name="CheckCircleIcon" size={18} className="text-primary shrink-0" />
                        <span className="text-sm text-fg-muted">{item}</span>
                      </div>
                    ))}
                  </div>
                  <label className="flex items-start gap-3 rounded-3xl p-5 cursor-pointer" style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.18)' }}>
                    <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
                    <span className="text-sm text-fg-muted leading-relaxed">
                      I authorize Credit Trust to process my details and generate my Financial Health Report. I understand my data will not be sold or shared for marketing.
                    </span>
                  </label>
                  <button onClick={createOrder} disabled={loading} className="btn-primary w-full justify-center py-4">
                    {loading ? 'Preparing next step...' : 'Continue'}
                  </button>
                </div>
              )}

              {step === 'payment' && (
                <div className="space-y-7">
                  <div>
                    <span className="tag tag-accent mb-4 inline-flex">Secure Payment</span>
                    <h2 className="text-3xl font-bold text-fg">Unlock your full report</h2>
                    <p className="text-fg-muted mt-3">Your report request is ready. Pay securely to generate and view your full report.</p>
                  </div>
                  <div className="rounded-4xl p-6" style={{ background: 'linear-gradient(135deg, rgba(0,212,170,0.12), rgba(245,166,35,0.07))', border: '1px solid rgba(0,212,170,0.18)' }}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-fg font-bold text-xl">Financial Health Report</p>
                        <p className="text-fg-muted text-sm mt-2">One-time secure report generation</p>
                      </div>
                      <div className="text-right">
                        <p className="text-4xl font-bold gradient-text-primary">₹199</p>
                        <p className="text-xs text-fg-subtle mt-1">incl. report access</p>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 mt-6">
                      {reportIncludes.slice(0, 4).map((item) => (
                        <div key={item} className="flex items-center gap-2 text-sm text-fg-muted">
                          <Icon name="CheckCircleIcon" size={16} className="text-primary" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={completePayment} disabled={loading} className="btn-primary w-full justify-center py-4">
                    {loading ? 'Opening secure checkout...' : 'Pay ₹199 Securely'}
                  </button>
                  <p className="text-center text-xs text-fg-subtle">Cashfree checkout ready. Demo mode completes payment safely when keys are not configured.</p>
                </div>
              )}

              {step === 'preparing' && (
                <div className="space-y-7 text-center py-8">
                  <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
                  <div>
                    <h2 className="text-3xl font-bold text-fg">Preparing your report</h2>
                    <p className="text-fg-muted mt-3">This takes a few seconds in demo mode.</p>
                  </div>
                  <div className="max-w-md mx-auto space-y-3 text-left">
                    {preparationSteps.map((item) => (
                      <div key={item} className="flex items-center gap-3 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <Icon name="CheckCircleIcon" size={18} className="text-primary" />
                        <span className="text-sm text-fg-muted">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 'report' && (
                <div className="space-y-7">
                  <div>
                    <span className="tag tag-primary mb-4 inline-flex">Report Ready</span>
                    <h2 className="text-3xl font-bold text-fg">Your Financial Health Report is ready</h2>
                    <p className="text-fg-muted mt-3">Report ID: {reportId || 'RPT_DEMO'}</p>
                  </div>
                  <ReportPreview locked={false} />
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      ['Loan Readiness', 'Good'],
                      ['Risk Level', 'Moderate'],
                      ['Next Action', 'Reduce utilization'],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-3xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <p className="text-xs text-fg-subtle">{label}</p>
                        <p className="text-lg font-bold text-fg mt-1">{value}</p>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => window.print()} className="btn-primary w-full justify-center py-4">Download / Print Report</button>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
