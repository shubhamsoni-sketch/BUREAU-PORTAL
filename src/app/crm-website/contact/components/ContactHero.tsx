import React from 'react';

export default function ContactHero() {
  return (
    <section className="pt-24 pb-10 md:pt-32 md:pb-12 gradient-hero-bg border-b border-border">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-accent mb-4 px-3 py-1 bg-accent/10 rounded-full">
          Book a Demo
        </span>
        <h1 className="text-hero-lg font-extrabold text-primary mb-4">
          See CreditTrust in action.
        </h1>
        <p className="text-base text-muted-foreground max-w-xl mx-auto">
          Fill in your details and our team will reach out within 24 hours to schedule a personalized demo for your loan workflow.
        </p>
      </div>
    </section>
  );
}