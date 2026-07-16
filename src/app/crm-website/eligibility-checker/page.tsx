import React from 'react';
import Header from '@/components/crm-website/Header';
import Footer from '@/components/crm-website/Footer';
import EligibilityHero from './components/EligibilityHero';
import HowItWorks from './components/HowItWorks';
import CreditsSystem from './components/CreditsSystem';
import EligibilityBenefits from './components/EligibilityBenefits';
import EligibilityCta from './components/EligibilityCta';
import { eligibilityMetadata, eligibilitySchemas, JsonLd } from '../seo';

export const metadata = eligibilityMetadata;

export default function EligibilityCheckerPage() {
  return (
    <>
      <JsonLd data={eligibilitySchemas} />
      <main className="min-h-screen bg-background">
        <Header />
        <EligibilityHero />
        <HowItWorks />
        <CreditsSystem />
        <EligibilityBenefits />
        <EligibilityCta />
        <Footer />
      </main>
    </>
  );
}
