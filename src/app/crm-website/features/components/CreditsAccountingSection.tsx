'use client';
import React, { useEffect, useRef } from 'react';

const transactions = [
  { date: '01 Jul 2026', type: 'Credit Added', amount: '+50', balance: '142', status: 'Completed', color: 'text-emerald-600' },
  { date: '28 Jun 2026', type: 'Check Used', amount: '-1', balance: '92', status: 'Used', color: 'text-muted-foreground' },
  { date: '25 Jun 2026', type: 'Invoice #INV-041', amount: '+100', balance: '93', status: 'Paid', color: 'text-emerald-600' },
  { date: '20 Jun 2026', type: 'Check Used', amount: '-1', balance: '-7', status: 'Used', color: 'text-muted-foreground' },
];

export default function CreditsAccountingSection() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    if (ref?.current) observer?.observe(ref?.current);
    return () => observer?.disconnect();
  }, []);

  return (
    <section className="py-16 md:py-24 bg-white" id="credits">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start section-reveal">
          {/* Left: Content */}
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-emerald-600 mb-3 px-3 py-1 bg-emerald-50 rounded-full">Eligibility Credits & Accounting</span>
            <h2 className="text-section-title font-extrabold text-primary mb-4">
              Simple credit requests, invoices, and usage tracking.
            </h2>
            <p className="text-base text-muted-foreground mb-6 leading-relaxed">
              Partners can request eligibility credits, admins approve requests, invoices are generated automatically, and credits are added after payment confirmation. No manual tracking, no confusion.
            </p>
            <div className="space-y-3 mb-6">
              {[
                'Real-time credit balance visibility',
                'One-click credit request from agent panel',
                'Admin approval workflow with notifications',
                'Automatic invoice generation on approval',
                'Credit usage statement per agent',
                'Monthly billing summary for the loan team',
              ]?.map((b) => (
                <div key={b} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <svg className="flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  {b}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Accounting Visual */}
          <div>
            <div className="bg-white rounded-xl border border-border overflow-hidden card-shadow mb-4">
              <div className="px-4 py-3 bg-emerald-50 border-b border-border flex items-center justify-between">
                <span className="text-sm font-bold text-emerald-800">Credit Account — July 2026</span>
                <span className="text-sm font-extrabold text-emerald-600">142 credits</span>
              </div>
              <div className="divide-y divide-border">
                {transactions?.map((tx) => (
                  <div key={tx?.date + tx?.type} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{tx?.type}</p>
                      <p className="text-xs text-muted-foreground">{tx?.date}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-bold ${tx?.color}`}>{tx?.amount}</p>
                      <p className="text-xs text-muted-foreground">Bal: {tx?.balance}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${tx?.status === 'Completed' || tx?.status === 'Paid' ? 'text-emerald-600 bg-emerald-50' : 'text-muted-foreground bg-muted'}`}>
                      {tx?.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
              <p className="text-sm font-bold text-primary mb-1">How credits work</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Each eligibility check uses 1 credit. Credits are pre-purchased in packs. Your admin controls allocation across agents. Usage is logged per check with full audit trail.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}