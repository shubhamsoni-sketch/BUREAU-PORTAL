import React from 'react';
import Header from '@/components/crm-website/Header';
import Footer from '@/components/crm-website/Footer';

export const metadata = {
  title: 'Privacy Policy | CreditTrust CRM',
  description: 'Privacy Policy for CreditTrust CRM demo enquiries and platform usage.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="pt-28 pb-14 gradient-hero-bg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-accent mb-4 px-3 py-1 bg-accent/10 rounded-full">
            Legal
          </span>
          <h1 className="text-hero-lg font-extrabold text-primary mb-4">Privacy Policy</h1>
          <p className="text-base text-muted-foreground">
            CreditTrust respects your privacy and collects only the information required to respond to enquiries, provide CRM and financial utility services, support customers, and keep the platform secure.
          </p>
        </div>
      </section>
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8 text-sm leading-7 text-muted-foreground">
          <div>
            <h2 className="text-xl font-extrabold text-primary mb-3">Information We Collect</h2>
            <p>
              We may collect your name, email, mobile number, city, business name, team size, lead volume, selected loan products, demo enquiry details, account information, usage logs, and support messages.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-primary mb-3">How We Use Information</h2>
            <p>
              We use this information to contact you about demo requests, onboard your team, provide CRM access, process eligibility credit workflows, improve platform reliability, and send important service updates.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-primary mb-3">Data Sharing</h2>
            <p>
              We do not sell your personal data. Information may be shared only with trusted service providers, legal authorities where required, or platform partners strictly for delivering requested services.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-primary mb-3">Security</h2>
            <p>
              We use reasonable technical and operational safeguards to protect data. Access is limited to authorized personnel and systems required to operate CreditTrust services.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-primary mb-3">Contact</h2>
            <p>
              For privacy questions, contact us at <a className="font-semibold text-accent" href="mailto:support@credittrust.in">support@credittrust.in</a>.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
