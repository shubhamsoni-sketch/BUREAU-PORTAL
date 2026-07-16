'use client';
import React, { useEffect, useRef } from 'react';

const problems = [
  {
    icon: '📱',
    title: 'Leads stuck in WhatsApp',
    desc: 'New leads are scattered across chats and spreadsheets. Nothing is tracked, nothing is followed up.',
  },
  {
    icon: '⏰',
    title: 'Follow-ups get missed',
    desc: 'Agents forget callbacks. Promising leads go cold because there is no structured reminder system.',
  },
  {
    icon: '🏦',
    title: 'Wrong lender selection',
    desc: 'Files are sent to lenders without checking customer fit first. Rejections waste time and damage credibility.',
  },
  {
    icon: '👁️',
    title: 'Agents work without visibility',
    desc: 'Owners have no clear view of what each agent is doing, which files are moving, or where things are stuck.',
  },
  {
    icon: '📊',
    title: 'Credit usage is hard to track',
    desc: 'Eligibility credit consumption, invoice status, and billing are managed manually with no clear audit trail.',
  },
  {
    icon: '📉',
    title: 'No clean performance reports',
    desc: 'Business owners cannot see monthly disbursal numbers, agent productivity, or lender-wise conversion data.',
  },
];

export default function ProblemSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    cardRefs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-16 md:py-24 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div ref={sectionRef} className="text-center mb-12 section-reveal">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-accent mb-3 px-3 py-1 bg-accent/10 rounded-full">
            The Problem
          </span>
          <h2 className="text-section-title font-extrabold text-primary mb-4">
            Loan teams lose time when leads, eligibility, lenders, and files are scattered.
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Most DSA offices run on WhatsApp, Excel, and memory. The result is missed follow-ups, wrong lender choices, and no visibility into team performance.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {problems.map((problem, i) => (
            <div
              key={problem.title}
              ref={(el) => { cardRefs.current[i] = el; }}
              className="stagger-child bg-white border border-border rounded-xl p-5 feature-card-hover"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="text-2xl mb-3">{problem.icon}</div>
              <h3 className="text-sm font-bold text-foreground mb-1.5">{problem.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{problem.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}