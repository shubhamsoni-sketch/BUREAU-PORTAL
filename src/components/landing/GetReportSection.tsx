'use client';

import Link from 'next/link';
import React, { useEffect, useRef } from 'react';
import Icon from '@/components/ui/AppIcon';

interface GetReportSectionProps {
  formRef: React.RefObject<HTMLDivElement | null>;
}

const reportBenefits = [
  {
    title: 'Know before you apply',
    desc: 'Check the signals lenders usually care about before starting a loan or credit card application.',
    icon: 'MagnifyingGlassIcon',
  },
  {
    title: 'Clear financial analysis',
    desc: 'See score, repayment behavior, utilization, account mix, enquiries, and risk markers in simple language.',
    icon: 'ShieldCheckIcon',
  },
  {
    title: 'Actionable next steps',
    desc: 'Get practical improvement points so you can strengthen your profile over time.',
    icon: 'ChartBarIcon',
  },
];

export default function GetReportSection({ formRef }: GetReportSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { rootMargin: '0px 0px -60px 0px', threshold: 0.08 },
    );
    const els = sectionRef.current?.querySelectorAll('.scroll-reveal');
    els?.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="get-report" ref={sectionRef} className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div
          className="absolute inset-0 opacity-10"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 70% 50%, rgba(0,212,170,0.08), transparent)' }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6" ref={formRef}>
        <div className="text-center mb-14 scroll-reveal">
          <span className="tag tag-primary mb-5 inline-flex">Create Your Report</span>
          <h2 className="section-headline text-fg">
            Ready to understand your{' '}
            <span className="font-serif italic gradient-text-primary">financial health?</span>
          </h2>
          <p className="text-fg-muted mt-4 max-w-xl mx-auto">
            Start with a secure request and get a report that explains your credit score, loan readiness, and improvement areas.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-10 items-stretch">
          <div className="lg:col-span-3 scroll-reveal">
            <div className="glass-card rounded-4xl p-7 sm:p-9 h-full flex flex-col justify-between">
              <div>
                <span className="tag tag-accent mb-5 inline-flex">Personal Report</span>
                <h3 className="text-3xl sm:text-4xl font-bold text-fg leading-tight">
                  Your report should be simple enough to act on.
                </h3>
                <p className="text-fg-muted mt-4 max-w-xl leading-relaxed">
                  InsightIQ turns credit and repayment data into a clean financial health view, so you know what looks strong and what needs attention.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mt-8">
                <Link href="/get-my-report" className="btn-primary justify-center px-5 py-4 text-sm">
                  Create My Report
                </Link>
                <Link href="/partner-program" className="btn-ghost justify-center px-5 py-4 text-sm">
                  For Partners
                </Link>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-5">
            {reportBenefits.map((benefit, index) => (
              <div key={benefit.title} className={`scroll-reveal scroll-reveal-delay-${index + 1} glass-card rounded-3xl p-6`}>
                <div className="flex items-start gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(0,212,170,0.12)', border: '1px solid rgba(0,212,170,0.2)' }}
                  >
                    <Icon name={benefit.icon} size={21} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-fg">{benefit.title}</h4>
                    <p className="text-sm text-fg-muted mt-2 leading-relaxed">{benefit.desc}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="scroll-reveal scroll-reveal-delay-3 glass-card rounded-3xl p-5 flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.2)' }}
              >
                <Icon name="SparklesIcon" size={22} className="text-accent" />
              </div>
              <div>
                <p className="text-fg font-bold">B2B is available too</p>
                <p className="text-fg-muted text-xs mt-0.5">Financial professionals can use the dedicated partner program for client workflows.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
