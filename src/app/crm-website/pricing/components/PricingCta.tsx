import React from 'react';
import Link from 'next/link';

export default function PricingCta() {
  return (
    <section className="py-16 bg-white border-t border-border">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-section-title font-extrabold text-primary mb-4">
          Not sure which plan is right for you?
        </h2>
        <p className="text-base text-muted-foreground mb-8">
          Book a 20-minute demo and our team will recommend the right setup for your DSA office, team size, and loan product mix.
        </p>
        <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold text-base px-8 py-3.5 rounded-lg hover:bg-accent transition-colors shadow-card">
          Book a Free Demo
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </Link>
      </div>
    </section>
  );
}