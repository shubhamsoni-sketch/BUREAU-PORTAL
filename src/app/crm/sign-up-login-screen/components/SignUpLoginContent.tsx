'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AppLogo from '@/crm/components/ui/AppLogo';
import { createClient } from '@/lib/supabase/client';

type LoginForm = { email: string; password: string; remember: boolean };

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function SignUpLoginContent() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loginForm = useForm<LoginForm>({
    defaultValues: { email: '', password: '', remember: false },
  });

  const handleLogin = loginForm.handleSubmit(async (data) => {
    setIsLoading(true);
    loginForm.clearErrors();

    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email.trim().toLowerCase(),
      password: data.password,
    });
    if (authError || !authData.session?.access_token || !authData.user) {
      setIsLoading(false);
      loginForm.setError('email', { message: 'Invalid email or password' });
      return;
    }

    try {
      const response = await fetch('/api/crm/me', {
        cache: 'no-store',
        headers: {
          authorization: `Bearer ${authData.session.access_token}`,
          'x-crm-user-id': authData.user.id,
        },
      });
      const json = await response.json();
      if (!response.ok || !json.success || !json.data) {
        throw new Error(json.error || 'CRM access is not enabled for this account');
      }

      const crmUser = {
        name: json.data.name || authData.user.user_metadata?.full_name || 'CRM User',
        role: json.data.role || 'Admin',
        avatar:
          json.data.avatar ||
          initials(json.data.name || authData.user.user_metadata?.full_name || 'CRM User'),
        permissions: Array.isArray(json.data.permissions) ? json.data.permissions : [],
      };
      window.localStorage.setItem('crm_current_user', JSON.stringify(crmUser));
      window.dispatchEvent(new Event('crm-current-user-changed'));
      toast.success('Welcome to CreditTrust CRM');
      const next = new URLSearchParams(window.location.search).get('next') || '/crm';
      router.replace(next);
      router.refresh();
    } catch (error) {
      await supabase.auth.signOut();
      loginForm.setError('email', {
        message: error instanceof Error ? error.message : 'CRM access is not enabled',
      });
    } finally {
      setIsLoading(false);
    }
  });

  return (
    <div className="min-h-screen grid lg:grid-cols-[0.9fr_1.1fr] bg-background">
      <section className="hidden lg:flex flex-col justify-center border-r border-border bg-[#0f172a] p-10 text-white">
        <div>
          <div className="flex items-center gap-3">
            <AppLogo size={42} />
            <div>
              <p className="text-xl font-900 leading-none">CreditTrust</p>
              <p className="text-xs font-700 uppercase tracking-[0.18em] text-white/55 mt-1">
                CRM Workspace
              </p>
            </div>
          </div>
          <div className="mt-16 max-w-md">
            <p className="text-xs font-800 uppercase tracking-[0.18em] text-blue-200">
              Partner Operations
            </p>
            <h1 className="mt-4 text-4xl font-900 leading-tight">
              Leads, eligibility checks, and file movement in one workspace.
            </h1>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden flex items-center gap-2">
            <AppLogo size={34} />
            <span className="text-xl font-900 text-foreground">
              Credit<span className="text-primary">Trust</span> CRM
            </span>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-card">
            <div className="mb-6">
              <p className="text-2xl font-900 text-foreground">Sign in</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Access your CreditTrust CRM workspace
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="block text-sm font-700 text-foreground">
                  Email address
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  className="h-10 w-full rounded-sm border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring/40"
                  {...loginForm.register('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                  })}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-xs font-700 text-danger">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="login-password" className="block text-sm font-700 text-foreground">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter password"
                    className="h-10 w-full rounded-sm border border-input bg-background px-3 pr-10 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring/40"
                    {...loginForm.register('password', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Minimum 6 characters' },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    className="absolute right-2 top-1/2 flex h-7 w-12 -translate-y-1/2 items-center justify-center rounded-sm text-xs font-700 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-xs font-700 text-danger">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded accent-primary"
                    {...loginForm.register('remember')}
                  />
                  Keep me signed in
                </label>
                <span className="text-xs font-700 text-muted-foreground">Admin managed</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex h-10 w-full items-center justify-center rounded-sm bg-primary text-sm font-800 text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
              >
                {isLoading ? 'Signing in...' : 'Open CRM'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
