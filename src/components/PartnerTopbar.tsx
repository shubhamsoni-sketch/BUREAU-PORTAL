'use client';

import React, { useState } from 'react';
import { ChevronDown, LogOut, User, Wallet, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import NotificationBell from '@/components/NotificationBell';

export default function PartnerTopbar({ title }: { title?: string }) {
  const [userOpen, setUserOpen] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'P';

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-4 flex-shrink-0 z-10">
      {title && (
        <h1 className="text-base font-semibold text-slate-800 mr-auto">{title}</h1>
      )}

      {/* Wallet Balance Chip */}
      <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
        <AlertTriangle size={13} className="text-amber-500" />
        <Wallet size={13} className="text-amber-600" />
        <span className="text-xs font-semibold text-amber-700 font-mono tabular-nums">Low Balance</span>
      </div>

      {/* Real Notification Bell */}
      <NotificationBell />

      {/* User */}
      <div className="relative">
        <button
          onClick={() => setUserOpen(!userOpen)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
            {initials}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.name ?? 'Partner'}</p>
            {user?.partnerCode && (
              <p className="text-[10px] text-slate-400 leading-tight">{user.partnerCode}</p>
            )}
          </div>
          <ChevronDown size={13} className="text-slate-400" />
        </button>

        {userOpen && (
          <div className="absolute right-0 top-11 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1">
            <button
              onClick={() => { setUserOpen(false); router.push('/my-profile'); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <User size={14} className="text-slate-500" />
              My Profile
            </button>
            <div className="border-t border-slate-100 mt-1 pt-1">
              <button
                onClick={() => { setUserOpen(false); logout(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}