'use client';

import React, { useEffect, useRef } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface TrustSectionProps {
  lang: 'en' | 'hi';
}

const copy = {
  en: {
    tag: 'Security & Trust',
    headline: 'Your data is as safe',
    headlineAccent: 'as your bank.',
    sub: 'We use bank-grade security standards because financial data deserves careful handling.',
    features: [
    { icon: 'LockClosedIcon', title: '256-bit SSL Encryption', desc: 'Every data transfer is end-to-end encrypted. No one can intercept your information.' },
    { icon: 'ShieldCheckIcon', title: 'ISO 27001 Certified', desc: 'Our data security management system meets international standards.' },
    { icon: 'EyeSlashIcon', title: 'No Data Selling', desc: 'We never sell, rent, or share your personal data with third parties.' },
    { icon: 'ServerStackIcon', title: 'India-Based Servers', desc: 'All data stored on RBI-compliant servers within Indian territory.' }],

    stats: [
    { value: '2,40,000+', label: 'Analyses Generated' },
    { value: '4.8 / 5', label: 'User Rating' },
    { value: '0', label: 'Data Breaches' }],

    testimonials: [
    {
      quote: 'The report helped me understand my credit health before applying for a loan.',
      name: 'Priya Venkataraman',
      role: 'Software Engineer, Bengaluru',
      avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1d4349ef8-1780547940762.png",
      avatarAlt: 'Young Indian woman smiling, professional headshot with neutral background',
      score: '684 to 741'
    },
    {
      quote: 'I could see repayment patterns, risk factors, and simple steps to improve my profile.',
      name: 'Ramesh Yadav',
      role: 'Shopkeeper, Lucknow',
      avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1b48d0a1c-1763296743407.png",
      avatarAlt: 'Middle-aged Indian man with confident smile, casual attire',
      score: '612 to 689'
    }],

    metricLabel: 'Credit Health Improvement'
  },
  hi: {
    tag: 'à¤¸à¥à¤°à¤•à¥à¤·à¤¾ à¤”à¤° à¤µà¤¿à¤¶à¥à¤µà¤¾à¤¸',
    headline: 'à¤†à¤ªà¤•à¤¾ à¤¡à¥‡à¤Ÿà¤¾ à¤‰à¤¤à¤¨à¤¾ à¤¹à¥€ à¤¸à¥à¤°à¤•à¥à¤·à¤¿à¤¤ à¤¹à¥ˆ',
    headlineAccent: 'à¤œà¤¿à¤¤à¤¨à¤¾ à¤†à¤ªà¤•à¤¾ à¤¬à¥ˆà¤‚à¤•à¥¤',
    sub: 'à¤¹à¤® à¤­à¤¾à¤°à¤¤ à¤•à¥‡ à¤ªà¥à¤°à¤®à¥à¤– à¤¬à¥ˆà¤‚à¤•à¥‹à¤‚ à¤œà¥ˆà¤¸à¥‡ à¤¹à¥€ à¤¸à¥à¤°à¤•à¥à¤·à¤¾ à¤®à¤¾à¤¨à¤•à¥‹à¤‚ à¤•à¤¾ à¤‰à¤ªà¤¯à¥‹à¤— à¤•à¤°à¤¤à¥‡ à¤¹à¥ˆà¤‚ â€” à¤•à¥à¤¯à¥‹à¤‚à¤•à¤¿ à¤†à¤ªà¤•à¥‡ à¤µà¤¿à¤¤à¥à¤¤à¥€à¤¯ à¤¡à¥‡à¤Ÿà¤¾ à¤•à¥‹ à¤‡à¤¸à¤¸à¥‡ à¤•à¤® à¤•à¥à¤› à¤¨à¤¹à¥€à¤‚ à¤šà¤¾à¤¹à¤¿à¤à¥¤',
    features: [
    { icon: 'LockClosedIcon', title: '256-à¤¬à¤¿à¤Ÿ SSL à¤à¤¨à¥à¤•à¥à¤°à¤¿à¤ªà¥à¤¶à¤¨', desc: 'à¤¹à¤° à¤¡à¥‡à¤Ÿà¤¾ à¤Ÿà¥à¤°à¤¾à¤‚à¤¸à¤«à¤° à¤à¤‚à¤¡-à¤Ÿà¥‚-à¤à¤‚à¤¡ à¤à¤¨à¥à¤•à¥à¤°à¤¿à¤ªà¥à¤Ÿà¥‡à¤¡ à¤¹à¥ˆà¥¤' },
    { icon: 'ShieldCheckIcon', title: 'ISO 27001 à¤ªà¥à¤°à¤®à¤¾à¤£à¤¿à¤¤', desc: 'à¤¹à¤®à¤¾à¤°à¤¾ à¤¡à¥‡à¤Ÿà¤¾ à¤¸à¥à¤°à¤•à¥à¤·à¤¾ à¤ªà¥à¤°à¤¬à¤‚à¤§à¤¨ à¤…à¤‚à¤¤à¤°à¥à¤°à¤¾à¤·à¥à¤Ÿà¥à¤°à¥€à¤¯ à¤®à¤¾à¤¨à¤•à¥‹à¤‚ à¤•à¥‹ à¤ªà¥‚à¤°à¤¾ à¤•à¤°à¤¤à¤¾ à¤¹à¥ˆà¥¤' },
    { icon: 'EyeSlashIcon', title: 'à¤¡à¥‡à¤Ÿà¤¾ à¤¨à¤¹à¥€à¤‚ à¤¬à¥‡à¤šà¤¤à¥‡', desc: 'à¤¹à¤® à¤†à¤ªà¤•à¤¾ à¤µà¥à¤¯à¤•à¥à¤¤à¤¿à¤—à¤¤ à¤¡à¥‡à¤Ÿà¤¾ à¤•à¤­à¥€ à¤•à¤¿à¤¸à¥€ à¤¤à¥€à¤¸à¤°à¥‡ à¤ªà¤•à¥à¤· à¤•à¥‹ à¤¨à¤¹à¥€à¤‚ à¤¦à¥‡à¤¤à¥‡à¥¤' },
    { icon: 'ServerStackIcon', title: 'à¤­à¤¾à¤°à¤¤-à¤†à¤§à¤¾à¤°à¤¿à¤¤ à¤¸à¤°à¥à¤µà¤°', desc: 'à¤¸à¤­à¥€ à¤¡à¥‡à¤Ÿà¤¾ RBI-à¤…à¤¨à¥à¤ªà¤¾à¤²à¤• à¤­à¤¾à¤°à¤¤à¥€à¤¯ à¤¸à¤°à¥à¤µà¤° à¤ªà¤° à¤¸à¤‚à¤—à¥à¤°à¤¹à¥€à¤¤à¥¤' }],

    stats: [
    { value: '2,40,000+', label: 'à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ à¤¤à¥ˆà¤¯à¤¾à¤°' },
    { value: '4.8 / 5', label: 'à¤‰à¤ªà¤¯à¥‹à¤—à¤•à¤°à¥à¤¤à¤¾ à¤°à¥‡à¤Ÿà¤¿à¤‚à¤—' },
    { value: '0', label: 'à¤¡à¥‡à¤Ÿà¤¾ à¤‰à¤²à¥à¤²à¤‚à¤˜à¤¨' }],

    testimonials: [
    {
      quote: 'à¤¹à¥‹à¤® à¤²à¥‹à¤¨ à¤•à¥‡ à¤²à¤¿à¤ à¤°à¤¿à¤œà¥‡à¤•à¥à¤Ÿ à¤¹à¥à¤ˆ à¤¥à¥€, à¤¸à¤®à¤ à¤¨à¤¹à¥€à¤‚ à¤† à¤°à¤¹à¤¾ à¤¥à¤¾ à¤•à¥à¤¯à¥‹à¤‚à¥¤ CredIntel à¤¨à¥‡ à¤¦à¤¿à¤–à¤¾à¤¯à¤¾ à¤•à¤¿ à¤•à¥Œà¤¨ à¤¸à¥‡ 2 à¤–à¤¾à¤¤à¥‡ à¤¸à¥à¤•à¥‹à¤° à¤—à¤¿à¤°à¤¾ à¤°à¤¹à¥‡ à¤¥à¥‡à¥¤ 3 à¤®à¤¹à¥€à¤¨à¥‡ à¤®à¥‡à¤‚ à¤ à¥€à¤• à¤•à¤¿à¤¯à¤¾à¥¤',
      name: 'à¤ªà¥à¤°à¤¿à¤¯à¤¾ à¤µà¥‡à¤‚à¤•à¤Ÿà¤°à¤®à¤¨',
      role: 'à¤¸à¥‰à¤«à¥à¤Ÿà¤µà¥‡à¤¯à¤° à¤‡à¤‚à¤œà¥€à¤¨à¤¿à¤¯à¤°, à¤¬à¥‡à¤‚à¤—à¤²à¥à¤°à¥',
      avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_11ca1a9b9-1763301531530.png",
      avatarAlt: 'à¤®à¥à¤¸à¥à¤•à¥à¤°à¤¾à¤¤à¥€ à¤¯à¥à¤µà¤¾ à¤­à¤¾à¤°à¤¤à¥€à¤¯ à¤®à¤¹à¤¿à¤²à¤¾, à¤ªà¥‡à¤¶à¥‡à¤µà¤° à¤«à¥‹à¤Ÿà¥‹',
      score: 'â†‘ 684 â†’ 741'
    },
    {
      quote: 'The financial analysis view makes customer conversations faster, clearer, and easier to document.',
      name: 'à¤°à¤®à¥‡à¤¶ à¤¯à¤¾à¤¦à¤µ',
      role: 'à¤¦à¥à¤•à¤¾à¤¨à¤¦à¤¾à¤°, à¤²à¤–à¤¨à¤Š',
      avatar: "https://images.unsplash.com/photo-1657846255959-fe5a67388e3c",
      avatarAlt: 'à¤†à¤¤à¥à¤®à¤µà¤¿à¤¶à¥à¤µà¤¾à¤¸ à¤¸à¥‡ à¤­à¤°à¥‡ à¤®à¤§à¥à¤¯à¤® à¤†à¤¯à¥ à¤•à¥‡ à¤­à¤¾à¤°à¤¤à¥€à¤¯ à¤µà¥à¤¯à¤•à¥à¤¤à¤¿ à¤•à¥€ à¤«à¥‹à¤Ÿà¥‹',
      score: 'â†‘ 612 â†’ 689'
    }],

    metricLabel: 'à¤¸à¥à¤•à¥‹à¤° à¤¸à¥à¤§à¤¾à¤°'
  }
};

