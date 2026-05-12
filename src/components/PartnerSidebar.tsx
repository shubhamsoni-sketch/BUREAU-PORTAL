'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { LayoutDashboard, FileSearch, Wallet, History, UserCircle, BookUser, ChevronLeft, ChevronRight, Zap, BookOpen,  } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


const partnerNav = [
  { label: 'Dashboard', href: '/partner-dashboard', icon: LayoutDashboard },
  { label: 'Pull Bureau', href: '/pull-bureau', icon: FileSearch },
  { label: 'My Wallet', href: '/my-wallet', icon: Wallet },
  { label: 'Accounts', href: '/accounts', icon: BookOpen },
  { label: 'Customer Master', href: '/customer-master', icon: BookUser },
  { label: 'Reports History', href: '/reports-history', icon: History },
  { label: 'My Profile', href: '/my-profile', icon: UserCircle },
];

export default function PartnerSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

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
      {/* Mode Badge */}
      {!collapsed && (
        <div className="mx-4 mt-3 mb-1 flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-600/20 border border-emerald-500/30">
          <Zap size={13} className="text-emerald-400" />
          <span className="text-xs font-medium text-emerald-300 tracking-wide">LIVE MODE</span>
        </div>
      )}
      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2">
        {partnerNav?.map((item) => {
          const isActive = pathname === item?.href;
          const Icon = item?.icon;
          return (
            <Link
              key={`pnav-${item?.href}`}
              href={item?.href}
              title={collapsed ? item?.label : undefined}
              className={`
                flex items-center gap-3 px-2.5 py-2.5 rounded-lg mb-0.5
                text-sm font-medium transition-all duration-150
                ${isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <Icon size={17} className="flex-shrink-0" />
              {!collapsed && <span>{item?.label}</span>}
            </Link>
          );
        })}
      </nav>
      {/* Bottom */}
      <div className="border-t border-slate-700/60 p-2">
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
