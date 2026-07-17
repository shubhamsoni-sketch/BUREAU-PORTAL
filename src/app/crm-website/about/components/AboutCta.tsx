import React from 'react';
import Link from 'next/link';

export default function AboutCta() {
  return (
    <section className="py-16 md:py-20 bg-muted/30 border-t border-border">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-section-title font-extrabold text-primary mb-4">
          Join 2,400+ loan teams already using CreditTrust.
        </h2>
        <p className="text-base text-muted-foreground mb-8 max-w-xl mx-auto">
          Whether you are a solo loan consultant, fintech partner, or running a team of 20 users, CreditTrust gives you the tools to manage your loan business professionally.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold text-base px-8 py-3.5 rounded-lg hover:bg-accent transition-colors shadow-card">
            Book a Free Demo
          </Link>
          <Link href="/features" className="inline-flex items-center justify-center gap-2 bg-white border border-border text-primary font-semibold text-base px-8 py-3.5 rounded-lg hover:border-accent hover:text-accent transition-colors">
            Explore Features
          </Link>
        </div>
      </div>
    </section>
  );
}