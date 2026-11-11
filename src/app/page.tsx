import type { Metadata } from 'next';
import { headers } from 'next/headers';
import LandingPage from '@/components/landing/LandingPage';
import { isNewCreditTrustWebsite } from '@/lib/credittrust-website-host';
import LoanHeroPreview from './home/loan-hero-preview/page';

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get('host');
  return isNewCreditTrustWebsite(host) ? {
    title: 'CreditTrust | Credit Report Analysis & Financial Health Insights',
    description: 'Explore personal loan options and financial journeys with CreditTrust, a platform owned and operated by Fin Coopers Tech India Private Limited. Lender approval is not guaranteed.',
  } : {};
}

export default async function RootPage() {
  const host = (await headers()).get('host');
  if (!isNewCreditTrustWebsite(host)) {
    return <LandingPage />;
  }
  return <LoanHeroPreview />;
}
