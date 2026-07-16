import React from 'react';
import Header from '@/components/crm-website/Header';
import Footer from '@/components/crm-website/Footer';
import PricingHero from './components/PricingHero';
import PricingCards from './components/PricingCards';
import PricingFaq from './components/PricingFaq';
import PricingCta from './components/PricingCta';

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <PricingHero />
      <PricingCards />
      <PricingFaq />
      <PricingCta />
      <Footer />
    </main>
  );
}