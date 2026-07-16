'use client';
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';

const pipelineStages = [
  { label: 'New Leads', count: 24, color: 'bg-primary', width: 'w-full' },
  { label: 'Eligibility Checked', count: 18, color: 'bg-accent', width: 'w-4/5' },
  { label: 'Lender Selection', count: 12, color: 'bg-blue-500', width: 'w-3/5' },
  { label: 'Files in Process', count: 8, color: 'bg-amber-500', width: 'w-2/5' },
  { label: 'Disbursed MTD', count: 5, color: 'bg-emerald-500', width: 'w-1/4' },
];

const lenderCards = [
  { name: 'HDFC Bank', status: 'Approved', statusColor: 'text-emerald-600 bg-emerald-50', product: 'Home Loan' },
  { name: 'Axis Bank', status: 'Login Pending', statusColor: 'text-amber-600 bg-amber-50', product: 'Personal Loan' },
  { name: 'ICICI Bank', status: 'Disbursed', statusColor: 'text-blue-600 bg-blue-50', product: 'Business Loan' },
];

export default function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = heroRef?.current;
    if (!el) return;
    el?.classList?.add('visible');
  }, []);

  return (
    <section className="relative min-h-screen gradient-hero-bg pt-16 overflow-hidden">
      {/* Subtle bg accent */}
      <div className="absolute top-20 right-0 w-96 h-96 blob-accent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 blob-accent pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-12 lg:pt-24 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">

          {/* LEFT: Copy */}
          <div ref={heroRef} className="lg:col-span-5 flex flex-col gap-6 section-reveal">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 self-start bg-white border border-accent/20 px-3 py-1.5 rounded-full shadow-sm">
              <span className="status-dot-green" />
              <span className="text-xs font-semibold text-accent tracking-wide uppercase">
                DSA CRM Software — India
              </span>
            </div>

            <h1 className="text-hero-xl font-extrabold text-primary leading-tight">
              DSA CRM built for faster loan eligibility, lead tracking, and file movement
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg">
              CreditTrust helps DSAs and loan teams manage leads, check customer fit, route files to suitable lenders, track follow-ups, and monitor business performance from one modern CRM.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold text-base px-7 py-3.5 rounded-lg hover:bg-accent transition-colors duration-200 shadow-card"
              >
                Book Demo
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center justify-center gap-2 bg-white border border-border text-primary font-semibold text-base px-7 py-3.5 rounded-lg hover:border-accent hover:text-accent transition-colors duration-200"
              >
                Explore Features
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4 pt-2 border-t border-border mt-2">
              <div className="flex -space-x-2">
                {['bg-primary', 'bg-accent', 'bg-blue-500', 'bg-amber-500']?.map((c, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full border-2 border-white ${c} flex items-center justify-center text-white text-xs font-bold`}>
                    {['D', 'A', 'L', 'C']?.[i]}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">2,400+ loan agents</p>
                <p className="text-xs text-muted-foreground">managing leads on CreditTrust</p>
              </div>
            </div>
          </div>

          {/* RIGHT: Dashboard Mockup */}
          <div className="lg:col-span-7 relative">
            {/* Main Dashboard Card */}
            <div className="dashboard-card rounded-xl overflow-hidden card-shadow-lg float-animation">
              {/* Dashboard Header */}
              <div className="bg-primary px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                  </div>
                  <span className="text-xs text-white/70 font-medium">CreditTrust CRM — Dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="status-dot-green" />
                  <span className="text-xs text-white/60">Live</span>
                </div>
              </div>

              <div className="p-4 bg-muted/40">
                {/* Top Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Leads Today', value: '24', icon: '👤', trend: '+3', color: 'text-primary' },
                    { label: 'Eligibility Checks', value: '18', icon: '✓', trend: '+5', color: 'text-accent' },
                    { label: 'Lender Matches', value: '12', icon: '🏦', trend: '+2', color: 'text-blue-600' },
                    { label: 'Credit Balance', value: '142', icon: '◈', trend: '', color: 'text-amber-600' },
                  ]?.map((stat) => (
                    <div key={stat?.label} className="dashboard-card p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">{stat?.label}</span>
                        <span className="text-base">{stat?.icon}</span>
                      </div>
                      <div className="flex items-end gap-1">
                        <span className={`text-xl font-extrabold ${stat?.color}`}>{stat?.value}</span>
                        {stat?.trend && <span className="text-xs text-emerald-500 font-semibold mb-0.5">{stat?.trend}</span>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Pipeline */}
                  <div className="dashboard-card p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-foreground">Lead Pipeline</span>
                      <span className="text-xs text-accent font-medium">This Month</span>
                    </div>
                    <div className="space-y-2">
                      {pipelineStages?.map((stage) => (
                        <div key={stage?.label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{stage?.label}</span>
                            <span className="font-semibold text-foreground">{stage?.count}</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full ${stage?.color} ${stage?.width} rounded-full transition-all`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Lender Status */}
                  <div className="dashboard-card p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-foreground">Lender Status</span>
                      <span className="text-xs text-accent font-medium">Active Files</span>
                    </div>
                    <div className="space-y-2">
                      {lenderCards?.map((lender) => (
                        <div key={lender?.name} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                          <div>
                            <p className="text-xs font-semibold text-foreground">{lender?.name}</p>
                            <p className="text-xs text-muted-foreground">{lender?.product}</p>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${lender?.statusColor}`}>
                            {lender?.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Agent Performance Row */}
                <div className="dashboard-card p-3 rounded-lg mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-foreground">Agent Performance — July 2026</span>
                    <span className="text-xs text-muted-foreground">4 agents</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { name: 'Rahul S.', leads: 14, disbursed: 3 },
                      { name: 'Priya M.', leads: 11, disbursed: 4 },
                      { name: 'Amit K.', leads: 9, disbursed: 2 },
                      { name: 'Sunita R.', leads: 8, disbursed: 2 },
                    ]?.map((agent) => (
                      <div key={agent?.name} className="text-center">
                        <div className="w-7 h-7 rounded-full bg-secondary mx-auto mb-1 flex items-center justify-center text-xs font-bold text-primary">
                          {agent?.name?.[0]}
                        </div>
                        <p className="text-xs font-semibold text-foreground truncate">{agent?.name?.split(' ')?.[0]}</p>
                        <p className="text-xs text-muted-foreground">{agent?.leads} leads</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Card: Eligibility Check */}
            <div className="absolute -left-4 lg:-left-8 top-1/3 dashboard-card p-3 rounded-xl shadow-card-lg float-animation-delayed w-44 hidden sm:block">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0EA5A0" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <span className="text-xs font-semibold text-foreground">Eligibility Check</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Profile Fit</span>
                  <span className="font-bold text-accent">High</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: '78%' }} />
                </div>
                <p className="text-xs text-muted-foreground">3 lenders matched</p>
              </div>
            </div>

            {/* Floating Card: New Lead */}
            <div className="absolute -right-4 lg:-right-6 bottom-16 dashboard-card p-3 rounded-xl shadow-card-lg w-40 hidden sm:block" style={{ animation: 'float-card 5s ease-in-out infinite', animationDelay: '0.8s' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="status-dot-green" />
                <span className="text-xs font-semibold text-foreground">New Lead</span>
              </div>
              <p className="text-xs font-bold text-primary">Vikram Nair</p>
              <p className="text-xs text-muted-foreground">Business Loan · ₹25L</p>
              <div className="mt-1.5 text-xs font-medium text-accent">Assign Agent →</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}