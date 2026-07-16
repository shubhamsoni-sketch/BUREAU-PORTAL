import React from 'react';
import Header from '@/components/crm-website/Header';
import Footer from '@/components/crm-website/Footer';
import HeroSection from './components/HeroSection';
import TrustStrip from './components/TrustStrip';
import ProblemSection from './components/ProblemSection';
import SolutionSection from './components/SolutionSection';
import FeaturesBento from './components/FeaturesBento';
import CtaBand from './components/CtaBand';
import { homeMetadata, homeSchemas, JsonLd } from './seo';

export const metadata = homeMetadata;

export default function HomePage() {
  return (
    <>
      <JsonLd data={homeSchemas} />
      <main className="min-h-screen bg-background">
        <Header />
        <HeroSection />
        <TrustStrip />
        <ProblemSection />
        <SolutionSection />
        <FeaturesBento />
        <CtaBand />
        <Footer />
      </main>
    </>
  );
}
