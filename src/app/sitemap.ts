import type { MetadataRoute } from 'next';
import { BRAND } from '@/lib/brand';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${BRAND.siteUrl}/`,
      changeFrequency: 'daily',
      priority: 1,
      lastModified: new Date(),
    },
    {
      url: `${BRAND.siteUrl}/brand`,
      changeFrequency: 'monthly',
      priority: 0.6,
      lastModified: new Date(),
    },
  ];
}
