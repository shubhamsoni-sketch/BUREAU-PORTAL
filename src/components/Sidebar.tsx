'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/context/AuthContext';

type NavItem = {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: number;
};

type NavGroup = {
  groupId: string;
  title?: string;
  items: NavItem[];
};

const adminNav: NavGroup[] = [
  {
    groupId: 'admin-main',
    items: [
      { id: 'nav-admin-dashboard', label: 'Dashboard', icon: 'Squares2X2Icon', href: '/admin-dashboard' },
      { id: 'nav-admin-partners', label: 'Partners', icon: 'UsersIcon', href: '/partners', badge: 3 },
      { id: 'nav-admin-customers', label: 'Customer Master', icon: 'UserGroupIcon', href: '/customers' },
    ],
  },
  {
    groupId: 'admin-finance',
    title: 'Finance',
    items: [
      { id: 'nav-admin-wallet', label: 'Wallet Management', icon: 'WalletIcon', href: '/wallet-management' },
      { id: 'nav-admin-payments', label: 'Payments', icon: 'CreditCardIcon', href: '/payments' },
    ],
  },
  {
    groupId: 'admin-ops',
    title: 'Operations',
    items: [
      { id: 'nav-admin-reports', label: 'Reports & Analytics', icon: 'ChartBarIcon', href: '/reports' },
      { id: 'nav-admin-agreements', label: 'Agreements', icon: 'DocumentTextIcon', href: '/agreements' },
      { id: 'nav-admin-integrations', label: 'Integrations', icon: 'PuzzlePieceIcon', href: '/integrations' },
      { id: 'nav-admin-audit', label: 'Audit Logs', icon: 'ClipboardDocumentListIcon', href: '/audit-logs' },
    ],
  },
  {
    groupId: 'admin-system',
    title: 'System',
    items: [
      { id: 'nav-admin-settings', label: 'Settings', icon: 'Cog6ToothIcon', href: '/settings' },
    ],
  },
];

const partnerNav: NavGroup[] = [
  {
    groupId: 'partner-main',
    items: [
      { id: 'nav-partner-dashboard', label: 'Dashboard', icon: 'Squares2X2Icon', href: '/partner-dashboard' },
      { id: 'nav-partner-pull', label: 'Pull Bureau', icon: 'MagnifyingGlassIcon', href: '/pull-cibil' },
      { id: 'nav-partner-wallet', label: 'My Wallet', icon: 'WalletIcon', href: '/my-wallet' },
      { id: 'nav-partner-accounts', label: 'Accounts', icon: 'BookOpenIcon', href: '/accounts' },
    ],
  },
  {
    groupId: 'partner-reports',
    title: 'History',
    items: [
      { id: 'nav-partner-reports', label: 'Reports History', icon: 'ClipboardDocumentListIcon', href: '/reports-history' },
    ],
  },
  {
    groupId: 'partner-account',
    title: 'Account',
    items: [
      { id: 'nav-partner-profile', label: 'Profile', icon: 'UserCircleIcon', href: '/my-profile' },
    ],
  },
];

type SidebarProps = {
  role: 'admin' | 'partner';
};

export default function Sidebar({ role }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  const navGroups = role === 'admin' ? adminNav : partnerNav;

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className={`flex items-center gap-2 px-4 border-b border-border transition-all duration-300 ${
          collapsed ? 'justify-center py-4' : 'py-4'
        }`}
        style={{ minHeight: 'var(--header-height)' }}
      >
        <AppLogo size={32} />
        {!collapsed && (
          <span className="font-bold text-base text-foreground tracking-tight">Insight</span>
        )}
      </div>

      {/* Role Badge */}
      {!collapsed && (
        <div className="px-4 pt-3 pb-1">
          <span
            className={`badge text-xs font-semibold ${
              role === 'admin' ? 'badge-blue' : 'bg-purple-50 text-purple-700'
            }`}
          >
            {role === 'admin' ? 'Admin Portal' : 'Partner Portal'}
          </span>
        </div>
      )}

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 scrollbar-thin">
        {navGroups.map((group) => (
          <div key={group.groupId} className="mb-4">
            {group.title && !collapsed && (
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-1">
                {group.title}
              </p>
            )}
            {group.items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`sidebar-nav-item ${isActive(item.href) ? 'active' : ''} ${
                  collapsed ? 'justify-center px-0' : ''
                } relative group`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  name={item.icon as Parameters<typeof Icon>[0]['name']}
                  size={18}
                  className="nav-icon flex-shrink-0"
                />
                {!collapsed && (
                  <span className="flex-1 truncate">{item.label}</span>
                )}
                {!collapsed && item.badge && item.badge > 0 ? (
                  <span className="ml-auto min-w-[20px] h-5 flex items-center justify-center rounded-full bg-primary text-white text-xs font-bold px-1">
                    {item.badge}
                  </span>
                ) : null}
                {collapsed && item.badge && item.badge > 0 ? (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
                ) : null}
                {/* Tooltip on collapsed */}
                {collapsed && (
                  <span className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs font-medium px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                    {item.label}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Collapse Toggle + User */}
      <div className="border-t border-border p-2">
        {!collapsed && (
          <div className="flex items-center gap-2 px-3 py-2 mb-1 rounded-lg hover:bg-muted transition-colors duration-150 cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {role === 'admin' ? 'A' : (user?.name ? user.name.charAt(0).toUpperCase() : 'P')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {role === 'admin' ? 'Admin User' : (user?.name || 'Partner')}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {role === 'admin' ? 'admin@insight.in' : (user?.email || '')}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Icon name={collapsed ? 'ChevronRightIcon' : 'ChevronLeftIcon'} size={16} />
          {!collapsed && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-white border-r border-border z-40 transition-all duration-300 overflow-hidden"
        style={{ width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)' }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-white border-r border-border z-50 lg:hidden transition-transform duration-300 w-[240px] ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Toggle Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-30 p-2 rounded-lg bg-white border border-border shadow-card"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <Icon name="Bars3Icon" size={20} />
      </button>
    </>
  );
}