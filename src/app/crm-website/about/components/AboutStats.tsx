'use client';
import React, { useEffect, useRef } from 'react';

const stats = [
  { value: '2,400+', label: 'Loan agents using CreditTrust', color: 'text-primary' },
  { value: '1.8L+', label: 'Leads tracked on the platform', color: 'text-accent' },
  { value: '₹420Cr+', label: 'Loan files processed via CRM', color: 'text-blue-600' },
  { value: '94%', label: 'Teams report better follow-up rates', color: 'text-emerald-600' },
];

export default function AboutStats() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.15 }
    );
    if (ref?.current) observer?.observe(ref?.current);
    return () => observer?.disconnect();
  }, []);

  return (
    <section className="py-12 md:py-16 bg-white border-b border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div ref={ref} className="grid grid-cols-2 md:grid-cols-4 gap-6 section-reveal">
          {stats?.map((stat) => (
            <div key={stat?.label} className="text-center">
              <p className={`text-3xl md:text-4xl font-extrabold mb-1 ${stat?.color}`}>{stat?.value}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{stat?.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}