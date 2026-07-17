'use client';
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';

const solutions = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/><line x1="20" y1="8" x2="20" y2="14"/>
      </svg>
    ),
    title: 'Capture every lead',
    desc: 'Add leads from any source — WhatsApp, walk-in, referral. Every lead is logged, assigned, and tracked.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    title: 'Check customer eligibility faster',
    desc: 'Run consent-based profile checks. Understand customer fit before choosing a lender.',
    color: 'bg-accent/10 text-accent',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
    title: 'Assign work to agents',
    desc: 'Distribute leads and files across your team. Track who is working on what in real time.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: 'Track lender-wise file movement',
    desc: 'Know exactly where each file is — sent, login pending, approved, disbursed, or rejected.',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    title: 'Manage eligibility credits',
    desc: 'Request credits, track usage, approve invoices, and manage billing from the admin panel.',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    title: 'View reports & team performance',
    desc: 'Get clean monthly reports on disbursal, agent productivity, and lender-wise conversion.',
    color: 'bg-purple-100 text-purple-600',
  },
];

export default function SolutionSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.12 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    cardRefs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div ref={sectionRef} className="text-center mb-12 section-reveal">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-accent mb-3 px-3 py-1 bg-accent/10 rounded-full">
            The Solution
          </span>
          <h2 className="text-section-title font-extrabold text-primary mb-4">
            One CRM to manage your complete loan workflow.
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            CreditTrust brings your leads, eligibility checks, lender routing, team management, and business reporting into a single clean platform.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {solutions.map((sol, i) => (
            <div
              key={sol.title}
              ref={(el) => { cardRefs.current[i] = el; }}
              className="stagger-child border border-border rounded-xl p-5 feature-card-hover bg-white"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className={`w-10 h-10 rounded-lg ${sol.color} flex items-center justify-center mb-4`}>
                {sol.icon}
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">{sol.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{sol.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/features"
            className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-primary transition-colors"
          >
            See all features in detail
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </div>
    </section>
  );
}