'use client';

import React, { useEffect, useRef } from 'react';
import Icon from '@/components/ui/AppIcon';

interface HeroSectionProps {
  lang: 'en' | 'hi';
  onGetReport: () => void;
}

const copy = {
  en: {
    tag: 'For Individuals',
    headline1: 'Create Your',
    headline2: 'Financial Health Report',
    headline3: 'Before You Apply.',
    sub: 'Understand your credit score, repayment behavior, loan readiness, risk signals, and improvement steps in one simple financial analysis.',
    cta1: 'Get My Report',
    cta2: 'Preview Report',
    stat1: '2.4L+ Reports',
    stat2: '4.8/5 Rating',
    stat3: 'Secure Journey',
    nodes: ['Payment\nHistory', 'Credit\nUtilization', 'Loan\nAccounts', 'Credit\nAge', 'Enquiries'],
    scoreLabel: 'Credit Score',
    scoreRange: '300 - 900',
  },
  hi: {
    tag: '100% à¤®à¥à¤«à¤¼à¥à¤¤ Â· à¤•à¥à¤°à¥‡à¤¡à¤¿à¤Ÿ à¤•à¤¾à¤°à¥à¤¡ à¤•à¥€ à¤œà¤¼à¤°à¥‚à¤°à¤¤ à¤¨à¤¹à¥€à¤‚',
    headline1: 'à¤œà¤¾à¤¨à¥‡à¤‚ à¤…à¤ªà¤¨à¥€',
    headline2: 'Credit à¤¸à¥‡à¤¹à¤¤',
    headline3: 'à¤¬à¥ˆà¤‚à¤• à¤¸à¥‡ à¤ªà¤¹à¤²à¥‡à¥¤',
    sub: '60 à¤¸à¥‡à¤•à¤‚à¤¡ à¤®à¥‡à¤‚ à¤µà¤¿à¤¸à¥à¤¤à¥ƒà¤¤ à¤•à¥à¤°à¥‡à¤¡à¤¿à¤Ÿ à¤¹à¥‡à¤²à¥à¤¥ à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ à¤ªà¤¾à¤à¤‚à¥¤ à¤…à¤ªà¤¨à¤¾ à¤¸à¥à¤•à¥‹à¤° à¤¸à¤®à¤à¥‡à¤‚, à¤•à¥à¤¯à¤¾ à¤•à¤®à¤œà¤¼à¥‹à¤° à¤•à¤° à¤°à¤¹à¤¾ à¤¹à¥ˆ à¤”à¤° à¤•à¥ˆà¤¸à¥‡ à¤¸à¥à¤§à¤¾à¤°à¥‡à¤‚ â€” à¤¬à¤¿à¤²à¥à¤•à¥à¤² à¤®à¥à¤«à¤¼à¥à¤¤à¥¤',
    cta1: 'Credit à¤¸à¥à¤•à¥‹à¤° à¤œà¤¾à¤à¤šà¥‡à¤‚',
    cta2: 'à¤¸à¥ˆà¤‚à¤ªà¤² à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ à¤¦à¥‡à¤–à¥‡à¤‚',
    stat1: '2.4 à¤²à¤¾à¤–+ à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ',
    stat2: '4.8â˜… à¤°à¥‡à¤Ÿà¤¿à¤‚à¤—',
    stat3: '100% à¤®à¥à¤«à¤¼à¥à¤¤',
    nodes: ['à¤­à¥à¤—à¤¤à¤¾à¤¨\nà¤‡à¤¤à¤¿à¤¹à¤¾à¤¸', 'à¤•à¥à¤°à¥‡à¤¡à¤¿à¤Ÿ\nà¤‰à¤ªà¤¯à¥‹à¤—', 'à¤²à¥‹à¤¨\nà¤–à¤¾à¤¤à¥‡', 'à¤•à¥à¤°à¥‡à¤¡à¤¿à¤Ÿ\nà¤†à¤¯à¥', 'à¤ªà¥‚à¤›à¤¤à¤¾à¤›'],
    scoreLabel: 'à¤†à¤ªà¤•à¤¾ à¤¸à¥à¤•à¥‹à¤°',
    scoreRange: '300 â€“ 900',
  },
};

