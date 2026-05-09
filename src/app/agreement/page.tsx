'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PartnerLayout from '@/components/PartnerLayout';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle, Clock, ExternalLink, FileText, ShieldCheck } from 'lucide-react';

interface PartnerAgreement {
  id: string;
  agreement_name: string;
  status: 'pending' | 'signed' | 'expired' | 'cancelled';
  assigned_at: string;
  signed_at: string | null;
  signed_url: string | null;
}

export default function AgreementPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const supabase = createClient();
  const [agreement, setAgreement] = useState<PartnerAgreement | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const authHeaders = async (): Promise<Record<string, string>> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  };

  const loadAgreement = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/partner-agreement', { headers });
      const json = await res.json();
      if (res.ok && json.success) {
        setAgreement(json.agreement);
        setReason(json.reason ?? null);
        if (json.agreement?.status === 'signed') {
          router.push('/partner-dashboard');
        }
      } else {
        setError(json.error || 'Unable to load agreement');
      }
    } catch {
      setError('Unable to load agreement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && user) loadAgreement();
    if (!isLoading && !user) router.push('/partner-login');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, user?.id]);

  const signAgreement = async () => {
    if (!agreement || !consent) return;
    setSubmitting(true);
    setError('');
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/sign-agreement', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agreementId: agreement.id, consent: true }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        router.push('/partner-dashboard');
      } else {
        setError(json.error || 'Unable to sign agreement');
      }
    } catch {
      setError('Unable to sign agreement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PartnerLayout title="Agreement">
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <FileText size={22} className="text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-slate-900">Partner Agreement</h1>
              <p className="text-sm text-slate-500 mt-1">
                Review and accept your assigned agreement to unlock portal access.
              </p>
            </div>
          </div>

          {loading && (
            <div className="mt-8 flex items-center gap-3 text-sm text-slate-500">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Loading agreement...
            </div>
          )}

          {!loading && error && (
            <div className="mt-6 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg p-4">
              {error}
            </div>
          )}

          {!loading && !agreement && !error && (
            <div className="mt-6 bg-amber-50 border border-amber-100 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Clock size={18} className="text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Agreement not assigned yet</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Your account is created, but an agreement has not been assigned yet. Please contact admin to continue onboarding.
                  </p>
                  {reason && <p className="text-xs text-amber-600 mt-2">Status: {reason}</p>}
                </div>
              </div>
            </div>
          )}

          {!loading && agreement && agreement.status !== 'signed' && (
            <div className="mt-6 space-y-5">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Assigned Agreement</p>
                <p className="text-sm font-semibold text-slate-900">{agreement.agreement_name}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Assigned on {new Date(agreement.assigned_at).toLocaleDateString('en-IN')}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {agreement.signed_url && (
                  <a
                    href={agreement.signed_url}
                    target="_blank"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink size={15} /> View Agreement
                  </a>
                )}
              </div>

              <label className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">
                  I confirm that I have read the assigned partner agreement and agree to its terms and conditions.
                </span>
              </label>

              <button
                onClick={signAgreement}
                disabled={!consent || submitting || agreement.status !== 'pending'}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                <ShieldCheck size={16} />
                {submitting ? 'Signing...' : 'Sign Agreement'}
              </button>
            </div>
          )}

          {!loading && agreement?.status === 'signed' && (
            <div className="mt-6 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-lg p-4 flex items-start gap-3">
              <CheckCircle size={18} className="mt-0.5" />
              Agreement already signed. Redirecting to dashboard...
            </div>
          )}
        </div>
      </div>
    </PartnerLayout>
  );
}
