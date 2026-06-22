'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import AppLogo from '@/crm/components/ui/AppLogo';

type LoginForm = { email: string; password: string; remember: boolean };
type SignUpForm = {
  name: string;
  mobile: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  agreeTerms: boolean;
};

const demoCredentials = [
  { role: 'Admin', email: 'admin@dsacrm.in', password: 'Admin@2026' },
  { role: 'Manager', email: 'manager@dsacrm.in', password: 'Manager@2026' },
  { role: 'DSA Agent', email: 'agent@dsacrm.in', password: 'Agent@2026' },
];

export default function SignUpLoginContent() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loginForm = useForm<LoginForm>({
    defaultValues: { email: '', password: '', remember: false },
  });
  const signupForm = useForm<SignUpForm>({
    defaultValues: {
      name: '',
      mobile: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'agent',
      agreeTerms: false,
    },
  });

  const handleLogin = loginForm.handleSubmit(async (data) => {
    const valid = demoCredentials.find(
      (c) => c.email === data.email && c.password === data.password
    );
    if (!valid) {
      loginForm.setError('email', {
        message: 'Invalid credentials — use the demo accounts below to sign in',
      });
      return;
    }
    setIsLoading(true);
    // BACKEND: POST /api/auth/login with { email, password }
    await new Promise((r) => setTimeout(r, 1200));
    setIsLoading(false);
    toast.success(`Welcome back! Signed in as ${valid.role}`);
    window.location.href = '/';
  });

  const handleSignUp = signupForm.handleSubmit(async (data) => {
    if (data.password !== data.confirmPassword) {
      signupForm.setError('confirmPassword', { message: 'Passwords do not match' });
      return;
    }
    setIsLoading(true);
    // BACKEND: POST /api/auth/register with form data
    await new Promise((r) => setTimeout(r, 1200));
    setIsLoading(false);
    toast.success('Account created! Please wait for admin approval.');
    setActiveTab('login');
  });

  const autofillCredentials = (email: string, password: string) => {
    loginForm.setValue('email', email);
    loginForm.setValue('password', password);
    setActiveTab('login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] bg-primary flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full border-2 border-white" />
          <div className="absolute top-40 left-32 w-40 h-40 rounded-full border border-white" />
          <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full border-2 border-white" />
          <div className="absolute bottom-40 right-32 w-48 h-48 rounded-full border border-white" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <AppLogo size={40} />
            <span className="text-2xl font-extrabold text-white tracking-tight">
              DSA<span className="opacity-80">CRM</span>
            </span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-800 text-white leading-tight mb-4">
            India's most trusted
            <br />
            Loan DSA platform
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-sm">
            Manage leads, track loan applications, connect with 50+ lenders, and grow your DSA
            business — all from one powerful dashboard.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {[
            { icon: '📊', text: '₹2,400 Cr+ disbursed through the platform' },
            { icon: '🏦', text: '50+ banks and NBFCs integrated' },
            { icon: '👥', text: '12,000+ active DSA agents across India' },
          ].map((item, i) => (
            <div
              key={`stat-${i}`}
              className="flex items-center gap-3 bg-white/10 rounded-lg px-4 py-3"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-white/90 text-sm font-medium">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-14 xl:px-20 py-10 bg-background overflow-y-auto">
        <div className="w-full max-w-md mx-auto">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <AppLogo size={32} />
            <span className="text-xl font-extrabold text-foreground tracking-tight">
              DSA<span className="text-primary">CRM</span>
            </span>
          </div>

          {/* Tabs */}
          <div className="flex rounded-lg border border-border bg-muted p-1 mb-8">
            {(['login', 'signup'] as const).map((tab) => (
              <button
                key={`tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={[
                  'flex-1 py-2 text-sm font-semibold rounded-sm transition-all duration-150',
                  activeTab === tab
                    ? 'bg-card text-foreground shadow-card'
                    : 'text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                {tab === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <p className="text-2xl font-800 text-foreground mb-1">Welcome back</p>
                <p className="text-sm text-muted-foreground">Sign in to your DSA CRM account</p>
              </div>

              <div className="space-y-1">
                <label htmlFor="login-email" className="block text-sm font-600 text-foreground">
                  Email address
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@dsacrm.in"
                  className="w-full h-10 px-3 rounded-sm border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                  {...loginForm.register('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                  })}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-xs text-danger mt-1">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="login-password" className="block text-sm font-600 text-foreground">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full h-10 px-3 pr-10 rounded-sm border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                    {...loginForm.register('password', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Minimum 6 characters' },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
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
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
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
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-xs text-danger mt-1">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 rounded accent-primary"
                    {...loginForm.register('remember')}
                  />
                  <span className="text-sm text-muted-foreground">Remember me</span>
                </label>
                <button type="button" className="text-sm text-primary font-medium hover:underline">
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 rounded-sm bg-primary text-primary-foreground text-sm font-700 hover:bg-primary/90 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
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
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>

              {/* Demo credentials */}
              <div className="mt-4 rounded-lg border border-border bg-muted/50 overflow-hidden">
                <div className="px-3 py-2 border-b border-border bg-muted">
                  <p className="text-xs font-600 text-muted-foreground uppercase tracking-wide">
                    Demo Accounts — click to autofill
                  </p>
                </div>
                <div className="divide-y divide-border">
                  {demoCredentials.map((cred) => (
                    <button
                      key={`cred-${cred.role}`}
                      type="button"
                      onClick={() => autofillCredentials(cred.email, cred.password)}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted transition-colors text-left group"
                    >
                      <div>
                        <p className="text-xs font-700 text-foreground">{cred.role}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">{cred.email}</p>
                      </div>
                      <span className="text-[10px] text-primary font-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Use →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <p className="text-2xl font-800 text-foreground mb-1">Create account</p>
                <p className="text-sm text-muted-foreground">Register as a DSA agent or manager</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label htmlFor="su-name" className="block text-sm font-600 text-foreground">
                    Full name
                  </label>
                  <input
                    id="su-name"
                    type="text"
                    placeholder="Priya Sharma"
                    className="w-full h-10 px-3 rounded-sm border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                    {...signupForm.register('name', { required: 'Full name is required' })}
                  />
                  {signupForm.formState.errors.name && (
                    <p className="text-xs text-danger">
                      {signupForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label htmlFor="su-mobile" className="block text-sm font-600 text-foreground">
                    Mobile number
                  </label>
                  <input
                    id="su-mobile"
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="w-full h-10 px-3 rounded-sm border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                    {...signupForm.register('mobile', {
                      required: 'Mobile is required',
                      pattern: { value: /^[6-9]\d{9}$/, message: '10-digit mobile number' },
                    })}
                  />
                  {signupForm.formState.errors.mobile && (
                    <p className="text-xs text-danger">
                      {signupForm.formState.errors.mobile.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label htmlFor="su-role" className="block text-sm font-600 text-foreground">
                    Role
                  </label>
                  <select
                    id="su-role"
                    className="w-full h-10 px-3 rounded-sm border border-input bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                    {...signupForm.register('role', { required: 'Select a role' })}
                  >
                    <option value="agent">DSA Agent</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-1">
                  <label htmlFor="su-email" className="block text-sm font-600 text-foreground">
                    Email address
                  </label>
                  <input
                    id="su-email"
                    type="email"
                    placeholder="you@example.com"
                    className="w-full h-10 px-3 rounded-sm border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                    {...signupForm.register('email', {
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+\.\S+$/, message: 'Valid email required' },
                    })}
                  />
                  {signupForm.formState.errors.email && (
                    <p className="text-xs text-danger">
                      {signupForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label htmlFor="su-password" className="block text-sm font-600 text-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="su-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="w-full h-10 px-3 pr-10 rounded-sm border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                      {...signupForm.register('password', {
                        required: 'Password required',
                        minLength: { value: 8, message: 'Min 8 characters' },
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Toggle password"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                  </div>
                  {signupForm.formState.errors.password && (
                    <p className="text-xs text-danger">
                      {signupForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label htmlFor="su-confirm" className="block text-sm font-600 text-foreground">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      id="su-confirm"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="w-full h-10 px-3 pr-10 rounded-sm border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                      {...signupForm.register('confirmPassword', {
                        required: 'Confirm your password',
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Toggle confirm password"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                  </div>
                  {signupForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-danger">
                      {signupForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 w-3.5 h-3.5 rounded accent-primary"
                  {...signupForm.register('agreeTerms', { required: 'You must agree to terms' })}
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  I agree to the{' '}
                  <span className="text-primary font-medium hover:underline cursor-pointer">
                    Terms of Service
                  </span>{' '}
                  and{' '}
                  <span className="text-primary font-medium hover:underline cursor-pointer">
                    Privacy Policy
                  </span>
                </span>
              </label>
              {signupForm.formState.errors.agreeTerms && (
                <p className="text-xs text-danger">
                  {signupForm.formState.errors.agreeTerms.message}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 rounded-sm bg-primary text-primary-foreground text-sm font-700 hover:bg-primary/90 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
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
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
