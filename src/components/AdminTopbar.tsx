'use client';

import React, { useState } from 'react';
import { Search, ChevronDown, Settings, LogOut, User, HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import NotificationBell from '@/components/NotificationBell';

export default function AdminTopbar({ title }: { title?: string }) {
  const [userOpen, setUserOpen] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-4 flex-shrink-0 z-10">
      {title && (
        <h1 className="text-base font-semibold text-slate-800 mr-auto">{title}</h1>
      )}

      {/* Search */}
      <div className="relative ml-auto">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search partners, customers..."
          className="pl-8 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg w-60 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all placeholder:text-slate-400"
        />
      </div>

      {/* Real Notification Bell */}
      <NotificationBell />

      {/* User Menu */}
      <div className="relative">
        <button
          onClick={() => { setUserOpen(!userOpen); }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'SA'}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.name ?? 'Super Admin'}</p>
            <p className="text-[10px] text-slate-400 leading-tight">{user?.email ?? 'admin@insight.in'}</p>
          </div>
          <ChevronDown size={13} className="text-slate-400" />
        </button>

        {userOpen && (
          <div className="absolute right-0 top-11 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 animate-fade-in py-1">
            {[
              { icon: User, label: 'My Profile' },
              { icon: Settings, label: 'Settings' },
              { icon: HelpCircle, label: 'Help Center' },
            ].map((item) => (
              <button key={`umenu-${item.label}`} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                <item.icon size={14} className="text-slate-500" />
                {item.label}
              </button>
            ))}
            <div className="border-t border-slate-100 mt-1 pt-1">
              <button
                onClick={() => { setUserOpen(false); logout(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}