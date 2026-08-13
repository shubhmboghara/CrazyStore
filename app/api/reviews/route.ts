import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const appSlug = searchParams.get('appSlug');

    if (!appSlug) {
      return NextResponse.json({ error: 'appSlug is required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('appSlug', appSlug.toLowerCase())
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Supabase fetch reviews error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reviews', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ reviews: reviews || [] });
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { appSlug, rating, name, reviewText } = body;

    if (!appSlug || !rating || !reviewText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from('reviews')
      .insert([
        {
          appSlug: appSlug.toLowerCase(),
          rating,
          name: name || 'Anonymous',
          reviewText,
          ip,
          createdAt: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('Supabase submit review error:', error);
      return NextResponse.json(
        { error: 'Failed to submit review', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Review submitted successfully', review: data ? data[0] : null },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { error: 'Failed to submit review', details: error.message },
      { status: 500 }
    );
  }
}
