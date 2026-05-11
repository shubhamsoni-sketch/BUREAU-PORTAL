'use client';

import React, { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface ReportPreviewSectionProps {
  lang: 'en' | 'hi';
}

const copy = {
  en: {
    tag: 'Financial Analysis',
    headline: "Here\'s what\'s inside",
    headlineAccent: 'your credit health analysis.',
    cards: {
      gauge: {
        title: 'Credit Score',
        score: 762,
        max: 900,
        label: 'Good',
        desc: 'Credit health indicator',
      },
      payment: {
        title: 'Payment History',
        value: '94%',
        label: 'On-Time Payments',
        trend: '+2% vs last year',
        bars: [82, 88, 91, 94, 94],
      },
      mix: {
        title: 'Credit Mix',
        items: ['Home Loan', 'Personal Loan', 'Credit Card'],
        values: [55, 30, 15],
        colors: ['#00D4AA', '#F5A623', '#7FFFDF'],
      },
      util: {
        title: 'Credit Utilization',
        value: '28%',
        label: 'Ideal range: < 30%',
        status: 'Healthy',
        statusColor: '#00D4AA',
      },
      accounts: {
        title: 'Loan Accounts',
        active: 3,
        closed: 2,
        label: 'Accounts Overview',
      },
      tips: {
        title: 'Improvement Tips',
        items: [
          'Pay credit card dues before due date',
          'Keep utilization below 30%',
          'Avoid multiple loan applications',
        ],
        badge: '3 Quick Wins',
      },
    },
  },
  hi: {
    tag: 'à¤†à¤ªà¤•à¥€ à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ',
    headline: 'à¤¦à¥‡à¤–à¥‡à¤‚ à¤•à¥à¤¯à¤¾ à¤¹à¥‹à¤¤à¤¾ à¤¹à¥ˆ',
    headlineAccent: 'à¤†à¤ªà¤•à¥€ Credit à¤¹à¥‡à¤²à¥à¤¥ à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ à¤®à¥‡à¤‚à¥¤',
    cards: {
      gauge: {
        title: 'à¤•à¥à¤°à¥‡à¤¡à¤¿à¤Ÿ à¤¸à¥à¤•à¥‹à¤°',
        score: 762,
        max: 900,
        label: 'à¤…à¤šà¥à¤›à¤¾',
        desc: 'à¤¶à¥€à¤°à¥à¤· 28% à¤‰à¤§à¤¾à¤°à¤•à¤°à¥à¤¤à¤¾',
      },
      payment: {
        title: 'à¤­à¥à¤—à¤¤à¤¾à¤¨ à¤‡à¤¤à¤¿à¤¹à¤¾à¤¸',
        value: '94%',
        label: 'à¤¸à¤®à¤¯ à¤ªà¤° à¤­à¥à¤—à¤¤à¤¾à¤¨',
        trend: '+2% à¤ªà¤¿à¤›à¤²à¥‡ à¤¸à¤¾à¤² à¤¸à¥‡',
        bars: [82, 88, 91, 94, 94],
      },
      mix: {
        title: 'à¤•à¥à¤°à¥‡à¤¡à¤¿à¤Ÿ à¤®à¤¿à¤¶à¥à¤°à¤£',
        items: ['à¤¹à¥‹à¤® à¤²à¥‹à¤¨', 'à¤ªà¤°à¥à¤¸à¤¨à¤² à¤²à¥‹à¤¨', 'à¤•à¥à¤°à¥‡à¤¡à¤¿à¤Ÿ à¤•à¤¾à¤°à¥à¤¡'],
        values: [55, 30, 15],
        colors: ['#00D4AA', '#F5A623', '#7FFFDF'],
      },
      util: {
        title: 'à¤•à¥à¤°à¥‡à¤¡à¤¿à¤Ÿ à¤‰à¤ªà¤¯à¥‹à¤—',
        value: '28%',
        label: 'à¤†à¤¦à¤°à¥à¤¶ à¤¸à¥€à¤®à¤¾: < 30%',
        status: 'à¤¸à¥à¤µà¤¸à¥à¤¥',
        statusColor: '#00D4AA',
      },
      accounts: {
        title: 'à¤²à¥‹à¤¨ à¤–à¤¾à¤¤à¥‡',
        active: 3,
        closed: 2,
        label: 'à¤–à¤¾à¤¤à¥‹à¤‚ à¤•à¤¾ à¤…à¤µà¤²à¥‹à¤•à¤¨',
      },
      tips: {
        title: 'à¤¸à¥à¤§à¤¾à¤° à¤•à¥‡ à¤¸à¥à¤à¤¾à¤µ',
        items: [
          'à¤•à¥à¤°à¥‡à¤¡à¤¿à¤Ÿ à¤•à¤¾à¤°à¥à¤¡ à¤¬à¤¿à¤² à¤¸à¤®à¤¯ à¤ªà¤° à¤šà¥à¤•à¤¾à¤à¤‚',
          'à¤‰à¤ªà¤¯à¥‹à¤— 30% à¤¸à¥‡ à¤•à¤® à¤°à¤–à¥‡à¤‚',
          'à¤à¤• à¤¸à¤¾à¤¥ à¤•à¤ˆ à¤²à¥‹à¤¨ à¤†à¤µà¥‡à¤¦à¤¨ à¤¸à¥‡ à¤¬à¤šà¥‡à¤‚',
        ],
        badge: '3 à¤¤à¥à¤µà¤°à¤¿à¤¤ à¤¸à¥à¤à¤¾à¤µ',
      },
    },
  },
};

function ScoreArc({ score, max }: { score: number; max: number }) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setAnimated(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const pct = score / max;
  const r = 52;
  const circ = 2 * Math.PI * r;
  // Only show 270deg arc (3/4 circle)
  const arcLen = circ * 0.75;
  const offset = animated ? arcLen * (1 - pct) + circ * 0.25 : arcLen + circ * 0.25;

  const getColor = (p: number) => {
    if (p < 0.45) return '#FF4D6D';
    if (p < 0.6) return '#FFB347';
    if (p < 0.72) return '#F5A623';
    if (p < 0.85) return '#7FD858';
    return '#00D4AA';
  };

  return (
    <div ref={ref} className="relative flex items-center justify-center w-32 h-32">
      <svg className="w-full h-full" viewBox="0 0 120 120" style={{ transform: 'rotate(135deg)' }}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"
          strokeDasharray={`${arcLen} ${circ - arcLen}`} strokeLinecap="round" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={getColor(pct)} strokeWidth="8"
          strokeDasharray={`${arcLen} ${circ - arcLen}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 2s cubic-bezier(0.22,1,0.36,1) 0.3s', filter: `drop-shadow(0 0 8px ${getColor(pct)}80)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color: getColor(pct) }}>{score}</span>
      </div>
    </div>
  );
}

