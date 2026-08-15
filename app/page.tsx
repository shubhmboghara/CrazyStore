import { Metadata } from 'next';
import { HomeClient } from '@/components/HomeClient';
import { ANDROID_APPS, AndroidApp } from '@/lib/appsData';
import { formatDownloadUrl, normalizeAppRecord } from '@/lib/appUtils';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'CrazyStore - Verified Open-Source Android Apps',
  description: 'A curated directory of high-performance Android applications built with Kotlin and Jetpack Compose. 100% free and open-source.',
};

export default async function HomePage() {
  let dbApps: any[] = [];
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data, error } = await supabase
      .from('apps')
      .select('*')
      .order('createdAt', { ascending: false });

    if (!error && data) {
      dbApps = data.map((d: any) => normalizeAppRecord(d));
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

  // Fetch review summaries for initial apps (optimistic quick load)
  const initialRatingsMap: Record<string, { avg: number; count: number }> = {};
  
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data, error } = await supabase
      .from('reviews')
      .select('appSlug, rating');
      
    if (!error && data) {
      // Calculate averages grouped by appSlug
      const grouped = data.reduce((acc: any, review: any) => {
        if (!review.appSlug) return acc;
        const slug = review.appSlug.toLowerCase();
        if (!acc[slug]) acc[slug] = { sum: 0, count: 0 };
        acc[slug].sum += review.rating;
        acc[slug].count += 1;
        return acc;
      }, {});
      
      for (const app of initialApps) {
        const slug = app.slug.toLowerCase();
        if (grouped[slug]) {
          initialRatingsMap[slug] = {
            avg: grouped[slug].sum / grouped[slug].count,
            count: grouped[slug].count,
          };
        } else {
          initialRatingsMap[slug] = {
            avg: app.initialRating || 0,
            count: app.initialReviewCount || 0,
          };
        }
      }
    }
  } catch (err) {
    console.warn('Could not fetch reviews for Server Component:', err);
  }

  return (
    <HomeClient initialApps={initialApps} initialRatingsMap={initialRatingsMap} />
  );
}
