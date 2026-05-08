'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import PublicNav from '../home/components/PublicNav';
import PublicFooter from '../home/components/PublicFooter';
import { ArrowRight, Shield, Target, Eye, Heart } from 'lucide-react';

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

const values = [
  { icon: Shield, title: 'Trust & Security', desc: 'We treat your financial data with the highest level of care. Bank-grade encryption and strict privacy standards are non-negotiable.' },
  { icon: Eye, title: 'Transparency', desc: 'No hidden fees, no complex jargon. We believe financial intelligence should be clear and accessible to everyone.' },
  { icon: Target, title: 'Precision', desc: 'Our analytics are built on rigorous data science. Every insight we provide is backed by comprehensive data analysis.' },
  { icon: Heart, title: 'Empowerment', desc: 'We believe everyone deserves to understand their financial health. Our mission is to democratize credit intelligence.' },
];

const team = [
  { name: 'Arjun Mehta', role: 'Chief Executive Officer', initials: 'AM', color: 'bg-blue-600' },
  { name: 'Priya Sharma', role: 'Chief Technology Officer', initials: 'PS', color: 'bg-indigo-600' },
  { name: 'Vikram Nair', role: 'Head of Data Science', initials: 'VN', color: 'bg-purple-600' },
  { name: 'Ananya Gupta', role: 'Head of Partnerships', initials: 'AG', color: 'bg-cyan-600' },
];

export default function AboutPage() {
  const { ref: missionRef, inView: missionInView } = useInView();
  const { ref: valuesRef, inView: valuesInView } = useInView();
  const { ref: teamRef, inView: teamInView } = useInView();
  const { ref: ctaRef, inView: ctaInView } = useInView();

  return (
    <div className="bg-white min-h-screen">
      <PublicNav />
      {/* HERO */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 mb-8">
            <span className="text-blue-600 text-xs font-medium">About Insight</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
            Redefining Credit<br />
            <span className="text-blue-600">Intelligence</span>
          </h1>
          <p className="text-slate-500 text-xl leading-relaxed max-w-2xl mx-auto">
            We&apos;re on a mission to make credit intelligence accessible, transparent, and actionable for every individual and financial professional in India.
          </p>
        </div>
      </section>
      {/* MISSION */}
      <section className="bg-slate-50 border-y border-slate-100 py-20" ref={missionRef}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className={`transition-all duration-700 ${missionInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
              <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-3">Our Mission</p>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">
                Making Financial Data Work for You
              </h2>
              <p className="text-slate-500 text-lg leading-relaxed mb-6">
                Credit data has always been complex, opaque, and difficult to understand. We built Insight to change that — to transform raw credit data into clear, actionable intelligence that empowers better financial decisions.
              </p>
              <p className="text-slate-500 text-lg leading-relaxed">
                Whether you&apos;re an individual trying to understand your financial health, or a financial professional serving hundreds of clients — Insight gives you the clarity and tools you need.
              </p>
            </div>
            <div className={`transition-all duration-700 delay-200 ${missionInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { val: '2023', label: 'Founded' },
                  { val: '10K+', label: 'Reports Generated' },
                  { val: '500+', label: 'Partners' },
                  { val: '50+', label: 'Cities' },
                ]?.map((stat) => (
                  <div key={stat?.label} className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
                    <div className="text-3xl font-bold text-slate-900 mb-1">{stat?.val}</div>
                    <div className="text-slate-500 text-sm">{stat?.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* VALUES */}
      <section className="py-20" ref={valuesRef}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className={`text-center mb-14 transition-all duration-700 ${valuesInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Our Core Values</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {values?.map((val, i) => (
              <div
                key={val?.title}
                className={`bg-white border border-slate-200 rounded-2xl p-6 hover:border-blue-200 hover:shadow-sm transition-all duration-300 ${valuesInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
                  <val.icon size={18} className="text-blue-600" />
                </div>
                <h3 className="text-slate-900 font-semibold text-base mb-2">{val?.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{val?.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* TEAM */}
      <section className="bg-slate-50 border-y border-slate-100 py-20" ref={teamRef}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className={`text-center mb-14 transition-all duration-700 ${teamInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Meet Our Leadership</h2>
            <p className="text-slate-500 text-base max-w-xl mx-auto">
              A team of fintech veterans, data scientists, and product builders passionate about financial intelligence.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {team?.map((member, i) => (
              <div
                key={member?.name}
                className={`bg-white border border-slate-200 rounded-2xl p-6 text-center hover:border-blue-200 hover:shadow-sm transition-all duration-300 ${teamInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className={`w-14 h-14 rounded-2xl ${member?.color} flex items-center justify-center mx-auto mb-4`}>
                  <span className="text-white font-bold text-lg">{member?.initials}</span>
                </div>
                <h3 className="text-slate-900 font-semibold text-base mb-1">{member?.name}</h3>
                <p className="text-slate-500 text-sm">{member?.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* CTA */}
      <section className="py-24" ref={ctaRef}>
        <div className={`max-w-3xl mx-auto px-6 lg:px-8 text-center transition-all duration-700 ${ctaInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-4xl font-bold text-slate-900 mb-5">Want to work with us?</h2>
          <p className="text-slate-500 text-lg mb-10">
            Whether you&apos;re an individual or a financial professional, we&apos;d love to have you on board.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/get-analysis"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 group"
            >
              Get Analysis
              <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold px-8 py-3.5 rounded-xl transition-all duration-200"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
