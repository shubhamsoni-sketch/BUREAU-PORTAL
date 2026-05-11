'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import AppLogo from '@/components/ui/AppLogo';
import { Eye, EyeOff, LogIn, ShieldAlert, Shield } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, isLoading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupMessage, setSetupMessage] = useState('');

  // If AuthContext already has an admin session, redirect immediately
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'admin') {
        router.replace('/admin-partners');
      } else {
        router.replace('/partner-dashboard');
      }
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      // Use the shared AuthContext login — single Supabase client, no competing locks
      const result = await login(email.trim(), password);
      if (!result.success) {
        setError(result.error ?? 'Invalid email or password.');
        setSubmitting(false);
        return;
      }

      // After login succeeds, check role via the singleton client (session is already set)
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        setError('Login failed. Please try again.');
        setSubmitting(false);
        return;
      }

      // Check role from JWT metadata first (most reliable — not affected by RLS)
      const appRole = session.user.app_metadata?.role;
      const metaRole = session.user.user_metadata?.role;

      if (appRole === 'admin' || metaRole === 'admin') {
        router.replace('/admin-partners');
        return;
      }

      // Fallback: query user_profiles table
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile?.role === 'admin') {
        router.replace('/admin-partners');
        return;
      }

      // Final fallback: verify via server-side API (bypasses RLS)
      const verifyRes = await fetch('/api/verify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id }),
      });
      const verifyData = await verifyRes.json();

      if (verifyData.isAdmin) {
        router.replace('/admin-partners');
        return;
      }

      router.replace('/partner-dashboard');
      setError('This account is a partner account. Opening the partner portal.');
      setSubmitting(false);
    } catch {
      setError('Login failed. Please try again.');
      setSubmitting(false);
    }
  };

  const handleSetupAdmin = async () => {
    setSetupLoading(true);
    setSetupMessage('');
    try {
      const res = await fetch('/api/setup-admin', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSetupMessage(data.message ?? 'Admin account ready. Try logging in now.');
      } else {
        setSetupMessage(data.error ?? 'Setup failed. Please try again.');
      }
    } catch {
      setSetupMessage('Network error. Please try again.');
    } finally {
      setSetupLoading(false);
    }
  };

  // Show spinner while AuthContext is initialising
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex-col justify-between p-12 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-slate-600/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

        <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-6">
            <Shield size={28} className="text-indigo-400" />
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Admin Portal
          </h2>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            Restricted access — authorized administrators only.
          </p>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 justify-center mb-8">
            <AppLogo size={32} />
            <span className="text-xl font-bold text-slate-800">Insight</span>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-8 py-10">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={18} className="text-indigo-600" />
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Admin Access</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Administrator Login</h1>
              <p className="text-sm text-slate-500">Sign in with your admin credentials</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Email */}
              <div>
                <label htmlFor="admin-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email Address
                </label>
                <input
                  id="admin-email"
                  type="text"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="admin-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-11 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                  <ShieldAlert size={14} className="text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-indigo-600/20 mt-2"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogIn size={16} />
                )}
                {submitting ? 'Signing in...' : 'Sign In as Admin'}
              </button>

              {/* Reset/Setup Admin */}
              <div className="pt-2 border-t border-slate-100">
                {setupMessage && (
                  <p className="text-xs text-center text-slate-500 mb-2">{setupMessage}</p>
                )}
                <button
                  type="button"
                  disabled={setupLoading}
                  onClick={handleSetupAdmin}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-600 text-xs font-medium rounded-xl transition-colors"
                >
                  {setupLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ShieldAlert size={14} />
                  )}
                  {setupLoading ? 'Setting up...' : 'Reset / Setup Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
