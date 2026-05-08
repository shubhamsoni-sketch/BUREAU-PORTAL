'use client';
import { useState } from 'react';
import Link from 'next/link';
import '../styles.css';
import DataIntelNav from '../components/DataIntelNav';
import DataIntelFooter from '../components/DataIntelFooter';

const engines = [
  {
    id: 'fintech',
    color: '#06B6D4',
    name: 'Fintech Processing Engine',
    subtitle: 'Lead profiling, segmentation, and lender routing',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#06B6D4" width={20} height={20}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Zm.75-12h9v9h-9v-9Z" />
      </svg>
    ),
    rows: [
      { action: 'Financial profile analysis', unit: 'per record', price: '\u20b92' },
      { action: 'Lead segmentation run', unit: 'per 1,000 records', price: '\u20b915' },
      { action: 'Lender routing', unit: 'per routed lead', price: '\u20b95' },
      { action: 'WhatsApp campaign trigger', unit: 'per message sent', price: '\u20b90.30' },
    ],
    demo: 'First 100 records free in demo mode',
  },
  {
    id: 'bigdata',
    color: '#7C3AED',
    name: 'Big Data Analysis Engine',
    badge: 'Offline',
    subtitle: 'Offline processing — runs on your machine',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#7C3AED" width={20} height={20}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Zm-3 6h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Z" />
      </svg>
    ),
    rows: [
      { action: 'Record analysis & segmentation', unit: 'per 1,000 records', price: '\u20b90.50' },
      { action: 'Deep filter run', unit: 'per dataset', price: '\u20b925' },
      { action: 'Export structured output', unit: 'per export', price: '\u20b910' },
    ],
    demo: 'Up to 10,000 records free in demo mode',
  },
  {
    id: 'whatsapp',
    color: '#22C55E',
    name: 'WhatsApp Intelligence Engine',
    subtitle: 'Verify WA activity before campaigns run',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#22C55E" width={20} height={20}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
    rows: [
      { action: 'WhatsApp presence check', unit: 'per number', price: '\u20b90.10' },
      { action: 'Bulk verification batch', unit: 'per 10,000 numbers', price: '\u20b9800' },
      { action: 'Campaign send (verified)', unit: 'per message', price: '\u20b90.25' },
    ],
    demo: 'First 500 numbers free in demo mode',
  },
  {
    id: 'marketing',
    color: '#F59E0B',
    name: 'Data & Marketing Engine',
    subtitle: 'Location-targeted datasets and campaign execution',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#F59E0B" width={20} height={20}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>
    ),
    rows: [
      { action: 'Location dataset access', unit: 'per 1,000 contacts', price: '\u20b95' },
      { action: 'Profession filter', unit: 'per segment', price: '\u20b920' },
      { action: 'Campaign execution', unit: 'per 1,000 sends', price: '\u20b9250' },
    ],
    demo: 'Sample datasets available in demo mode',
  },
  {
    id: 'credit',
    color: '#818CF8',
    name: 'Credit Intelligence',
    subtitle: 'Detailed financial profile analysis',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#818CF8" width={20} height={20}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
    rows: [
      { action: 'Full credit profile report', unit: 'per report', price: '\u20b915' },
      { action: 'Income & obligation analysis', unit: 'per profile', price: '\u20b910' },
      { action: 'Batch profile analysis', unit: 'per 10 profiles', price: '\u20b9120' },
    ],
    demo: '3 sample reports free in demo mode',
  },
];

const faqs = [
  {
    q: 'Do credits expire?',
    a: 'No. Wallet credits never expire. Load them whenever you need to and use them at your own pace.',
  },
  {
    q: 'Can I try the engines before adding credits?',
    a: 'Yes. All five engines are available in demo mode immediately after account creation. No credits required to explore.',
  },
  {
    q: 'Is there a minimum top-up amount?',
    a: 'The minimum top-up is \u20b9100. You can add any custom amount above that.',
  },
  {
    q: 'How does the Big Data Engine work offline?',
    a: 'The Big Data Analysis Engine runs as a local process on your machine. Your data is never uploaded to any server. The analysis happens entirely on your hardware.',
  },
  {
    q: 'What does "per record" mean for credit deduction?',
    a: 'Each row in your uploaded file counts as one record. The exact credit cost is shown before you run any analysis, so there are no surprises.',
  },
  {
    q: 'Can multiple people use the same account?',
    a: 'Currently, accounts are single-user. Enterprise accounts with team access are available on request.',
  },
  {
    q: 'Is there a refund policy for credits?',
    a: 'Credits are non-refundable once added. However, since credits never expire, you can use them at any time.',
  },
  {
    q: 'What data formats are supported?',
    a: 'CSV and Excel (.xlsx) are supported for all engines. The Fintech Processing Engine also accepts JSON and pipe-delimited formats.',
  },
];

