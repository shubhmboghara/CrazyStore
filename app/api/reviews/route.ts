import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const appSlug = searchParams.get('appSlug')?.toLowerCase() || 'videohub';

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: dbReviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('appSlug', appSlug)
      .order('createdAt', { ascending: false });

    let customReviews: Array<{ id: string; appSlug: string; rating: number; name: string; reviewText: string; createdAt: string }> = [];

    if (!error && dbReviews) {
      customReviews = dbReviews.map((data: any) => {
        return {
          id: data.id?.toString() || Math.random().toString(),
          appSlug: data.appSlug || appSlug,
          rating: Number(data.rating) || 5,
          name: data.name || 'Anonymous',
          reviewText: data.reviewText || '',
          createdAt: data.createdAt || new Date().toISOString(),
        };
      });
    } else {
      console.warn('Supabase reviews query error:', error);
    }

    const totalCount = customReviews.length;
    const averageRating =
      totalCount > 0
        ? customReviews.reduce((sum, r) => sum + r.rating, 0) / totalCount
        : 0;

    return NextResponse.json({
      reviews: customReviews,
      totalCount,
      averageRating: Number(averageRating.toFixed(1)),
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews', reviews: [], totalCount: 0, averageRating: 0 },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { appSlug, rating, name, reviewText } = body;

    // Server-side validation
    if (!appSlug || typeof appSlug !== 'string') {
      return NextResponse.json({ error: 'App slug is required.' }, { status: 400 });
    }
    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json(
        { error: 'Rating must be a number between 1 and 5.' },
        { status: 400 }
      );
    }
    if (!reviewText || typeof reviewText !== 'string' || reviewText.trim().length < 10) {
      return NextResponse.json(
        { error: 'Review text must be at least 10 characters long.' },
        { status: 400 }
      );
    }

    const trimmedName = name && typeof name === 'string' && name.trim() ? name.trim() : 'Anonymous';
    const trimmedText = reviewText.trim();

    // Client IP detection for rate limiting
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Rate Limiting Check
    const { data: recentDocs, error: rateLimitErr } = await supabase
      .from('reviews')
      .select('createdAt')
      .eq('appSlug', appSlug.toLowerCase())
      .eq('ip', clientIp)
      .gte('createdAt', twentyFourHoursAgo);

    if (rateLimitErr) {
      console.warn('Rate limit query warning (proceeding):', rateLimitErr);
    }

    if (recentDocs && recentDocs.length > 0) {
      return NextResponse.json(
        {
          error:
            'Rate limit exceeded. You have already submitted a review for this app in the last 24 hours.',
        },
        { status: 429 }
      );
    }

    // Save to Supabase table "reviews"
    const newDocData = {
      appSlug: appSlug.toLowerCase(),
      rating: numericRating,
      name: trimmedName,
      reviewText: trimmedText,
      createdAt: new Date().toISOString(),
      ip: clientIp,
    };

    const { data, error } = await supabase
      .from('reviews')
      .insert([newDocData])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'An internal error occurred while saving your review to Supabase.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Review published successfully',
        review: {
          id: data && data.length > 0 ? data[0].id : Math.random().toString(),
          ...newDocData,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error posting review:', error);
    return NextResponse.json(
      { error: 'An internal error occurred while saving your review.' },
      { status: 500 }
    );
  }
}
