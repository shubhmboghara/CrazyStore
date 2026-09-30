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
import {
  Hero3DExperience,
  Card3DTilt,
  FloatingAndroid3D,
  Global3DBackground,
  Feature3DCanvas,
} from '@/components/three';
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
  ImageIcon,
} from 'lucide-react';

function AppLogoImage({
  src,
  alt,
  fallback,
  className = "w-full h-full object-cover",
}: {
  src: string;
  alt: string;
  fallback: React.ReactNode;
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (hasError || !src) {
    return <>{fallback}</>;
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={className}
    />
  );
}

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

  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://crazy-store-rho.vercel.app').replace(/\/$/, '');

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
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans text-zinc-100 relative">
      {/* Three.js Global 3D Cyber Grid & Constellation Stardust */}
      <Global3DBackground />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeItemListJsonLd) }}
      />
      <Navbar />

      <main className="flex-1">
        {/* 3D WebGL Hero Section */}
        <section className="relative py-12 sm:py-20 overflow-hidden">
          {/* Background Ambient Glows */}
          <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-purple-600/15 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute top-1/2 right-10 w-[450px] h-[450px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Headline, Highlights & Actions */}
              <div className="lg:col-span-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/70 border border-purple-800/50 text-purple-300 text-xs font-bold mb-6 animate-in fade-in slide-in-from-bottom-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>3D Interactive Showcase • 100% Free & Open Source</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-[1.1]">
                  Premium Android Apps, <br />
                  Built with <span className="text-transparent bg-clip-text bg-gradient-to-br from-purple-400 via-indigo-400 to-fuchsia-400">Compose</span>
                </h1>

                <p className="max-w-xl mx-auto lg:mx-0 text-sm sm:text-base text-zinc-400 mb-8 leading-relaxed font-medium">
                  A curated vault of high-performance, ad-free Android applications crafted natively in Kotlin.
                  Interact with apps live in 3D WebGL, download verified APKs, and review open-source code.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8">
                  <Link
                    href="#catalog"
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-sm shadow-xl shadow-purple-900/20 hover:scale-105 active:scale-95 transition-all text-center"
                  >
                    Browse Catalog
                  </Link>

                  <Link
                    href={`/apps/${apps[0]?.slug || 'videohub'}`}
                    className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 font-bold text-sm border border-purple-800/60 shadow-lg hover:border-purple-600 transition-all text-center flex items-center justify-center gap-2"
                  >
                    <span>📱 3D Device Studio</span>
                  </Link>
                </div>

                {/* Micro Highlights */}
                <div className="grid grid-cols-3 gap-3 pt-6 border-t border-zinc-800/80 max-w-md mx-auto lg:mx-0 text-left">
                  <div>
                    <span className="block text-lg font-black text-zinc-100">0%</span>
                    <span className="text-[11px] text-zinc-400 font-medium">Zero Telemetry</span>
                  </div>
                  <div>
                    <span className="block text-lg font-black text-purple-400">120Hz</span>
                    <span className="text-[11px] text-zinc-400 font-medium">Compose Native</span>
                  </div>
                  <div>
                    <span className="block text-lg font-black text-indigo-400">3D</span>
                    <span className="text-[11px] text-zinc-400 font-medium">WebGL Live View</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive 3D WebGL Phone Experience */}
              <div className="lg:col-span-6 relative flex items-center justify-center">
                <div className="w-full max-w-[560px] relative">
                  <Hero3DExperience />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-12 bg-zinc-900/50 border-y border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-purple-950/20 border border-purple-900/30">
                <Feature3DCanvas type="shield" />
                <div>
                  <h3 className="font-bold text-sm mb-1 text-zinc-100 flex items-center gap-1.5">
                    Zero Telemetry
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800/40">3D FOSS</span>
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">No ads, no trackers, and no background data mining. Privacy-first architecture.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-indigo-950/20 border border-indigo-900/30">
                <Feature3DCanvas type="zap" />
                <div>
                  <h3 className="font-bold text-sm mb-1 text-zinc-100 flex items-center gap-1.5">
                    Native Performance
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">120Hz</span>
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">Compiled natively for Android with 120Hz smooth scrolling and battery efficiency.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-fuchsia-950/20 border border-fuchsia-900/30">
                <Feature3DCanvas type="code" />
                <div>
                  <h3 className="font-bold text-sm mb-1 text-zinc-100 flex items-center gap-1.5">
                    Modern Stack
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-800/40">Compose</span>
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">Built entirely with Kotlin, Coroutines, and declarative Jetpack Compose UI.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* App Catalog Section */}
        <section id="catalog" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/40">
                  Curated Catalog
                </span>
              </div>
              <h2 className="text-2xl font-black mb-1 mt-1 text-zinc-100">Explore Applications</h2>
              <p className="text-xs text-zinc-400">Discover high-performance Android applications with native Jetpack Compose &amp; Kotlin.</p>
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
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 3D Perspective Tilt Cards Grid */}
          {isLoading ? (
            <AppCardSkeleton count={6} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {filteredApps.map((app, idx) => (
                <Card3DTilt key={app.slug} className="h-full">
                  <Link
                    href={`/apps/${app.slug}`}
                    onClick={() => {
                      trackEvent({
                        eventType: 'app_view',
                        appSlug: app.slug,
                        appName: app.name,
                        path: `/apps/${app.slug}`,
                        details: `Explored App Details: ${app.name}`,
                      });
                    }}
                    className="group flex flex-col h-full bg-zinc-900 border border-zinc-800 hover:border-purple-800/60 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-purple-900/20 transition-all duration-300 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    {/* Decorative background banner / ambient glow */}
                    {app.bannerUrl ? (
                      <div className="absolute inset-0 pointer-events-none opacity-15 group-hover:opacity-25 transition-opacity overflow-hidden">
                        <img src={app.bannerUrl} alt="" className="w-full h-full object-cover blur-sm scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/80 to-transparent" />
                      </div>
                    ) : (
                      <div className={`absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br ${app.iconBg || 'from-purple-600 to-indigo-600'} rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity`} />
                    )}

                    <div className="flex items-start justify-between mb-6 relative z-10">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${app.iconBg || 'from-purple-600 to-indigo-600'} flex items-center justify-center shadow-lg shadow-purple-500/20 transform group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300 shrink-0 overflow-hidden`}>
                        {app.logoUrl ? (
                          <AppLogoImage
                            key={app.logoUrl || app.slug}
                            src={app.logoUrl}
                            alt={app.name}
                            fallback={getIconComponent(app.iconSymbol)}
                          />
                        ) : (
                          getIconComponent(app.iconSymbol)
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-1.5">
                          {app.githubUrl && (
                            <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-200 border border-zinc-700/50 text-[10px] font-bold flex items-center gap-1">
                              <FaGithub className="w-3 h-3" /> GitHub
                            </span>
                          )}
                          <span className="px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700/40 text-[10px] font-bold text-zinc-400">
                            {app.version}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {app.screenshots && app.screenshots.length > 0 && (
                            <span className="px-2 py-0.5 rounded-lg bg-zinc-800/90 text-purple-300 border border-purple-800/40 text-[10px] font-bold flex items-center gap-1">
                              <ImageIcon className="w-3 h-3 text-purple-400" /> {app.screenshots.length} Screens
                            </span>
                          )}
                          <span className="px-2.5 py-1 rounded-lg bg-purple-950/50 text-purple-300 border border-purple-800/40 text-[10px] font-bold">
                            {app.badge || 'Kotlin + Compose'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-xl font-black mb-2 text-zinc-100 group-hover:text-purple-400 transition-colors">
                        {app.name}
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed mb-4 line-clamp-2">
                        {app.tagline || app.shortDescription}
                      </p>
                    </div>

                    <div className="pt-5 border-t border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <StarRating rating={ratingsMap[app.slug]?.avg || 5} />
                        <span className="text-[10px] font-bold text-zinc-400">
                          ({ratingsMap[app.slug]?.count || 0})
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-purple-400 group-hover:translate-x-1 transition-transform">
                        View Details <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </Link>
                </Card3DTilt>
              ))}
            </div>
          )}
        </section>

        {/* Generative Engine Optimization (GEO) & FOSS Architecture Standards Section */}
        <section className="py-16 bg-zinc-900/40 border-y border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-950/60 border border-purple-800/40 px-3 py-1 rounded-full">
                Verification & Architecture Standards
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-100 mt-3 mb-3">
                Why Developers & Power Users Choose CrazyStore
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Every Android APK indexed on CrazyStore adheres to strict open-source privacy benchmarks, modern Android architecture patterns, and reproducible builds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-3xl bg-zinc-900/70 border border-zinc-800 space-y-3">
                <div className="p-3 rounded-2xl bg-purple-950/80 text-purple-400 border border-purple-800/50 w-fit">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-zinc-100">100% Zero-Telemetry</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  No Facebook SDKs, Google Analytics, ad networks, or user fingerprinting. Completely offline-capable and privacy compliant.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-zinc-900/70 border border-zinc-800 space-y-3">
                <div className="p-3 rounded-2xl bg-indigo-950/80 text-indigo-400 border border-indigo-800/50 w-fit">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-zinc-100">Modern Android (MAD)</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Built with Kotlin 2.0, Jetpack Compose, Material Design 3, Coroutines, and ExoPlayer for native 120Hz rendering and fluid UI.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-zinc-900/70 border border-zinc-800 space-y-3">
                <div className="p-3 rounded-2xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 w-fit">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-zinc-100">De-Googled & MicroG Ready</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Engineered to operate without Google Play Services. Fully compatible with GrapheneOS, LineageOS, CalyxOS, and vanilla AOSP.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-zinc-900/70 border border-zinc-800 space-y-3">
                <div className="p-3 rounded-2xl bg-fuchsia-950/80 text-fuchsia-400 border border-fuchsia-800/50 w-fit">
                  <Boxes className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-zinc-100">Verified User Feedback</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
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

        {/* Interactive 3D Android Companion */}
        <FloatingAndroid3D />
      </main>

      <Footer />
    </div>
  );
}
