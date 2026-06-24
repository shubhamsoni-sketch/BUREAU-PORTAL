'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from './ui/AppLogo';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  group?: string;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    group: 'Main',
    icon: (
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
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: 'Lead Management',
    href: '/lead-management',
    group: 'Pipeline',
    badge: 8,
    icon: (
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
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'Loan Applications',
    href: '/loan-application-tracking',
    group: 'Pipeline',
    badge: 5,
    icon: (
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
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    label: 'Lender Selection',
    href: '/lender-selection',
    group: 'Pipeline',
    icon: (
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
        <path d="M3 6h18" />
        <path d="M7 12h10" />
        <path d="M10 18h4" />
        <circle cx="18" cy="12" r="3" />
      </svg>
    ),
  },
  {
    label: 'Lender Management',
    href: '/lender-management',
    group: 'Partners',
    icon: (
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
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    label: 'Team Management',
    href: '/team-management',
    group: 'Partners',
    icon: (
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
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'Eligibility Checker',
    href: '/eligibility-check',
    group: 'Tools',
    icon: (
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
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    label: 'EMI Calculator',
    href: '/emi-calculator',
    group: 'Tools',
    icon: (
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
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    label: 'Reports & Analytics',
    href: '/reports-analytics-dashboard',
    group: 'Insights',
    icon: (
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
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    label: 'Setup',
    href: '/setup',
    group: 'Settings',
    icon: (
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
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 7.04 4.3l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.08a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v.08a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();

  const groups = Array.from(new Set(navItems.map((i) => i.group)));
  const crmHref = (href: string) => (href === '/' ? '/crm' : `/crm${href}`);

  return (
    <aside
      className={[
        'flex flex-col bg-card border-r border-border sidebar-transition shrink-0 z-40',
        'fixed inset-y-0 left-0 lg:relative',
        collapsed ? 'w-16' : 'w-60',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      ].join(' ')}
    >
      {/* Logo */}
      <div
        className={[
          'flex items-center border-b border-border h-14 shrink-0',
          collapsed ? 'justify-center px-0' : 'px-4 gap-2',
        ].join(' ')}
      >
        <div className="flex items-center gap-2">
          <AppLogo size={32} />
          {!collapsed && (
            <span className="font-extrabold text-base text-foreground tracking-tight whitespace-nowrap">
              DSA<span className="text-primary">CRM</span>
            </span>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={onMobileClose}
            className="ml-auto lg:hidden flex items-center justify-center w-6 h-6 rounded hover:bg-muted transition-colors"
            aria-label="Close sidebar"
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2">
        {groups.map((group) => (
          <div key={`group-${group}`} className="mb-4">
            {!collapsed && (
              <p className="px-2 mb-1 text-[10px] font-600 uppercase tracking-widest text-muted-foreground">
                {group}
              </p>
            )}
            {navItems
              .filter((i) => i.group === group)
              .map((item) => {
                const href = crmHref(item.href);
                const isActive =
                  href === '/crm'
                    ? pathname === '/crm' || pathname === '/crm/dashboard'
                    : pathname.startsWith(href);
                return (
                  <Link
                    key={`nav-${item.href}`}
                    href={href}
                    title={collapsed ? item.label : undefined}
                    className={[
                      'flex items-center gap-3 px-2 py-2 rounded-sm text-sm font-medium transition-all duration-150 mb-0.5 group relative',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    ].join(' ')}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {!collapsed && item.badge && (
                      <span className="ml-auto flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-danger-foreground text-[10px] font-700">
                        {item.badge}
                      </span>
                    )}
                    {collapsed && item.badge && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-danger" />
                    )}
                    {collapsed && (
                      <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-sm bg-foreground text-background text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-card">
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}
          </div>
        ))}
      </nav>

      {/* Collapse toggle + user */}
      <div className="border-t border-border p-2">
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-2 mb-1 rounded-sm bg-muted/50">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-700 shrink-0">
              RK
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">Rajesh Kumar</p>
              <p className="text-[10px] text-muted-foreground">Admin</p>
            </div>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex w-full items-center justify-center gap-2 px-2 py-1.5 rounded-sm text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
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
              <polyline points="13 17 18 12 13 7" />
              <polyline points="6 17 11 12 6 7" />
            </svg>
          ) : (
            <>
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
                <polyline points="11 17 6 12 11 7" />
                <polyline points="18 17 13 12 18 7" />
              </svg>
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
