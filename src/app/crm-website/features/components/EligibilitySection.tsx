'use client';
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';

export default function EligibilitySection() {
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
    <section className="py-16 md:py-24 bg-white" id="eligibility">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center section-reveal">
          {/* Left: Content */}
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-accent mb-3 px-3 py-1 bg-accent/10 rounded-full">Eligibility Intelligence</span>
            <h2 className="text-section-title font-extrabold text-primary mb-4">
              Qualify customers before sending files to lenders.
            </h2>
            <p className="text-base text-muted-foreground mb-6 leading-relaxed">
              Run consent-based customer checks, understand profile strength, and make faster decisions before spending time on the wrong lender. CreditTrust eligibility intelligence gives your team the data to act confidently.
            </p>
            <div className="space-y-3 mb-6">
              {[
                'Faster customer qualification — know fit before calling lenders',
                'Better lender match — route files based on profile data',
                'Reduced rejection chances — fewer wasted submissions',
                'Usage-based eligibility credits — pay only for what you use',
                'Consent-first workflow — customer approval before any check',
                'Secure and controlled access — admin manages credit allocation',
              ]?.map((b) => (
                <div key={b} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <svg className="flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0EA5A0" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  {b}
                </div>
              ))}
            </div>
            <Link href="/eligibility-checker" className="inline-flex items-center gap-2 text-sm font-bold text-accent hover:text-primary transition-colors">
              See Eligibility Checker details →
            </Link>
          </div>

          {/* Right: Visual */}
          <div className="bg-muted/40 rounded-xl p-5 border border-border">
            <div className="dashboard-card rounded-lg p-4 mb-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-foreground">Customer Profile Check</span>
                <span className="text-xs font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-full">Consent Obtained</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {[
                  { label: 'Income Stability', value: 'High', color: 'text-emerald-600' },
                  { label: 'Existing Obligations', value: 'Moderate', color: 'text-amber-600' },
                  { label: 'Employment Type', value: 'Salaried', color: 'text-blue-600' },
                  { label: 'Profile Fit', value: '82 / 100', color: 'text-primary' },
                ]?.map((item) => (
                  <div key={item?.label} className="bg-muted/60 rounded-lg p-2.5">
                    <p className="text-xs text-muted-foreground mb-0.5">{item?.label}</p>
                    <p className={`text-sm font-bold ${item?.color}`}>{item?.value}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-xs font-semibold text-foreground mb-2">Recommended Lenders</p>
                <div className="flex gap-2 flex-wrap">
                  {['HDFC Bank', 'Axis Bank', 'ICICI Bank']?.map((l) => (
                    <span key={l} className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-lg">{l}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="dashboard-card rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Credit Balance Used</span>
                <span className="text-xs font-bold text-foreground">1 credit</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">Remaining Balance</span>
                <span className="text-xs font-bold text-accent">141 credits</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}