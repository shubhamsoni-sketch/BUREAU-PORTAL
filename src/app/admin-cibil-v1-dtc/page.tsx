'use client';

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { authFetch } from '@/lib/supabase/auth-fetch';

type ApiResult = {
  success: boolean;
  httpStatus?: number;
  businessStatus?: string | null;
  error?: string | null;
  result?: Record<string, unknown>;
};

const emptyForm = { cust_fname: '', cust_mname: '', cust_lname: '', cust_pan: '', cust_phone: '' };

export default function AdminCibilV1DtcPage() {
  const [form, setForm] = useState(emptyForm);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consentConfirmed || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await authFetch('/api/admin-cibil-v1-dtc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        timeoutMs: 45_000,
      });
      setResult(await response.json());
    } catch {
      setResult({ success: false, error: 'Request failed. It may still have reached the provider; check status before retrying.' });
    } finally {
      setLoading(false);
    }
  }

  function download() {
    if (!result?.result) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(result.result, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `cibil-v1-dtc-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminLayout title="CIBIL V1 DTC">
      <div className="mx-auto max-w-5xl space-y-6 p-5 md:p-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Separate provider</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">CIBIL V1 DTC</h1>
          <p className="mt-2 text-sm text-slate-600">Manual report pull via Optim. Existing CIBIL integration and partner APIs are unchanged.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Customer details</h2>
            {([
              ['cust_fname', 'First name', true],
              ['cust_mname', 'Middle name', false],
              ['cust_lname', 'Last name', true],
              ['cust_pan', 'PAN', true],
              ['cust_phone', 'Mobile number', true],
            ] as const).map(([key, label, required]) => (
              <label key={key} className="block text-sm font-medium text-slate-700">
                {label}
                <input
                  required={required}
                  value={form[key]}
                  onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                  autoComplete="off"
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </label>
            ))}
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input type="checkbox" checked={consentConfirmed} onChange={(event) => setConsentConfirmed(event.target.checked)} className="mt-1" />
              I confirm that customer authorization for this credit report pull is recorded.
            </label>
            <button disabled={!consentConfirmed || loading} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? 'Requesting report...' : 'Request CIBIL V1 report'}
            </button>
            <p className="text-xs text-slate-500">A timeout or verification-in-progress result is not safe to retry automatically.</p>
          </form>
          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-live="polite">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Provider response</h2>
              {result?.result && <button type="button" onClick={download} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Download JSON</button>}
            </div>
            {!result && <p className="mt-5 text-sm text-slate-500">No request in this session.</p>}
            {result && <>
              <div className={`mt-4 rounded-xl p-3 text-sm ${result.success ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>
                <strong>{result.success ? 'Report received' : 'Report not confirmed'}</strong>
                {result.httpStatus && <span> · HTTP {result.httpStatus}</span>}
                {result.businessStatus && <span> · Provider {result.businessStatus}</span>}
                {result.error && <p className="mt-1">{result.error}</p>}
              </div>
              {result.result && <pre className="mt-4 max-h-[550px] overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(result.result, null, 2)}</pre>}
            </>}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
