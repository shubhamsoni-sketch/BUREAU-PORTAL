'use client';

import React, { useEffect, useRef } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface HowItWorksSectionProps {
  lang: 'en' | 'hi';
  onGetReport: () => void;
}

const copy = {
  en: {
    tag: 'Customer Journey',
    headline: 'Four simple steps to',
    headlineAccent: 'understand your money profile.',
    steps: [
      {
        num: '01',
        title: 'Enter Basic Details',
        desc: 'Start with your name, mobile number, and identity details needed to prepare your financial health report.',
        icon: 'IdentificationIcon',
        color: '#00D4AA',
      },
      {
        num: '02',
        title: 'Give Secure Consent',
        desc: 'Your report journey stays consent-based, encrypted, and controlled from start to finish.',
        icon: 'ServerStackIcon',
        color: '#F5A623',
      },
      {
        num: '03',
        title: 'View Financial Analysis',
        desc: 'See your credit score, payment history, utilization, loan accounts, and risk markers in one place.',
        icon: 'DocumentChartBarIcon',
        color: '#7FFFDF',
      },
      {
        num: '04',
        title: 'Improve Loan Readiness',
        desc: 'Use clear action points to reduce risk, plan applications, and strengthen your financial profile.',
        icon: 'PresentationChartLineIcon',
        color: '#00D4AA',
      },
    ],
    timeLabel: 'Simple report',
    timeDesc: 'Made for non-technical customers',
    imgAlt: 'Person reviewing financial documents on a laptop in a modern office with warm lighting',
    cta: 'Get My Report',
  },
  hi: {
    tag: 'à¤¯à¤¹ à¤•à¥ˆà¤¸à¥‡ à¤•à¤¾à¤® à¤•à¤°à¤¤à¤¾ à¤¹à¥ˆ',
    headline: 'à¤¤à¥€à¤¨ à¤†à¤¸à¤¾à¤¨ à¤šà¤°à¤£à¥‹à¤‚ à¤®à¥‡à¤‚',
    headlineAccent: 'à¤ªà¥‚à¤°à¥€ à¤•à¥à¤°à¥‡à¤¡à¤¿à¤Ÿ à¤œà¤¾à¤¨à¤•à¤¾à¤°à¥€à¥¤',
    steps: [
      {
        num: '01',
        title: 'à¤…à¤ªà¤¨à¥€ à¤œà¤¾à¤¨à¤•à¤¾à¤°à¥€ à¤¦à¤°à¥à¤œ à¤•à¤°à¥‡à¤‚',
        desc: 'à¤…à¤ªà¤¨à¤¾ PAN à¤¨à¤‚à¤¬à¤°, à¤®à¥‹à¤¬à¤¾à¤‡à¤² à¤”à¤° à¤¬à¥à¤¨à¤¿à¤¯à¤¾à¤¦à¥€ à¤œà¤¾à¤¨à¤•à¤¾à¤°à¥€ à¤¦à¥‡à¤‚à¥¤ à¤¹à¤® 256-à¤¬à¤¿à¤Ÿ à¤à¤¨à¥à¤•à¥à¤°à¤¿à¤ªà¥à¤¶à¤¨ à¤‰à¤ªà¤¯à¥‹à¤— à¤•à¤°à¤¤à¥‡ à¤¹à¥ˆà¤‚à¥¤',
        icon: 'IdentificationIcon',
        color: '#00D4AA',
      },
      {
        num: '02',
        title: 'à¤¹à¤® à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ à¤²à¤¾à¤¤à¥‡ à¤¹à¥ˆà¤‚',
        desc: 'à¤¹à¤®à¤¾à¤°à¤¾ à¤¸à¤¿à¤¸à¥à¤Ÿà¤® à¤†à¤ªà¤•à¤¾ à¤•à¥à¤°à¥‡à¤¡à¤¿à¤Ÿ à¤¡à¥‡à¤Ÿà¤¾ à¤¸à¥à¤°à¤•à¥à¤·à¤¿à¤¤ à¤°à¥‚à¤ª à¤¸à¥‡ à¤²à¤¾à¤•à¤° 40+ à¤¸à¥à¤µà¤¾à¤¸à¥à¤¥à¥à¤¯ à¤®à¤¾à¤ªà¤¦à¤‚à¤¡à¥‹à¤‚ à¤ªà¤° à¤œà¤¾à¤à¤šà¤¤à¤¾ à¤¹à¥ˆà¥¤',
        icon: 'ServerStackIcon',
        color: '#F5A623',
      },
      {
        num: '03',
        title: 'à¤¹à¥‡à¤²à¥à¤¥ à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ à¤ªà¤¾à¤à¤‚',
        desc: 'à¤µà¤¿à¤¸à¥à¤¤à¥ƒà¤¤ à¤µà¤¿à¤¶à¥à¤²à¥‡à¤·à¤£ à¤ªà¤¾à¤à¤‚: à¤¸à¥à¤•à¥‹à¤°, à¤­à¥à¤—à¤¤à¤¾à¤¨ à¤‡à¤¤à¤¿à¤¹à¤¾à¤¸, à¤‰à¤ªà¤¯à¥‹à¤— à¤…à¤¨à¥à¤ªà¤¾à¤¤, à¤–à¥à¤²à¥‡ à¤–à¤¾à¤¤à¥‡ à¤”à¤° à¤¸à¥à¤§à¤¾à¤° à¤•à¥‡ à¤¸à¥à¤à¤¾à¤µà¥¤',
        icon: 'DocumentChartBarIcon',
        color: '#7FFFDF',
      },
    ],
    timeLabel: '< 60 à¤¸à¥‡à¤•à¤‚à¤¡',
    timeDesc: 'à¤”à¤¸à¤¤ à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ à¤¡à¤¿à¤²à¥€à¤µà¤°à¥€ à¤¸à¤®à¤¯',
    imgAlt: 'à¤†à¤§à¥à¤¨à¤¿à¤• à¤•à¤¾à¤°à¥à¤¯à¤¾à¤²à¤¯ à¤®à¥‡à¤‚ à¤²à¥ˆà¤ªà¤Ÿà¥‰à¤ª à¤ªà¤° à¤µà¤¿à¤¤à¥à¤¤à¥€à¤¯ à¤¦à¤¸à¥à¤¤à¤¾à¤µà¥‡à¤œà¤¼ à¤¦à¥‡à¤–à¤¤à¤¾ à¤µà¥à¤¯à¤•à¥à¤¤à¤¿',
    cta: 'à¤®à¥à¤«à¤¼à¥à¤¤ à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ à¤ªà¤¾à¤à¤‚',
  },
};

