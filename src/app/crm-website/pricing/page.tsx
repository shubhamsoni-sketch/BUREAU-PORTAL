import React from 'react';
import Header from '@/components/crm-website/Header';
import Footer from '@/components/crm-website/Footer';
import PricingHero from './components/PricingHero';
import PricingCards from './components/PricingCards';
import PricingFaq from './components/PricingFaq';
import PricingCta from './components/PricingCta';
import { JsonLd, pricingMetadata, pricingSchemas } from '../seo';

export const metadata = pricingMetadata;

export default function PricingPage() {
  return (
    <>
      <JsonLd data={pricingSchemas} />
      <main className="min-h-screen bg-background">
        <Header />
        <PricingHero />
        <PricingCards />
        <PricingFaq />
        <PricingCta />
        <Footer />
      </main>
    </>
  );
}