export default function TrustSection({ lang }: TrustSectionProps) {
  const t = copy[lang];
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { rootMargin: '0px 0px -60px 0px', threshold: 0.08 }
    );
    const els = sectionRef.current?.querySelectorAll('.scroll-reveal');
    els?.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="trust" ref={sectionRef} className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
        <div className="absolute inset-0 opacity-5" style={{ background: 'radial-gradient(ellipse 70% 50% at 20% 50%, rgba(0,212,170,0.3), transparent)' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16 scroll-reveal">
          <span className="tag tag-primary mb-5 inline-flex">{t.tag}</span>
          <h2 className="section-headline text-fg">
            {t.headline}{' '}
            <span className="font-serif italic gradient-text-primary">{t.headlineAccent}</span>
          </h2>
          <p className="text-fg-muted mt-4 max-w-xl mx-auto leading-relaxed">{t.sub}</p>
        </div>

        {/* Asymmetric split: Security features (left 60%) + Testimonials (right 40%) */}
        <div className="grid lg:grid-cols-5 gap-8 items-start">

          {/* LEFT â€” Security features + Stats (3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats row */}
            <div className="scroll-reveal grid grid-cols-3 gap-4">
              {t.stats.map((stat, i) =>
              <div key={i} className="glass-card rounded-3xl p-5 text-center">
                  <div className="text-2xl font-bold gradient-text-primary mb-1">{stat.value}</div>
                  <div className="text-xs text-fg-muted">{stat.label}</div>
                </div>
              )}
            </div>

            {/* Security feature grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {t.features.map((f, i) =>
              <div
                key={i}
                className={`scroll-reveal scroll-reveal-delay-${i + 1} glass-card glass-card-hover rounded-3xl p-5 flex gap-4 items-start`}>
                
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(0,212,170,0.12)', border: '1px solid rgba(0,212,170,0.2)' }}>
                    <Icon name={f.icon as 'LockClosedIcon'} size={18} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-fg mb-1">{f.title}</h4>
                    <p className="text-xs text-fg-muted leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT â€” Testimonials (2 cols) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Stacked testimonial cards */}
            <div className="scroll-reveal scroll-reveal-delay-2 relative">
              {/* Back layer */}
              <div className="absolute inset-x-4 -top-3 h-full rounded-4xl opacity-30 scale-95" style={{ background: 'rgba(13,27,46,0.8)', border: '1px solid rgba(0,212,170,0.08)' }} />
              {/* Front card */}
              <div className="relative glass-card rounded-4xl p-6 space-y-5">
                {t.testimonials.map((tm, i) =>
                <div key={i} className={i > 0 ? 'pt-5 border-t border-white/5' : ''}>
                    {/* Quote */}
                    <div className="text-fg-subtle text-3xl leading-none mb-2 font-serif">&ldquo;</div>
                    <p className="text-sm text-fg-muted leading-relaxed italic mb-4">{tm.quote}</p>
                    {/* Author */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
                          <AppImage src={tm.avatar} alt={tm.avatarAlt} width={36} height={36} className="object-cover" />
                        </div>
                        <div>
                          <p className="text-fg text-sm font-bold">{tm.name}</p>
                          <p className="text-fg-subtle text-xs">{tm.role}</p>
                        </div>
                      </div>
                      <span className="tag tag-primary text-xs">{tm.score}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Readiness badge */}
            <div className="scroll-reveal scroll-reveal-delay-3 glass-card rounded-3xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.2)' }}>
                <Icon name="GiftIcon" size={22} className="text-accent" />
              </div>
              <div>
                <p className="text-fg font-bold">{lang === 'en' ? 'Consent-first analysis' : 'Secure demo workspace'}</p>
                <p className="text-fg-muted text-xs mt-0.5">
                  {lang === 'en' ? 'Financial reports are generated only through a controlled and approved journey.' : 'Demo data stays contained while live integrations remain gated.'}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>);

}