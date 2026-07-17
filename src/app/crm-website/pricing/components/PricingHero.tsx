import React from 'react';

export default function PricingHero() {
  return (
    <section className="pt-24 pb-12 md:pt-32 md:pb-16 gradient-hero-bg border-b border-border">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-accent mb-4 px-3 py-1 bg-accent/10 rounded-full">
          Pricing
        </span>
        <h1 className="text-hero-lg font-extrabold text-primary mb-5">
          Simple plans for every loan team size.
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          Plans are customized based on your team size, modules needed, eligibility credit usage, and workflow requirements. Book a demo to get a quote tailored to your business.
        </p>
      </div>
    </section>
  );
}