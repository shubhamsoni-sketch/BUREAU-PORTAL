'use client';
import React, { useEffect, useRef } from 'react';

const benefits = [
  {
    title: 'Faster customer qualification',
    desc: 'Know if a customer is a strong candidate before spending time preparing a full file. Save hours per week.',
    stat: '3x faster',
    statLabel: 'qualification speed',
    color: 'bg-primary/10 text-primary',
  },
  {
    title: 'Better lender fit',
    desc: 'Match customers to lenders based on actual profile data, not guesswork. Fewer wrong submissions.',
    stat: '40% fewer',
    statLabel: 'wrong lender submissions',
    color: 'bg-accent/10 text-accent',
  },
  {
    title: 'Reduced rejection chances',
    desc: 'Files sent to well-matched lenders have a significantly higher approval rate. Less time chasing rejections.',
    stat: '28% better',
    statLabel: 'approval rate',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    title: 'Controlled credit usage',
    desc: 'Admin controls how many credits each agent has. No wasteful over-checking. Every credit is accounted for.',
    stat: 'Zero',
    statLabel: 'unauthorized checks',
    color: 'bg-emerald-100 text-emerald-600',
  },
];

export default function EligibilityBenefits() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    cardRefs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div ref={sectionRef} className="text-center mb-12 section-reveal">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-accent mb-3 px-3 py-1 bg-accent/10 rounded-full">
            Why It Matters
          </span>
          <h2 className="text-section-title font-extrabold text-primary mb-4">
            What eligibility intelligence does for your DSA business.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {benefits.map((b, i) => (
            <div
              key={b.title}
              ref={(el) => { cardRefs.current[i] = el; }}
              className="stagger-child bg-white border border-border rounded-xl p-5 feature-card-hover"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className={`inline-block text-2xl font-extrabold mb-1 ${b.color.split(' ')[1]}`}>
                {b.stat}
              </div>
              <p className="text-xs text-muted-foreground mb-3">{b.statLabel}</p>
              <h3 className="text-sm font-bold text-foreground mb-2">{b.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 bg-primary/5 border border-primary/10 rounded-xl p-6 text-center">
          <p className="text-sm font-semibold text-primary mb-2">
            Important: CreditTrust is not a bureau or CIBIL resale portal.
          </p>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Our eligibility intelligence is a consent-based customer profile assessment tool built for DSA operational workflows. It is designed to help loan agents make informed decisions — not to resell credit reports.
          </p>
        </div>
      </div>
    </section>
  );
}