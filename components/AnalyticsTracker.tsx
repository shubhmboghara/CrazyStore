'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';

export function AnalyticsTracker() {
  const pathname = usePathname();
  const startTimeRef = useRef<number>(0);
  const hasInteractedRef = useRef<boolean>(false);
  const eventSentRef = useRef<boolean>(false);

  useEffect(() => {
    // Reset timer on route change
    startTimeRef.current = Date.now();
    hasInteractedRef.current = false;
    eventSentRef.current = false;

    // Track Page View
    trackEvent({
      eventType: 'page_view',
      path: pathname,
      details: pathname === '/' ? 'Visited Homepage' : `Browsing ${pathname}`,
    });

    // Mark interaction on user clicks/scrolls
    const handleUserInteraction = () => {
      hasInteractedRef.current = true;
    };

    window.addEventListener('click', handleUserInteraction, { passive: true });
    window.addEventListener('scroll', handleUserInteraction, { passive: true });
    window.addEventListener('keydown', handleUserInteraction, { passive: true });

    // Live session heartbeat: ping server every 20 seconds to keep live visitor status active
    const heartbeatInterval = setInterval(() => {
      const activeDuration = Math.round((Date.now() - startTimeRef.current) / 1000);
      trackEvent({
        eventType: 'session_ping',
        path: pathname,
        durationSeconds: activeDuration,
        details: `Active on ${pathname}`,
      });
    }, 20000);

    // Handle Early Exit vs Duration on tab close or navigation
    const handleUnload = () => {
      if (eventSentRef.current) return;
      const durationSeconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

      // If user stayed < 6 seconds with zero interactions, flag as early exit
      if (durationSeconds < 6 && !hasInteractedRef.current) {
        trackEvent({
          eventType: 'early_exit',
          path: pathname,
          durationSeconds,
          isTaskCompleted: false,
          details: `Left ${pathname} in under 6s (Bounced)`,
        });
      } else {
        // Send final duration update
        trackEvent({
          eventType: 'session_ping',
          path: pathname,
          durationSeconds,
          details: `Completed session on ${pathname} (${durationSeconds}s)`,
        });
      }
      eventSentRef.current = true;
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(heartbeatInterval);
      handleUnload();
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('scroll', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [pathname]);

  return null;
}

