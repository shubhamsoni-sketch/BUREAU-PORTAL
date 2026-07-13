'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, X, ArrowRight, FileText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePartnerDashboardData } from './PartnerDashboardDataContext';

const DISMISSED_KEY = 'dismissed_invoice_ids';

function getDismissedIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(sessionStorage.getItem(DISMISSED_KEY) || '[]');
  } catch {
    return [];
  }
}

function addDismissedId(id: string) {
  if (typeof window === 'undefined') return;
  const ids = getDismissedIds();
  if (!ids.includes(id)) {
    sessionStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids, id]));
  }
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  issued_at: string;
}

export default function PendingInvoiceBanner() {
  const { user } = useAuth();
  const { data: dashboardData, loading: dashboardLoading } = usePartnerDashboardData();
  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    setDismissedIds(getDismissedIds());
  }, []);

  useEffect(() => {
    if (!user?.id || dashboardLoading) return;

    async function loadPending() {
      try {
        if (!dashboardData?.partnerId) return;

        const invRes = await fetch(
          `/api/admin-invoices-list?partner_id=${dashboardData.partnerId}&status=raised,Pending`
        );
        const invJson = await invRes.json();

        if (!invJson.success || !Array.isArray(invJson.data)) return;

        const pending: Invoice[] = invJson.data.filter(
          (inv: Invoice) => inv.status === 'raised' || inv.status === 'Pending'
        );

        setPendingInvoices(pending);

        // Show popup if there are any new (not dismissed) invoices
        const currentDismissed = getDismissedIds();
        const hasNew = pending.some((inv) => !currentDismissed.includes(inv.id));
        if (hasNew && pending.length > 0) {
          setShowPopup(true);
        }
      } catch {
        // silently fail
      } finally {
        setLoaded(true);
      }
    }

    loadPending();

    // Re-check every 30 seconds for new invoices
    const interval = setInterval(loadPending, 30000);
    return () => clearInterval(interval);
  }, [user?.id, dashboardData?.partnerId, dashboardLoading]);

  function handleDismissPopup() {
    // Mark all current pending invoices as dismissed
    pendingInvoices.forEach((inv) => addDismissedId(inv.id));
    setDismissedIds(getDismissedIds());
    setShowPopup(false);
  }

  function handleDismissBanner() {
    pendingInvoices.forEach((inv) => addDismissedId(inv.id));
    setDismissedIds(getDismissedIds());
    setShowPopup(false);
  }

  if (!loaded || pendingInvoices.length === 0) return null;

  const pendingCount = pendingInvoices.length;
  const pendingTotal = pendingInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const allDismissed = pendingInvoices.every((inv) => dismissedIds.includes(inv.id));

  return (
    <>
      {/* Popup Modal — shown when new invoice arrives */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <FileText size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Invoice Raised</h3>
                  <p className="text-xs text-amber-100 mt-0.5">Action required</p>
                </div>
              </div>
              <button
                onClick={handleDismissPopup}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X size={14} className="text-white" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <p className="text-sm text-slate-700 leading-relaxed">
                You have{' '}
                <strong className="text-slate-900">
                  {pendingCount} pending invoice{pendingCount !== 1 ? 's' : ''}
                </strong>{' '}
                raised by the admin totalling{' '}
                <strong className="text-amber-600">
                  ₹{pendingTotal.toLocaleString('en-IN')}
                </strong>
                . Please make payment to keep your wallet active.
              </p>

              {/* Invoice list */}
              {pendingInvoices.length > 0 && (
                <div className="mt-4 space-y-2">
                  {pendingInvoices.slice(0, 3).map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-100"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{inv.invoice_number}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {new Date(inv.issued_at).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-amber-700">
                        ₹{Number(inv.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                  {pendingInvoices.length > 3 && (
                    <p className="text-xs text-slate-400 text-center">
                      +{pendingInvoices.length - 3} more invoice{pendingInvoices.length - 3 !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 flex gap-3">
              <button
                onClick={handleDismissPopup}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Remind Later
              </button>
              <Link
                href="/accounts?tab=pending"
                onClick={handleDismissPopup}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors"
              >
                View & Pay
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Banner (shown when popup is dismissed but invoices still pending) */}
      {!allDismissed && !showPopup && (
        <div className="mx-auto max-w-6xl mb-4 fade-in">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-300 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle size={16} className="text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800">
                You have{' '}
                <strong>
                  {pendingCount} pending invoice{pendingCount !== 1 ? 's' : ''}
                </strong>{' '}
                totalling{' '}
                <strong>₹{pendingTotal.toLocaleString('en-IN')}</strong> — please make
                payment to recharge your wallet.
              </p>
            </div>
            <Link
              href="/accounts?tab=pending"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors flex-shrink-0"
            >
              View & Pay
              <ArrowRight size={12} />
            </Link>
            <button
              onClick={handleDismissBanner}
              className="p-1.5 rounded-lg hover:bg-amber-100 transition-colors flex-shrink-0"
              aria-label="Dismiss banner"
            >
              <X size={14} className="text-amber-600" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
