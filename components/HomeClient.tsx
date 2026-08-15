'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AndroidApp } from '@/lib/appsData';
import { normalizeAppRecord } from '@/lib/appUtils';
import { StarRating } from '@/components/StarRating';
import { AppCardSkeleton } from '@/components/AppCardSkeleton';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { GeoKnowledgeBase } from '@/components/GeoKnowledgeBase';
import { trackEvent } from '@/lib/analytics';
import { FaGithub } from 'react-icons/fa6';
import {
  Download,
  Play,
  Activity,
  Music,
  Smartphone,
  ChevronRight,
  ShieldCheck,
  Zap,
  Code2,
  Sparkles,
  CheckCircle2,
  Cpu,
  Lock,
  Boxes,
} from 'lucide-react';

export function HomeClient({ initialApps, initialRatingsMap }: { initialApps: AndroidApp[], initialRatingsMap: Record<string, { avg: number; count: number }> }) {
  const [apps, setApps] = useState<AndroidApp[]>(initialApps);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [ratingsMap, setRatingsMap] = useState<Record<string, { avg: number; count: number }>>(initialRatingsMap);
  const [categories, setCategories] = useState<string[]>(() => {
    const uniqueCats = new Set<string>();
    initialApps.forEach((a: AndroidApp) => {
      if (a.category) uniqueCats.add(a.category);
    });
    return ['All', ...Array.from(uniqueCats)];
  });

  useEffect(() => {
    setApps(initialApps);
    
    const uniqueCats = new Set<string>();
    initialApps.forEach((a: AndroidApp) => {
      if (a.category) uniqueCats.add(a.category);
    });
    setCategories(['All', ...Array.from(uniqueCats)]);
  }, [initialApps]);

  useEffect(() => {
    setRatingsMap(initialRatingsMap);
  }, [initialRatingsMap]);

  useEffect(() => {
    let isSubscribed = true;

    async function loadApps(showLoading = false) {
      if (showLoading) {
        setIsLoading(true);
      }
      try {
        const res = await fetch(`/api/apps?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });
        if (res.ok && isSubscribed) {
          const data = await res.json();
          const fetchedApps = (data.apps || []).map((a: any) => normalizeAppRecord(a));
          setApps(fetchedApps);

          const uniqueCats = new Set<string>();
          fetchedApps.forEach((a: AndroidApp) => {
            if (a.category) uniqueCats.add(a.category);
          });
          setCategories(['All', ...Array.from(uniqueCats)]);

          // Fetch reviews rating map in the background
          const results: Record<string, { avg: number; count: number }> = {};
          for (const app of fetchedApps) {
            try {
              const reviewRes = await fetch(`/api/reviews?appSlug=${encodeURIComponent(app.slug)}&t=${Date.now()}`, {
                cache: 'no-store',
                headers: {
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                },
              });
              if (reviewRes.ok && isSubscribed) {
                const reviewData = await reviewRes.json();
                results[app.slug] = {
                  avg: reviewData.averageRating || app.initialRating || 0,
                  count: reviewData.totalCount || app.initialReviewCount || 0,
                };
              }
            } catch {
              results[app.slug] = { avg: app.initialRating || 0, count: app.initialReviewCount || 0 };
            }
          }
          if (isSubscribed) {
            setRatingsMap(results);
          }
        }
      } catch (err) {
        console.error('Error fetching apps:', err);
      } finally {
        if (isSubscribed && showLoading) {
          setIsLoading(false);
        }
      }
    }

    // DO NOT load on mount since we have initial data from server!
    // loadApps(true);

    const handleAppsUpdated = () => {
      loadApps(false);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'crazystore_apps_last_updated') {
        loadApps(false);
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadApps(false);
      }
    };

    const handleFocus = () => {
      loadApps(false);
    };

    window.addEventListener('apps_updated', handleAppsUpdated);
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    return () => {
      isSubscribed = false;
      window.removeEventListener('apps_updated', handleAppsUpdated);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const filteredApps =
    selectedCategory === 'All'
      ? apps
      : apps.filter((app) => app.category === selectedCategory);

  const getIconComponent = (symbol: string) => {
    switch (symbol) {
      case 'play':
        return <Play className="w-6 h-6 text-white fill-white" />;
      case 'activity':
        return <Activity className="w-6 h-6 text-white" />;
      case 'music':
        return <Music className="w-6 h-6 text-white" />;
      default:
        return <Smartphone className="w-6 h-6 text-white" />;
    }
  };

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://crazystore.app';

  const homeItemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Featured Open-Source Android Applications',
    description: 'A curated directory of high-performance Android applications built with Kotlin and Jetpack Compose.',
    numberOfItems: apps.length,
    itemListElement: apps.map((app, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: app.name,
      url: `${baseUrl}/apps/${app.slug}`,
      description: app.shortDescription,
    })),
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col font-sans text-zinc-900 dark:text-zinc-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeItemListJsonLd) }}
      />
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 overflow-hidden">
          {/* Background Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/50 text-purple-700 dark:text-purple-300 text-xs font-bold mb-6 animate-in fade-in slide-in-from-bottom-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              100% Free & Open Source
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-6 leading-tight">
              Premium Android Apps, <br className="hidden sm:block" />
              Built with <span className="text-transparent bg-clip-text bg-gradient-to-br from-purple-600 to-indigo-600">Compose</span>
            </h1>

            <p className="max-w-2xl mx-auto text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed font-medium">
              A curated vault of high-performance, ad-free Android applications crafted natively in Kotlin.
              Download secure APKs directly and leave verified reviews.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="#catalog"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-sm shadow-xl shadow-purple-900/10 hover:scale-105 transition-all"
              >
                Browse Catalog
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-12 bg-white dark:bg-zinc-900/50 border-y border-zinc-200 dark:border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100/50 dark:border-purple-900/30">
                <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1">Zero Telemetry</h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">No ads, no trackers, and no background data mining. Privacy-first architecture.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30">
                <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1">Native Performance</h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">Compiled natively for Android with 120Hz smooth scrolling and battery efficiency.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-fuchsia-50/50 dark:bg-fuchsia-950/20 border border-fuchsia-100/50 dark:border-fuchsia-900/30">
                <div className="p-3 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-900/40 text-fuchsia-600 dark:text-fuchsia-400 shrink-0">
                  <Code2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1">Modern Stack</h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">Built entirely with Kotlin, Coroutines, and declarative Jetpack Compose UI.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* App Catalog Section */}
        <section id="catalog" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12">
            <div>
              <h2 className="text-2xl font-black mb-2">Explore Applications</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Select an app to view details, reviews, and download the APK.</p>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto hide-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    trackEvent({
                      eventType: 'category_filter',
                      details: `Filtered apps by "${cat}" category`,
                    });
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <AppCardSkeleton count={6} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredApps.map((app, idx) => (
                <Link
                  href={`/apps/${app.slug}`}
                  key={app.slug}
                  onClick={() => {
                    trackEvent({
                      eventType: 'app_view',
                      appSlug: app.slug,
                      appName: app.name,
                      path: `/apps/${app.slug}`,
                      details: `Explored App Details: ${app.name}`,
                    });
                  }}
                  className="group flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-purple-900/10 hover:border-purple-300 dark:hover:border-purple-800/50 transition-all duration-300 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  {/* Decorative background blob */}
                  <div className={`absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br ${app.iconBg || 'from-purple-600 to-indigo-600'} rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity`} />

                  <div className="flex items-start justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${app.iconBg || 'from-purple-600 to-indigo-600'} flex items-center justify-center shadow-lg shadow-purple-500/20 transform group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300 shrink-0 overflow-hidden`}>
                      {app.logoUrl ? (
                        <img src={app.logoUrl} alt={app.name} className="w-full h-full object-cover" />
                      ) : (
                        getIconComponent(app.iconSymbol)
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex items-center gap-1.5">
                        {app.githubUrl && (
                          <span className="px-2 py-0.5 rounded-md bg-zinc-900 text-white dark:bg-zinc-800 text-[10px] font-bold flex items-center gap-1">
                            <FaGithub className="w-3 h-3" /> GitHub
                          </span>
                        )}
                        <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                          {app.version}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 text-[10px] font-bold">
                        {app.badge || 'Kotlin + Compose'}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl font-black mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {app.name}
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4 line-clamp-2">
                      {app.tagline || app.shortDescription}
                    </p>
                  </div>

                  <div className="pt-5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <StarRating rating={ratingsMap[app.slug]?.avg || 5} />
                      <span className="text-[10px] font-bold text-zinc-500">
                        ({ratingsMap[app.slug]?.count || 0})
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform">
                      View Details <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Generative Engine Optimization (GEO) & FOSS Architecture Standards Section */}
        <section className="py-16 bg-white dark:bg-zinc-900/60 border-y border-zinc-200 dark:border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/40 px-3 py-1 rounded-full">
                Verification & Architecture Standards
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 mt-3 mb-3">
                Why Developers & Power Users Choose CrazyStore
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Every Android APK indexed on CrazyStore adheres to strict open-source privacy benchmarks, modern Android architecture patterns, and reproducible builds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/50 space-y-3">
                <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 w-fit">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">100% Zero-Telemetry</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  No Facebook SDKs, Google Analytics, ad networks, or user fingerprinting. Completely offline-capable and privacy compliant.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/50 space-y-3">
                <div className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 w-fit">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Modern Android (MAD)</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Built with Kotlin 2.0, Jetpack Compose, Material Design 3, Coroutines, and ExoPlayer for native 120Hz rendering and fluid UI.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/50 space-y-3">
                <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 w-fit">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">De-Googled & MicroG Ready</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Engineered to operate without Google Play Services. Fully compatible with GrapheneOS, LineageOS, CalyxOS, and vanilla AOSP.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/50 space-y-3">
                <div className="p-3 rounded-2xl bg-fuchsia-100 dark:bg-fuchsia-950/80 text-fuchsia-600 dark:text-fuchsia-400 w-fit">
                  <Boxes className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Verified User Feedback</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Community-driven star ratings, real bug reports, and transparent open-source code repositories with public GitHub links.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Global GEO FAQ & Knowledge Graph Section */}
        <section className="py-16 sm:py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <GeoKnowledgeBase />
        </section>
      </main>

      <Footer />
    </div>
  );
}
