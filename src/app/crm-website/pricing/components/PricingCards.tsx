import React from 'react';
import Link from 'next/link';

const plans = [
  {
    name: 'Starter',
    tagline: 'For individual DSAs and small teams',
    description: 'Everything you need to start managing leads and tracking files professionally.',
    features: [
      'Lead management & pipeline',
      'Basic CRM dashboard',
      'Eligibility checks (credit-based)',
      'File tracking & status updates',
      'Follow-up reminders',
      'Document checklist',
      'Up to 3 users',
    ],
    cta: 'Request Pricing',
    href: '/contact',
    highlight: false,
    badge: '',
  },
  {
    name: 'Growth',
    tagline: 'For growing DSA offices with multiple agents',
    description: 'Full workflow coverage for teams that need lender routing, team controls, and detailed reporting.',
    features: [
      'Everything in Starter',
      'Team management (roles & access)',
      'Lender workflow & file routing',
      'Eligibility credits & invoicing',
      'Agent performance reports',
      'Lender-wise conversion tracking',
      'Up to 15 users',
    ],
    cta: 'Book Demo',
    href: '/contact',
    highlight: true,
    badge: 'Most Popular',
  },
  {
    name: 'Business',
    tagline: 'For channel partners and larger finance distributors',
    description: 'Custom configuration, multi-user access, and dedicated onboarding for large operations.',
    features: [
      'Everything in Growth',
      'Custom workflow configuration',
      'Multi-branch / multi-user access',
      'Advanced reporting & exports',
      'Dedicated setup support',
      'Priority support',
      'Unlimited users',
    ],
    cta: 'Talk to Sales',
    href: '/contact',
    highlight: false,
    badge: '',
  },
];

export default function PricingCards() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {plans?.map((plan) => (
            <div
              key={plan?.name}
              className={`relative rounded-xl border p-6 flex flex-col feature-card-hover ${
                plan?.highlight
                  ? 'border-accent bg-primary text-white shadow-card-lg'
                  : 'border-border bg-white'
              }`}
            >
              {plan?.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
                    {plan?.badge}
                  </span>
                </div>
              )}
              <div className="mb-5">
                <h3 className={`text-xl font-extrabold mb-1 ${plan?.highlight ? 'text-white' : 'text-primary'}`}>
                  {plan?.name}
                </h3>
                <p className={`text-xs font-semibold mb-3 ${plan?.highlight ? 'text-accent' : 'text-accent'}`}>
                  {plan?.tagline}
                </p>
                <p className={`text-sm leading-relaxed ${plan?.highlight ? 'text-white/70' : 'text-muted-foreground'}`}>
                  {plan?.description}
                </p>
              </div>
              <div className="mb-5">
                <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${plan?.highlight ? 'text-white/60' : 'text-muted-foreground'}`}>
                  Includes
                </p>
                <ul className="space-y-2">
                  {plan?.features?.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={plan?.highlight ? '#0EA5A0' : '#0EA5A0'} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      <span className={plan?.highlight ? 'text-white/80' : 'text-muted-foreground'}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-auto">
                <p className={`text-xs mb-3 ${plan?.highlight ? 'text-white/50' : 'text-muted-foreground'}`}>
                  Pricing based on team size & usage. Contact us for a custom quote.
                </p>
                <Link
                  href={plan?.href}
                  className={`w-full inline-flex items-center justify-center gap-2 font-bold text-sm px-5 py-3 rounded-lg transition-colors ${
                    plan?.highlight
                      ? 'bg-accent text-white hover:bg-white hover:text-primary' :'bg-primary text-white hover:bg-accent'
                  }`}
                >
                  {plan?.cta}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-muted/50 border border-border rounded-xl p-5 text-center">
          <p className="text-sm font-semibold text-foreground mb-1">All plans include: Secure data handling · Role-based access · Mobile responsive CRM · Onboarding support</p>
          <p className="text-xs text-muted-foreground">Eligibility credits are purchased separately based on usage volume. No hidden charges.</p>
        </div>
      </div>
    </section>
  );
}