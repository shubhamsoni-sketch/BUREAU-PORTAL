import React from 'react';
import Header from '@/components/crm-website/Header';
import Footer from '@/components/crm-website/Footer';
import FeaturesHero from './components/FeaturesHero';
import EligibilitySection from './components/EligibilitySection';
import LeadFileSection from './components/LeadFileSection';
import LenderWorkflowSection from './components/LenderWorkflowSection';
import TeamManagementSection from './components/TeamManagementSection';
import CreditsAccountingSection from './components/CreditsAccountingSection';
import FeaturesCta from './components/FeaturesCta';
import { featuresMetadata, featuresSchemas, JsonLd } from '../seo';

export const metadata = featuresMetadata;

export default function FeaturesPage() {
  return (
    <>
      <JsonLd data={featuresSchemas} />
      <main className="min-h-screen bg-background">
        <Header />
        <FeaturesHero />
        <EligibilitySection />
        <LeadFileSection />
        <LenderWorkflowSection />
        <TeamManagementSection />
        <CreditsAccountingSection />
        <FeaturesCta />
        <Footer />
      </main>
    </>
  );
}
