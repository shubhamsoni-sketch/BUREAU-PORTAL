'use client';

import Link from 'next/link';
import React from 'react';
import Footer from '@/components/landing/Footer';
import PartnerProgramSection from '@/components/landing/PartnerProgramSection';
import Icon from '@/components/ui/AppIcon';
import AppLogo from '@/components/ui/AppLogo';

export default function PartnerProgramPage() {
  return (
    <div className="landing-page min-h-screen bg-bg text-fg">
      <div className="grain-overlay" aria-hidden />

      <header className="fixed top-0 inset-x-0 z-50 bg-bg/90 backdrop-blur-xl border-b border-white/5 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Go to homepage">
            <AppLogo size={42} width={170} height={40} />
          </Link>

          <nav className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2 py-1">
            <Link href="/" className="px-4 py-2 rounded-full text-sm font-medium text-fg-muted hover:text-fg hover:bg-white/10 transition-all duration-200">
              Individuals
            </Link>
            <a href="#partner-program" className="px-4 py-2 rounded-full text-sm font-medium text-fg-muted hover:text-fg hover:bg-white/10 transition-all duration-200">
              Program
            </a>
            <a href="#partner-cta" className="px-4 py-2 rounded-full text-sm font-medium text-fg-muted hover:text-fg hover:bg-white/10 transition-all duration-200">
              Apply
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/partner-login" className="btn-ghost px-4 py-2.5 text-sm">
              Partner Login
            </Link>
            <Link href="/become-a-partner" className="btn-primary hidden sm:flex items-center gap-2 px-5 py-2.5 text-sm">
              Apply Now
              <Icon name="ArrowRightIcon" size={16} variant="solid" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section
          className="relative min-h-[72vh] flex items-center pt-28 pb-16 overflow-hidden"
          style={{
            background:
              'radial-gradient(ellipse 90% 70% at 50% -5%, rgba(0,212,170,0.12) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 85% 85%, rgba(245,166,35,0.07) 0%, transparent 50%)',
          }}
        >
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="partner-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#00D4AA" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#partner-grid)" />
            </svg>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="space-y-7 z-10">
                <span className="tag tag-primary">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  B2B Partner Program
                </span>
                <h1 className="hero-headline text-fg">
                  <span className="block">Offer financial</span>
                  <span className="block gradient-text-primary">analysis to clients</span>
                  <span className="block text-fg/70">from one workspace.</span>
                </h1>
                <p className="text-lg text-fg-muted leading-relaxed max-w-xl">
                  Built for DSAs, CAs, and financial advisors who need secure client intake, wallet-backed usage, consumer analysis, commercial analysis, and bulk workflows.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/become-a-partner" className="btn-primary flex items-center gap-2.5 px-7 py-4 text-base">
                    Become a Partner
                    <Icon name="ArrowRightIcon" size={18} variant="solid" />
                  </Link>
                  <a href="mailto:contact@credittrust.in" className="btn-ghost flex items-center gap-2 px-6 py-4 text-base">
                    Talk to Team
                  </a>
                </div>
              </div>

              <div className="glass-card rounded-4xl p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
                <div className="flex items-center justify-between gap-4 mb-8">
                  <div>
                    <p className="text-xs text-fg-subtle uppercase tracking-wider font-bold">Financial Intelligence</p>
                    <h2 className="text-2xl font-bold text-fg mt-2">Professional report view</h2>
                  </div>
                  <span className="tag tag-accent">Partner Grade</span>
                </div>

                <div className="rounded-4xl p-6 mb-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(0,212,170,0.12), rgba(255,255,255,0.035))', border: '1px solid rgba(0,212,170,0.16)' }}>
                  <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #00D4AA, transparent 65%)' }} />
                  <div className="relative flex items-center gap-6">
                    <div className="relative w-32 h-32 shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120" aria-hidden>
                        <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                        <circle cx="60" cy="60" r="48" fill="none" stroke="url(#partner-score)" strokeWidth="10" strokeLinecap="round" strokeDasharray="238 302" />
                        <defs>
                          <linearGradient id="partner-score" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#00D4AA" />
                            <stop offset="100%" stopColor="#F5A623" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-bold gradient-text-primary">742</span>
                        <span className="text-[10px] text-fg-subtle uppercase tracking-wider">Score View</span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-bold text-fg">Credit health summary</p>
                      <p className="text-sm text-fg-muted mt-2 leading-relaxed">
                        Score, repayment behavior, utilization, enquiries, and risk markers organized for client discussions.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-4">
                        <span className="tag tag-primary">Score</span>
                        <span className="tag tag-accent">Risk</span>
                        <span className="tag tag-primary">Insights</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 mb-5">
                  {[
                    { title: 'Repayment', value: 'Stable', icon: 'CheckCircleIcon', tone: 'primary' },
                    { title: 'Utilization', value: 'Moderate', icon: 'ChartBarIcon', tone: 'accent' },
                    { title: 'Risk', value: 'Reviewed', icon: 'ShieldCheckIcon', tone: 'primary' },
                  ].map((item) => (
                    <div key={item.title} className="rounded-3xl p-4" style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="flex flex-col gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{
                            background: item.tone === 'accent' ? 'rgba(245,166,35,0.12)' : 'rgba(0,212,170,0.12)',
                            border: item.tone === 'accent' ? '1px solid rgba(245,166,35,0.22)' : '1px solid rgba(0,212,170,0.22)',
                          }}
                        >
                          <Icon name={item.icon} size={18} className={item.tone === 'accent' ? 'text-accent' : 'text-primary'} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-fg">{item.title}</p>
                          <p className="text-xs text-fg-muted mt-0.5">{item.value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Account summary', width: '82%', tone: 'primary' },
                    { label: 'Payment behavior', width: '68%', tone: 'accent' },
                    { label: 'Improvement actions', width: '76%', tone: 'primary' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.035)' }}>
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <p className="text-sm font-bold text-fg">{item.label}</p>
                        <Icon name="DocumentChartBarIcon" size={16} className={item.tone === 'accent' ? 'text-accent' : 'text-primary'} />
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: item.width,
                            background: item.tone === 'accent' ? 'linear-gradient(90deg, #F5A623, #FFD166)' : 'linear-gradient(90deg, #00D4AA, #7FFFDF)',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <PartnerProgramSection />

        <section id="partner-cta" className="py-24 relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <span className="tag tag-accent mb-5 inline-flex">Ready For B2B</span>
            <h2 className="section-headline text-fg">
              Start serving clients with{' '}
              <span className="font-serif italic gradient-text-accent">structured financial intelligence.</span>
            </h2>
            <p className="text-fg-muted mt-5 max-w-2xl mx-auto leading-relaxed">
              Apply for access, get the partner workspace activated, recharge credits, and start managing client analysis from one dashboard.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 mt-9">
              <Link href="/become-a-partner" className="btn-primary px-8 py-4">
                Become a Partner
              </Link>
              <Link href="/partner-login" className="btn-ghost px-8 py-4">
                Partner Login
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
