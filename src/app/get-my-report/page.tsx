'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';

type Step = 'mobile' | 'otp' | 'payment' | 'prefill' | 'generating' | 'report';
type Profile = { full_name: string; dob: string; gender: string; pan: string; address: string; state: string; pincode: string };
type CashfreeCheckout = (options: { paymentSessionId: string; redirectTarget: '_modal' }) => Promise<{ error?: { message?: string } }>;

declare global {
  interface Window {
    Cashfree?: (options: { mode: 'sandbox' | 'production' }) => { checkout: CashfreeCheckout };
  }
}

const steps = [
  ['mobile', 'Mobile'],
  ['otp', 'Verify'],
  ['payment', 'Payment'],
  ['prefill', 'Confirm'],
  ['report', 'Report'],
] as const;

function loadCashfree() {
  return new Promise<void>((resolve, reject) => {
    if (window.Cashfree) return resolve();
    const existing = document.querySelector<HTMLScriptElement>('script[data-cashfree-sdk]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Unable to load payment gateway.')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.dataset.cashfreeSdk = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Unable to load payment gateway.'));
    document.head.appendChild(script);
  });
}

async function api(path: string, body: Record<string, unknown>) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

export default function GetMyReportPage() {
  const [step, setStep] = useState<Step>('mobile');
  const [mobile, setMobile] = useState('');
  const [consent, setConsent] = useState(false);
  const [otp, setOtp] = useState('');
  const [requestId, setRequestId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState<number | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reportId, setReportId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = window.sessionStorage.getItem('ct_b2c_request_id');
    const returnedOrder = new URLSearchParams(window.location.search).get('order_id');
    if (!saved || !returnedOrder) return;
    setRequestId(saved);
    setOrderId(returnedOrder);
    setStep('payment');
    void verifyPayment(saved, returnedOrder);
  }, []);

  const activeIndex = step === 'generating' ? 4 : Math.max(0, steps.findIndex(([id]) => id === step));

  async function start() {
    setError('');
    if (!/^[6-9]\d{9}$/.test(mobile.replace(/\D/g, '').slice(-10))) return setError('Enter a valid 10-digit mobile number.');
    if (!consent) return setError('Please provide consent to continue.');
    setLoading(true);
    try {
      const data = await api('/api/customer-report/start', { mobile, consent: true });
      setRequestId(data.request_id);
      window.sessionStorage.setItem('ct_b2c_request_id', data.request_id);
      setStep('otp');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to send OTP.');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setError('');
    if (!/^\d{6}$/.test(otp)) return setError('Enter the 6-digit OTP sent on WhatsApp.');
    setLoading(true);
    try {
      await api('/api/customer-report/verify-otp', { request_id: requestId, otp });
      setStep('payment');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to verify OTP.');
    } finally {
      setLoading(false);
    }
  }

  async function pay() {
    setError('');
    setLoading(true);
    try {
      const order = await api('/api/customer-report/create-order', { request_id: requestId });
      setOrderId(order.order_id);
      setAmount(order.amount);
      await loadCashfree();
      if (!window.Cashfree) throw new Error('Payment gateway did not load.');
      const result = await window.Cashfree({ mode: order.mode }).checkout({
        paymentSessionId: order.payment_session_id,
        redirectTarget: '_modal',
      });
      if (result?.error) throw new Error(result.error.message || 'Payment was not completed.');
      await verifyPayment(requestId, order.order_id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to complete payment.');
    } finally {
      setLoading(false);
    }
  }

  async function verifyPayment(id = requestId, order = orderId) {
    setError('');
    setLoading(true);
    try {
      await api('/api/customer-report/verify-payment', { request_id: id, order_id: order });
      const data = await api('/api/customer-report/prefill', { request_id: id });
      setProfile(data.profile);
      setStep('prefill');
      window.history.replaceState({}, '', '/get-my-report');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Payment verification is pending.');
      setStep('payment');
    } finally {
      setLoading(false);
    }
  }

  async function generate() {
    setError('');
    setStep('generating');
    setLoading(true);
    try {
      const data = await api('/api/customer-report/generate', { request_id: requestId, confirm: true });
      if (!data.ready) throw new Error('Your report is still being prepared. Please try again shortly.');
      setReportId(data.report_id);
      setStep('report');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to generate the report.');
      setStep('prefill');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg text-fg">
      <header className="border-b border-white/10 bg-bg/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/"><AppLogo /></Link>
          <Link href="/" className="text-sm font-semibold text-fg-muted transition-colors hover:text-fg">Back to home</Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-10 sm:py-14 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="tag tag-primary">Secure Financial Report</span>
          <h1 className="mt-5 text-3xl font-bold sm:text-5xl">Get your financial health report</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-fg-muted sm:text-base">
            Verify your mobile, complete the secure payment, confirm your profile and download your report.
          </p>
        </div>

        <div className="mx-auto mt-8 flex max-w-2xl items-center justify-between gap-2">
          {steps.map(([id, label], index) => (
            <div key={id} className="flex min-w-0 flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${index <= activeIndex ? 'bg-primary text-bg' : 'bg-white/10 text-fg-subtle'}`}>
                  {index < activeIndex ? <Icon name="CheckIcon" size={16} /> : index + 1}
                </span>
                <span className={`hidden text-[11px] font-semibold sm:block ${index <= activeIndex ? 'text-fg' : 'text-fg-subtle'}`}>{label}</span>
              </div>
              {index < steps.length - 1 && <span className={`mx-2 mb-5 h-px flex-1 sm:mx-4 ${index < activeIndex ? 'bg-primary' : 'bg-white/15'}`} />}
            </div>
          ))}
        </div>

        <div className="glass-card mx-auto mt-8 max-w-2xl rounded-4xl p-6 sm:p-9">
          {error && <div className="mb-6 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}

          {step === 'mobile' && (
            <div>
              <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary"><Icon name="DevicePhoneMobileIcon" size={24} /></div>
              <h2 className="text-2xl font-bold">Start with your mobile number</h2>
              <p className="mt-2 text-sm text-fg-muted">We will send a one-time password on WhatsApp.</p>
              <label className="mt-6 block text-sm font-semibold">Mobile number</label>
              <div className="mt-2 flex h-12 overflow-hidden rounded-xl border border-white/10 bg-white/[0.045] focus-within:border-primary/50">
                <span className="flex items-center border-r border-white/10 px-4 text-sm text-fg-muted">+91</span>
                <input value={mobile} onChange={(event) => setMobile(event.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" placeholder="10-digit mobile number" className="min-w-0 flex-1 bg-transparent px-4 outline-none" />
              </div>
              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-5 text-fg-muted">
                <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 h-4 w-4 accent-primary" />
                <span>I authorize CreditTrust to retrieve my financial profile and bureau information for generating this report.</span>
              </label>
              <button onClick={start} disabled={loading} className="btn-primary mt-6 w-full justify-center">{loading ? 'Sending OTP...' : 'Send WhatsApp OTP'}</button>
            </div>
          )}

          {step === 'otp' && (
            <div>
              <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary"><Icon name="ChatBubbleLeftRightIcon" size={24} /></div>
              <h2 className="text-2xl font-bold">Verify your mobile</h2>
              <p className="mt-2 text-sm text-fg-muted">Enter the OTP sent to WhatsApp number +91 {mobile}.</p>
              <input value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit OTP" className="mt-6 h-14 w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 text-center text-xl font-bold tracking-[0.35em] outline-none focus:border-primary/50" />
              <button onClick={verifyOtp} disabled={loading} className="btn-primary mt-6 w-full justify-center">{loading ? 'Verifying...' : 'Verify OTP'}</button>
            </div>
          )}

          {step === 'payment' && (
            <div className="text-center">
              <div className="mx-auto mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary"><Icon name="CreditCardIcon" size={28} /></div>
              <h2 className="text-2xl font-bold">Complete secure payment</h2>
              <p className="mt-2 text-sm text-fg-muted">Your profile will be fetched only after successful payment verification.</p>
              <div className="my-7 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                <div className="flex items-center justify-between text-sm"><span className="text-fg-muted">Financial health report</span><strong className="text-xl">₹{amount || Number(process.env.NEXT_PUBLIC_B2C_REPORT_PRICE || 199)}</strong></div>
              </div>
              <button onClick={orderId ? () => verifyPayment() : pay} disabled={loading} className="btn-primary w-full justify-center">{loading ? 'Checking payment...' : orderId ? 'Verify payment' : 'Pay securely'}</button>
            </div>
          )}

          {step === 'prefill' && profile && (
            <div>
              <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary"><Icon name="IdentificationIcon" size={24} /></div>
              <h2 className="text-2xl font-bold">Confirm your profile</h2>
              <p className="mt-2 text-sm text-fg-muted">Please confirm that the retrieved information belongs to you.</p>
              <dl className="mt-6 divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.03] px-5">
                {[
                  ['Name', profile.full_name], ['Date of birth', profile.dob], ['Gender', profile.gender], ['PAN', profile.pan],
                  ['Address', profile.address], ['State & PIN', `${profile.state} - ${profile.pincode}`],
                ].map(([label, value]) => <div key={label} className="grid gap-1 py-3 sm:grid-cols-[140px_1fr]"><dt className="text-xs font-semibold uppercase text-fg-subtle">{label}</dt><dd className="text-sm font-medium capitalize">{value}</dd></div>)}
              </dl>
              <button onClick={generate} disabled={loading} className="btn-primary mt-6 w-full justify-center">Confirm and generate report</button>
            </div>
          )}

          {step === 'generating' && (
            <div className="py-10 text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-primary" />
              <h2 className="mt-6 text-2xl font-bold">Preparing your report</h2>
              <p className="mt-2 text-sm text-fg-muted">Please keep this page open. This can take a few moments.</p>
            </div>
          )}

          {step === 'report' && (
            <div className="py-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary"><Icon name="CheckCircleIcon" size={34} /></div>
              <h2 className="mt-6 text-2xl font-bold">Your report is ready</h2>
              <p className="mt-2 text-sm text-fg-muted">Report reference: <span className="font-semibold text-fg">{reportId}</span></p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <a href={`/credit-intelligence?request_id=${encodeURIComponent(requestId)}`} className="btn-secondary w-full justify-center"><Icon name="ChartBarIcon" size={18} /> Open Credit Intelligence</a>
                <a href={`/api/customer-report/download?request_id=${encodeURIComponent(requestId)}`} className="btn-primary w-full justify-center"><Icon name="ArrowDownTrayIcon" size={18} /> Download PDF report</a>
              </div>
            </div>
          )}
        </div>

        <div className="mx-auto mt-5 flex max-w-2xl items-center justify-center gap-2 text-xs text-fg-subtle"><Icon name="LockClosedIcon" size={14} /> Secure payment and encrypted report access</div>
      </section>
    </main>
  );
}
