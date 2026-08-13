import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { AndroidApp } from '@/lib/appsData';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug')?.toLowerCase();

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: dbApps, error } = await supabase
      .from('apps')
      .select('*')
      .order('createdAt', { ascending: false });

    let customApps: any[] = [];
    if (!error && dbApps) {
      customApps = dbApps.map((data: any) => ({
        ...data,
        isCustom: true,
      }));
    } else {
      console.warn('Supabase apps query fallback or missing table:', error);
    }

    if (slug) {
      const foundApp = customApps.find((a) => a.slug.toLowerCase() === slug);
      if (!foundApp) {
        return NextResponse.json({ error: 'App not found' }, { status: 404 });
      }
      return NextResponse.json({ app: foundApp });
    }

    return NextResponse.json({ apps: customApps });
  } catch (error: any) {
    console.error('Error fetching apps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch apps', details: error.message },
      { status: 500 }
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
    if (!downloadUrl || typeof downloadUrl !== 'string' || !downloadUrl.trim()) {
      return NextResponse.json({ error: 'APK download URL is required.' }, { status: 400 });
    }
    if (!shortDescription || typeof shortDescription !== 'string' || !shortDescription.trim()) {
      return NextResponse.json({ error: 'Short description is required.' }, { status: 400 });
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
      : Array.isArray(fullDescription) ? fullDescription : [shortDescription];

    const screenshotsArray = Array.isArray(screenshots) && screenshots.length > 0 ? screenshots : [
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
    ];

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
      screenshots: screenshotsArray,
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
        { error: error.message || 'An internal error occurred while saving the app to Supabase.', details: error },
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
  } catch (error: any) {
    console.error('Error uploading app:', error);
    return NextResponse.json(
      { error: 'An internal error occurred while saving the app.', details: error.message },
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
        { error: error.message || 'Failed to delete app from Supabase.', details: error },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'App not found in database.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'App deleted successfully.', app: data[0] });
  } catch (error: any) {
    console.error('Error deleting app:', error);
    return NextResponse.json(
      { error: 'Failed to delete app.', details: error.message },
      { status: 500 }
    );
  }
}
