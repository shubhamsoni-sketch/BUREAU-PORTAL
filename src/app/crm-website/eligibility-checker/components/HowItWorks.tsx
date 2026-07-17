'use client';
import React, { useEffect, useRef } from 'react';

const steps = [
  {
    number: '01',
    title: 'Agent adds a new lead',
    desc: 'The loan agent captures the customer\'s name, mobile, loan type, and requested amount in CreditTrust.',
    detail: 'Lead is instantly added to the pipeline and assigned to the agent.',
    color: 'bg-primary text-white',
    border: 'border-primary/20',
  },
  {
    number: '02',
    title: 'Customer consent is obtained',
    desc: 'Before any check is run, the agent confirms that the customer has given consent for a profile assessment.',
    detail: 'Consent is logged with timestamp in the system.',
    color: 'bg-accent text-white',
    border: 'border-accent/20',
  },
  {
    number: '03',
    title: 'Eligibility check is run',
    desc: 'CreditTrust runs a consent-based profile assessment. 1 eligibility credit is deducted from the agent\'s balance.',
    detail: 'The check takes seconds and returns a profile fit score.',
    color: 'bg-blue-500 text-white',
    border: 'border-blue-200',
  },
  {
    number: '04',
    title: 'Profile strength is displayed',
    desc: 'The agent sees a clear profile fit score, income indicators, repayment capacity, and a list of suitable lenders.',
    detail: 'No raw bureau data is shown — only actionable insights.',
    color: 'bg-amber-500 text-white',
    border: 'border-amber-200',
  },
  {
    number: '05',
    title: 'Lender is selected and file is sent',
    desc: 'Based on the eligibility result, the agent selects the best-fit lender and moves the file to the lender workflow stage.',
    detail: 'File status updates automatically in the pipeline.',
    color: 'bg-emerald-500 text-white',
    border: 'border-emerald-200',
  },
];

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    stepRefs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div ref={ref} className="text-center mb-12 section-reveal">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-accent mb-3 px-3 py-1 bg-accent/10 rounded-full">
            How It Works
          </span>
          <h2 className="text-section-title font-extrabold text-primary mb-4">
            From lead to lender match in 5 steps.
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            The eligibility intelligence workflow is designed to be fast, consent-first, and directly integrated into your CRM lead pipeline.
          </p>
        </div>

        <div className="space-y-4">
          {steps.map((step, i) => (
            <div
              key={step.number}
              ref={(el) => { stepRefs.current[i] = el; }}
              className={`stagger-child bg-white border ${step.border} rounded-xl p-5 flex items-start gap-4 feature-card-hover`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className={`w-10 h-10 rounded-lg ${step.color} flex items-center justify-center text-sm font-extrabold flex-shrink-0`}>
                {step.number}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-foreground mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-1">{step.desc}</p>
                <p className="text-xs text-accent font-medium">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}