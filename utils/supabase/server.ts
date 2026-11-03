import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

// Circuit breaker state to prevent blocking on dead or paused Supabase instances
let isCircuitOpen = false;
let consecutiveFailures = 0;
let lastFailureTimestamp = 0;
const CIRCUIT_RESET_TIMEOUT_MS = 10_000; // Retry after 10 seconds (not 60s)
const MAX_CONSECUTIVE_FAILURES = 3;
const REQUEST_TIMEOUT_MS = 7_000; // 7 seconds (resilient to cold starts)

export const isSupabaseConfigured = () => {
  if (!supabaseUrl || !supabaseKey) return false;
  if (
    supabaseUrl.includes("your-supabase-url") ||
    supabaseUrl.includes("placeholder")
  ) {
    return false;
  }
  // If circuit breaker is open, skip until cooldown elapsed
  if (isCircuitOpen) {
    if (Date.now() - lastFailureTimestamp > CIRCUIT_RESET_TIMEOUT_MS) {
      isCircuitOpen = false; // test probe again
      consecutiveFailures = 0;
    } else {
      return false; // skip immediately, 0ms latency!
    }
  }
  return true;
};

const customFetch: typeof fetch = async (input, init) => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase unreachable or circuit breaker open");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    isCircuitOpen = false;
    consecutiveFailures = 0;
    return res;
  } catch (err) {
    consecutiveFailures += 1;
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      isCircuitOpen = true;
      lastFailureTimestamp = Date.now();
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Public client for static generation & ISR (no cookies called, preventing Next.js from bailing out of static generation)
 */
export const createPublicClient = () => {
  return createServerClient(
    supabaseUrl || "https://placeholder.supabase.co",
    supabaseKey || "placeholder",
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
      global: {
        fetch: customFetch,
      },
    }
  );
};

/**
 * Session-aware client for authenticated Server Components / Route Handlers
 */
export const createClient = (cookieStore: Awaited<ReturnType<typeof cookies>>) => {
  return createServerClient(
    supabaseUrl || "https://placeholder.supabase.co",
    supabaseKey || "placeholder",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored in Server Component
          }
        },
      },
      global: {
        fetch: customFetch,
      },
    }
  );
};
