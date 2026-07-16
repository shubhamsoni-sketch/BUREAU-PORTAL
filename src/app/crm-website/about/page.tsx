import React from 'react';
import Header from '@/components/crm-website/Header';
import Footer from '@/components/crm-website/Footer';
import AboutHero from './components/AboutHero';
import AboutMission from './components/AboutMission';
import TrustSection from './components/TrustSection';
import AboutStats from './components/AboutStats';
import AboutCta from './components/AboutCta';
import { aboutMetadata, aboutSchemas, JsonLd } from '../seo';

export const metadata = aboutMetadata;

export default function AboutPage() {
  return (
    <>
      <JsonLd data={aboutSchemas} />
      <main className="min-h-screen bg-background">
        <Header />
        <AboutHero />
        <AboutStats />
        <AboutMission />
        <TrustSection />
        <AboutCta />
        <Footer />
      </main>
    </>
  );
}
