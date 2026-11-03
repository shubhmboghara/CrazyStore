import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { ANDROID_APPS, AndroidApp } from '@/lib/appsData';
import { formatDownloadUrl, normalizeAppRecord } from '@/lib/appUtils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Resilient memory cache (serves as zero-crash fallback if Supabase project is paused or offline)
const inMemoryAppsStore = new Map<string, any>();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug')?.toLowerCase();

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
      } else if (error) {
        console.warn('Supabase query warning in GET /api/apps:', error.message);
      }
    } catch (e: any) {
      console.warn('Supabase client error in GET /api/apps (project may be paused):', e.message);
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

    // 3. Merge in-memory updates (fallback if Supabase was paused during an edit)
    for (const [key, memApp] of inMemoryAppsStore.entries()) {
      const baseApp = appsMap.get(key) || {};
      appsMap.set(key, {
        ...baseApp,
        ...memApp,
        downloadUrl: memApp.downloadUrl ? formatDownloadUrl(memApp.downloadUrl) : baseApp.downloadUrl,
        isCustom: true,
      });
    }

    const allApps = Array.from(appsMap.values());

    if (slug) {
      const foundApp = allApps.find((a) => a.slug.toLowerCase() === slug);
      if (!foundApp) {
        return NextResponse.json(
          { error: 'Application not found' },
          {
            status: 404,
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            },
          }
        );
      }
      return NextResponse.json(
        { app: foundApp },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        }
      );
    }

    return NextResponse.json(
      { apps: allApps },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching apps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch apps', details: error.message },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  }
}

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get('x-admin-key');
  const expectedPasscode = process.env.ADMIN_PASSCODE || 'Kf$W8Dx0UaSf0shubham@93';

  if (!expectedPasscode) {
    return NextResponse.json({ error: 'Server configuration error: ADMIN_PASSCODE not set.' }, { status: 500 });
  }

  if (!adminKey || adminKey !== expectedPasscode) {
    return NextResponse.json({ error: 'Unauthorized: Invalid admin key' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      name,
      slug: customSlug,
      tagline,
      category,
      version,
      size,
      minAndroid,
      downloadUrl,
      shortDescription,
      fullDescription,
      features,
      techStack,
      iconBg,
      iconSymbol,
      badge,
      logoUrl,
      bannerUrl,
      githubUrl,
      screenshots,
    } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'App name is required.' }, { status: 400 });
    }

    const generatedSlug =
      customSlug && typeof customSlug === 'string' && customSlug.trim()
        ? customSlug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
        : name.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');

    const techStackArray = typeof techStack === 'string'
      ? techStack.split(',').map((s: string) => s.trim()).filter(Boolean)
      : Array.isArray(techStack) ? techStack : ['Kotlin', 'Jetpack Compose'];

    const featuresArray = typeof features === 'string'
      ? features.split('\n').map((s: string) => s.trim()).filter(Boolean)
      : Array.isArray(features) ? features : ['Ad-free experience', 'Native Android UI', 'High performance'];

    const fullDescArray = typeof fullDescription === 'string'
      ? fullDescription.split('\n\n').map((s: string) => s.trim()).filter(Boolean)
      : Array.isArray(fullDescription) ? fullDescription : (shortDescription ? [shortDescription] : []);

    const screenshotsArray = Array.isArray(screenshots) && screenshots.length > 0 ? screenshots : [];

    const newAppDoc = {
      slug: generatedSlug,
      name: name.trim(),
      tagline: tagline ? tagline.trim() : 'Native Kotlin & Compose Android App',
      category: category || 'Tools & Utilities',
      version: version || 'v1.0.0',
      updatedAt: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      size: size || '15 MB',
      minAndroid: minAndroid || 'Android 8.0 (API 26)+',
      iconBg: iconBg || 'from-purple-600 to-indigo-600',
      iconSymbol: iconSymbol || 'smartphone',
      badge: badge || 'Kotlin + Compose',
      logoUrl: logoUrl || '',
      bannerUrl: bannerUrl || '',
      githubUrl: githubUrl || '',
      techStack: techStackArray,
      downloadUrl: formatDownloadUrl(downloadUrl),
      shortDescription: shortDescription ? shortDescription.trim() : '',
      fullDescription: fullDescArray,
      features: featuresArray,
      createdAt: new Date().toISOString(),
      initialRating: 5.0,
      initialReviewCount: 0,
      screenshots: screenshotsArray,
    };

    let savedApp: any = null;
    let supabaseError: string | null = null;

    try {
      const cookieStore = await cookies();
      const supabase = createClient(cookieStore);
      const { data, error } = await supabase
        .from('apps')
        .upsert([newAppDoc], { onConflict: 'slug' })
        .select();

      if (!error && data && data.length > 0) {
        savedApp = normalizeAppRecord(data[0]);
      } else if (error) {
        supabaseError = error.message;
      }
    } catch (err: any) {
      console.warn('Supabase offline or unreachable in POST /api/apps:', err.message);
      supabaseError = err.message;
    }

    // Always cache in memory as fallback so write operation never crashes
    const fallbackApp = normalizeAppRecord(newAppDoc);
    inMemoryAppsStore.set(generatedSlug.toLowerCase(), fallbackApp);
    try { revalidatePath('/', 'layout'); revalidatePath(`/apps/${generatedSlug.toLowerCase()}`, 'page'); } catch (_) {}
    if (!savedApp) {
      savedApp = fallbackApp;
    }

    return NextResponse.json(
      {
        message: supabaseError
          ? `App created in memory! (Note: Supabase project is unreachable: ${supabaseError}. Please unpause your Supabase database in the Supabase Dashboard to sync cloud storage)`
          : 'App uploaded successfully',
        app: savedApp,
        supabaseStatus: supabaseError ? 'offline' : 'connected',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error uploading app:', error);
    return NextResponse.json(
      { error: 'An internal error occurred while saving the app.', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const adminKey = req.headers.get('x-admin-key');
  const expectedPasscode = process.env.ADMIN_PASSCODE || 'Kf$W8Dx0UaSf0shubham@93';

  if (!expectedPasscode) {
    return NextResponse.json({ error: 'Server configuration error: ADMIN_PASSCODE not set.' }, { status: 500 });
  }

  if (!adminKey || adminKey !== expectedPasscode) {
    return NextResponse.json({ error: 'Unauthorized: Invalid admin key' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      originalSlug,
      name,
      slug: customSlug,
      tagline,
      category,
      version,
      size,
      minAndroid,
      downloadUrl,
      shortDescription,
      fullDescription,
      features,
      techStack,
      iconBg,
      iconSymbol,
      badge,
      logoUrl,
      bannerUrl,
      githubUrl,
      screenshots,
    } = body;

    if (!originalSlug) {
      return NextResponse.json({ error: 'originalSlug is required to identify the app to edit.' }, { status: 400 });
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'App name is required.' }, { status: 400 });
    }

    const generatedSlug =
      customSlug && typeof customSlug === 'string' && customSlug.trim()
        ? customSlug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
        : name.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');

    const techStackArray = typeof techStack === 'string'
      ? techStack.split(',').map((s: string) => s.trim()).filter(Boolean)
      : Array.isArray(techStack) ? techStack : [];

    const featuresArray = typeof features === 'string'
      ? features.split('\n').map((s: string) => s.trim()).filter(Boolean)
      : Array.isArray(features) ? features : [];

    const fullDescArray = typeof fullDescription === 'string'
      ? fullDescription.split('\n\n').map((s: string) => s.trim()).filter(Boolean)
      : Array.isArray(fullDescription) ? fullDescription : (shortDescription ? [shortDescription] : []);

    const updatedAppDoc: any = {
      slug: generatedSlug,
      name: name.trim(),
      tagline: tagline ? tagline.trim() : '',
      category: category || 'Tools & Utilities',
      version: version || 'v1.0.0',
      updatedAt: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      size: size || '15 MB',
      minAndroid: minAndroid || 'Android 8.0 (API 26)+',
      iconBg: iconBg || 'from-purple-600 to-indigo-600',
      iconSymbol: iconSymbol || 'smartphone',
      badge: badge || 'Kotlin + Compose',
      logoUrl: logoUrl || '',
      bannerUrl: bannerUrl || '',
      githubUrl: githubUrl || '',
      techStack: techStackArray,
      downloadUrl: formatDownloadUrl(downloadUrl),
      shortDescription: shortDescription ? shortDescription.trim() : '',
      fullDescription: fullDescArray,
      features: featuresArray,
    };
    
    if (screenshots && Array.isArray(screenshots)) {
      updatedAppDoc.screenshots = screenshots;
    }

    let savedApp: any = null;
    let supabaseError: string | null = null;

    try {
      const cookieStore = await cookies();
      const supabase = createClient(cookieStore);

      const { data: recordsByOriginal } = await supabase
        .from('apps')
        .select('*')
        .ilike('slug', originalSlug.toLowerCase().trim());

      let existingApp = recordsByOriginal && recordsByOriginal.length > 0 ? recordsByOriginal[0] : null;

      if (!existingApp && generatedSlug && generatedSlug !== originalSlug) {
        const { data: recordsByGen } = await supabase
          .from('apps')
          .select('*')
          .ilike('slug', generatedSlug.toLowerCase().trim());
        if (recordsByGen && recordsByGen.length > 0) {
          existingApp = recordsByGen[0];
        }
      }

      if (existingApp) {
        const updateQuery = existingApp.id
          ? supabase.from('apps').update(updatedAppDoc).eq('id', existingApp.id)
          : supabase.from('apps').update(updatedAppDoc).eq('slug', existingApp.slug);

        const { data, error } = await updateQuery.select();
        if (!error && data && data.length > 0) {
          savedApp = normalizeAppRecord(data[0]);
        } else if (error) {
          supabaseError = error.message;
        }
      } else {
        const defaultApp = ANDROID_APPS.find(
          (a) =>
            a.slug.toLowerCase() === originalSlug.toLowerCase() ||
            a.slug.toLowerCase() === generatedSlug.toLowerCase()
        );

        const insertDoc = {
          ...(defaultApp ? normalizeAppRecord(defaultApp) : {}),
          ...updatedAppDoc,
          createdAt: new Date().toISOString(),
          initialRating: defaultApp?.initialRating || 5.0,
          initialReviewCount: defaultApp?.initialReviewCount || 0,
        };

        const { data, error } = await supabase
          .from('apps')
          .upsert([insertDoc], { onConflict: 'slug' })
          .select();

        if (!error && data && data.length > 0) {
          savedApp = normalizeAppRecord(data[0]);
        } else if (error) {
          supabaseError = error.message;
        }
      }
    } catch (err: any) {
      console.warn('Supabase offline or unreachable in PUT /api/apps:', err.message);
      supabaseError = err.message;
    }

    // Always update in memory cache fallback so admin edits succeed seamlessly
    const fallbackApp = normalizeAppRecord(updatedAppDoc);
    inMemoryAppsStore.set(generatedSlug.toLowerCase(), fallbackApp);
    try { revalidatePath('/', 'layout'); revalidatePath(`/apps/${generatedSlug.toLowerCase()}`, 'page'); if (originalSlug !== generatedSlug) { revalidatePath(`/apps/${originalSlug.toLowerCase()}`, 'page'); } } catch (_) {}
    if (originalSlug.toLowerCase() !== generatedSlug.toLowerCase()) {
      inMemoryAppsStore.delete(originalSlug.toLowerCase());
    }

    if (!savedApp) {
      savedApp = fallbackApp;
    }

    return NextResponse.json(
      {
        message: supabaseError
          ? `App updated in local memory! (Note: Supabase project is unreachable: ${supabaseError}. Please unpause your Supabase database in the Supabase Dashboard to sync cloud storage)`
          : 'App updated successfully',
        app: savedApp,
        supabaseStatus: supabaseError ? 'offline' : 'connected',
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('Error updating app:', error);
    return NextResponse.json(
      { error: 'An internal error occurred while updating the app.', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const adminKey = req.headers.get('x-admin-key');
  const expectedPasscode = process.env.ADMIN_PASSCODE || 'Kf$W8Dx0UaSf0shubham@93';

  if (!expectedPasscode) {
    return NextResponse.json({ error: 'Server configuration error: ADMIN_PASSCODE not set.' }, { status: 500 });
  }

  if (!adminKey || adminKey !== expectedPasscode) {
    return NextResponse.json({ error: 'Unauthorized: Invalid admin key' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter is required.' }, { status: 400 });
    }

    try {
      const cookieStore = await cookies();
      const supabase = createClient(cookieStore);
      await supabase
        .from('apps')
        .delete()
        .ilike('slug', slug.toLowerCase().trim());
    } catch (err: any) {
      console.warn('Supabase offline in DELETE /api/apps:', err.message);
    }

    inMemoryAppsStore.delete(slug.toLowerCase().trim());

    return NextResponse.json(
      { message: 'App deleted successfully' },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('Error deleting app:', error);
    return NextResponse.json(
      { error: 'An internal error occurred while deleting the app.', details: error.message },
      { status: 500 }
    );
  }
}
