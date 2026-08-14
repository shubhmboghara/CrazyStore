import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

// Server-side rolling storage fallback in case Supabase table isn't created yet
// Global in-memory analytics store for persistence across API requests
declare global {
  var __analyticsStore: {
    events: any[];
    visitors: Map<string, any>;
    sessions: Map<string, any>;
  } | undefined;
}

if (!global.__analyticsStore) {
  global.__analyticsStore = {
    events: [],
    visitors: new Map(),
    sessions: new Map(),
  };
}

// Country code to Flag emoji helper
function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode === 'XX' || countryCode === 'LOCAL') return '🌐';
  const code = countryCode.toUpperCase();
  const codePoints = code
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// IP Geolocation cache to prevent rate limits
const geoCache = new Map<string, { country: string; countryCode: string; city: string; region: string; flag: string }>();

async function getGeoLocation(ip: string, headers: Headers) {
  // Check Cloudflare / CDN headers first
  const cfCountry = headers.get('cf-ipcountry');
  const vercelCountry = headers.get('x-vercel-ip-country');
  const gcpCountry = headers.get('x-appengine-country');
  const countryHeader = cfCountry || vercelCountry || gcpCountry;

  if (countryHeader && countryHeader.length === 2 && countryHeader !== 'XX') {
    const code = countryHeader.toUpperCase();
    return {
      countryCode: code,
      country: getCountryName(code),
      city: headers.get('x-vercel-ip-city') || headers.get('cf-ipcity') || 'Local City',
      region: headers.get('x-vercel-ip-country-region') || '',
      flag: getCountryFlag(code),
    };
  }

  // Clean IP
  const cleanIp = ip.split(',')[0].trim();
  if (!cleanIp || cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp.startsWith('192.168.') || cleanIp.startsWith('10.')) {
    return {
      countryCode: 'US',
      country: 'United States',
      city: 'Silicon Valley',
      region: 'California',
      flag: '🇺🇸',
    };
  }

  if (geoCache.has(cleanIp)) {
    return geoCache.get(cleanIp)!;
  }

  // Fast fetch with timeout to avoid blocking
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const res = await fetch(`https://ipapi.co/${cleanIp}/json/`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const geo = {
        countryCode: data.country_code || 'US',
        country: data.country_name || 'United States',
        city: data.city || 'Unknown City',
        region: data.region || '',
        flag: getCountryFlag(data.country_code || 'US'),
      };
      geoCache.set(cleanIp, geo);
      return geo;
    }
  } catch {
    // Fallback on timeout or lookup failure
  }

  const fallback = {
    countryCode: 'US',
    country: 'United States',
    city: 'Direct Visitor',
    region: '',
    flag: '🇺🇸',
  };
  geoCache.set(cleanIp, fallback);
  return fallback;
}

