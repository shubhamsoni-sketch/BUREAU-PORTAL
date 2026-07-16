import type { MetadataRoute } from 'next';

const baseUrl = 'https://credittrust.in';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${baseUrl}/`, priority: 1.0, changeFrequency: 'weekly' },
    { url: `${baseUrl}/features`, priority: 0.8, changeFrequency: 'monthly' },
    { url: `${baseUrl}/pricing`, priority: 0.8, changeFrequency: 'monthly' },
    { url: `${baseUrl}/eligibility-checker`, priority: 0.8, changeFrequency: 'monthly' },
    { url: `${baseUrl}/about`, priority: 0.5, changeFrequency: 'monthly' },
    { url: `${baseUrl}/contact`, priority: 0.8, changeFrequency: 'monthly' },
  ];
}
