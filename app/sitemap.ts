import { MetadataRoute } from 'next';
import { ANDROID_APPS } from '@/lib/appsData';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://crazy-store-rho.vercel.app').replace(/\/$/, '');
  const currentDate = new Date().toISOString();

  // Base routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ];

  // Dynamic app routes
  const appRoutes: MetadataRoute.Sitemap = ANDROID_APPS.map((app) => ({
    url: `${baseUrl}/apps/${app.slug}`,
    lastModified: currentDate,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  return [...staticRoutes, ...appRoutes];
}