export default function HowItWorksSection({ lang, onGetReport }: HowItWorksSectionProps) {
  const t = copy[lang];
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { rootMargin: '0px 0px -60px 0px', threshold: 0.1 }
    );

    const els = sectionRef.current?.querySelectorAll('.scroll-reveal');
    els?.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="how-it-works" ref={sectionRef} className="py-24 relative overflow-hidden">
      {/* subtle bg */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16 scroll-reveal">
          <span className="tag tag-primary mb-5 inline-flex">{t.tag}</span>
          <h2 className="section-headline text-fg">
            {t.headline}{' '}
            <span className="font-serif italic gradient-text-primary">{t.headlineAccent}</span>
          </h2>
        </div>

        {/* Asymmetric layout: steps left, image right */}
        <div className="grid lg:grid-cols-5 gap-10 items-stretch">

          {/* Steps â€” 3 cols */}
          <div className="lg:col-span-3 space-y-4">
            {t.steps.map((step, i) => (
              <div
                key={i}
                className={`scroll-reveal scroll-reveal-delay-${i + 1} glass-card glass-card-hover rounded-3xl p-6 flex gap-5 items-start`}
              >
                {/* Number + line */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                    style={{ background: `${step.color}18`, color: step.color, border: `1px solid ${step.color}30` }}
                  >
                    {step.num}
                  </div>
                  {i < t.steps.length - 1 && <div className="w-px flex-1 min-h-[2rem]" style={{ background: `linear-gradient(to bottom, ${step.color}30, transparent)` }} />}
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon name={step.icon as 'IdentificationIcon'} size={18} className="shrink-0" style={{ color: step.color }} />
                    <h3 className="text-lg font-bold text-fg">{step.title}</h3>
                  </div>
                  <p className="text-fg-muted text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}

            {/* Time badge */}
            <div className="scroll-reveal scroll-reveal-delay-4 flex items-center gap-4 pl-2">
              <div className="flex items-center gap-3 glass-card rounded-2xl px-5 py-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,212,170,0.15)' }}>
                  <Icon name="BoltIcon" size={16} className="text-primary" variant="solid" />
                </div>
                <div>
                  <p className="text-primary font-bold text-base">{t.timeLabel}</p>
                  <p className="text-fg-subtle text-xs">{t.timeDesc}</p>
                </div>
              </div>
              <button onClick={onGetReport} className="btn-primary flex items-center gap-2 px-6 py-3 text-sm">
                {t.cta}
                <Icon name="ArrowRightIcon" size={15} variant="solid" />
              </button>
            </div>
          </div>

          {/* Image â€” 2 cols */}
          <div className="lg:col-span-2 scroll-reveal scroll-reveal-delay-2">
            <div className="h-full min-h-72 rounded-4xl overflow-hidden relative" style={{ border: '1px solid rgba(0,212,170,0.12)' }}>
              <AppImage
                src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=800&auto=format&fit=crop"
                alt={t.imgAlt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
              {/* overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-bg/80 via-bg/20 to-transparent" />
              {/* floating card */}
              <div className="absolute bottom-5 left-5 right-5 glass-card rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(0,212,170,0.15)' }}>
                    <Icon name="ShieldCheckIcon" size={20} className="text-primary" variant="solid" />
                  </div>
                  <div>
                    <p className="text-fg text-sm font-bold">{lang === 'en' ? 'Consent-based report journey' : 'à¤¬à¥ˆà¤‚à¤•-à¤¸à¥à¤¤à¤°à¥€à¤¯ à¤¸à¥à¤°à¤•à¥à¤·à¤¾'}</p>
                    <p className="text-fg-muted text-xs">{lang === 'en' ? 'Secure data handling from request to report' : '256-bit SSL / ISO 27001'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