export default function PricingPage() {
  const [openEngine, setOpenEngine] = useState<string>('fintech');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="di-root di-scrollbar">
      <DataIntelNav />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 di-data-grid-bg opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(6,182,212,0.08) 0%, transparent 70%)' }} />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8" style={{ borderColor: 'rgba(6,182,212,0.2)', background: 'rgba(6,182,212,0.05)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#06b6d4" width={16} height={16}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
            </svg>
            <span className="text-xs font-semibold text-[#06b6d4] uppercase tracking-wide">Wallet-Based Access</span>
          </div>
          <h1 className="di-font-display di-display-xl font-semibold text-[#f1f5f9] mb-6">
            Pay for what you use.<br />
            <span className="di-font-display italic di-text-gradient">Not what you don&apos;t.</span>
          </h1>
          <p className="text-xl text-[#94a3b8] max-w-2xl mx-auto mb-10 leading-relaxed">
            No monthly subscriptions. No seat licenses. Load wallet credits and spend them across any of the five engines — only when you need them.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dataintel/sign-up-login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-sm bg-[#06b6d4] text-[#080b14] hover:bg-[#22d3ee] transition-all"
              style={{ boxShadow: '0 0 20px rgba(6,182,212,0.3)' }}
            >
              Create free account
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={16} height={16}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/dataintel/dashboard"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-sm border text-[#94a3b8] hover:text-[#f1f5f9] transition-all"
              style={{ borderColor: '#334155' }}
            >
              Try demo first
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#64748b] block mb-3">How it works</span>
            <h2 className="di-font-display di-display-md font-semibold text-[#f1f5f9]">The wallet model — simple by design.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { num: '01', icon: 'user', title: 'Create your account', desc: 'Sign up in under 60 seconds. Demo mode is available immediately — no credits needed.' },
              { num: '02', icon: 'wallet', title: 'Add wallet credits', desc: 'Choose a top-up amount. Credits are added instantly. No expiry, no lock-in.' },
              { num: '03', icon: 'bolt', title: 'Run any engine', desc: 'Select an engine, upload your data, and run. Credits are deducted per record or per report — shown upfront before you run.' },
              { num: '04', icon: 'download', title: 'Get structured output', desc: 'Download results, export segments, or trigger campaigns directly from the engine output.' },
            ].map((step) => (
              <div key={step.num} className="p-6 rounded-2xl border" style={{ borderColor: '#1e293b', background: 'rgba(15,23,42,0.5)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
                    <StepIcon icon={step.icon} />
                  </div>
                  <span className="text-xs font-bold di-font-mono text-[#06b6d4]">{step.num}</span>
                </div>
                <h3 className="di-font-display text-lg font-semibold text-[#f1f5f9] mb-2">{step.title}</h3>
                <p className="text-sm text-[#64748b] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: 'clock', title: 'No expiry', desc: 'Credits never expire. Use them at your pace.' },
              { icon: 'eye', title: 'Cost shown upfront', desc: 'Exact credit cost displayed before every run.' },
              { icon: 'play', title: 'Demo always free', desc: 'All engines available in demo mode. No credits needed.' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 p-4 rounded-xl border" style={{ borderColor: '#1e293b', background: 'rgba(15,23,42,0.3)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(6,182,212,0.1)' }}>
                  <FeatureIcon icon={item.icon} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#f1f5f9] mb-0.5">{item.title}</div>
                  <div className="text-xs text-[#64748b]">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Per-use rates */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="mb-10">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#64748b] block mb-3">Per-use rates</span>
            <h2 className="di-font-display di-display-md font-semibold text-[#f1f5f9] mb-3">Exact cost. Every action. No surprises.</h2>
            <p className="text-[#94a3b8]">All prices shown in INR (₹). Cost is displayed before every run. You approve before credits are deducted.</p>
          </div>

          <div className="space-y-2">
            {engines.map((engine) => (
              <div key={engine.id} className="rounded-2xl border overflow-hidden" style={{ borderColor: openEngine === engine.id ? `${engine.color}40` : '#1e293b' }}>
                <button
                  className="w-full flex items-center justify-between p-5 text-left transition-all"
                  style={{ background: openEngine === engine.id ? `${engine.color}08` : 'rgba(15,23,42,0.5)' }}
                  onClick={() => setOpenEngine(openEngine === engine.id ? '' : engine.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${engine.color}15`, border: `1px solid ${engine.color}30` }}>
                      {engine.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#f1f5f9]">{engine.name}</span>
                        {engine.badge && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: `${engine.color}20`, color: engine.color, border: `1px solid ${engine.color}40` }}>{engine.badge}</span>
                        )}
                      </div>
                      <div className="text-sm text-[#64748b]">{engine.subtitle}</div>
                    </div>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#64748b" width={20} height={20}
                    style={{ transform: openEngine === engine.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {openEngine === engine.id && (
                  <div className="px-5 pb-5" style={{ background: `${engine.color}05` }}>
                    <div className="rounded-xl overflow-hidden border" style={{ borderColor: `${engine.color}20` }}>
                      <div className="grid grid-cols-2 gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#64748b]" style={{ background: 'rgba(15,23,42,0.5)' }}>
                        <span>Action</span>
                        <span className="text-right">Rate</span>
                      </div>
                      {engine.rows.map((row) => (
                        <div key={row.action} className="grid grid-cols-2 gap-4 px-4 py-3 border-t" style={{ borderColor: `${engine.color}15` }}>
                          <div>
                            <div className="text-sm text-[#f1f5f9]">{row.action}</div>
                            <div className="text-xs text-[#64748b]">{row.unit}</div>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold di-font-mono" style={{ color: engine.color }}>{row.price}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-xs text-[#64748b]">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#06b6d4" width={14} height={14}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                      </svg>
                      {engine.demo}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 text-sm text-[#64748b]">
            Volume pricing available for enterprise accounts.{' '}
            <a href="mailto:enterprise@dataintel.in" className="text-[#06b6d4] hover:text-[#22d3ee] transition-colors">Contact us</a>
          </div>
        </div>
      </section>

      {/* Wallet top-up */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#64748b] block mb-3">Wallet top-up</span>
            <h2 className="di-font-display di-display-md font-semibold text-[#f1f5f9]">Load once. Use across all engines.</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { name: 'Starter', price: '\u20b9500', bonus: null, desc: 'Perfect for exploring all engines', total: '\u20b9500', examples: ['250 financial profiles','or 5,000 WA verifications','or 1L record analysis'], popular: false },
              { name: 'Professional', price: '\u20b92,000', bonus: '+\u20b9200 bonus credits', desc: 'Most popular for active users', total: '\u20b92,200', examples: ['1,100 financial profiles','or 22,000 WA verifications','or 4.4L record analysis'], popular: true },
              { name: 'Business', price: '\u20b95,000', bonus: '+\u20b9750 bonus credits', desc: 'For teams running regular campaigns', total: '\u20b95,750', examples: ['2,875 financial profiles','or 57,500 WA verifications','or 11.5L record analysis'], popular: false },
              { name: 'Enterprise', price: '\u20b915,000', bonus: '+\u20b93,000 bonus credits', desc: 'High-volume fintech and enterprise use', total: '\u20b918,000', examples: ['9,000 financial profiles','or 1.8L WA verifications','or 36L record analysis'], popular: false },
            ].map((plan) => (
              <div
                key={plan.name}
                className="relative rounded-2xl border p-6 flex flex-col"
                style={{
                  borderColor: plan.popular ? 'rgba(6,182,212,0.4)' : '#1e293b',
                  background: plan.popular ? 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(124,58,237,0.05))' : 'rgba(15,23,42,0.5)',
                }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold" style={{ background: '#06b6d4', color: '#080b14' }}>Most popular</div>
                )}
                <div className="mb-4">
                  <div className="text-sm font-semibold text-[#94a3b8] mb-1">{plan.name}</div>
                  <div className="di-font-display text-3xl font-bold text-[#f1f5f9]">{plan.price}</div>
                  {plan.bonus && <div className="text-xs text-[#06b6d4] mt-1">{plan.bonus}</div>}
                  <div className="text-xs text-[#64748b] mt-1">{plan.desc}</div>
                </div>
                <div className="p-3 rounded-xl mb-4" style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.1)' }}>
                  <div className="text-lg font-bold di-font-mono text-[#06b6d4]">{plan.total}</div>
                  <div className="text-xs text-[#64748b]">total credits</div>
                </div>
                <ul className="space-y-1.5 mb-6 flex-1">
                  {plan.examples.map((ex) => (
                    <li key={ex} className="flex items-center gap-2 text-xs text-[#94a3b8]">
                      <span className="w-1 h-1 rounded-full bg-[#06b6d4] shrink-0" />
                      {ex}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/dataintel/sign-up-login"
                  className="block text-center py-3 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    background: plan.popular ? '#06b6d4' : 'rgba(6,182,212,0.1)',
                    color: plan.popular ? '#080b14' : '#06b6d4',
                    border: plan.popular ? 'none' : '1px solid rgba(6,182,212,0.2)',
                  }}
                >
                  {plan.popular ? 'Get started' : 'Add credits'}
                </Link>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between p-5 rounded-2xl border" style={{ borderColor: '#1e293b', background: 'rgba(15,23,42,0.3)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.1)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#06b6d4" width={20} height={20}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-[#f1f5f9]">Custom top-up amount</div>
                <div className="text-xs text-[#64748b]">Add any amount above ₹100. Credits added instantly.</div>
              </div>
            </div>
            <Link
              href="/dataintel/sign-up-login"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-[#06b6d4] border transition-all hover:bg-[rgba(6,182,212,0.1)]"
              style={{ borderColor: 'rgba(6,182,212,0.3)' }}
            >
              Custom amount
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="mb-10">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#64748b] block mb-3">FAQ</span>
            <h2 className="di-font-display di-display-md font-semibold text-[#f1f5f9]">Common questions.</h2>
          </div>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border overflow-hidden" style={{ borderColor: '#1e293b' }}>
                <button
                  className="w-full flex items-center justify-between p-5 text-left"
                  style={{ background: openFaq === i ? 'rgba(6,182,212,0.05)' : 'rgba(15,23,42,0.5)' }}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium text-[#f1f5f9]">{faq.q}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#64748b" width={18} height={18}
                    style={{ transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s', flexShrink: 0 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-[#94a3b8] leading-relaxed" style={{ background: 'rgba(6,182,212,0.03)' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="di-font-display di-display-md font-semibold text-[#f1f5f9] mb-4">
            The system is ready.{' '}
            <span className="di-text-gradient">Are you?</span>
          </h2>
          <p className="text-[#94a3b8] text-lg mb-10">Create your account in under 60 seconds. Demo mode is free. Credits are optional until you&apos;re ready.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link
              href="/dataintel/sign-up-login"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full font-semibold text-sm bg-[#06b6d4] text-[#080b14] hover:bg-[#22d3ee] transition-all"
              style={{ boxShadow: '0 0 20px rgba(6,182,212,0.3)' }}
            >
              Start for free
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={16} height={16}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/dataintel/homepage#capabilities"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full font-semibold text-sm border text-[#94a3b8] hover:text-[#f1f5f9] transition-all"
              style={{ borderColor: '#334155' }}
            >
              Explore capabilities
            </Link>
          </div>
          <p className="text-xs text-[#64748b]">No credit card required · Demo mode always free · Cancel anytime</p>
        </div>
      </section>

      <DataIntelFooter />
    </div>
  );
}

function StepIcon({ icon }: { icon: string }) {
  const color = '#06b6d4';
  if (icon === 'user') return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={18} height={18}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
  if (icon === 'wallet') return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={18} height={18}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
    </svg>
  );
  if (icon === 'bolt') return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={18} height={18}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
    </svg>
  );
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={18} height={18}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}

function FeatureIcon({ icon }: { icon: string }) {
  const color = '#06b6d4';
  if (icon === 'clock') return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={16} height={16}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
  if (icon === 'eye') return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={16} height={16}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={16} height={16}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
    </svg>
  );
}
