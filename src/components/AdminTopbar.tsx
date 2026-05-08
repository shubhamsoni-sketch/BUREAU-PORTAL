'use client';

import React, { useState } from 'react';
import { Bell, Search, ChevronDown, Settings, LogOut, User, HelpCircle } from 'lucide-react';

export default function AdminTopbar({ title }: { title?: string }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const notifications = [
    { id: 'notif-1', text: 'Partner Kiran Mehta awaiting activation', time: '5m ago', dot: 'bg-amber-500' },
    { id: 'notif-2', text: 'Low wallet alert: Suresh DSA (₹200 left)', time: '22m ago', dot: 'bg-red-500' },
    { id: 'notif-3', text: 'New agreement signed by Priya Finance', time: '1h ago', dot: 'bg-blue-500' },
    { id: 'notif-4', text: 'CIBIL API integration test passed', time: '3h ago', dot: 'bg-emerald-500' },
  ];

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

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); }}
          className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
        >
          <Bell size={17} className="text-slate-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-11 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 animate-fade-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <span className="text-sm font-semibold text-slate-800">Notifications</span>
              <span className="text-xs text-blue-600 cursor-pointer hover:underline">Mark all read</span>
            </div>
            <div className="max-h-72 overflow-y-auto scrollbar-thin">
              {notifications.map((n) => (
                <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0">
                  <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${n.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 leading-relaxed">{n.text}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-2.5 border-t border-slate-100">
              <button className="text-xs text-blue-600 hover:underline w-full text-center">View all notifications</button>
            </div>
          </div>
        )}
      </div>

      {/* User Menu */}
      <div className="relative">
        <button
          onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
            SA
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold text-slate-800 leading-tight">Super Admin</p>
            <p className="text-[10px] text-slate-400 leading-tight">admin@cibilysis.in</p>
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
              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
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