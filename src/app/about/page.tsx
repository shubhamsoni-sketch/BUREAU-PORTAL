'use client';

import Link from 'next/link';
import Footer from '@/components/landing/Footer';
import Header from '@/components/landing/Header';
import { ArrowRight, BadgeCheck, FileCheck2, LockKeyhole, ShieldCheck } from 'lucide-react';

const principles = [
  {
    icon: ShieldCheck,
    title: 'Consent-first reporting',
    desc: 'Every customer report workflow is designed around identity details, mobile verification, explicit consent, and auditable processing records.',
  },
  {
    icon: LockKeyhole,
    title: 'Sensitive-data protection',
    desc: 'PAN, payment data, customer details, report responses, and partner records are handled with strict access controls and operational safeguards.',
  },
  {
    icon: FileCheck2,
    title: 'Clear records and accountability',
    desc: 'Admin workflows maintain report, payment, wallet, invoice, agreement, and support records so every action can be reconciled.',
  },
  {
    icon: BadgeCheck,
    title: 'Responsible partner access',
    desc: 'Partner tools are built for approved business use with agreements, wallet controls, report history, and compliance-oriented restrictions.',
  },
];

export default function AboutPage() {
  const goToReport = () => {
    window.location.href = '/get-my-report';
  };

  return (
    <div className="landing-page min-h-screen bg-bg text-fg">
      <div className="grain-overlay" aria-hidden />
      <Header onGetReport={goToReport} />
      <main>
        <section className="relative pt-32 pb-20 overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[760px] h-[460px] bg-primary/10 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-8">
              <span className="text-primary text-xs font-semibold uppercase tracking-widest">About InsightIQ</span>
            </div>
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
              <div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-fg leading-tight mb-6">
                  Financial health reports with consent, clarity, and control.
                </h1>
                <p className="text-fg-muted text-lg leading-relaxed">
                  InsightIQ is a digital financial health report platform for individuals and approved partners. Our purpose is to help users understand their financial profile through structured report workflows while keeping consent, privacy, payment transparency, and misuse prevention at the center of the product.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Link href="/get-my-report" className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl">
                    Get My Financial Report
                    <ArrowRight size={17} />
                  </Link>
                  <Link href="/partner-program" className="btn-ghost inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl">
                    Partner Program
                  </Link>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <h2 className="text-lg font-bold text-fg mb-4">What we operate</h2>
                <div className="space-y-4">
                  {[
                    ['Individuals', 'Mobile-verified, consent-based financial health report journey.'],
                    ['Partners', 'Wallet, invoice, agreement, and report workflow tools for approved businesses.'],
                    ['Admin controls', 'Customer master, B2C reports, payment records, partner status, and compliance records.'],
                    ['Support', 'Refund, payment, consent, and misuse review processes.'],
                  ].map(([label, desc]) => (
                    <div key={label} className="border-b border-white/10 pb-4 last:border-b-0 last:pb-0">
                      <p className="font-semibold text-fg">{label}</p>
                      <p className="text-sm text-fg-muted mt-1">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mb-12">
              <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Our Operating Principles</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-fg mb-4">Built to reduce misuse, not just process reports.</h2>
              <p className="text-fg-muted leading-relaxed">
                Financial profile data is sensitive. Our platform is designed so report requests, payments, partner usage, and admin access are traceable and governed by clear policies.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {principles.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 p-6 bg-white/[0.035]">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                    <item.icon size={18} className="text-primary" />
                  </div>
                  <h3 className="font-bold text-fg mb-2">{item.title}</h3>
                  <p className="text-sm text-fg-muted leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 border-y border-white/5 bg-white/[0.025]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-10 items-start">
              <div>
                <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Compliance Posture</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-fg mb-5">Clear policies for customers, partners, and payment review.</h2>
                <p className="text-fg-muted leading-relaxed">
                  We maintain visible policies for privacy, refund and cancellation, acceptable use, and platform terms. These policies are written to protect genuine users and prevent unauthorized report access, payment abuse, and sensitive-data misuse.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  ['Privacy Policy', '/privacy-policy'],
                  ['Refund Policy', '/refund-policy'],
                  ['Usage Policy', '/usage-policy'],
                  ['Terms And Conditions', '/terms-and-conditions'],
                ].map(([label, href]) => (
                  <Link key={href} href={href} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-fg hover:bg-white/[0.07] transition-colors">
                    <span className="font-semibold">{label}</span>
                    <ArrowRight size={15} className="mt-3 text-primary" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