export default function HeroSection({ lang, onGetReport }: HeroSectionProps) {
  const t = copy[lang];
  const dialRef = useRef<SVGCircleElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (dialRef.current) {
        dialRef.current.style.strokeDashoffset = '88';
      }
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Cursor parallax on orbit visual
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const orbit = el.querySelector<HTMLElement>('.orbit-container');
    if (!orbit) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;
      orbit.style.transform = `translate(${dx * 18}px, ${dy * 12}px)`;
    };

    el.addEventListener('mousemove', handleMove);
    return () => el.removeEventListener('mousemove', handleMove);
  }, []);

  const circumference = 2 * Math.PI * 45;

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden"
      style={{ background: 'radial-gradient(ellipse 90% 70% at 50% -5%, rgba(0,212,170,0.12) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 85% 85%, rgba(245,166,35,0.07) 0%, transparent 50%)' }}
    >
      {/* Background mesh blobs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #00D4AA, transparent 70%)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-8" style={{ background: 'radial-gradient(circle, #F5A623, transparent 70%)' }} />
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#00D4AA" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* LEFT - Text */}
          <div className="space-y-7 z-10">
            {/* Tag */}
            <div
              className="opacity-0"
              style={{ animation: 'slideInBlur 0.8s cubic-bezier(0.22,1,0.36,1) 0.2s forwards' }}
            >
              <span className="tag tag-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {t.tag}
              </span>
            </div>

            {/* Headline */}
            <div
              className="opacity-0"
              style={{ animation: 'slideInBlur 0.9s cubic-bezier(0.22,1,0.36,1) 0.4s forwards' }}
            >
              <h1 className="hero-headline text-fg">
                <span className="block">{t.headline1}</span>
                <span className="block gradient-text-primary">{t.headline2}</span>
                <span className="block text-fg/70">{t.headline3}</span>
              </h1>
            </div>

            {/* Sub */}
            <div
              className="opacity-0"
              style={{ animation: 'slideInBlur 0.8s cubic-bezier(0.22,1,0.36,1) 0.65s forwards' }}
            >
              <p className="text-lg text-fg-muted leading-relaxed max-w-lg">
                {t.sub}
              </p>
            </div>

            {/* CTAs */}
            <div
              className="flex flex-wrap gap-3 opacity-0"
              style={{ animation: 'slideInBlur 0.8s cubic-bezier(0.22,1,0.36,1) 0.85s forwards' }}
            >
              <button
                onClick={onGetReport}
                className="btn-primary flex items-center gap-2.5 px-7 py-4 text-base"
              >
                <Icon name="DocumentMagnifyingGlassIcon" size={20} />
                {t.cta1}
              </button>
              <a
                href="#report-preview"
                className="btn-ghost flex items-center gap-2 px-6 py-4 text-base"
              >
                {t.cta2}
                <Icon name="ArrowDownIcon" size={16} />
              </a>
            </div>

            {/* Stats */}
            <div
              className="flex items-center gap-6 pt-2 opacity-0"
              style={{ animation: 'slideInBlur 0.8s cubic-bezier(0.22,1,0.36,1) 1.05s forwards' }}
            >
              {[t.stat1, t.stat2, t.stat3].map((s, i) => (
                <React.Fragment key={i}>
                  <div className="text-center">
                    <p className="text-base font-bold text-fg">{s}</p>
                  </div>
                  {i < 2 && <div className="w-px h-8 bg-white/10" />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* RIGHT - Orbital Credit Score Visual */}
          <div
            className="flex items-center justify-center relative z-10 orbit-container transition-transform duration-300 ease-out opacity-0"
            style={{ animation: 'scaleInBlur 1.2s cubic-bezier(0.22,1,0.36,1) 0.5s forwards' }}
          >
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96">

              {/* Outer orbit ring (slowest) */}
              <div className="absolute inset-0 rounded-full border border-primary/8 orbit-3">
                {/* Orbit node: Enquiries */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-xl glass-card flex flex-col items-center justify-center" style={{ border: '1px solid rgba(0,212,170,0.2)' }}>
                  <Icon name="MagnifyingGlassIcon" size={14} className="text-primary" />
                  <span className="text-[9px] text-fg-muted mt-0.5 text-center leading-tight whitespace-pre-line">{t.nodes[4]}</span>
                </div>
              </div>

              {/* Mid orbit ring */}
              <div className="absolute inset-6 rounded-full border border-primary/12 orbit-2">
                {/* Node: Payment History */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-xl glass-card flex flex-col items-center justify-center" style={{ border: '1px solid rgba(0,212,170,0.2)' }}>
                  <Icon name="CheckCircleIcon" size={14} className="text-success" />
                  <span className="text-[9px] text-fg-muted mt-0.5 text-center leading-tight whitespace-pre-line">{t.nodes[0]}</span>
                </div>
                {/* Node: Credit Utilization */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-12 h-12 rounded-xl glass-card flex flex-col items-center justify-center" style={{ border: '1px solid rgba(245,166,35,0.2)' }}>
                  <Icon name="ChartBarIcon" size={14} className="text-accent" />
                  <span className="text-[9px] text-fg-muted mt-0.5 text-center leading-tight whitespace-pre-line">{t.nodes[1]}</span>
                </div>
              </div>

              {/* Inner orbit ring */}
              <div className="absolute inset-12 rounded-full border border-primary/18 orbit-1">
                {/* Node: Loan Accounts */}
                <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl glass-card flex flex-col items-center justify-center" style={{ border: '1px solid rgba(0,212,170,0.2)' }}>
                  <Icon name="BanknotesIcon" size={13} className="text-primary" />
                  <span className="text-[8px] text-fg-muted mt-0.5 text-center leading-tight whitespace-pre-line">{t.nodes[2]}</span>
                </div>
                {/* Node: Credit Age */}
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl glass-card flex flex-col items-center justify-center" style={{ border: '1px solid rgba(245,166,35,0.2)' }}>
                  <Icon name="ClockIcon" size={13} className="text-accent" />
                  <span className="text-[8px] text-fg-muted mt-0.5 text-center leading-tight whitespace-pre-line">{t.nodes[3]}</span>
                </div>
              </div>

              {/* Center Score Dial */}
              <div className="absolute inset-16 flex items-center justify-center">
                <div className="relative w-full h-full">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {/* Track */}
                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                    {/* Fill */}
                    <circle
                      ref={dialRef}
                      cx="50" cy="50" r="45"
                      fill="none"
                      stroke="url(#scoreGrad)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${circumference}`}
                      strokeDashoffset={`${circumference}`}
                      style={{ transition: 'stroke-dashoffset 2s cubic-bezier(0.22,1,0.36,1) 0.6s' }}
                    />
                    <defs>
                      <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00D4AA" />
                        <stop offset="100%" stopColor="#7FFFDF" />
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* Score number */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold gradient-text-primary leading-none">762</span>
                    <span className="text-[9px] text-fg-muted mt-0.5 font-medium">{t.scoreLabel}</span>
                    <span className="text-[8px] text-fg-subtle">{t.scoreRange}</span>
                  </div>
                </div>
              </div>

              {/* Glow under center */}
              <div className="absolute inset-16 rounded-full blur-2xl opacity-25" style={{ background: 'radial-gradient(circle, #00D4AA, transparent 60%)' }} />
            </div>
          </div>

        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-40">
        <div className="w-5 h-8 rounded-full border border-fg-subtle flex items-start justify-center pt-1.5">
          <div className="w-1 h-2 rounded-full bg-fg-subtle" style={{ animation: 'float 1.8s ease-in-out infinite' }} />
        </div>
      </div>
    </section>
  );
}
