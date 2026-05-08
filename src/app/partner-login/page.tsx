'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AppLogo from '@/components/ui/AppLogo';
import { Eye, EyeOff, LogIn, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function PartnerLoginPage() {
  const router = useRouter();
  const { user, isLoading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      if (user.role === 'partner') {
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
      const result = await login(email.trim(), password);
      if (!result.success) {
        setError(result.error || 'Invalid email or password.');
        setSubmitting(false);
        return;
      }
    } catch {
      setError('Login failed. Please try again.');
      setSubmitting(false);
    }
  };

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
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex-col justify-between p-12 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />

        <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Credit Intelligence Platform
          </h2>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            Smart Credit Decisions, Powered by Data
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
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Partner Login</h1>
              <p className="text-sm text-slate-500">Sign in to your partner account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-11 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-slate-400"
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
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-600/20 mt-2"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogIn size={16} />
                )}
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>

          {/* Become a partner */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Want to join as a partner?{' '}
            <Link href="/become-a-partner" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors">
              Become a Partner
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
