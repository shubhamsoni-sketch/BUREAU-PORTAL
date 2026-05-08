import React from 'react';
import type { Metadata, Viewport } from 'next';
import '../styles/tailwind.css';
import { WalletProvider } from '@/context/WalletContext';
import { CustomerMasterProvider } from '@/context/CustomerMasterContext';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'CIBILysis — CIBIL Analysis Platform for DSA Partners',
  description:
    'CIBILysis helps DSA partners and admins pull, analyze, and manage CIBIL credit reports with wallet-based billing and real-time partner oversight.',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        <WalletProvider>
          <CustomerMasterProvider>
            {children}
          </CustomerMasterProvider>
        </WalletProvider>
</body>
    </html>
  );
}