'use client';
import React, { useEffect, useRef } from 'react';

const lenderFiles = [
  { lender: 'HDFC Bank', product: 'Home Loan', amount: '₹45L', status: 'Approved', color: 'text-emerald-600 bg-emerald-50', agent: 'Rahul S.' },
  { lender: 'Axis Bank', product: 'Personal Loan', amount: '₹8L', status: 'Login Pending', color: 'text-amber-600 bg-amber-50', agent: 'Priya M.' },
  { lender: 'ICICI Bank', product: 'Business Loan', amount: '₹20L', status: 'Disbursed', color: 'text-blue-600 bg-blue-50', agent: 'Rahul S.' },
  { lender: 'SBI', product: 'LAP', amount: '₹35L', status: 'File Sent', color: 'text-primary bg-primary/10', agent: 'Amit K.' },
  { lender: 'Kotak Bank', product: 'Used Car Loan', amount: '₹6L', status: 'Rejected', color: 'text-red-600 bg-red-50', agent: 'Sunita R.' },
];

export default function LenderWorkflowSection() {
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
    <section className="py-16 md:py-24 bg-white" id="lender-workflow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start section-reveal">
          {/* Left: Content */}
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-600 mb-3 px-3 py-1 bg-blue-50 rounded-full">Lender Workflow</span>
            <h2 className="text-section-title font-extrabold text-primary mb-4">
              Route files to the right lender and track every movement.
            </h2>
            <p className="text-base text-muted-foreground mb-6 leading-relaxed">
              Stop guessing which lender a file is with. CreditTrust gives you a clear, real-time view of every file's lender status — so your team can follow up at exactly the right time.
            </p>
            <div className="space-y-3 mb-6">
              {[
                'Lender-wise file status dashboard',
                'Move rejected files to another lender instantly',
                'Compare lender fit before sending',
                'Login pending reminders for agents',
                'Approved / disbursed / rejected tracking',
                'Historical lender performance view',
              ]?.map((b) => (
                <div key={b} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <svg className="flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  {b}
                </div>
              ))}
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
              <p className="text-sm font-semibold text-amber-800">Smart Routing Tip</p>
              <p className="text-xs text-amber-700 mt-1">When a file is rejected by one lender, CreditTrust shows you the next best-fit lender based on the customer profile — so you can re-route without delay.</p>
            </div>
          </div>

          {/* Right: Lender Status Table */}
          <div className="bg-muted/40 rounded-xl border border-border overflow-hidden">
            <div className="bg-primary px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-white/80">Lender File Tracker</span>
              <span className="text-xs text-white/60">July 2026</span>
            </div>
            <div className="divide-y divide-border">
              {lenderFiles?.map((file) => (
                <div key={`${file?.lender}-${file?.product}`} className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-muted/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F2D52" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground">{file?.lender}</p>
                    <p className="text-xs text-muted-foreground">{file?.product} · {file?.amount} · {file?.agent}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${file?.color}`}>
                    {file?.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}