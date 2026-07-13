'use client';

import Link from 'next/link';
import Footer from '@/components/landing/Footer';
import Header from '@/components/landing/Header';
import { ArrowRight, BadgeCheck, BarChart3, Building2, FileText, LockKeyhole, ShieldCheck, Workflow } from 'lucide-react';

const focusAreas = [
  {
    icon: ShieldCheck,
    title: 'Secure digital onboarding',
    desc: 'Structured onboarding journeys help individuals and partners move through financial utility workflows with clarity.',
  },
  {
    icon: LockKeyhole,
    title: 'Consent-based workflows',
    desc: 'The platform is designed around authorized access, user consent, and responsible handling of assessment requests.',
  },
  {
    icon: BarChart3,
    title: 'Financial analytics and reporting',
    desc: 'Financial health reports and assessment insights are presented in a more understandable digital format.',
  },
  {
    icon: Workflow,
    title: 'Technology-driven assessment solutions',
    desc: 'Automation, analytics systems, and infrastructure support scalable financial utility services.',
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
              <span className="text-primary text-xs font-semibold uppercase tracking-widest">About Us</span>
            </div>
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
              <div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-fg leading-tight mb-6">
                  Technology-driven financial analytics for a clearer digital ecosystem.
                </h1>
                <p className="text-fg-muted text-lg leading-relaxed">
                  CreditTrust is a technology-driven financial analytics and assessment platform designed to simplify financial insights for individuals and business partners.
                </p>
                <p className="mt-5 text-fg-muted text-lg leading-relaxed">
                  Our platform enables users to securely access consent-based financial assessment workflows, digital onboarding services, and detailed financial health reports through a seamless online experience.
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
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-glow-sm">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                  <Building2 size={22} className="text-primary" />
                </div>
                <h2 className="text-lg font-bold text-fg mb-4">Operated by Fincoopers Tech India Private Limited</h2>
                <p className="text-sm text-fg-muted leading-relaxed mb-5">
                  CreditTrust is operated and managed by Fincoopers Tech India Private Limited, working as a technology and sourcing partner within the financial ecosystem.
                </p>
                <div className="space-y-4">
                  {[
                    ['Technology infrastructure', 'Modern systems for secure digital workflow execution.'],
                    ['Analytics systems', 'Assessment-oriented insights for user and partner journeys.'],
                    ['Workflow automation', 'Operational tools that simplify onboarding, reporting, and utility services.'],
                  ]?.map(([label, desc]) => (
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
              <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Platform Focus</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-fg mb-4">Built for secure, transparent, and technology-enabled financial understanding.</h2>
              <p className="text-fg-muted leading-relaxed">
                Through advanced technology infrastructure, analytics systems, and workflow automation, the platform helps users better understand their financial profile and assessment insights.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {focusAreas?.map((item) => (
                <div key={item?.title} className="rounded-2xl border border-white/10 p-6 bg-white/[0.035]">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                    <item.icon size={18} className="text-primary" />
                  </div>
                  <h3 className="font-bold text-fg mb-2">{item?.title}</h3>
                  <p className="text-sm text-fg-muted leading-relaxed">{item?.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 border-y border-white/5 bg-white/[0.025]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-10 items-start">
              <div>
                <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Our Mission</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-fg mb-5">Bridging technology and financial services.</h2>
                <p className="text-fg-muted leading-relaxed">
                  At CreditTrust, we aim to make financial understanding more accessible, transparent, and technology-enabled through a modern digital platform experience.
                </p>
                <p className="mt-5 text-fg-muted leading-relaxed">
                  Our mission is to bridge technology and financial services by providing scalable, secure, and user-friendly financial utility solutions for the evolving digital ecosystem.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <div className="h-12 w-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-5">
                  <FileText size={22} className="text-accent" />
                </div>
                <h3 className="text-xl font-bold text-fg mb-4">What CreditTrust supports</h3>
                <div className="space-y-3">
                  {[
                    'Partner and customer utility services',
                    'Financial analytics and reporting',
                    'Digital onboarding workflows',
                    'Assessment insight delivery',
                  ]?.map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm text-fg-muted">
                      <BadgeCheck size={17} className="shrink-0 text-primary" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
