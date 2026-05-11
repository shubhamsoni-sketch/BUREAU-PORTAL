'use client';

import Link from 'next/link';
import React from 'react';
import Footer from '@/components/landing/Footer';
import PartnerProgramSection from '@/components/landing/PartnerProgramSection';
import Icon from '@/components/ui/AppIcon';

export default function PartnerProgramPage() {
  return (
    <div className="landing-page min-h-screen bg-bg text-fg">
      <div className="grain-overlay" aria-hidden />

      <header className="fixed top-0 inset-x-0 z-50 bg-bg/90 backdrop-blur-xl border-b border-white/5 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Go to homepage">
            <span className="h-9 w-9 rounded-2xl bg-primary text-bg flex items-center justify-center font-bold shadow-glow-sm">
              I
            </span>
            <span className="font-bold text-lg tracking-tight text-fg hidden sm:block">
              Insight<span className="gradient-text-primary">IQ</span>
            </span>
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
                  <Link href="/contact" className="btn-ghost flex items-center gap-2 px-6 py-4 text-base">
                    Talk to Team
                  </Link>
                </div>
              </div>

              <div className="glass-card rounded-4xl p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
                <div className="flex items-center justify-between gap-4 mb-8">
                  <div>
                    <p className="text-xs text-fg-subtle uppercase tracking-wider font-bold">Partner Workspace</p>
                    <h2 className="text-2xl font-bold text-fg mt-2">Client journey preview</h2>
                  </div>
                  <span className="tag tag-accent">Secure Flow</span>
                </div>

                <div className="rounded-3xl p-5 mb-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-fg">New client intake</p>
                      <p className="text-xs text-fg-muted mt-1">Identity details, consent, and analysis type in one controlled flow.</p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(0,212,170,0.12)', border: '1px solid rgba(0,212,170,0.22)' }}>
                      <Icon name="IdentificationIcon" size={21} className="text-primary" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-5">
                    {['Profile', 'Consent', 'Analysis'].map((item, index) => (
                      <div key={item} className="rounded-2xl px-3 py-3 text-center" style={{ background: index === 2 ? 'rgba(0,212,170,0.10)' : 'rgba(255,255,255,0.035)' }}>
                        <p className={index === 2 ? 'text-primary text-xs font-bold' : 'text-fg-muted text-xs font-bold'}>{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 mb-5">
                  {[
                    { title: 'Consumer', desc: 'Individual credit health', icon: 'UserCircleIcon', tone: 'primary' },
                    { title: 'Commercial', desc: 'Business profile checks', icon: 'BuildingOffice2Icon', tone: 'accent' },
                  ].map((item) => (
                    <div key={item.title} className="rounded-3xl p-4" style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="flex items-center gap-3">
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
                          <p className="text-xs text-fg-muted mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  {[
                    { name: 'Rahul Mehta', type: 'Personal loan review', status: 'Ready' },
                    { name: 'Aarav Traders', type: 'Business funding review', status: 'Queued' },
                    { name: 'Priya Shah', type: 'Credit card planning', status: 'Draft' },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center justify-between gap-4 rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.035)' }}>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-fg truncate">{item.name}</p>
                        <p className="text-xs text-fg-muted truncate">{item.type}</p>
                      </div>
                      <span className={item.status === 'Ready' ? 'tag tag-primary shrink-0' : 'tag tag-accent shrink-0'}>{item.status}</span>
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
