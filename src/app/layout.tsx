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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Credit Trust - Financial Health Analysis Platform',
  description:
    'Credit Trust helps individuals and financial partners generate clear financial health reports with credit score insights, repayment analysis, and wallet-based partner workflows.',
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
