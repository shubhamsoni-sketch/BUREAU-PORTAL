import React from 'react';
import Link from 'next/link';

export default function CtaBand() {
  return (
    <section className="py-16 md:py-20 bg-white border-t border-border">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-accent mb-4 px-3 py-1 bg-accent/10 rounded-full">
          Get Started Today
        </span>
        <h2 className="text-section-title font-extrabold text-primary mb-4">
          Ready to run your loan workflow from one CRM?
        </h2>
        <p className="text-base text-muted-foreground mb-8 max-w-xl mx-auto">
          Book a free demo and see how CreditTrust can help your team manage more leads, qualify customers faster, and track every file to disbursal.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold text-base px-8 py-3.5 rounded-lg hover:bg-accent transition-colors duration-200 shadow-card"
          >
            Book a Free Demo
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 bg-white border border-border text-primary font-semibold text-base px-8 py-3.5 rounded-lg hover:border-accent hover:text-accent transition-colors duration-200"
          >
            View Pricing Plans
          </Link>
        </div>
      </div>
    </section>
  );
}