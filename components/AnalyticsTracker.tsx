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
    });

    // Mark interaction on user clicks/scrolls
    const handleUserInteraction = () => {
      hasInteractedRef.current = true;
    };

    window.addEventListener('click', handleUserInteraction, { passive: true });
    window.addEventListener('scroll', handleUserInteraction, { passive: true });
    window.addEventListener('keydown', handleUserInteraction, { passive: true });

    // Handle Early Exit vs Duration on tab close or navigation
    const handleUnload = () => {
      if (eventSentRef.current) return;
      const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

      // If user stayed < 8 seconds with zero interactions, flag as early exit
      if (durationSeconds < 8 && !hasInteractedRef.current) {
        trackEvent({
          eventType: 'early_exit',
          path: pathname,
          durationSeconds,
          isTaskCompleted: false,
        });
      }
      eventSentRef.current = true;
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      handleUnload();
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('scroll', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [pathname]);

  return null;
}
