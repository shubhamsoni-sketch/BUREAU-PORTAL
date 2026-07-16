'use client';
import React, { useEffect, useRef } from 'react';

const trustPoints = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    title: 'Consent-first customer workflows',
    desc: 'Every eligibility check requires explicit customer consent before proceeding. No unauthorized data access.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: 'Role-based access control',
    desc: 'Agents see only their assigned leads. Managers see their team. Owners see everything. Access is tightly controlled.',
    color: 'bg-accent/10 text-accent',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
      </svg>
    ),
    title: 'Secure data handling',
    desc: 'Customer data is stored securely with access logging. Sensitive information is never exposed unnecessarily.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    title: 'Full usage visibility',
    desc: 'Every eligibility credit used is logged with timestamp, agent name, and customer reference. Complete audit trail.',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    title: 'Admin-controlled credits & billing',
    desc: 'Credit allocation, invoice management, and billing are all controlled by the admin. No agent can self-approve credits.',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: 'Built for practical DSA operations',
    desc: 'No unnecessary complexity. CreditTrust is designed to be adopted quickly by DSA teams without heavy training.',
    color: 'bg-purple-100 text-purple-600',
  },
];

export default function TrustSection() {
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
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div ref={sectionRef} className="text-center mb-12 section-reveal">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-accent mb-3 px-3 py-1 bg-accent/10 rounded-full">
            Trust & Security
          </span>
          <h2 className="text-section-title font-extrabold text-primary mb-4">
            A platform your DSA team can trust.
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            CreditTrust is built with responsible data practices at its core. Here is how we protect your business and your customers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {trustPoints.map((point, i) => (
            <div
              key={point.title}
              ref={(el) => { cardRefs.current[i] = el; }}
              className="stagger-child bg-white border border-border rounded-xl p-5 feature-card-hover"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className={`w-10 h-10 rounded-lg ${point.color} flex items-center justify-center mb-4`}>
                {point.icon}
              </div>
              <h3 className="text-sm font-bold text-foreground mb-2">{point.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{point.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}