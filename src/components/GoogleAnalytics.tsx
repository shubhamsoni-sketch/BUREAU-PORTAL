'use client';

import Script from 'next/script';

const envMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const primaryMeasurementId =
  !envMeasurementId || envMeasurementId === 'enter-your-value-here'
    ? 'G-QY5W5KEKCB'
    : envMeasurementId;
const fallbackMeasurementId = 'G-N5EQ7QV5JS';
const GA_MEASUREMENT_IDS = Array.from(
  new Set([primaryMeasurementId, fallbackMeasurementId].filter(Boolean))
);

export default function GoogleAnalytics() {
  if (!GA_MEASUREMENT_IDS.length) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_IDS[0]}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          ${GA_MEASUREMENT_IDS.map((id) => `gtag('config', '${id}');`).join('\n          ')}
        `}
      </Script>
    </>
  );
}
