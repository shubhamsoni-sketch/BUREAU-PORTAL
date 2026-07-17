import React from 'react';

export default function AboutHero() {
  return (
    <section className="pt-24 pb-12 md:pt-32 md:pb-16 gradient-hero-bg border-b border-border">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-accent mb-4 px-3 py-1 bg-accent/10 rounded-full">
          About CreditTrust
        </span>
        <h1 className="text-hero-lg font-extrabold text-primary mb-5">
          Built for Indian loan distribution workflows.
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          CreditTrust CRM is designed for loan teams, agents, and channel partners who need a simple but powerful way to manage leads, files, customer eligibility, lenders, teams, and reports — all in one place.
        </p>
      </div>
    </section>
  );
}