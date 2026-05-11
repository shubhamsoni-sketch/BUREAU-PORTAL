'use client';

import React, { useRef } from 'react';
import Footer from './Footer';
import Header from './Header';
import GetReportSection from './GetReportSection';
import HeroSection from './HeroSection';
import HowItWorksSection from './HowItWorksSection';
import PartnerProgramSection from './PartnerProgramSection';
import ReportPreviewSection from './ReportPreviewSection';
import TrustSection from './TrustSection';

export default function LandingPage() {
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToAnalysis = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="landing-page min-h-screen bg-bg text-fg">
      <div className="grain-overlay" aria-hidden />
      <Header onGetReport={scrollToAnalysis} />
      <main>
        <HeroSection lang="en" onGetReport={scrollToAnalysis} />
        <HowItWorksSection lang="en" onGetReport={scrollToAnalysis} />
        <ReportPreviewSection lang="en" />
        <TrustSection lang="en" />
        <PartnerProgramSection />
        <GetReportSection formRef={formRef} />
      </main>
      <Footer />
    </div>
  );
}
