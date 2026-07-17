import React from 'react';
import Header from '@/components/crm-website/Header';
import Footer from '@/components/crm-website/Footer';

export const metadata = {
  title: 'Terms of Use | CreditTrust CRM',
  description: 'Terms of Use for CreditTrust CRM demo enquiries and platform usage.',
};

export default function TermsAndConditionsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="pt-28 pb-14 gradient-hero-bg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-accent mb-4 px-3 py-1 bg-accent/10 rounded-full">
            Legal
          </span>
          <h1 className="text-hero-lg font-extrabold text-primary mb-4">Terms of Use</h1>
          <p className="text-base text-muted-foreground">
            These terms govern access to the CreditTrust CRM website, demo enquiries, and related platform services.
          </p>
        </div>
      </section>
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8 text-sm leading-7 text-muted-foreground">
          <div>
            <h2 className="text-xl font-extrabold text-primary mb-3">Use of Services</h2>
            <p>
              CreditTrust CRM is intended for legitimate business use by loan teams, fintech partners, sourcing businesses, and authorized users. You agree to provide accurate information and use the platform lawfully.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-primary mb-3">Consent-Based Workflows</h2>
            <p>
              Any credit report, eligibility, or financial utility workflow must be initiated only after obtaining valid customer consent and following applicable laws and partner requirements.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-primary mb-3">Accounts and Access</h2>
            <p>
              Users are responsible for keeping login credentials secure. CreditTrust may suspend access if misuse, unauthorized activity, or policy violation is detected.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-primary mb-3">Service Changes</h2>
            <p>
              Features, pricing, integrations, credits, and workflows may change as the platform evolves. We will make reasonable efforts to communicate important operational changes.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-primary mb-3">Contact</h2>
            <p>
              For questions about these terms, contact <a className="font-semibold text-accent" href="mailto:support@credittrust.in">support@credittrust.in</a>.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
