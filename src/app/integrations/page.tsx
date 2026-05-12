'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import PublicNav from '../home/components/PublicNav';
import PublicFooter from '../home/components/PublicFooter';
import { ArrowRight, Database, FileText, Building, Globe, Mail } from 'lucide-react';

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setInView(true);
    }, { threshold });
    if (ref?.current) observer?.observe(ref?.current);
    return () => observer?.disconnect();
  }, [threshold]);
  return { ref, inView };
}

const dataSources = [
  {
    icon: Database,
    name: 'Credit Data Provider',
    desc: 'Primary financial data source',
    category: 'Core',
  },
  {
    icon: FileText,
    name: 'Loan Records',
    desc: 'Active and closed loan history',
    category: 'Core',
  },
  {
    icon: Building,
    name: 'Banking Data',
    desc: 'Account and transaction signals',
    category: 'Financial',
  },
  {
    icon: Globe,
    name: 'Public Records',
    desc: 'Legal and compliance data',
    category: 'Compliance',
  },
  {
    icon: Mail,
    name: 'Partner APIs',
    desc: 'DSA and advisor integrations',
    category: 'Partner',
  },
];

export default function IntegrationsPage() {
  const { ref: heroRef, inView: heroInView } = useInView();
  const { ref: sourcesRef, inView: sourcesInView } = useInView();
  const { ref: ctaRef, inView: ctaInView } = useInView();

  return (
    <div className="bg-white min-h-screen">
      <PublicNav />
      {/* HERO */}
      <section className="pt-32 pb-16" ref={heroRef}>
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <div className={`transition-all duration-700 ${heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 mb-8">
              <span className="text-blue-600 text-xs font-medium">Integrations</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
              Connect your data.<br />
              <span className="text-blue-600">Let the intelligence do the rest.</span>
            </h1>
            <p className="text-slate-500 text-xl leading-relaxed">
              Credit Trust connects to the data sources that matter — so you get a complete picture, not a partial one.
            </p>
          </div>
        </div>
      </section>
      {/* DATA SOURCES */}
      <section className="bg-slate-50 border-y border-slate-100 py-20" ref={sourcesRef}>
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className={`mb-12 transition-all duration-700 ${sourcesInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Data Sources &amp; Connections</h2>
            <p className="text-slate-500 text-base">The inputs that power your intelligence report.</p>
          </div>

          <div className="space-y-3">
            {dataSources?.map((source, i) => (
              <div
                key={source?.name}
                className={`flex items-center gap-5 bg-white border border-slate-200 rounded-xl px-6 py-5 hover:border-blue-200 transition-all duration-300 ${sourcesInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                  <source.icon size={18} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-900 font-semibold text-base">{source?.name}</span>
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wide">{source?.category}</span>
                  </div>
                  <p className="text-slate-500 text-sm mt-0.5">{source?.desc}</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" title="Active" />
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* HOW DATA FLOWS */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-10">How data flows through Credit Trust</h2>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-0">
            {[
              { label: 'Data Sources', desc: 'Financial, banking, and partner data' },
              { label: 'Processing Engine', desc: '50+ signals analyzed in real-time' },
              { label: 'Intelligence Report', desc: 'Structured insights, ready to act on' },
            ]?.map((step, i) => (
              <React.Fragment key={i}>
                <div className="flex-1 py-6 md:py-0 md:px-6 first:pl-0 last:pr-0">
                  <p className="text-slate-900 font-semibold text-base mb-1">{step?.label}</p>
                  <p className="text-slate-400 text-sm leading-relaxed">{step?.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:flex items-center flex-shrink-0">
                    <div className="w-10 h-px bg-slate-200" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-0.5" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>
      {/* BOTTOM CTA */}
      <div className="bg-slate-50 border-t border-slate-100" ref={ctaRef}>
        <div className={`max-w-3xl mx-auto px-6 lg:px-8 py-24 text-center transition-all duration-700 ${ctaInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Need a specific integration?</h2>
          <p className="text-slate-500 text-lg mb-10">We&apos;re continuously expanding our data connections. Reach out to discuss your requirements.</p>
          <a
            href="mailto:support@credittrust.in"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-10 py-4 rounded-xl transition-all duration-200 group text-base"
          >
            Contact Us
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
