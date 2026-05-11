'use client';

import Link from 'next/link';
import React, { useEffect, useRef } from 'react';
import Icon from '@/components/ui/AppIcon';

interface GetReportSectionProps {
  formRef: React.RefObject<HTMLDivElement | null>;
}

const partnerBenefits = [
  {
    title: 'Partner-ready workflow',
    desc: 'Login, wallet, customer intake, and financial analysis flows stay connected to the existing portal.',
    icon: 'BuildingOffice2Icon',
  },
  {
    title: 'Secure credit health checks',
    desc: 'Analysis happens inside the partner portal with consent, audit history, and controlled access.',
    icon: 'ShieldCheckIcon',
  },
  {
    title: 'Built for scale',
    desc: 'Demo users can experience the complete journey while live integrations remain gated until approved.',
    icon: 'ChartBarSquareIcon',
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
          <span className="tag tag-primary mb-5 inline-flex">Start Financial Analysis</span>
          <h2 className="section-headline text-fg">
            Give partners a polished way to{' '}
            <span className="font-serif italic gradient-text-primary">analyze credit health.</span>
          </h2>
          <p className="text-fg-muted mt-4 max-w-xl mx-auto">
            The public page now guides users into the existing portal instead of collecting data on a separate landing form.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-10 items-stretch">
          <div className="lg:col-span-3 scroll-reveal">
            <div className="glass-card rounded-4xl p-7 sm:p-9 h-full flex flex-col justify-between">
              <div>
                <span className="tag tag-accent mb-5 inline-flex">Portal Access</span>
                <h3 className="text-3xl sm:text-4xl font-bold text-fg leading-tight">
                  Continue with the secure partner workspace.
                </h3>
                <p className="text-fg-muted mt-4 max-w-xl leading-relaxed">
                  Partners can log in, add customer details, run demo financial analysis, and review history from the same controlled dashboard.
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 mt-8">
                <Link href="/partner-login" className="btn-primary justify-center px-5 py-4 text-sm">
                  Partner Login
                </Link>
                <Link href="/become-a-partner" className="btn-ghost justify-center px-5 py-4 text-sm">
                  Become Partner
                </Link>
                <Link href="/contact" className="btn-ghost justify-center px-5 py-4 text-sm">
                  Contact Team
                </Link>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-5">
            {partnerBenefits.map((benefit, index) => (
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
                <p className="text-fg font-bold">Demo safe by default</p>
                <p className="text-fg-muted text-xs mt-0.5">Live bureau calls stay disabled until the real API contract is approved.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
