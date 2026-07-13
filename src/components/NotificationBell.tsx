'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, CheckCheck, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authFetch } from '@/lib/supabase/auth-fetch';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

const TYPE_DOT: Record<string, string> = {
  credit_request: 'bg-amber-500',
  invoice_raised: 'bg-blue-500',
  invoice_paid: 'bg-emerald-500',
  wallet_recharged: 'bg-emerald-500',
  account_approved: 'bg-purple-500',
  default: 'bg-slate-400',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await authFetch('/api/get-notifications');
      const json = await res.json();
      if (json.success) {
        setNotifications(json.notifications ?? []);
        setUnreadCount(json.unreadCount ?? 0);
      }
    } catch {
      // silent
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    fetchNotifications();
    // Poll every 15 seconds for near-real-time notifications
    pollRef.current = setInterval(fetchNotifications, 15000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchNotifications, user?.id]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const markAllRead = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await authFetch('/api/mark-notifications-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const markOneRead = async (notifId: string) => {
    if (!user?.id) return;
    await authFetch('/api/mark-notifications-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notification_id: notifId }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={17} className={`text-slate-600 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 animate-fade-in overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={loading}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline disabled:opacity-50"
                >
                  <CheckCheck size={12} />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-100 text-slate-400"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell size={24} className="text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => { if (!n.is_read) markOneRead(n.id); }}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 last:border-0 cursor-pointer transition-colors
                    ${n.is_read ? 'hover:bg-slate-50' : 'bg-blue-50/40 hover:bg-blue-50/70'}`}
                >
                  <span
                    className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${TYPE_DOT[n.type] ?? TYPE_DOT.default}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-relaxed ${n.is_read ? 'text-slate-600' : 'text-slate-800 font-medium'}`}>
                      {n.message}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
