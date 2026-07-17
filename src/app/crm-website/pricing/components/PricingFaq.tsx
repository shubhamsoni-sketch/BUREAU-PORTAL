'use client';
import React, { useState } from 'react';

const faqs = [
  {
    q: 'What are eligibility credits?',
    a: 'Eligibility credits are used when you run a consent-based customer profile check through CreditTrust. Each check uses 1 credit. Credits are purchased in packs and managed by the admin. Usage is tracked per agent with a full audit trail.',
  },
  {
    q: 'Can I add more agents to my plan?',
    a: 'Yes. Each plan has a default user limit, but you can request additional agent seats. Talk to our team to get a custom quote based on your team size.',
  },
  {
    q: 'Is there a free trial available?',
    a: 'We offer a guided demo session rather than a self-serve trial. This ensures your team gets properly onboarded and you see the features most relevant to your loan workflow. Book a demo to get started.',
  },
  {
    q: 'What loan products does CreditTrust support?',
    a: 'CreditTrust supports all major loan products — Personal Loan, Business Loan, Home Loan, Loan Against Property, Used Car Loan, and more. Product categories can be customized for your loan team.',
  },
  {
    q: 'How is billing handled?',
    a: 'Platform subscription is billed monthly or annually (with a discount). Eligibility credits are billed separately per purchase. Invoices are generated automatically in the platform.',
  },
  {
    q: 'Is my customer data secure?',
    a: 'Yes. CreditTrust uses role-based access controls, consent-first workflows, and secure data handling practices. Agents can only see leads and files assigned to them. Admin has full visibility and control.',
  },
];

export default function PricingFaq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-14 md:py-20 bg-muted/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-section-title font-extrabold text-primary mb-3">Frequently Asked Questions</h2>
          <p className="text-sm text-muted-foreground">Have more questions? Book a demo and we will answer everything.</p>
        </div>
        <div className="space-y-3">
          {faqs?.map((faq, i) => (
            <div key={i} className="bg-white border border-border rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="text-sm font-semibold text-foreground pr-4">{faq?.q}</span>
                <svg
                  className={`flex-shrink-0 transition-transform duration-200 text-muted-foreground ${open === i ? 'rotate-180' : ''}`}
                  width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {open === i && (
                <div className="px-5 pb-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq?.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}