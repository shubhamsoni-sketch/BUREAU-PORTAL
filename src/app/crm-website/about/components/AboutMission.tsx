'use client';
import React, { useEffect, useRef } from 'react';

export default function AboutMission() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    if (ref?.current) observer?.observe(ref?.current);
    return () => observer?.disconnect();
  }, []);

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center section-reveal">
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-accent mb-3 px-3 py-1 bg-accent/10 rounded-full">
              Our Mission
            </span>
            <h2 className="text-section-title font-extrabold text-primary mb-5">
              Giving Indian DSAs the tools to run a professional loan business.
            </h2>
            <p className="text-base text-muted-foreground mb-5 leading-relaxed">
              Most DSA offices in India still rely on WhatsApp groups, Excel sheets, and memory to manage their loan pipeline. CreditTrust was built to change that — not with a complicated enterprise tool, but with a clean, practical CRM that fits how DSA teams actually work.
            </p>
            <p className="text-base text-muted-foreground mb-5 leading-relaxed">
              We focus on the complete workflow: from the first lead call to the final disbursal confirmation. Eligibility intelligence, lender routing, team management, and business reporting — all built around the real operational needs of Indian loan distribution.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              CreditTrust is not a bureau portal or a CIBIL resale platform. It is a DSA CRM that uses consent-based customer assessment to help loan agents make smarter decisions — faster.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                icon: '🎯',
                title: 'Purpose-built for DSA operations',
                desc: 'Every feature in CreditTrust was designed around how Indian DSA offices actually work — not adapted from a generic CRM template.',
              },
              {
                icon: '🔒',
                title: 'Consent-first approach',
                desc: 'Customer eligibility checks are always consent-based. We believe in responsible, transparent workflows that protect both agents and customers.',
              },
              {
                icon: '📊',
                title: 'Visibility for owners, clarity for agents',
                desc: 'Owners get full business visibility. Agents get clear task lists. Everyone knows what to do next.',
              },
              {
                icon: '🇮🇳',
                title: 'Built for Indian loan products',
                desc: 'Personal Loan, Business Loan, Home Loan, LAP, Used Car Loan — CreditTrust is configured for the Indian lending landscape.',
              },
            ]?.map((item) => (
              <div key={item?.title} className="bg-white border border-border rounded-xl p-4 flex items-start gap-4 feature-card-hover">
                <span className="text-2xl flex-shrink-0">{item?.icon}</span>
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-1">{item?.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item?.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}