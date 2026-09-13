import { Metadata } from 'next';
import { UserHubClient } from '@/components/UserHubClient';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ANDROID_APPS, AndroidApp } from '@/lib/appsData';
import { formatDownloadUrl, normalizeAppRecord } from '@/lib/appUtils';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'User Hub & My Apps - CrazyStore',
  description: 'Manage your downloaded Kotlin applications, personal wishlist, and community app requests.',
};

export default async function UserHubPage() {
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
    console.warn('Supabase client error in UserHubPage:', e);
  }

  // Merge default apps with DB apps
  const appsMap = new Map<string, any>();
  for (const app of ANDROID_APPS) {
    appsMap.set(app.slug.toLowerCase(), normalizeAppRecord({ ...app }));
  }

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

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <UserHubClient initialApps={initialApps} />
      </main>
      <Footer />
    </div>
  );
}
