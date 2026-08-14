'use client';

// Client-side analytics helper and event emitter

export type ActivityType =
  | 'page_view'
  | 'app_view'
  | 'app_download'
  | 'review_submit'
  | 'screenshot_view'
  | 'search'
  | 'category_filter'
  | 'github_click'
  | 'share_click'
  | 'theme_toggle'
  | 'early_exit'
  | 'task_completed';

export interface TrackPayload {
  eventType: ActivityType;
  path?: string;
  appSlug?: string;
  appName?: string;
  details?: string;
  metadata?: Record<string, any>;
  durationSeconds?: number;
  isTaskCompleted?: boolean;
}

// Generate or retrieve persistent visitor ID
export function getVisitorId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    let vid = localStorage.getItem('cs_visitor_id');
    if (!vid) {
      vid = 'v_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      localStorage.setItem('cs_visitor_id', vid);
    }
    return vid;
  } catch {
    return 'anonymous_' + Math.random().toString(36).substring(2, 8);
  }
}

// Generate or retrieve session ID (expires after 30 mins of inactivity)
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server_session';
  try {
    const sessionKey = 'cs_session_id';
    const timeKey = 'cs_session_time';
    const now = Date.now();
    const lastActive = parseInt(sessionStorage.getItem(timeKey) || '0', 10);
    
    let sid = sessionStorage.getItem(sessionKey);
    // New session if older than 30 mins or not exists
    if (!sid || (now - lastActive > 30 * 60 * 1000)) {
      sid = 's_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      sessionStorage.setItem(sessionKey, sid);
    }
    sessionStorage.setItem(timeKey, now.toString());
    return sid;
  } catch {
    return 'session_' + Math.random().toString(36).substring(2, 8);
  }
}

// Detect basic device and screen info
export function getClientDeviceInfo() {
  if (typeof window === 'undefined') {
    return {
      deviceType: 'Desktop',
      os: 'Unknown',
      browser: 'Unknown',
      screenResolution: '1920x1080',
      language: 'en',
    };
  }

  const ua = navigator.userAgent;
  let deviceType = 'Desktop';
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    deviceType = 'Tablet';
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle/i.test(ua)) {
    deviceType = 'Mobile';
  }

  let os = 'Unknown';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Unknown';
  if (/Chrome|CriOS/i.test(ua) && !/Edg|OPR/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome|CriOS/i.test(ua)) browser = 'Safari';
  else if (/Firefox|FxiOS/i.test(ua)) browser = 'Firefox';
  else if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/OPR/i.test(ua)) browser = 'Opera';

  return {
    deviceType,
    os,
    browser,
    screenResolution: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
    language: navigator.language || 'en-US',
  };
}

/**
 * Send an analytics event to the server
 */
export async function trackEvent(payload: TrackPayload) {
  if (typeof window === 'undefined') return;

  try {
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const deviceInfo = getClientDeviceInfo();
    const currentPath = payload.path || window.location.pathname;
    const referrer = document.referrer || '';

    // Automatically determine if task is completed
    const isCompleted = payload.isTaskCompleted ?? (
      payload.eventType === 'app_download' ||
      payload.eventType === 'review_submit' ||
      payload.eventType === 'task_completed'
    );

    const bodyData = {
      visitorId,
      sessionId,
      eventType: payload.eventType,
      path: currentPath,
      appSlug: payload.appSlug || null,
      appName: payload.appName || null,
      details: payload.details || '',
      metadata: payload.metadata || {},
      durationSeconds: payload.durationSeconds || 0,
      isTaskCompleted: isCompleted,
      device: deviceInfo.deviceType,
      os: deviceInfo.os,
      browser: deviceInfo.browser,
      screenResolution: deviceInfo.screenResolution,
      language: deviceInfo.language,
      referrer,
      timestamp: new Date().toISOString(),
    };

    // Use sendBeacon if available for unload/background reliability, otherwise fetch
    if (payload.eventType === 'early_exit' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/track', JSON.stringify(bodyData));
    } else {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
        keepalive: true,
      }).catch((e) => console.debug('Analytics track error:', e));
    }
  } catch (err) {
    console.debug('Analytics tracking skipped:', err);
  }
}
