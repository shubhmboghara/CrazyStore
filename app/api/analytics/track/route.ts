import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Server-side real-time analytics global store
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
  if (code.length !== 2) return '🌐';
  const codePoints = code
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Timezone to Country & City mapper for accurate geolocation even behind local proxies/sandboxes
function getGeoFromTimezoneAndLocale(timeZone: string, language?: string) {
  const tz = (timeZone || '').toLowerCase();
  
  if (tz.includes('calcutta') || tz.includes('kolkata') || tz.includes('india')) {
    return { countryCode: 'IN', country: 'India', city: 'Bengaluru / India', flag: '🇮🇳', region: 'Asia' };
  }
  if (tz.includes('dubai') || tz.includes('muscat')) {
    return { countryCode: 'AE', country: 'United Arab Emirates', city: 'Dubai', flag: '🇦🇪', region: 'Middle East' };
  }
  if (tz.includes('new_york') || tz.includes('detroit') || tz.includes('toronto')) {
    return { countryCode: 'US', country: 'United States', city: 'New York', flag: '🇺🇸', region: 'Eastern' };
  }
  if (tz.includes('los_angeles') || tz.includes('pacific') || tz.includes('vancouver')) {
    return { countryCode: 'US', country: 'United States', city: 'Los Angeles', flag: '🇺🇸', region: 'West Coast' };
  }
  if (tz.includes('chicago') || tz.includes('central')) {
    return { countryCode: 'US', country: 'United States', city: 'Chicago', flag: '🇺🇸', region: 'Midwest' };
  }
  if (tz.includes('london') || tz.includes('belfast')) {
    return { countryCode: 'GB', country: 'United Kingdom', city: 'London', flag: '🇬🇧', region: 'Europe' };
  }
  if (tz.includes('berlin') || tz.includes('frankfurt')) {
    return { countryCode: 'DE', country: 'Germany', city: 'Berlin', flag: '🇩🇪', region: 'Europe' };
  }
  if (tz.includes('paris')) {
    return { countryCode: 'FR', country: 'France', city: 'Paris', flag: '🇫🇷', region: 'Europe' };
  }
  if (tz.includes('tokyo')) {
    return { countryCode: 'JP', country: 'Japan', city: 'Tokyo', flag: '🇯🇵', region: 'Asia' };
  }
  if (tz.includes('singapore')) {
    return { countryCode: 'SG', country: 'Singapore', city: 'Singapore', flag: '🇸🇬', region: 'Asia' };
  }
  if (tz.includes('sydney') || tz.includes('melbourne') || tz.includes('australia')) {
    return { countryCode: 'AU', country: 'Australia', city: 'Sydney', flag: '🇦🇺', region: 'Oceania' };
  }
  if (tz.includes('sao_paulo') || tz.includes('brazil')) {
    return { countryCode: 'BR', country: 'Brazil', city: 'São Paulo', flag: '🇧🇷', region: 'South America' };
  }
  if (tz.includes('amsterdam')) {
    return { countryCode: 'NL', country: 'Netherlands', city: 'Amsterdam', flag: '🇳🇱', region: 'Europe' };
  }
  if (tz.includes('madrid')) {
    return { countryCode: 'ES', country: 'Spain', city: 'Madrid', flag: '🇪🇸', region: 'Europe' };
  }
  if (tz.includes('rome')) {
    return { countryCode: 'IT', country: 'Italy', city: 'Rome', flag: '🇮🇹', region: 'Europe' };
  }
  if (tz.includes('seoul')) {
    return { countryCode: 'KR', country: 'South Korea', city: 'Seoul', flag: '🇰🇷', region: 'Asia' };
  }
  if (tz.includes('jakarta')) {
    return { countryCode: 'ID', country: 'Indonesia', city: 'Jakarta', flag: '🇮🇩', region: 'Asia' };
  }

  // Fallback by locale if timezone is generic UTC
  if (language) {
    const lang = language.toLowerCase();
    if (lang.startsWith('hi') || lang.includes('in')) {
      return { countryCode: 'IN', country: 'India', city: 'India Regional', flag: '🇮🇳', region: 'Asia' };
    }
    if (lang.startsWith('de')) {
      return { countryCode: 'DE', country: 'Germany', city: 'Berlin', flag: '🇩🇪', region: 'Europe' };
    }
    if (lang.startsWith('fr')) {
      return { countryCode: 'FR', country: 'France', city: 'Paris', flag: '🇫🇷', region: 'Europe' };
    }
    if (lang.startsWith('ja')) {
      return { countryCode: 'JP', country: 'Japan', city: 'Tokyo', flag: '🇯🇵', region: 'Asia' };
    }
    if (lang.startsWith('en-gb')) {
      return { countryCode: 'GB', country: 'United Kingdom', city: 'London', flag: '🇬🇧', region: 'Europe' };
    }
  }

  return { countryCode: 'US', country: 'United States', city: 'Direct Visitor', flag: '🇺🇸', region: 'Global' };
}

