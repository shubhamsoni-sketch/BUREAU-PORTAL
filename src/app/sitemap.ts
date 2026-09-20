import type { MetadataRoute } from 'next';

const baseUrl = 'https://credittrust.in';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${baseUrl}/`, priority: 1.0, changeFrequency: 'weekly' },
    { url: `${baseUrl}/features`, priority: 0.8, changeFrequency: 'monthly' },
    { url: `${baseUrl}/partner-program`, priority: 0.8, changeFrequency: 'monthly' },
    { url: `${baseUrl}/become-a-partner`, priority: 0.7, changeFrequency: 'monthly' },
    { url: `${baseUrl}/get-my-report`, priority: 0.7, changeFrequency: 'monthly' },
    { url: `${baseUrl}/sample-report`, priority: 0.6, changeFrequency: 'monthly' },
    { url: `${baseUrl}/about`, priority: 0.5, changeFrequency: 'monthly' },
    { url: `${baseUrl}/privacy-policy`, priority: 0.3, changeFrequency: 'yearly' },
    { url: `${baseUrl}/refund-policy`, priority: 0.3, changeFrequency: 'yearly' },
    { url: `${baseUrl}/terms-and-conditions`, priority: 0.3, changeFrequency: 'yearly' },
    { url: `${baseUrl}/usage-policy`, priority: 0.3, changeFrequency: 'yearly' },
  ];
}
