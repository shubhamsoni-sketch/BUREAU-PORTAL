import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { isNewCreditTrustWebsite } from '@/lib/credittrust-website-host';
import AboutCreditTrust from '@/app/home/loan-hero-preview/about/page';
import LegacyAbout from './LegacyAbout';

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get('host');
  return isNewCreditTrustWebsite(host) ? {
    title: 'About CreditTrust | Fin Coopers Tech India Private Limited',
    description: 'Learn about CreditTrust, our mission and vision for clearer financial journeys, and our ownership by Fin Coopers Tech India Private Limited.',
  } : {};
}

export default async function AboutPage() {
  const host = (await headers()).get('host');
  return isNewCreditTrustWebsite(host) ? <AboutCreditTrust /> : <LegacyAbout />;
}
