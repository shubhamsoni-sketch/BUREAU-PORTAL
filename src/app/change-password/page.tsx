'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Lock, CheckCircle2, ShieldCheck } from 'lucide-react';

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score === 2) return { score, label: 'Fair', color: 'bg-orange-400' };
  if (score === 3) return { score, label: 'Good', color: 'bg-yellow-400' };
  if (score === 4) return { score, label: 'Strong', color: 'bg-blue-500' };
  return { score, label: 'Very Strong', color: 'bg-emerald-500' };
}

const REQUIREMENTS = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function ChangePasswordPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/');
    }
    // If user is authenticated, redirect to partner-dashboard where the
    // ForcePasswordChangeModal handles the forced password change flow
    if (!isLoading && user && user.role === 'partner') {
      router.replace('/partner-dashboard');
    }
  }, [user, isLoading, router]);

  const strength = getPasswordStrength(newPassword);
  const allRequirementsMet = REQUIREMENTS.every((r) => r.test(newPassword));
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const meetsMinimum = newPassword.length >= 8;
  const canSubmit = meetsMinimum && passwordsMatch && termsAccepted && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }
    if (!termsAccepted) {
      setError('You must accept the Terms & Conditions to continue.');
      return;
    }

    if (!user) {
      setError('Session expired. Please log in again.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, newPassword }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || 'Failed to update password. Please try again.');
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.replace('/partner-dashboard');
      }, 2500);
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 py-12">
      {/* Background decorative blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-7 text-white text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-full mb-3">
              <Lock size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-bold">Set Your New Password</h1>
            <p className="text-blue-100 text-sm mt-1">
              You&apos;re using a temporary password. Secure your account now.
            </p>
          </div>

          <div className="px-8 py-8">
            {success ? (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
                  <CheckCircle2 size={32} className="text-emerald-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800 mb-2">Password Updated!</h2>
                <p className="text-sm text-slate-500">Redirecting you to your dashboard...</p>
                <div className="mt-4 w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Create a strong password"
                      className="w-full px-4 py-3 pr-11 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {newPassword.length > 0 && (
                    <div className="mt-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-500">Password strength</span>
                        <span className={`text-xs font-semibold ${
                          strength.score <= 1 ? 'text-red-500' :
                          strength.score === 2 ? 'text-orange-500' :
                          strength.score === 3 ? 'text-yellow-600' :
                          strength.score === 4 ? 'text-blue-600' : 'text-emerald-600'
                        }`}>{strength.label}</span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                              i <= strength.score ? strength.color : 'bg-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Requirements checklist */}
                  {newPassword.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {REQUIREMENTS.map((req) => {
                        const met = req.test(newPassword);
                        return (
                          <div key={req.label} className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${met ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                              {met && (
                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className={`text-xs transition-colors ${met ? 'text-emerald-700' : 'text-slate-400'}`}>{req.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      className={`w-full px-4 py-3 pr-11 text-sm border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                        confirmPassword.length > 0
                          ? passwordsMatch
                            ? 'border-emerald-400 focus:ring-emerald-500/20 focus:border-emerald-400' :'border-red-300 focus:ring-red-500/20 focus:border-red-400' :'border-slate-200 focus:ring-blue-500/20 focus:border-blue-400'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                  )}
                  {confirmPassword.length > 0 && passwordsMatch && (
                    <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Passwords match
                    </p>
                  )}
                </div>

                {/* Terms & Conditions */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => setTermsAccepted(!termsAccepted)}
                      className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
                        termsAccepted ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300 hover:border-blue-400'
                      }`}
                    >
                      {termsAccepted && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-2"
                      >
                        Terms & Conditions
                      </button>{' '}
                      and{' '}
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-2"
                      >
                        Privacy Policy
                      </button>{' '}
                      of Insight Partner Portal.
                    </p>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                    <ShieldCheck size={14} className="text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Lock size={15} />
                  )}
                  {submitting ? 'Updating Password...' : 'Set New Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowTermsModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 text-lg">Terms & Conditions</h3>
              <button onClick={() => setShowTermsModal(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
            </div>
            <div className="overflow-y-auto px-6 py-5 text-sm text-slate-600 space-y-4 flex-1">
              <p className="font-semibold text-slate-800">Insight Partner Portal — Terms of Use</p>
              <p>By accessing and using the Insight Partner Portal, you agree to the following terms and conditions:</p>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-slate-700">1. Account Security</p>
                  <p>You are responsible for maintaining the confidentiality of your account credentials. You must not share your login details with any third party.</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">2. Data Usage</p>
                  <p>All Bureau reports and customer data accessed through this portal must be used solely for legitimate credit assessment purposes in compliance with applicable laws.</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">3. Confidentiality</p>
                  <p>All information accessed through the portal is confidential. You agree not to disclose, reproduce, or distribute any data obtained through this platform.</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">4. Compliance</p>
                  <p>You agree to comply with all applicable laws, regulations, and guidelines including those issued by RBI, SEBI, and other regulatory bodies.</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">5. Termination</p>
                  <p>Insight reserves the right to suspend or terminate your account for any violation of these terms without prior notice.</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">6. Privacy Policy</p>
                  <p>Your use of this portal is also governed by our Privacy Policy, which describes how we collect, use, and protect your personal information.</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => { setTermsAccepted(true); setShowTermsModal(false); }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                I Accept
              </button>
              <button
                onClick={() => setShowTermsModal(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