function getCountryName(code: string): string {
  const names: Record<string, string> = {
    US: 'United States',
    IN: 'India',
    GB: 'United Kingdom',
    DE: 'Germany',
    CA: 'Canada',
    AU: 'Australia',
    FR: 'France',
    BR: 'Brazil',
    JP: 'Japan',
    SG: 'Singapore',
    NL: 'Netherlands',
    ES: 'Spain',
    IT: 'Italy',
    KR: 'South Korea',
    ID: 'Indonesia',
    AE: 'United Arab Emirates',
  };
  return names[code] || code;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      visitorId = 'anonymous',
      sessionId = 'session_' + Date.now(),
      eventType = 'page_view',
      path = '/',
      appSlug = null,
      appName = null,
      details = '',
      metadata = {},
      durationSeconds = 0,
      isTaskCompleted = false,
      device = 'Desktop',
      os = 'Unknown',
      browser = 'Unknown',
      screenResolution = '1920x1080',
      language = 'en',
      referrer = '',
    } = body;

    // Detect IP
    const forwardedFor = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
    
    // Mask IP for privacy (e.g. 192.168.xxx.xxx)
    const ipParts = ip.split('.');
    const maskedIp = ipParts.length === 4 ? `${ipParts[0]}.${ipParts[1]}.*.*` : 'masked';

    // Get Geo Location
    const geo = await getGeoLocation(ip, req.headers);

    const now = new Date();
    const eventRecord = {
      id: 'ev_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36),
      visitorId,
      sessionId,
      eventType,
      path,
      appSlug,
      appName,
      details: details || generateDefaultDetails(eventType, path, appName),
      metadata,
      durationSeconds: Number(durationSeconds) || 0,
      isTaskCompleted: Boolean(isTaskCompleted),
      device,
      os,
      browser,
      screenResolution,
      language,
      referrer,
      country: geo.country,
      countryCode: geo.countryCode,
      city: geo.city,
      region: geo.region,
      flag: geo.flag,
      ip: maskedIp,
      createdAt: now.toISOString(),
      timestamp: now.getTime(),
      hour: now.getHours(),
      dayOfWeek: now.getDay(),
      dateStr: now.toISOString().split('T')[0],
    };

    // 1. Update Global in-memory store
    const store = global.__analyticsStore!;
    store.events.unshift(eventRecord);
    if (store.events.length > 5000) {
      store.events.pop(); // Keep latest 5000 events
    }

    // Update Session
    const existingSession = store.sessions.get(sessionId) || {
      sessionId,
      visitorId,
      country: geo.country,
      city: geo.city,
      flag: geo.flag,
      device,
      os,
      browser,
      firstSeen: now.toISOString(),
      lastSeen: now.toISOString(),
      pageViews: 0,
      eventsCount: 0,
      hasCompletedTask: false,
      paths: [],
      appsExplored: [],
    };

    existingSession.lastSeen = now.toISOString();
    existingSession.eventsCount += 1;
    if (eventType === 'page_view') {
      existingSession.pageViews += 1;
      if (!existingSession.paths.includes(path)) existingSession.paths.push(path);
    }
    if (appSlug && !existingSession.appsExplored.includes(appSlug)) {
      existingSession.appsExplored.push(appSlug);
    }
    if (isTaskCompleted) {
      existingSession.hasCompletedTask = true;
    }
    store.sessions.set(sessionId, existingSession);

    // Update Visitor
    const existingVisitor = store.visitors.get(visitorId) || {
      visitorId,
      firstSeen: now.toISOString(),
      lastSeen: now.toISOString(),
      visitsCount: 0,
      country: geo.country,
      city: geo.city,
      flag: geo.flag,
      device,
      os,
      browser,
      tasksCompleted: 0,
    };
    existingVisitor.lastSeen = now.toISOString();
    existingVisitor.visitsCount += 1;
    if (isTaskCompleted) {
      existingVisitor.tasksCompleted += 1;
    }
    store.visitors.set(visitorId, existingVisitor);

    // 2. Persist to Supabase if connected
    try {
      const cookieStore = await cookies();
      const supabase = createClient(cookieStore);
      
      // Fire and forget insert to supabase table 'analytics_events'
      supabase.from('analytics_events').insert([
        {
          visitor_id: visitorId,
          session_id: sessionId,
          event_type: eventType,
          path,
          app_slug: appSlug,
          app_name: appName,
          details: eventRecord.details,
          duration_seconds: durationSeconds,
          is_task_completed: isTaskCompleted,
          device,
          os,
          browser,
          country: geo.country,
          country_code: geo.countryCode,
          city: geo.city,
          ip: maskedIp,
          created_at: now.toISOString(),
        },
      ]).then(({ error }) => {
        if (error) {
          // Table may not exist yet in user's Supabase instance, safe to ignore
        }
      });
    } catch {
      // Supabase not configured or failed, handled gracefully by memory store
    }

    return NextResponse.json({ success: true, eventId: eventRecord.id });
  } catch (error: any) {
    console.error('Analytics track error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function generateDefaultDetails(eventType: string, path: string, appName: string | null): string {
  switch (eventType) {
    case 'page_view':
      return path === '/' ? 'Visited Homepage' : `Viewed Page: ${path}`;
    case 'app_view':
      return `Explored App: ${appName || path}`;
    case 'app_download':
      return `Downloaded APK: ${appName || 'App'}`;
    case 'review_submit':
      return `Submitted Review for ${appName || 'App'}`;
    case 'screenshot_view':
      return `Expanded Screenshot Gallery for ${appName || 'App'}`;
    case 'search':
      return 'Searched app catalog';
    case 'category_filter':
      return 'Filtered apps by category';
    case 'github_click':
      return `Viewed GitHub Source Code for ${appName || 'App'}`;
    case 'early_exit':
      return 'Exited session early (Bounced)';
    case 'task_completed':
      return 'Completed key goal task';
    default:
      return `${eventType} on ${path}`;
  }
}
