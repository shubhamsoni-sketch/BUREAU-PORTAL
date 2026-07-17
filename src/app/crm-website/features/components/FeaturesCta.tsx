import React from 'react';
import Link from 'next/link';

export default function FeaturesCta() {
  return (
    <section className="py-16 md:py-20 bg-primary">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-section-title font-extrabold text-white mb-4">
          See CreditTrust in action for your loan team.
        </h2>
        <p className="text-base text-white/70 mb-8 max-w-xl mx-auto">
          Book a free demo and we will walk you through the complete platform — from lead capture to lender routing to team performance reports.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-accent text-white font-bold text-base px-8 py-3.5 rounded-lg hover:bg-white hover:text-primary transition-colors">
            Book My Demo
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
          <Link href="/pricing" className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-semibold text-base px-8 py-3.5 rounded-lg hover:bg-white/20 transition-colors">
            View Pricing
          </Link>
        </div>
      </div>
    </section>
  );
}