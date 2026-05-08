'use client';

import React, { useState } from 'react';
import { Bell, ChevronDown, LogOut, User, HelpCircle, Wallet, AlertTriangle } from 'lucide-react';

export default function PartnerTopbar({ title }: { title?: string }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const notifications = [
    { id: 'pnotif-1', text: 'Wallet balance low — only ₹350 remaining', time: '10m ago', dot: 'bg-red-500' },
    { id: 'pnotif-2', text: 'CIBIL report ready for Amit Sharma', time: '1h ago', dot: 'bg-emerald-500' },
    { id: 'pnotif-3', text: 'Your agreement has been signed', time: '2h ago', dot: 'bg-blue-500' },
  ];

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-4 flex-shrink-0 z-10">
      {title && (
        <h1 className="text-base font-semibold text-slate-800 mr-auto">{title}</h1>
      )}

      {/* Wallet Balance Chip */}
      <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
        <AlertTriangle size={13} className="text-amber-500" />
        <Wallet size={13} className="text-amber-600" />
        <span className="text-xs font-semibold text-amber-700 font-mono tabular-nums">₹350 left</span>
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
          <div className="absolute right-0 top-11 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-50 animate-fade-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <span className="text-sm font-semibold text-slate-800">Notifications</span>
              <span className="text-xs text-blue-600 cursor-pointer hover:underline">Mark all read</span>
            </div>
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
        )}
      </div>

      {/* User */}
      <div className="relative">
        <button
          onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
            RK
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold text-slate-800 leading-tight">Rajesh Kumar</p>
            <p className="text-[10px] text-slate-400 leading-tight">DSA Partner</p>
          </div>
          <ChevronDown size={13} className="text-slate-400" />
        </button>

        {userOpen && (
          <div className="absolute right-0 top-11 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 animate-fade-in py-1">
            {[
              { icon: User, label: 'My Profile' },
              { icon: Wallet, label: 'My Wallet' },
              { icon: HelpCircle, label: 'Support' },
            ].map((item) => (
              <button key={`pumenu-${item.label}`} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
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