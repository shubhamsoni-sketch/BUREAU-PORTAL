'use client';

import React from 'react';
import Footer from '@/components/landing/Footer';
import Header from '@/components/landing/Header';

export type LegalSection = {
  title: string;
  body?: string;
  bullets?: string[];
};

interface LegalPageProps {
  eyebrow: string;
  title: string;
  intro: string;
  updatedAt: string;
  sections: LegalSection[];
}

export default function LegalPage({ eyebrow, title, intro, updatedAt, sections }: LegalPageProps) {
  const goToReport = () => {
    window.location.href = '/get-my-report';
  };

  return (
    <div className="landing-page min-h-screen bg-bg text-fg">
      <div className="grain-overlay" aria-hidden />
      <Header onGetReport={goToReport} />
      <main>
        <section className="relative pt-32 pb-14 overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[720px] h-[420px] bg-primary/10 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-7">
              <span className="text-primary text-xs font-semibold uppercase tracking-widest">{eyebrow}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-fg mb-5">
              {title}
            </h1>
            <p className="text-lg text-fg-muted leading-relaxed max-w-3xl">{intro}</p>
            <p className="mt-6 text-sm text-fg-subtle">Last updated: {updatedAt}</p>
          </div>
        </section>

        <section className="py-14">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 mb-10">
              <p className="text-sm leading-relaxed text-fg-muted">
                This page is written for transparency and customer protection. It does not replace any mandatory notice, consent text, payment gateway term, statutory disclosure, or regulator-prescribed format that may apply to a specific transaction.
              </p>
            </div>

            <div className="space-y-6">
              {sections.map((section, index) => (
                <section key={section.title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">
                  <h2 className="text-xl font-bold text-fg mb-3">
                    {index + 1}. {section.title}
                  </h2>
                  {section.body && (
                    <p className="text-fg-muted leading-relaxed mb-4">{section.body}</p>
                  )}
                  {section.bullets && (
                    <ul className="space-y-2.5">
                      {section.bullets.map((item) => (
                        <li key={item} className="flex gap-3 text-fg-muted leading-relaxed">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.045] p-6">
              <h2 className="text-lg font-bold text-fg mb-2">Contact and Grievance Support</h2>
              <p className="text-fg-muted leading-relaxed">
                For policy questions, consent withdrawal, payment support, refund requests, or misuse reporting, contact us at support@credittrust.in or through the Contact Us page. We may ask for your registered mobile number, payment reference, report request ID, and identity verification before taking action on sensitive account or report requests.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
