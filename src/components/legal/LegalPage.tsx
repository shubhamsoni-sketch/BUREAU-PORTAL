import React from 'react';
import PublicNav from '@/app/home/components/PublicNav';
import PublicFooter from '@/app/home/components/PublicFooter';

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
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />
      <main>
        <section className="pt-32 pb-12 border-b border-slate-200 bg-slate-50">
          <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-3">{eyebrow}</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-950 tracking-tight mb-5">{title}</h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-3xl">{intro}</p>
            <p className="mt-6 text-sm text-slate-500">Last updated: {updatedAt}</p>
          </div>
        </section>

        <section className="py-14">
          <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 mb-10">
              <p className="text-sm leading-relaxed text-amber-900">
                This page is written for transparency and customer protection. It does not replace any mandatory notice, consent text, payment gateway term, statutory disclosure, or regulator-prescribed format that may apply to a specific transaction.
              </p>
            </div>

            <div className="space-y-10">
              {sections.map((section, index) => (
                <section key={section.title} className="border-b border-slate-100 pb-8 last:border-b-0">
                  <h2 className="text-xl font-bold text-slate-900 mb-3">
                    {index + 1}. {section.title}
                  </h2>
                  {section.body && (
                    <p className="text-slate-600 leading-relaxed mb-4">{section.body}</p>
                  )}
                  {section.bullets && (
                    <ul className="space-y-2.5">
                      {section.bullets.map((item) => (
                        <li key={item} className="flex gap-3 text-slate-600 leading-relaxed">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>

            <div className="mt-12 rounded-xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-2">Contact and Grievance Support</h2>
              <p className="text-slate-600 leading-relaxed">
                For policy questions, consent withdrawal, payment support, refund requests, or misuse reporting, contact us at support@insightcredit.in or through the Contact Us page. We may ask for your registered mobile number, payment reference, report request ID, and identity verification before taking action on sensitive account or report requests.
              </p>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
