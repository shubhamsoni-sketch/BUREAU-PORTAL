import React from 'react';
import Link from 'next/link';

export default function EligibilityHero() {
  return (
    <section className="pt-24 pb-12 md:pt-32 md:pb-16 gradient-hero-bg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left */}
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-accent mb-4 px-3 py-1 bg-accent/10 rounded-full">
              Eligibility Intelligence
            </span>
            <h1 className="text-hero-xl font-extrabold text-primary mb-5">
              Qualify customers before sending files to lenders.
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mb-8 leading-relaxed max-w-lg">
              CreditTrust eligibility intelligence helps DSAs and loan agents run consent-based customer checks, understand profile strength, and make smarter lender routing decisions — before wasting time on the wrong lender.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold text-base px-7 py-3.5 rounded-lg hover:bg-accent transition-colors shadow-card">
                See It in a Demo
              </Link>
              <Link href="/features#eligibility" className="inline-flex items-center justify-center gap-2 bg-white border border-border text-primary font-semibold text-base px-7 py-3.5 rounded-lg hover:border-accent hover:text-accent transition-colors">
                Full Feature Details
              </Link>
            </div>
          </div>

          {/* Right: Visual */}
          <div className="bg-white rounded-xl border border-border p-5 card-shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-foreground">Priya Iyer — Personal Loan</p>
                <p className="text-xs text-muted-foreground">Requested: ₹10 Lakhs · Salaried · Mumbai</p>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Consent Obtained</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'Income Level', value: 'Stable', icon: '💼', color: 'text-emerald-600' },
                { label: 'Repayment Capacity', value: 'Good', icon: '📊', color: 'text-emerald-600' },
                { label: 'Existing Obligations', value: 'Low', icon: '✓', color: 'text-blue-600' },
                { label: 'Employment Type', value: 'Salaried', icon: '🏢', color: 'text-primary' },
              ]?.map((item) => (
                <div key={item?.label} className="bg-muted/60 rounded-lg p-3 border border-border">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">{item?.icon}</span>
                    <p className="text-xs text-muted-foreground">{item?.label}</p>
                  </div>
                  <p className={`text-sm font-bold ${item?.color}`}>{item?.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground">Overall Profile Fit</span>
                <span className="text-sm font-extrabold text-accent">86 / 100</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all" style={{ width: '86%' }} />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-foreground mb-2">Recommended Lenders (3 matches)</p>
              <div className="space-y-2">
                {[
                  { name: 'HDFC Bank', fit: 'Best Fit', color: 'text-emerald-600 bg-emerald-50' },
                  { name: 'Axis Bank', fit: 'Good Fit', color: 'text-blue-600 bg-blue-50' },
                  { name: 'ICICI Bank', fit: 'Good Fit', color: 'text-blue-600 bg-blue-50' },
                ]?.map((l) => (
                  <div key={l?.name} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <span className="text-xs font-semibold text-foreground">{l?.name}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${l?.color}`}>{l?.fit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Credits used: 1</span>
              <span className="text-xs font-bold text-accent">Balance: 141 credits</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}