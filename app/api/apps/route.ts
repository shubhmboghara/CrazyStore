import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { ANDROID_APPS, AndroidApp } from '@/lib/appsData';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug')?.toLowerCase();

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Fetch custom apps from Supabase
    const { data: dbApps, error } = await supabase
      .from('apps')
      .select('*')
      .order('createdAt', { ascending: false });

    let customApps: AndroidApp[] = [];

    if (!error && dbApps) {
      customApps = dbApps.map((data: any) => ({
        slug: data.slug,
        name: data.name || 'Untitled App',
        tagline: data.tagline || '',
        category: data.category || 'Tools',
        version: data.version || 'v1.0.0',
        updatedAt: data.updatedAt || 'Recent',
        size: data.size || '10 MB',
        minAndroid: data.minAndroid || 'Android 8.0+',
        iconBg: data.iconBg || 'from-purple-600 to-indigo-600',
        iconSymbol: data.iconSymbol || 'smartphone',
        badge: data.badge || 'Kotlin + Compose',
        techStack: Array.isArray(data.techStack) ? data.techStack : ['Kotlin', 'Compose'],
        downloadUrl: data.downloadUrl || '#',
        shortDescription: data.shortDescription || '',
        fullDescription: Array.isArray(data.fullDescription)
          ? data.fullDescription
          : [data.shortDescription || ''],
        features: Array.isArray(data.features) ? data.features : [],
        screenshots: Array.isArray(data.screenshots)
          ? data.screenshots
          : [
              {
                id: '1',
                title: 'Main Dashboard',
                subtitle: 'Native Jetpack Compose UI',
                accentColor: 'from-purple-900/40 to-indigo-900/20',
                type: 'feed',
              },
              {
                id: '2',
                title: 'App Features',
                subtitle: 'High performance Android engine',
                accentColor: 'from-indigo-900/40 to-violet-900/20',
                type: 'player',
              },
            ],
        initialRating: Number(data.initialRating) || 5.0,
        initialReviewCount: Number(data.initialReviewCount) || 0,
        isCustom: true,
        logoUrl: data.logoUrl,
        bannerUrl: data.bannerUrl,
      }));
    } else {
      console.warn('Supabase apps query fallback:', error);
    }

    // Merge default apps with custom apps if you want, or just use customApps
    // Based on previous code, the user wanted only custom Supabase apps after the last edit.
    // "Use only custom Supabase apps" -> "Use only custom Supabase apps"
    const allApps = customApps;

    if (slug) {
      const foundApp = allApps.find((a) => a.slug.toLowerCase() === slug);
      if (!foundApp) {
        return NextResponse.json({ error: 'App not found' }, { status: 404 });
      }
      return NextResponse.json({ app: foundApp });
    }

    return NextResponse.json({ apps: allApps });
  } catch (error) {
    console.error('Error fetching apps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch apps', apps: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Server-side admin passcode verification
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

    // Server-side validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'App name is required.' }, { status: 400 });
    }
    if (!downloadUrl || typeof downloadUrl !== 'string' || !downloadUrl.trim()) {
      return NextResponse.json({ error: 'APK download URL is required.' }, { status: 400 });
    }
    if (!shortDescription || typeof shortDescription !== 'string' || !shortDescription.trim()) {
      return NextResponse.json(
        { error: 'Short description is required.' },
        { status: 400 }
      );
    }

    // Generate or clean slug
    const generatedSlug =
      customSlug && typeof customSlug === 'string' && customSlug.trim()
        ? customSlug
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
        : name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-');

    const techStackArray =
      typeof techStack === 'string'
        ? techStack.split(',').map((s: string) => s.trim()).filter(Boolean)
        : Array.isArray(techStack)
        ? techStack
        : ['Kotlin', 'Jetpack Compose'];

    const featuresArray =
      typeof features === 'string'
        ? features.split('\n').map((s: string) => s.trim()).filter(Boolean)
        : Array.isArray(features)
        ? features
        : ['Ad-free experience', 'Native Android UI', 'High performance'];

    const fullDescArray =
      typeof fullDescription === 'string'
        ? fullDescription.split('\n\n').map((s: string) => s.trim()).filter(Boolean)
        : Array.isArray(fullDescription)
        ? fullDescription
        : [shortDescription];

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
      downloadUrl: downloadUrl.trim(),
      shortDescription: shortDescription.trim(),
      fullDescription: fullDescArray,
      features: featuresArray,
      createdAt: new Date().toISOString(),
      initialRating: 5.0,
      initialReviewCount: 0,
      screenshots: Array.isArray(screenshots) && screenshots.length > 0 ? screenshots : [
        {
          id: '1',
          title: `${name.trim()} Dashboard`,
          subtitle: 'Fluid 120Hz Jetpack Compose layout',
          accentColor: 'from-purple-900/40 to-indigo-900/20',
          type: 'feed',
        },
        {
          id: '2',
          title: 'Features & Controls',
          subtitle: 'Optimized Kotlin architecture',
          accentColor: 'from-indigo-900/40 to-violet-900/20',
          type: 'player',
        },
      ],
    };

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from('apps')
      .insert([newAppDoc])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'An internal error occurred while saving the app to Supabase.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'App uploaded successfully',
        app: {
          id: data && data.length > 0 ? data[0].id : generatedSlug,
          ...newAppDoc,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading app:', error);
    return NextResponse.json(
      { error: 'An internal error occurred while saving the app.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  // Server-side admin passcode verification
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
    const slug = searchParams.get('slug')?.toLowerCase();

    if (!slug) {
      return NextResponse.json({ error: 'App slug is required for deletion.' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from('apps')
      .delete()
      .eq('slug', slug)
      .select();

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete app from Supabase.' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'App not found in custom database.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'App deleted successfully.' });
  } catch (error) {
    console.error('Error deleting app:', error);
    return NextResponse.json(
      { error: 'Failed to delete app.' },
      { status: 500 }
    );
  }
}
