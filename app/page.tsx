import { Metadata } from 'next';
import { HomeClient } from '@/components/HomeClient';
import { ANDROID_APPS, AndroidApp } from '@/lib/appsData';
import { formatDownloadUrl, normalizeAppRecord } from '@/lib/appUtils';
import { createPublicClient } from '@/utils/supabase/server';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'CrazyStore - Verified Open-Source Android Apps',
  description: 'A curated directory of high-performance Android applications built with Kotlin and Jetpack Compose. 100% free and open-source.',
};

export default async function HomePage() {
  let dbApps: any[] = [];
  const initialRatingsMap: Record<string, { avg: number; count: number }> = {};

  try {
    const supabase = createPublicClient();
    const [appsRes, reviewsRes] = await Promise.all([
      supabase.from('apps').select('*').order('createdAt', { ascending: false }),
      supabase.from('reviews').select('appSlug, rating'),
    ]);

    if (!appsRes.error && appsRes.data) {
      dbApps = appsRes.data.map((d: any) => normalizeAppRecord(d));
    }

    if (!reviewsRes.error && reviewsRes.data) {
      const grouped = reviewsRes.data.reduce((acc: any, review: any) => {
        if (!review.appSlug) return acc;
        const slug = review.appSlug.toLowerCase();
        if (!acc[slug]) acc[slug] = { sum: 0, count: 0 };
        acc[slug].sum += review.rating;
        acc[slug].count += 1;
        return acc;
      }, {});

      for (const slug of Object.keys(grouped)) {
        initialRatingsMap[slug] = {
          avg: grouped[slug].sum / grouped[slug].count,
          count: grouped[slug].count,
        };
      }
    }
  } catch (e) {
    console.warn('Supabase client error in Server Component /:', e);
  }

  // Merge default apps with database apps (database overrides static)
  const appsMap = new Map<string, any>();

  // 1. Seed with default apps
  for (const app of ANDROID_APPS) {
    appsMap.set(app.slug.toLowerCase(), normalizeAppRecord({ ...app }));
  }

  // 2. Override or add from DB
  for (const dbApp of dbApps) {
    if (dbApp && dbApp.slug) {
      const key = dbApp.slug.toLowerCase();
      const baseApp = appsMap.get(key) || {};
      appsMap.set(key, {
        ...baseApp,
        ...dbApp,
        downloadUrl: dbApp.downloadUrl ? formatDownloadUrl(dbApp.downloadUrl) : baseApp.downloadUrl,
        isCustom: true,
      });
    }
  }

  const initialApps = Array.from(appsMap.values()) as AndroidApp[];

  // Fill in default ratings for apps without DB reviews
  for (const app of initialApps) {
    const slug = app.slug.toLowerCase();
    if (!initialRatingsMap[slug]) {
      initialRatingsMap[slug] = {
        avg: app.initialRating || 0,
        count: app.initialReviewCount || 0,
      };
    }
  }

  return (
    <HomeClient initialApps={initialApps} initialRatingsMap={initialRatingsMap} />
  );
}
