'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { LayoutDashboard, Users, BookUser, Wallet, CreditCard, FileText, Plug, ScrollText, ChevronLeft, ChevronRight, LogOut, Shield, Receipt, UserRoundCheck, Network, FileSpreadsheet, Megaphone } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/context/AuthContext';


const navGroups = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin-dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Partner Management',
    items: [
      { label: 'Partners', href: '/admin-partners', icon: Users, badge: 3 },
      { label: 'Customer Master', href: '/admin-customer-master', icon: BookUser },
      { label: 'B2C Reports', href: '/admin-b2c-reports', icon: UserRoundCheck },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Wallet Management', href: '/admin-wallet', icon: Wallet },
      { label: 'Payments', href: '/admin-payments', icon: CreditCard },
      { label: 'Invoices', href: '/admin-invoices', icon: Receipt },
    ],
  },
  {
    label: 'API Hub',
    items: [
      { label: 'API Hub', href: '/admin-api-hub', icon: Network },
      { label: 'Bulk CIBIL Pull', href: '/admin-bulk-cibil', icon: FileSpreadsheet },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { label: 'Promotions', href: '/admin-promotions', icon: Megaphone },
    ],
  },
  {
    label: 'Documents',
    items: [
      { label: 'Agreements', href: '/admin-agreements', icon: FileText },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Integrations', href: '/admin-integrations', icon: Plug },
      { label: 'Audit Logs', href: '/admin-audit-logs', icon: ScrollText },
    ],
  },
];

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside
      className={`
        relative flex flex-col bg-slate-900 text-white h-screen
        transition-all duration-300 ease-in-out flex-shrink-0
        ${collapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* Logo */}
      <div className={`flex items-center h-16 px-4 border-b border-slate-700/60 ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <AppLogo variant={collapsed ? 'mark' : 'dark'} size={collapsed ? 28 : 40} width={collapsed ? 34 : 150} height={collapsed ? 28 : 42} />
      </div>
      {/* Role Badge */}
      {!collapsed && (
        <div className="mx-4 mt-3 mb-1 flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-600/20 border border-blue-500/30">
          <Shield size={13} className="text-blue-400" />
          <span className="text-xs font-medium text-blue-300 tracking-wide">ADMIN PANEL</span>
        </div>
      )}
      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-2 px-2">
        {navGroups?.map((group) => (
          <div key={`group-${group?.label}`} className="mb-1">
            {!collapsed && (
              <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {group?.label}
              </p>
            )}
            {group?.items?.map((item) => {
              const isActive = pathname === item?.href || pathname?.startsWith(item?.href + '/');
              const Icon = item?.icon;
              return (
                <Link
                  key={`nav-${item?.href}`}
                  href={item?.href}
                  title={collapsed ? item?.label : undefined}
                  className={`
                    relative flex items-center gap-3 px-2.5 py-2 rounded-lg mb-0.5
                    text-sm font-medium transition-all duration-150
                    ${isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }
                    ${collapsed ? 'justify-center' : ''}
                  `}
                >
                  <Icon size={17} className="flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item?.label}</span>}
                  {!collapsed && item?.badge && (
                    <span className="ml-auto text-[10px] font-semibold bg-amber-500 text-white px-1.5 py-0.5 rounded-full">
                      {item?.badge}
                    </span>
                  )}
                  {collapsed && item?.badge && (
                    <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-amber-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      {/* Bottom */}
      <div className="border-t border-slate-700/60 p-2">
        <div className={`flex items-center gap-3 px-2.5 py-2 rounded-lg ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            SA
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name ?? 'Super Admin'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email ?? 'admin@credittrust.in'}</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={() => logout()} className="text-slate-500 hover:text-white transition-colors">
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>
      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-600 transition-all duration-150 z-10"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
