'use client';

import Link from 'next/link';
import React, { useEffect, useRef } from 'react';
import Icon from '@/components/ui/AppIcon';

const audiences = [
  {
    title: 'DSA Agents',
    desc: 'Close more loan conversations with clear, data-backed client insights.',
    icon: 'ClipboardDocumentCheckIcon',
  },
  {
    title: 'Chartered Accountants',
    desc: 'Give clients a complete financial health view beyond tax and documents.',
    icon: 'ChartPieIcon',
  },
  {
    title: 'Financial Advisors',
    desc: 'Build trust with professional-grade analysis your clients can act on.',
    icon: 'PresentationChartLineIcon',
  },
];

const products = [
  {
    title: 'Consumer Data',
    tag: 'Individuals',
    desc: 'Credit health intelligence for individual borrowers, including score, accounts, repayment behavior, utilization, enquiries, and risk signals.',
    points: ['Credit score and trend view', 'Account-level breakdown', 'Payment behavior patterns', 'Enquiry and utilization signals'],
    icon: 'UserCircleIcon',
    tone: 'primary',
  },
  {
    title: 'Commercial Data',
    tag: 'Businesses',
    desc: 'Business credit intelligence for SMEs, proprietorships, and companies before lending, advisory, or investment decisions.',
    points: ['Business profile summary', 'Lender exposure mapping', 'Commercial repayment behavior', 'Entity-level risk indicators'],
    icon: 'BuildingOffice2Icon',
    tone: 'accent',
  },
  {
    title: 'Bulk Analysis',
    tag: 'Scale',
    desc: 'Process client portfolios in batches with queued analysis, transparent deductions, and structured outputs for every profile.',
    points: ['Batch profile processing', 'Portfolio-level risk summary', 'Per-analysis wallet transparency', 'Export-ready workflow'],
    icon: 'DocumentDuplicateIcon',
    tone: 'primary',
  },
];

const steps = [
  { step: '01', title: 'Apply', desc: 'Submit partner details and business use case.' },
  { step: '02', title: 'Get Approved', desc: 'Team reviews access and activates the partner workspace.' },
  { step: '03', title: 'Recharge Wallet', desc: 'Add credits and keep usage transparent.' },
  { step: '04', title: 'Start Analysis', desc: 'Add customers and run financial analysis from the dashboard.' },
];

const differentiators = [
  {
    title: 'More than a number',
    desc: 'Each analysis surfaces account behavior, risk signals, and clear context instead of only showing a score.',
  },
  {
    title: 'Pay as you go',
    desc: 'Wallet-based billing keeps every report transparent, with no hidden monthly commitment.',
  },
  {
    title: 'Built for volume',
    desc: 'The same system supports a single customer check or a high-volume partner workflow.',
  },
];

function ToneIcon({ name, tone }: { name: string; tone: 'primary' | 'accent' }) {
  const isAccent = tone === 'accent';
  return (
    <div
      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
      style={{
        background: isAccent ? 'rgba(245,166,35,0.12)' : 'rgba(0,212,170,0.12)',
        border: isAccent ? '1px solid rgba(245,166,35,0.22)' : '1px solid rgba(0,212,170,0.22)',
      }}
    >
      <Icon name={name} size={23} className={isAccent ? 'text-accent' : 'text-primary'} />
    </div>
  );
}

export default function PartnerProgramSection() {
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
    <section id="partner-program" ref={sectionRef} className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
        <div
          className="absolute inset-0 opacity-10"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 20% 45%, rgba(0,212,170,0.12), transparent)' }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-end mb-14">
          <div className="scroll-reveal">
            <span className="tag tag-primary mb-5 inline-flex">Partner Program</span>
            <h2 className="section-headline text-fg">
              Built for professionals who need{' '}
              <span className="font-serif italic gradient-text-primary">financial intelligence at scale.</span>
            </h2>
          </div>
          <div className="scroll-reveal scroll-reveal-delay-1">
            <p className="text-fg-muted text-lg leading-relaxed">
              Give DSAs, CAs, and financial advisors a secure way to run consumer, commercial, and bulk analysis from one partner workspace.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link href="/become-a-partner" className="btn-primary px-6 py-3 text-sm">
                Become a Partner
              </Link>
              <a href="mailto:contact@credittrust.in" className="btn-ghost px-6 py-3 text-sm">
                Talk to Team
              </a>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-10">
          {audiences.map((item, index) => (
            <div key={item.title} className={`scroll-reveal scroll-reveal-delay-${index + 1} glass-card glass-card-hover rounded-3xl p-6`}>
              <ToneIcon name={item.icon} tone={index === 1 ? 'accent' : 'primary'} />
              <h3 className="text-lg font-bold text-fg mt-5">{item.title}</h3>
              <p className="text-sm text-fg-muted leading-relaxed mt-2">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-12">
          {products.map((product, index) => (
            <div key={product.title} className={`scroll-reveal scroll-reveal-delay-${index + 1} glass-card rounded-4xl p-7 relative overflow-hidden`}>
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{
                  background:
                    product.tone === 'accent'
                      ? 'linear-gradient(90deg, rgba(245,166,35,0.9), rgba(255,209,102,0.7))'
                      : 'linear-gradient(90deg, rgba(0,212,170,0.9), rgba(127,255,223,0.7))',
                }}
              />
              <div className="flex items-start justify-between gap-4">
                <ToneIcon name={product.icon} tone={product.tone as 'primary' | 'accent'} />
                <span className={product.tone === 'accent' ? 'tag tag-accent' : 'tag tag-primary'}>{product.tag}</span>
              </div>
              <h3 className="text-xl font-bold text-fg mt-6">{product.title}</h3>
              <p className="text-sm text-fg-muted leading-relaxed mt-3">{product.desc}</p>
              <div className="space-y-3 mt-6">
                {product.points.map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <Icon name="CheckCircleIcon" size={17} className={product.tone === 'accent' ? 'text-accent shrink-0 mt-0.5' : 'text-primary shrink-0 mt-0.5'} />
                    <span className="text-sm text-fg-muted">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="glass-card rounded-4xl p-7 sm:p-8 mb-10 scroll-reveal">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div>
              <span className="tag tag-accent mb-4 inline-flex">How It Works</span>
              <h3 className="text-2xl sm:text-3xl font-bold text-fg">Four steps to start serving clients.</h3>
            </div>
            <p className="text-sm text-fg-muted max-w-lg leading-relaxed">
              From application to first analysis, the partner journey stays simple, controlled, and wallet-backed.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {steps.map((item, index) => (
              <div key={item.step} className={`scroll-reveal scroll-reveal-delay-${index + 1} rounded-3xl p-5`} style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="w-10 h-10 rounded-2xl bg-primary text-bg flex items-center justify-center font-bold text-sm mb-5">
                  {item.step}
                </div>
                <h4 className="text-fg font-bold">{item.title}</h4>
                <p className="text-sm text-fg-muted mt-2 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5 scroll-reveal">
          {differentiators.map((item, index) => (
            <div key={item.title} className="glass-card rounded-3xl p-6">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-bg bg-primary font-bold text-sm mb-5">
                {index + 1}
              </div>
              <h4 className="text-lg font-bold text-fg">{item.title}</h4>
              <p className="text-sm text-fg-muted leading-relaxed mt-2">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
