import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/_next/',
        '/admin/',
        '/crm/',
        '/partner-login',
        '/partner-dashboard',
        '/home/credittrust-preview',
        '/credit-intelligence',
      ],
    },
    sitemap: 'https://credittrust.in/sitemap.xml',
  };
}
