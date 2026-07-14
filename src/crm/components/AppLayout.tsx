'use client';
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import { CrmPermissionKey, rolePermissions } from '@/lib/crm/team';
import { crmFetch } from '@/lib/crm/api';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    name: 'CRM User',
    role: 'Admin' as keyof typeof rolePermissions,
    avatar: 'CU',
    permissions: rolePermissions.Admin as CrmPermissionKey[],
  });

  useEffect(() => {
    let cancelled = false;
    const requireCrmSession = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session?.access_token) {
        router.replace(
          `/crm/sign-up-login-screen?next=${encodeURIComponent(pathname || '/crm')}`
        );
        return;
      }
      setAuthChecked(true);
    };
    requireCrmSession();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  useEffect(() => {
    if (!authChecked) return;
    const loadCurrentUser = () => {
      try {
        const raw = window.localStorage.getItem('crm_current_user');
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<typeof currentUser>;
        const role = parsed.role && rolePermissions[parsed.role] ? parsed.role : 'Admin';
        setCurrentUser({
          name: parsed.name || 'Rajesh Kumar',
          role,
          avatar: parsed.avatar || 'RK',
          permissions: Array.isArray(parsed.permissions)
            ? parsed.permissions
            : rolePermissions[role],
        });
      } catch {
        setCurrentUser({
          name: 'CRM User',
          role: 'Admin',
          avatar: 'CU',
          permissions: rolePermissions.Admin,
        });
      }
    };
    loadCurrentUser();
    const loadRealCrmUser = async () => {
      try {
        const response = await crmFetch('/api/crm/me', { cache: 'no-store' });
        const json = await response.json();
        if (!response.ok || !json.success || !json.data) return;
        setCurrentUser({
          name: json.data.name || 'CRM User',
          role: rolePermissions[json.data.role as keyof typeof rolePermissions]
            ? json.data.role
            : 'Admin',
          avatar: json.data.avatar || 'CU',
          permissions: Array.isArray(json.data.permissions)
            ? json.data.permissions
            : rolePermissions.Admin,
        });
      } catch {
        // Keep local preview fallback when CRM auth is not available.
      }
    };
    loadRealCrmUser();
    window.addEventListener('crm-current-user-changed', loadCurrentUser);
    window.addEventListener('storage', loadCurrentUser);
    return () => {
      window.removeEventListener('crm-current-user-changed', loadCurrentUser);
      window.removeEventListener('storage', loadCurrentUser);
    };
  }, [authChecked]);

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-sm font-700 text-muted-foreground">
        Opening CreditTrust CRM...
      </div>
    );
  }

  const handleLogout = async () => {
    window.localStorage.removeItem('crm_current_user');
    await logout('/crm/sign-up-login-screen');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((p) => !p)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
          <button
            className="flex items-center justify-center w-8 h-8 rounded-sm hover:bg-muted transition-colors lg:hidden"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <button
              className="relative flex items-center justify-center w-8 h-8 rounded-sm hover:bg-muted transition-colors"
              aria-label="Notifications"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-danger border-2 border-card" />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-border">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-700">
                {currentUser.avatar}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-foreground leading-none">
                  {currentUser.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{currentUser.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-1 flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                aria-label="Logout"
                title="Logout"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin">{children}</main>
      </div>
    </div>
  );
}
