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
  title: 'Credit Trust - Financial Health Analysis Platform',
  description:
    'Credit Trust helps individuals and financial partners generate clear financial health reports with credit score insights, repayment analysis, and wallet-based partner workflows.',
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                var KEY = 'bureau-portal-root-chunk-reload-attempted';
                function isChunkFailure(value) {
                  var text = '';
                  try {
                    text = String(value && (value.message || value.reason && value.reason.message || value.filename || value.target && value.target.src) || value || '');
                  } catch (e) {}
                  return text.indexOf('ChunkLoadError') !== -1 ||
                    text.indexOf('Loading chunk') !== -1 ||
                    text.indexOf('/_next/static/chunks/') !== -1;
                }
                function recover(event) {
                  if (!isChunkFailure(event && (event.error || event.reason || event))) return;
                  try {
                    if (window.sessionStorage.getItem(KEY) === '1') return;
                    window.sessionStorage.setItem(KEY, '1');
                  } catch (e) {}
                  var url = new URL(window.location.href);
                  url.searchParams.set('_reload', String(Date.now()));
                  window.location.replace(url.toString());
                }
                window.addEventListener('error', recover, true);
                window.addEventListener('unhandledrejection', recover, true);
              })();
            `,
          }}
        />
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
