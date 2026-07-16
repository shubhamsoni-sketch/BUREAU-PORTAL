import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'CreditTrust DSA CRM - Loan Lead & File Management',
  description:
    'CreditTrust DSA CRM helps loan agents, DSAs, and channel partners manage leads, check customer eligibility, route files to lenders, and track team performance from one modern dashboard.',
};

export default function CrmWebsiteLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="crm-marketing min-h-screen bg-background text-foreground">{children}</div>;
}
