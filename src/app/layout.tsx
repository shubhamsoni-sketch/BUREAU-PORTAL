import React from 'react';
import type { Metadata, Viewport } from 'next';
import '../styles/tailwind.css';
import { WalletProvider } from '@/context/WalletContext';
import { CustomerMasterProvider } from '@/context/CustomerMasterContext';
import { AdminProvider } from '@/context/AdminContext';
import { AuthProvider } from '@/context/AuthContext';
import AdminGuard from '@/components/AdminGuard';
import { InvoiceProvider } from '@/context/InvoiceContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from 'sonner';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import MetaPixel from '@/components/MetaPixel';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://credittrust.in'),
  title: 'Credit Trust - Financial Health Analysis Platform',
  description:
    'Credit Trust helps individuals and financial partners generate clear financial health reports with credit score insights, repayment analysis, and wallet-based partner workflows.',
  applicationName: 'Credit Trust',
  authors: [{ name: 'Fin Coopers Tech India Private Limited' }],
  creator: 'Fin Coopers Tech India Private Limited',
  publisher: 'Fin Coopers Tech India Private Limited',
  keywords: [
    'Credit Trust',
    'financial health report',
    'credit score analysis',
    'credit report insights',
    'loan readiness',
    'partner bureau portal',
  ],
  openGraph: {
    type: 'website',
    url: 'https://credittrust.in',
    siteName: 'Credit Trust',
    title: 'Credit Trust - Financial Health Analysis Platform',
    description:
      'Generate clear financial health reports with credit score insights, repayment analysis, and partner workflows.',
    images: [
      {
        url: '/icon-512.png',
        width: 512,
        height: 512,
        alt: 'Credit Trust',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Credit Trust - Financial Health Analysis Platform',
    description:
      'Generate clear financial health reports with credit score insights, repayment analysis, and partner workflows.',
    images: ['/icon-512.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg?v=2', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png?v=2', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico?v=2', type: 'image/x-icon' },
    ],
    apple: [{ url: '/apple-touch-icon.png?v=2', sizes: '180x180', type: 'image/png' }],
  },
  other: {
    'facebook-domain-verification': 'ea72459vl839c0mswzpv0lry3pp7ao',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        <GoogleAnalytics />
        <MetaPixel />
        <ErrorBoundary label="App Root">
          <AuthProvider>
            <AdminGuard>
              <AdminProvider>
                <WalletProvider>
                  <CustomerMasterProvider>
                    <InvoiceProvider>
                      {children}
                      <Toaster richColors position="top-right" />
                    </InvoiceProvider>
                  </CustomerMasterProvider>
                </WalletProvider>
              </AdminProvider>
            </AdminGuard>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