export default function ReportPreviewSection({ lang }: ReportPreviewSectionProps) {
  const t = copy[lang];
  const c = t.cards;
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

  // Bento audit (4-col grid):
  // Row 1: [Score Gauge cs-2] + [Payment History cs-1] + [Credit Mix cs-1] = 4 âœ“
  // Row 2: [Credit Utilization cs-1] + [Loan Accounts cs-1] + [Improvement Tips cs-2] = 4 âœ“

  return (
    <section id="report-preview" ref={sectionRef} className="py-24 relative">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-14 scroll-reveal">
          <span className="tag tag-accent mb-5 inline-flex">{t.tag}</span>
          <h2 className="section-headline text-fg">
            {t.headline}{' '}
            <span className="font-serif italic gradient-text-accent">{t.headlineAccent}</span>
          </h2>
        </div>

        {/* Bento Grid */}
        <div className="bento-grid">

          {/* Card 1: Score Gauge â€” col-span-2 */}
          <div className="scroll-reveal col-span-2 glass-card glass-card-hover rounded-4xl p-7 flex flex-col sm:flex-row items-center gap-6">
            <ScoreArc score={c.gauge.score} max={c.gauge.max} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-fg">{c.gauge.title}</h3>
                <span className="tag tag-primary text-xs">{c.gauge.label}</span>
              </div>
              <p className="text-fg-muted text-sm mb-4">{c.gauge.desc}</p>
              {/* Score range bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-fg-subtle">
                  <span>300</span><span>550</span><span>700</span><span>750</span><span>900</span>
                </div>
                <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: '80%', background: 'linear-gradient(to right, #FF4D6D 0%, #FFB347 25%, #F5A623 45%, #7FD858 65%, #00D4AA 100%)' }} />
                  {/* Marker */}
                  <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-bg bg-primary shadow-glow-sm" style={{ left: 'calc(80% * (762-300)/(900-300) + 0%)' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Payment History â€” col-span-1 */}
          <div className="scroll-reveal scroll-reveal-delay-1 glass-card glass-card-hover rounded-4xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-fg-muted uppercase tracking-wider mb-3">{c.payment.title}</h3>
              <div className="text-3xl font-bold gradient-text-primary mb-1">{c.payment.value}</div>
              <p className="text-xs text-fg-muted">{c.payment.label}</p>
            </div>
            {/* Mini bar chart */}
            <div className="mt-4 flex items-end gap-1.5 h-14">
              {c.payment.bars.map((v, i) => (
                <div key={i} className="flex-1 rounded-t-md" style={{ height: `${v}%`, background: i === 4 ? '#00D4AA' : 'rgba(0,212,170,0.25)', transition: `height 1s ease ${i * 0.1}s` }} />
              ))}
            </div>
            <p className="text-xs text-primary mt-2 font-medium">{c.payment.trend}</p>
          </div>

          {/* Card 3: Credit Mix â€” col-span-1 */}
          <div className="scroll-reveal scroll-reveal-delay-2 glass-card glass-card-hover rounded-4xl p-6 flex flex-col justify-between">
            <h3 className="text-sm font-bold text-fg-muted uppercase tracking-wider mb-4">{c.mix.title}</h3>
            <div className="space-y-3">
              {c.mix.items.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-fg-muted">{item}</span>
                    <span style={{ color: c.mix.colors[i] }} className="font-bold">{c.mix.values[i]}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${c.mix.values[i]}%`, background: c.mix.colors[i] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Credit Utilization â€” col-span-1 */}
          <div className="scroll-reveal scroll-reveal-delay-1 glass-card glass-card-hover rounded-4xl p-6 flex flex-col justify-between">
            <h3 className="text-sm font-bold text-fg-muted uppercase tracking-wider mb-3">{c.util.title}</h3>
            <div>
              <div className="text-4xl font-bold gradient-text-primary mb-1">{c.util.value}</div>
              <p className="text-xs text-fg-muted mb-3">{c.util.label}</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '28%', background: 'linear-gradient(to right, #00D4AA, #7FFFDF)' }} />
              </div>
            </div>
            <span className="tag tag-primary mt-3 self-start">{c.util.status}</span>
          </div>

          {/* Card 5: Loan Accounts â€” col-span-1 */}
          <div className="scroll-reveal scroll-reveal-delay-2 glass-card glass-card-hover rounded-4xl p-6 flex flex-col justify-between">
            <h3 className="text-sm font-bold text-fg-muted uppercase tracking-wider mb-4">{c.accounts.label}</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 text-center p-3 rounded-2xl" style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.15)' }}>
                <div className="text-2xl font-bold text-primary">{c.accounts.active}</div>
                <div className="text-xs text-fg-muted mt-0.5">{lang === 'en' ? 'Active' : 'à¤¸à¤•à¥à¤°à¤¿à¤¯'}</div>
              </div>
              <div className="flex-1 text-center p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="text-2xl font-bold text-fg-muted">{c.accounts.closed}</div>
                <div className="text-xs text-fg-muted mt-0.5">{lang === 'en' ? 'Closed' : 'à¤¬à¤‚à¤¦'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Icon name="InformationCircleIcon" size={14} className="text-fg-subtle" />
              <p className="text-xs text-fg-subtle">{c.accounts.title}</p>
            </div>
          </div>

          {/* Card 6: Improvement Tips â€” col-span-2 */}
          <div className="scroll-reveal scroll-reveal-delay-3 col-span-2 glass-card glass-card-hover rounded-4xl p-7">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-fg">{c.tips.title}</h3>
              <span className="tag tag-accent">{c.tips.badge}</span>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {c.tips.items.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: 'rgba(245,166,35,0.05)', border: '1px solid rgba(245,166,35,0.12)' }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(245,166,35,0.15)' }}>
                    <span className="text-accent font-bold text-xs">{i + 1}</span>
                  </div>
                  <p className="text-fg-muted text-sm leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}