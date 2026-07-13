'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const ADMIN_ONLY_PATHS = [
  '/admin-partners',
  '/admin-wallet',
  '/admin-payments',
  '/admin-agreements',
  '/admin-integrations',
  '/admin-api-hub',
  '/admin-bulk-cibil',
  '/admin-audit-logs',
  '/admin-invoices',
  '/admin-customer-master',
  '/admin-b2c-reports',
  '/admin-dashboard',
  '/customer-master',
  '/partners',
];

const PUBLIC_PATHS = [
  '/',
  '/become-a-partner',
  '/admin',
  '/home',
  '/for-individuals',
  '/for-partners',
  '/about',
  '/pricing',
  '/get-analysis',
  '/get-my-report',
  '/features',
  '/integrations',
  '/accounts',
  '/api-console',
  '/crm',
  '/partner-program',
  '/partner-login',
  '/privacy-policy',
  '/refund-policy',
  '/usage-policy',
  '/terms-and-conditions',
];

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const isAdminRoute = ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (!isLoading) return;
    const t = setTimeout(() => setTimedOut(true), 10000);
    return () => clearTimeout(t);
  }, [isLoading]);

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

  return <>{children}</>;
}