// IP Geolocation cache
const geoCache = new Map<string, { country: string; countryCode: string; city: string; region: string; flag: string }>();

async function getGeoLocation(ip: string, headers: Headers, timeZone?: string, language?: string) {
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
      city: headers.get('x-vercel-ip-city') || headers.get('cf-ipcity') || (timeZone ? timeZone.split('/')[1]?.replace(/_/g, ' ') : 'Metro City') || 'Direct City',
      region: headers.get('x-vercel-ip-country-region') || '',
      flag: getCountryFlag(code),
    };
  }

  // Clean IP
  const cleanIp = ip.split(',')[0].trim();
  const isPrivateOrLocal = !cleanIp || cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp.startsWith('192.168.') || cleanIp.startsWith('10.') || cleanIp.startsWith('172.');

  if (isPrivateOrLocal) {
    // Dynamically derive from visitor's real browser timezone/locale
    if (timeZone) {
      return getGeoFromTimezoneAndLocale(timeZone, language);
    }
    return {
      countryCode: 'US',
      country: 'United States',
      city: 'Local Visitor',
      region: '',
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
      if (data.country_code && data.country_name) {
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
    }
  } catch {
    // Fallback on timeout
  }

  // Fallback to browser timezone
  if (timeZone) {
    const tzGeo = getGeoFromTimezoneAndLocale(timeZone, language);
    geoCache.set(cleanIp, tzGeo);
    return tzGeo;
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
      timeZone = '',
      referrer = '',
    } = body;

    // Detect IP
    const forwardedFor = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') || '';
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    // Mask IP for privacy (e.g. 192.168.xxx.xxx)
    const ipParts = ip.split('.');
    const maskedIp = ipParts.length === 4 ? `${ipParts[0]}.${ipParts[1]}.*.*` : 'masked';

    // Get Geo Location dynamically
    const geo = await getGeoLocation(ip, req.headers, timeZone, language);

    const now = new Date();
    const eventRecord = {
      id: 'ev_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
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

    const store = global.__analyticsStore!;

    // 1. Update Global in-memory store
    // For session_ping, update session timestamps/duration without flooding the feed
    if (eventType !== 'session_ping') {
      store.events.unshift(eventRecord);
      if (store.events.length > 5000) {
        store.events.pop(); // Keep latest 5000 events
      }
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
      lastActiveTimestamp: now.getTime(),
      pageViews: 0,
      eventsCount: 0,
      durationSeconds: 0,
      hasCompletedTask: false,
      paths: [],
      appsExplored: [],
    };

    existingSession.lastSeen = now.toISOString();
    existingSession.lastActiveTimestamp = now.getTime();
    existingSession.eventsCount += 1;
    if (durationSeconds > existingSession.durationSeconds) {
      existingSession.durationSeconds = durationSeconds;
    }

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
      lastActiveTimestamp: now.getTime(),
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
    existingVisitor.lastActiveTimestamp = now.getTime();
    existingVisitor.visitsCount += 1;
    if (isTaskCompleted) {
      existingVisitor.tasksCompleted += 1;
    }
    store.visitors.set(visitorId, existingVisitor);

    // 2. Persist to Supabase if connected
    if (eventType !== 'session_ping') {
      try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

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
            flag: geo.flag,
            ip: maskedIp,
            created_at: now.toISOString(),
          },
        ]).then(({ error }) => {
          if (error) {
            // Table may not exist yet, memory store fallback is safe
          }
        });
      } catch {
        // Supabase query fallback
      }
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

