import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  metadataBase: new URL('https://credittrust.in'),
  title: {
    default: 'CreditTrust DSA CRM - Loan Lead & File Management',
    template: '%s',
  },
  description:
    'CreditTrust DSA CRM helps loan agents, DSAs, and channel partners manage leads, check customer eligibility, route files to lenders, and track team performance from one modern dashboard.',
  openGraph: {
    title: 'CreditTrust DSA CRM',
    description: 'Loan lead management, eligibility checking, and file routing for DSAs',
    url: 'https://credittrust.in',
    siteName: 'CreditTrust',
    type: 'website',
    images: [
      {
        url: '/assets/images/app_logo.png',
        width: 1200,
        height: 630,
        alt: 'CreditTrust DSA CRM Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CreditTrust DSA CRM',
    description: 'Loan lead management, eligibility checking, and file routing for DSAs',
    images: ['/assets/images/app_logo.png'],
  },
};

export default function CrmWebsiteLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="crm-marketing min-h-screen bg-background text-foreground">{children}</div>;
}
