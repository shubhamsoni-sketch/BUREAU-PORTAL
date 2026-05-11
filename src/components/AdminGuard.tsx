'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FileText, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';

const ADMIN_ONLY_PATHS = [
  '/admin-partners',
  '/admin-wallet',
  '/admin-payments',
  '/admin-agreements',
  '/admin-integrations',
  '/admin-audit-logs',
  '/admin-invoices',
  '/admin-customer-master',
  '/admin-dashboard',
  '/customer-master',
  '/partners',
];

const PARTNER_ONLY_PATHS = [
  '/partner-dashboard',
  '/pull-cibil',
  '/my-wallet',
  '/reports-history',
  '/my-profile',
  '/partner-invoices',
];

const PUBLIC_PATHS = [
  '/',
  '/become-a-partner',
  '/admin',
  '/home',
  '/for-individuals',
  '/for-partners',
  '/about',
  '/contact',
  '/pricing',
  '/get-analysis',
  '/features',
  '/integrations',
  '/accounts',
  '/partner-program',
  '/partner-login',
];

const ONBOARDING_PATHS = [
  '/agreement',
  '/change-password',
  '/partner-login',
];

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);
  const [agreementStatus, setAgreementStatus] = useState<'loading' | 'signed' | 'pending' | 'missing'>('loading');

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const isAdminRoute = ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p));
  const isPartnerRoute = PARTNER_ONLY_PATHS.some((p) => pathname.startsWith(p));
  const isOnboardingRoute = ONBOARDING_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

  useEffect(() => {
    if (!isLoading) return;
    const t = setTimeout(() => setTimedOut(true), 10000);
    return () => clearTimeout(t);
  }, [isLoading]);

  useEffect(() => {
    if (!user || user.role !== 'partner') {
      setAgreementStatus('signed');
      return;
    }

    let cancelled = false;
    const loadAgreement = async () => {
      setAgreementStatus('loading');
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
        const res = await fetch('/api/partner-agreement', { headers });
        const json = await res.json();
        if (cancelled) return;
        if (res.ok && json.agreement?.status === 'signed') setAgreementStatus('signed');
        else if (res.ok && json.agreement) setAgreementStatus('pending');
        else setAgreementStatus('missing');
      } catch {
        if (!cancelled) setAgreementStatus('missing');
      }
    };

    loadAgreement();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (isPublicPath || user || (isLoading && !timedOut)) return;
    router.replace(isAdminRoute ? '/admin' : '/partner-login');
  }, [isAdminRoute, isLoading, isPublicPath, router, timedOut, user]);

  // Public paths never need auth, render immediately with no spinner.
  if (isPublicPath) return <>{children}</>;

  const stillLoading = isLoading && !timedOut;

  if (stillLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in: redirect quietly instead of showing a blocking auth message.
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Partner trying to access admin route
  if (isAdminRoute && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-6">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
          <p className="text-slate-500 text-sm mb-4">You do not have permission to access this page. This area is restricted to administrators only.</p>
          <a href="/partner-dashboard" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (user.role === 'partner' && isPartnerRoute && !isOnboardingRoute) {
    if (agreementStatus === 'loading') {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (agreementStatus !== 'signed') {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center max-w-sm mx-auto px-6">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <FileText size={28} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Agreement Required</h2>
            <p className="text-slate-500 text-sm mb-4">
              Please review and sign your partner agreement before accessing the portal.
            </p>
            <a href="/agreement" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
              View Agreement
            </a>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
