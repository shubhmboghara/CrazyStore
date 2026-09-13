import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Fallback in-memory storage for community app requests
let inMemoryRequests: any[] = [
  {
    id: 'req_seed_1',
    title: 'RetroMusic Player',
    category: 'Entertainment',
    description: 'A material design music player with local lyrics synchronization and custom themes.',
    githubUrl: 'https://github.com/RetroMusicPlayer/RetroMusicPlayer',
    requesterName: 'Alex K.',
    status: 'approved',
    upvotes: 24,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'req_seed_2',
    title: 'Spotube Client',
    category: 'Entertainment',
    description: 'Lightweight Spotify client using YouTube music as backend without telemetry.',
    githubUrl: 'https://github.com/KRTirtho/spotube',
    requesterName: 'Sarah M.',
    status: 'pending',
    upvotes: 18,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'req_seed_3',
    title: 'Seal Video Downloader',
    category: 'Tools & Utilities',
    description: 'Material You video and audio downloader powered by yt-dlp for Android.',
    githubUrl: 'https://github.com/JunkFood02/Seal',
    requesterName: 'DevPioneer',
    status: 'in-review',
    upvotes: 31,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  }
];

export async function GET() {
  try {
    let dbRequests: any[] = [];
    try {
      const cookieStore = await cookies();
      const supabase = createClient(cookieStore);
      const { data, error } = await supabase
        .from('app_requests')
        .select('*')
        .order('createdAt', { ascending: false });

      if (!error && data) {
        dbRequests = data;
      }
    } catch {
      // Supabase table may not exist yet, fallback gracefully
    }

    if (dbRequests.length > 0) {
      return NextResponse.json({ requests: dbRequests });
    }

    return NextResponse.json({ requests: inMemoryRequests });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch requests', requests: inMemoryRequests }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, category, description, githubUrl, apkUrl, requesterName } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const newRequest = {
      id: 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: String(title).trim(),
      category: String(category || 'Tools & Utilities').trim(),
      description: String(description).trim(),
      githubUrl: githubUrl ? String(githubUrl).trim() : undefined,
      apkUrl: apkUrl ? String(apkUrl).trim() : undefined,
      requesterName: requesterName ? String(requesterName).trim() : 'Anonymous',
      status: 'pending',
      upvotes: 1,
      createdAt: new Date().toISOString(),
    };

    try {
      const cookieStore = await cookies();
      const supabase = createClient(cookieStore);
      const { data, error } = await supabase.from('app_requests').insert([newRequest]).select();
      if (!error && data && data.length > 0) {
        return NextResponse.json({ success: true, request: data[0] }, { status: 201 });
      }
    } catch {
      // Fallback to memory
    }

    inMemoryRequests.unshift(newRequest);
    return NextResponse.json({ success: true, request: newRequest }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, upvote } = body;

    if (!id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    // Try Supabase first
    try {
      const cookieStore = await cookies();
      const supabase = createClient(cookieStore);
      if (status) {
        await supabase.from('app_requests').update({ status }).eq('id', id);
      }
    } catch {
      // ignore
    }

    // Update in-memory
    const item = inMemoryRequests.find((r) => r.id === id);
    if (item) {
      if (status) item.status = status;
      if (upvote) item.upvotes = (item.upvotes || 0) + 1;
      return NextResponse.json({ success: true, request: item });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    try {
      const cookieStore = await cookies();
      const supabase = createClient(cookieStore);
      await supabase.from('app_requests').delete().eq('id', id);
    } catch {
      // ignore
    }

    inMemoryRequests = inMemoryRequests.filter((r) => r.id !== id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete request' }, { status: 500 });
  }
}
