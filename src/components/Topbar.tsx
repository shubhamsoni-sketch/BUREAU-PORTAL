'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import NotificationBell from '@/components/NotificationBell';

type TopbarProps = {
  title: string;
  subtitle?: string;
  role: 'admin' | 'partner';
  actions?: React.ReactNode;
};

export default function Topbar({ title, subtitle, role, actions }: TopbarProps) {
  const [userOpen, setUserOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, logout } = useAuth();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setUserOpen(false);
    logout();
  };

  return (
    <header
      className="fixed top-0 right-0 bg-white border-b border-border z-30 flex items-center justify-between px-6 transition-all duration-300"
      style={{
        height: 'var(--header-height)',
        left: 'var(--sidebar-width)',
      }}
    >
      {/* Left: Page Title */}
      <div className="flex flex-col justify-center min-w-0">
        <h1 className="text-lg font-semibold text-foreground leading-tight truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>

      {/* Right: Actions + User */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {actions}

        <NotificationBell />

        {/* Help */}
        <button
          className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150"
          aria-label="Help"
        >
          <Icon name="QuestionMarkCircleIcon" size={20} />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-border" />

        {/* User Avatar with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setUserOpen(!userOpen)}
            className="flex items-center gap-2 cursor-pointer group px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
              {user?.name ? user.name.charAt(0).toUpperCase() : (role === 'admin' ? 'A' : 'P')}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-foreground leading-none">
                {user?.name ? user.name.split(' ')[0] : (role === 'admin' ? 'Admin' : 'Partner')}
              </p>
              <p className="text-xs text-muted-foreground leading-none mt-0.5">
                {role === 'admin' ? 'Super Admin' : 'Partner'}
              </p>
            </div>
            <Icon name="ChevronDownIcon" size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>

          {userOpen && (
            <div className="absolute right-0 top-12 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-800">
                  {user?.name ?? (role === 'admin' ? 'Super Admin' : 'Partner')}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {user?.email ?? (role === 'admin' ? 'admin@credittrust.in' : 'Partner')}
                </p>
              </div>
              <Link
                href="/my-profile"
                onClick={() => setUserOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Icon name="UserCircleIcon" size={14} className="text-slate-500" />
                My Profile
              </Link>
              <div className="border-t border-slate-100 mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Icon name="ArrowRightOnRectangleIcon" size={14} className="text-red-500" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
