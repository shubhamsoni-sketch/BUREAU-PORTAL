'use client';

import { useEffect, useMemo, useState } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import {
  bindMetaContactTracking,
  persistMetaAttribution,
  trackMetaEvent,
} from '@/lib/meta-pixel';

const PROTECTED_PREFIXES = [
  '/admin',
  '/partner-dashboard',
  '/partner-invoices',
  '/pull-bureau',
  '/reports-history',
  '/customer-master',
  '/my-wallet',
  '/my-profile',
  '/accounts',
  '/agreement',
  '/crm',
  '/api-console',
  '/api-client-portal',
  '/client',
  '/dataintel',
];

const VIEW_CONTENT_PATHS = new Set(['/sample-report', '/credit-intelligence', '/pricing', '/get-analysis']);

function isPublicMarketingPath(pathname: string) {
  return !PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

type MetaPixelProps = {
  pixelId?: string;
};

export default function MetaPixel({ pixelId = '' }: MetaPixelProps) {
  const pathname = usePathname() || '/';
  const [mounted, setMounted] = useState(false);
  const [clientPathname, setClientPathname] = useState('');
  const [ready, setReady] = useState(false);
  const activePathname = mounted && typeof window !== 'undefined' ? window.location.pathname || clientPathname : '';
  const shouldLoad = Boolean(activePathname) && Boolean(pixelId) && isPublicMarketingPath(activePathname);

  const safePixelId = useMemo(() => pixelId.replace(/[^\w-]/g, ''), [pixelId]);

  useEffect(() => {
    setMounted(true);
    setClientPathname(window.location.pathname || pathname);
  }, [pathname]);

  useEffect(() => {
    if (!shouldLoad) return;
    persistMetaAttribution();
    return bindMetaContactTracking();
  }, [shouldLoad]);

  useEffect(() => {
    if (!ready || !shouldLoad) return;
    trackMetaEvent('PageView', { page_path: activePathname });
    if (VIEW_CONTENT_PATHS.has(activePathname)) {
      trackMetaEvent('ViewContent', {
        content_name: activePathname === '/credit-intelligence' ? 'Credit Intelligence Report' : activePathname === '/sample-report' ? 'Sample Report' : 'Report Detail',
        content_category: 'credit_report',
        page_path: activePathname,
      });
    }
  }, [activePathname, ready, shouldLoad]);

  if (!shouldLoad || !safePixelId) return null;

  return (
    <>
      <Script
        id="meta-pixel-credittrust"
        strategy="afterInteractive"
        onReady={() => setReady(true)}
      >
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${safePixelId}');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${safePixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
