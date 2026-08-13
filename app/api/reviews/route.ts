import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const appSlug = searchParams.get('appSlug');

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    if (appSlug) {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('appSlug', appSlug.toLowerCase())
        .order('createdAt', { ascending: false });

      if (error) {
        console.error('Supabase fetch reviews error:', error);
        return NextResponse.json({ error: 'Failed to fetch reviews', details: error.message }, { status: 500 });
      }
      return NextResponse.json({ reviews: reviews || [] });
    } else {
      // Fetch ALL reviews (for admin dashboard)
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) {
        console.error('Supabase fetch all reviews error:', error);
        return NextResponse.json({ error: 'Failed to fetch reviews', details: error.message }, { status: 500 });
      }
      return NextResponse.json({ reviews: reviews || [] });
    }
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
    const { reviewId, adminReply } = body;

    if (!reviewId || adminReply === undefined) {
      return NextResponse.json({ error: 'Review ID and adminReply are required.' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from('reviews')
      .update({ adminReply })
      .eq('id', reviewId)
      .select();

    if (error) {
      console.error('Supabase update review error:', error);
      return NextResponse.json(
        { error: 'Failed to update review', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Review updated successfully', review: data ? data[0] : null },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Failed to update review', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Review ID is required.' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase delete review error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to delete review' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Review deleted successfully', deletedReview: data },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Failed to delete review', details: error.message },
      { status: 500 }
    );
  }
}
