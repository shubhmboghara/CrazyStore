import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { getAppBySlug } from '@/lib/appsData';
import { formatDownloadUrl, normalizeAppRecord } from '@/lib/appUtils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug')?.toLowerCase().trim();

    if (!slug) {
      return NextResponse.json({ error: 'App slug is required.' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Fetch live app record from Supabase
    const { data, error } = await supabase
      .from('apps')
      .select('*')
      .ilike('slug', slug)
      .order('id', { ascending: false })
      .limit(1);

    const dbApp = data && data.length > 0 ? data[0] : null;

    let targetApp: any = null;

    if (!error && dbApp) {
      targetApp = normalizeAppRecord(dbApp);
    } else {
      const defaultApp = getAppBySlug(slug);
      if (defaultApp) {
        targetApp = defaultApp;
      }
    }

    if (!targetApp || !targetApp.downloadUrl) {
      return NextResponse.json(
        { error: `No download link found for application: ${slug}` },
        { status: 404 }
      );
    }

    const verifiedDownloadUrl = formatDownloadUrl(targetApp.downloadUrl);

    try {
      await supabase.from('analytics_events').insert({
        event_type: 'app_download',
        app_slug: targetApp.slug,
        app_name: targetApp.name,
        path: `/api/download?slug=${targetApp.slug}`,
        details: `Direct Download Redirect: ${targetApp.name} (${targetApp.version})`,
        is_task_completed: true,
        created_at: new Date().toISOString(),
      });
    } catch (analyticsErr) {
      console.warn('Analytics tracking error during download redirect:', analyticsErr);
    }

    // Redirect directly to the verified download destination
    return NextResponse.redirect(verifiedDownloadUrl, {
      status: 307,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('Download redirect error:', err);
    return NextResponse.json(
      { error: 'Failed to process download link redirect', details: err.message },
      { status: 500 }
    );
  }
}
