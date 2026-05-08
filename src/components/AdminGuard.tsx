'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const ADMIN_ONLY_PATHS = [
  '/admin-partners',
  '/admin-wallet',
  '/admin-payments',
  '/admin-agreements',
  '/admin-integrations',
  '/admin-audit-logs',
  '/admin-dashboard',
  '/customer-master',
  '/partners',
];

const PARTNER_ONLY_PATHS = [
  '/partner-dashboard',
  '/pull-cibil',
  '/my-wallet',
  '/reports-history',
  '/profile',
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
  '/my-profile',
  '/change-password',
  '/partner-invoices',
  '/reports-history',
  '/my-wallet',
  '/pull-cibil',
  '/partner-dashboard',
  '/customer-master',
  '/partners',
  '/admin-partners',
  '/admin-wallet',
  '/admin-payments',
  '/admin-agreements',
  '/admin-integrations',
  '/admin-audit-logs',
  '/admin-invoices',
  '/admin-customer-master',
  '/partner-program',
  '/partner-login',
];

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!isLoading) return;
    const t = setTimeout(() => setTimedOut(true), 10000);
    return () => clearTimeout(t);
  }, [isLoading]);

  // Public paths never need auth — render immediately, no spinner
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  if (isPublicPath) return <>{children}</>;

  const stillLoading = isLoading && !timedOut;

  if (stillLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in — show access denied
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-6">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Authentication Required</h2>
          <p className="text-slate-500 text-sm mb-4">Please log in to access this page.</p>
          <a href="/partner-login" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  const isAdminRoute = ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p));

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
