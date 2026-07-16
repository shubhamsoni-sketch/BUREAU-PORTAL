import React from 'react';
import Link from 'next/link';

export default function FeaturesHero() {
  return (
    <section className="pt-24 pb-12 md:pt-32 md:pb-16 gradient-hero-bg border-b border-border">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-accent mb-4 px-3 py-1 bg-accent/10 rounded-full">
          Platform Features
        </span>
        <h1 className="text-hero-lg font-extrabold text-primary mb-5">
          Every feature your DSA team needs to close more loans.
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          CreditTrust DSA CRM covers the complete loan distribution workflow — from lead capture to disbursal tracking, eligibility intelligence to lender routing, team management to business reporting.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold text-base px-7 py-3.5 rounded-lg hover:bg-accent transition-colors">
            Book Demo
          </Link>
          <Link href="/pricing" className="inline-flex items-center justify-center gap-2 bg-white border border-border text-primary font-semibold text-base px-7 py-3.5 rounded-lg hover:border-accent hover:text-accent transition-colors">
            View Pricing
          </Link>
        </div>
      </div>
    </section>
  );
}