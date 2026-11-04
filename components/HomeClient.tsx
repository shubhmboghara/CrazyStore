'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Search,
  ArrowUpDown,
  Filter,
  X,
  RotateCcw,
  SlidersHorizontal,
  Tag,
  Star,
} from 'lucide-react';
import {
  HighlightedText,
  filterApps,
  sortApps,
  SortOption,
  QuickFilterOption,
  POPULAR_SEARCH_TAGS,
} from '@/lib/searchUtils';

function AppLogoImage({
  src,
  alt,
  fallback,
  fallbackSrc,
  className = "w-full h-full object-cover",
}: {
  src?: string;
  alt: string;
  fallback: React.ReactNode;
  fallbackSrc?: string;
  className?: string;
}) {
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src || fallbackSrc);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
    setHasError(false);
  }, [src, fallbackSrc]);

  if (hasError || !currentSrc) {
    return <>{fallback}</>;
  }
  return (
    <img
      src={currentSrc}
      alt={alt}
      onError={() => {
        if (fallbackSrc && currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        } else {
          setHasError(true);
        }
      }}
      className={className}
      loading="eager"
      decoding="async"
    />
  );
}

export function HomeClient({
  initialApps,
  initialRatingsMap,
}: {
  initialApps: AndroidApp[];
  initialRatingsMap: Record<string, { avg: number; count: number }>;
}) {
  const [apps, setApps] = useState<AndroidApp[]>(initialApps);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [quickFilter, setQuickFilter] = useState<QuickFilterOption>('all');
  const [ratingsMap, setRatingsMap] = useState<Record<string, { avg: number; count: number }>>(initialRatingsMap);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node) &&
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [categories, setCategories] = useState<string[]>(() => {
    const uniqueCats = new Set<string>();
    initialApps.forEach((a: AndroidApp) => {
      if (a.category) uniqueCats.add(a.category);
    });
    return ['All', ...Array.from(uniqueCats)];
  });

  // Hotkey listener: '/' to focus in-page catalog search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        // Prevent default slash behavior and focus catalog search
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

          // Parallel non-blocking review ratings fetch (eliminates sequential N+1 bottleneck)
          const reviewPromises = fetchedApps.map(async (app: AndroidApp) => {
            try {
              const reviewRes = await fetch(`/api/reviews?appSlug=${encodeURIComponent(app.slug)}&t=${Date.now()}`, {
                cache: 'no-store',
                headers: {
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                },
              });
              if (reviewRes.ok) {
                const reviewData = await reviewRes.json();
                return {
                  slug: app.slug,
                  avg: reviewData.averageRating || app.initialRating || 0,
                  count: reviewData.totalCount || app.initialReviewCount || 0,
                };
              }
            } catch {
              // Ignore
            }
            return {
              slug: app.slug,
              avg: app.initialRating || 0,
              count: app.initialReviewCount || 0,
            };
          });

          const settled = await Promise.allSettled(reviewPromises);
          if (isSubscribed) {
            const results: Record<string, { avg: number; count: number }> = {};
            settled.forEach((res) => {
              if (res.status === 'fulfilled' && res.value) {
                results[res.value.slug] = { avg: res.value.avg, count: res.value.count };
              }
            });
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

    // If initialApps wasn't loaded from SSR, fetch it
    if (!initialApps || initialApps.length === 0) {
      loadApps(true);
    }

    const handleAppsUpdated = () => {
      loadApps(false);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'crazystore_apps_last_updated') {
        loadApps(false);
      }
    };

    window.addEventListener('apps_updated', handleAppsUpdated);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      isSubscribed = false;
      window.removeEventListener('apps_updated', handleAppsUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Filter and sort apps dynamically with high-performance memoization
  const filteredApps = useMemo(() => {
    const filtered = filterApps(apps, {
      query: searchQuery,
      category: selectedCategory,
      quickFilter,
          });
    return sortApps(filtered, sortBy, ratingsMap, searchQuery);
  }, [apps, searchQuery, selectedCategory, quickFilter, sortBy, ratingsMap]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    selectedCategory !== 'All' ||
    quickFilter !== 'all' ||
    sortBy !== 'featured'
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setQuickFilter('all');
    setSortBy('featured');
    searchInputRef.current?.focus();
  };

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

      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        {/* 3D WebGL Hero Section */}
        <section className="relative py-8 sm:py-14 md:py-16 lg:py-20 overflow-hidden">
          {/* Background Ambient Glows - Bounded to avoid mobile horizontal scroll */}
          <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[480px] lg:w-[650px] h-[280px] sm:h-[480px] lg:h-[650px] bg-purple-600/15 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute top-1/2 right-4 sm:right-10 w-[220px] sm:w-[360px] lg:w-[450px] h-[220px] sm:h-[360px] lg:h-[450px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-8 lg:gap-12 items-center">
              {/* Left Column: Headline, Highlights & Actions */}
              <div className="md:col-span-6 lg:col-span-6 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-purple-950/70 border border-purple-800/50 text-purple-300 text-[11px] sm:text-xs font-bold mb-4 sm:mb-6 animate-in fade-in slide-in-from-bottom-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="truncate">100% Free &amp; Open Source • Kotlin &amp; Compose</span>
                </div>

                <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-4 sm:mb-6 leading-[1.15] text-zinc-100">
                  The Open Vault for <br className="hidden xs:inline" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-300">
                    Native Android Apps
                  </span>
                </h1>

                <p className="max-w-xl mx-auto md:mx-0 text-xs sm:text-sm md:text-base text-zinc-400 leading-relaxed font-normal">
                  Curated directory of high-performance, ad-free Android applications built natively with Kotlin and Jetpack Compose. Zero telemetry, reproducible builds, and verified open-source code.
                </p>

              </div>

              {/* Right Column: Interactive 3D WebGL Phone Experience */}
              <div className="md:col-span-6 lg:col-span-6 relative flex items-center justify-center">
                <div className="w-full max-w-[420px] md:max-w-full lg:max-w-[560px] relative">
                  <Hero3DExperience apps={apps} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid with accessible anchor id="features" */}
        <section id="features" className="py-8 sm:py-12 bg-zinc-900/50 border-y border-zinc-800 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
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

        {/* App Catalog Section with Ultra-Modern Search & Instant Filters */}
        <section id="catalog" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
          {/* Section Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/40 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  Curated Catalog
                </span>
                <span className="text-xs font-mono text-zinc-400 bg-zinc-900/80 px-2.5 py-0.5 rounded-full border border-zinc-800">
                  {filteredApps.length} of {apps.length} apps
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-1.5 text-zinc-100 tracking-tight">
                Explore Applications
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
                Discover high-performance Android applications with native Jetpack Compose &amp; Kotlin. Ad-free, tracker-free, and verified open-source.
              </p>
            </div>

            {/* Prominent Search & Sort Bar Hub */}
            <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Accessible Search Input Container */}
              <div className="relative flex-1 sm:w-80 lg:w-96 group">
                <label htmlFor="catalog-search" className="sr-only">
                  Search applications
                </label>
                <div className="relative flex items-center rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 focus-within:border-zinc-700 focus-within:ring-1 focus-within:ring-zinc-600/50 transition-all shadow-inner">
                  <div className="pl-3.5 pr-2 pointer-events-none text-zinc-400 group-focus-within:text-zinc-200 transition-colors">
                    <Search className="w-4 h-4 text-zinc-400 group-focus-within:text-zinc-200" />
                  </div>
                  <input
                    ref={searchInputRef}
                    id="catalog-search"
                    type="text"
                    value={searchQuery}
                    autoComplete="off"
                    spellCheck="false"
                    style={{ outline: 'none', boxShadow: 'none' }}
                    onFocus={() => setIsSearchFocused(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchFocused(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setSearchQuery('');
                        setIsSearchFocused(false);
                      }
                    }}
                    placeholder="Search by name, tag, or tech..."
                    className="w-full py-2.5 pr-20 bg-transparent text-zinc-100 placeholder-zinc-500 text-sm sm:text-xs focus:outline-hidden"
                  />

                  {/* Right side controls: Match count badge & Clear button */}
                  <div className="absolute right-2.5 flex items-center gap-1.5">
                    {searchQuery ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setIsSearchFocused(false);
                          searchInputRef.current?.focus();
                        }}
                        className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 cursor-pointer transition-colors"
                        aria-label="Clear search query"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <kbd className="hidden sm:inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-zinc-950 text-zinc-500 border border-zinc-800 group-focus-within:border-zinc-700 group-focus-within:text-zinc-300 transition-colors" title="Press / to focus">
                        /
                      </kbd>
                    )}
                  </div>
                </div>

                {/* Instant Autocomplete / Live Search Preview Dropdown */}
                {isSearchFocused && searchQuery.trim().length > 0 && (
                  <div
                    ref={searchDropdownRef}
                    className="absolute left-0 right-0 top-full mt-2 z-40 p-2 rounded-2xl bg-zinc-950/95 border border-zinc-800 shadow-2xl shadow-black/80 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150"
                  >
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-900 text-[11px] text-zinc-400 font-semibold">
                      <span className="flex items-center gap-1.5 text-zinc-300">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span>Matching Applications ({filteredApps.length})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsSearchFocused(false)}
                        className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                        aria-label="Dismiss search preview"
                        title="Close preview"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-1 p-1">
                      {filteredApps.length > 0 ? (
                        filteredApps.slice(0, 5).map((app) => (
                          <Link
                            key={app.slug}
                            href={`/apps/${app.slug}`}
                            onClick={() => {
                              setIsSearchFocused(false);
                              trackEvent({
                                eventType: 'app_view',
                                appSlug: app.slug,
                                appName: app.name,
                                path: `/apps/${app.slug}`,
                                details: `Live Search dropdown opened: ${app.name}`,
                              });
                            }}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-900/90 border border-transparent hover:border-purple-800/40 text-zinc-300 hover:text-white transition-all cursor-pointer group/item"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
                                  app.iconBg || 'from-purple-600 to-indigo-600'
                                } flex items-center justify-center text-white shrink-0 shadow-md ring-1 ring-white/10 overflow-hidden relative`}
                              >
                                <AppLogoImage
                                  key={app.slug}
                                  src={app.logoUrl}
                                  fallbackSrc={app.slug === 'videohub' ? '/videohub-logo.png' : undefined}
                                  alt={app.name}
                                  fallback={getIconComponent(app.iconSymbol)}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-zinc-100 truncate">
                                    <HighlightedText text={app.name} query={searchQuery} />
                                  </span>
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800 shrink-0">
                                    {app.version}
                                  </span>
                                  {app.initialRating && (
                                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-amber-950/70 text-amber-300 border border-amber-800/40 flex items-center gap-0.5 shrink-0">
                                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                      <span>{app.initialRating.toFixed(1)}</span>
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                                  <HighlightedText text={app.tagline || app.shortDescription} query={searchQuery} />
                                </p>
                              </div>
                            </div>

                            <div className="p-1 rounded-lg text-zinc-500 group-hover/item:text-purple-400 group-hover/item:translate-x-0.5 transition-all">
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="p-4 text-center space-y-2">
                          <p className="text-xs text-zinc-400">
                            No apps found for &ldquo;{searchQuery}&rdquo; in &ldquo;{selectedCategory}&rdquo;.
                          </p>
                          {selectedCategory !== 'All' && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCategory('All');
                                setQuickFilter('all');
                              }}
                              className="px-3 py-1 rounded-lg bg-purple-950 text-purple-300 border border-purple-800/50 text-[11px] font-bold hover:bg-purple-900/60 transition-colors cursor-pointer"
                            >
                              Search across All Categories
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sort Dropdown Selector */}
              <div className="relative shrink-0">
                <label htmlFor="catalog-sort" className="sr-only">
                  Sort applications
                </label>
                <div className="relative flex items-center rounded-2xl bg-zinc-900/90 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:border-zinc-700 transition-all">
                  <div className="pl-3 pointer-events-none text-purple-400">
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                  <select
                    id="catalog-sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full sm:w-auto py-2.5 pl-2.5 pr-8 bg-transparent text-zinc-200 text-xs font-medium cursor-pointer focus:outline-hidden appearance-none"
                  >
                    <option value="featured" className="bg-zinc-900 text-zinc-200">Sort: Featured</option>
                    <option value="rating-desc" className="bg-zinc-900 text-zinc-200">Sort: Highest Rated</option>
                    <option value="name-asc" className="bg-zinc-900 text-zinc-200">Sort: Name (A - Z)</option>
                    <option value="name-desc" className="bg-zinc-900 text-zinc-200">Sort: Name (Z - A)</option>
                    <option value="size-asc" className="bg-zinc-900 text-zinc-200">Sort: Smallest Size</option>
                  </select>
                  <div className="pr-3 pointer-events-none text-zinc-500">
                    <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category Filter Pills Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 hide-scrollbar" role="tablist" aria-label="Filter applications by category">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={selectedCategory === cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  trackEvent({
                    eventType: 'category_filter',
                    details: `Filtered apps by "${cat}" category`,
                  });
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer min-h-[40px] focus-visible:ring-2 focus-visible:ring-purple-500 ${
                  selectedCategory === cat
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-600/30'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                {cat}
              </button>
            ))}

            
          </div>

          {/* Quick Filter Badges Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 hide-scrollbar text-xs">
            <span className="text-zinc-500 font-medium flex items-center gap-1 pr-1 shrink-0">
              <Filter className="w-3 h-3 text-purple-400" /> Quick tags:
            </span>

            <button
              type="button"
              onClick={() => setQuickFilter((prev) => (prev === 'zero-trackers' ? 'all' : 'zero-trackers'))}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border ${
                quickFilter === 'zero-trackers'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700/60 shadow-xs'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border-zinc-800/80'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>0 Trackers Only</span>
            </button>

            <button
              type="button"
              onClick={() => setQuickFilter((prev) => (prev === 'compose' ? 'all' : 'compose'))}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border ${
                quickFilter === 'compose'
                  ? 'bg-purple-950 text-purple-300 border-purple-700/60 shadow-xs'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border-zinc-800/80'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>Jetpack Compose</span>
            </button>

            <button
              type="button"
              onClick={() => setQuickFilter((prev) => (prev === 'material-you' ? 'all' : 'material-you'))}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border ${
                quickFilter === 'material-you'
                  ? 'bg-indigo-950 text-indigo-300 border-indigo-700/60 shadow-xs'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border-zinc-800/80'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Material You (M3)</span>
            </button>
          </div>

          {/* Active Filters Summary Strip */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 p-3 mb-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 text-xs text-zinc-400 animate-in fade-in duration-200">
              <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" /> Active filters:
              </span>

              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-950/70 border border-purple-800/50 text-purple-200">
                  <span>Search: &ldquo;{searchQuery}&rdquo;</span>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="hover:text-white p-0.5 rounded cursor-pointer"
                    aria-label="Remove search filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedCategory !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-950/70 border border-purple-800/50 text-purple-200">
                  <span>Category: {selectedCategory}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('All')}
                    className="hover:text-white p-0.5 rounded cursor-pointer"
                    aria-label="Remove category filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {quickFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-950/70 border border-purple-800/50 text-purple-200">
                  <span>Filter: {quickFilter}</span>
                  <button
                    type="button"
                    onClick={() => setQuickFilter('all')}
                    className="hover:text-white p-0.5 rounded cursor-pointer"
                    aria-label="Remove quick filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {sortBy !== 'featured' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-950/70 border border-purple-800/50 text-purple-200">
                  <span>Sort: {sortBy}</span>
                  <button
                    type="button"
                    onClick={() => setSortBy('featured')}
                    className="hover:text-white p-0.5 rounded cursor-pointer"
                    aria-label="Reset sorting"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleResetFilters}
                className="ml-auto inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-medium transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset all</span>
              </button>
            </div>
          )}

          {/* 3D Perspective Tilt Cards Grid / Empty State */}
          {isLoading ? (
            <AppCardSkeleton count={6} />
          ) : filteredApps.length === 0 ? (
            <div className="p-12 text-center bg-zinc-900/40 rounded-3xl border border-dashed border-zinc-800 space-y-5 animate-in fade-in duration-200">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-950/40">
                <Boxes className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-zinc-100">No applications found</h3>
                <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                  We couldn&apos;t find any applications matching &quot;{searchQuery}&quot; in category &quot;{selectedCategory}&quot;.
                </p>
              </div>

              {/* Suggestions chips */}
              <div className="pt-2">
                <p className="text-xs text-zinc-500 mb-2 font-medium">Try searching for popular keywords:</p>
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg mx-auto">
                  {POPULAR_SEARCH_TAGS.slice(0, 5).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setSearchQuery(tag);
                        setSelectedCategory('All');
                        setQuickFilter('all');
                      }}
                      className="px-3 py-1 rounded-xl bg-zinc-900 hover:bg-purple-950/60 border border-zinc-800 hover:border-purple-800/60 text-xs text-zinc-300 hover:text-purple-200 transition-all cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20 cursor-pointer inline-flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Search &amp; Filters</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 card-container">
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
                    className="group flex flex-col h-full bg-zinc-900 border border-zinc-800 hover:border-purple-800/60 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-purple-900/20 transition-all duration-300 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 focus-visible:ring-2 focus-visible:ring-purple-500"
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
                        <AppLogoImage
                          key={app.slug}
                          src={app.logoUrl}
                          fallbackSrc={app.slug === 'videohub' ? '/videohub-logo.png' : undefined}
                          alt={app.name}
                          fallback={getIconComponent(app.iconSymbol)}
                        />
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-1.5">
                          

                          {app.githubUrl && (
                            <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-200 border border-zinc-700/50 text-[10px] font-bold flex items-center gap-1">
                              <FaGithub className="w-3 h-3" /> GitHub
                            </span>
                          )}
                          <span className="px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700/40 text-[10px] font-bold text-zinc-400 font-mono">
                            {app.version}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 text-[10px] font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> 0 Trackers
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-purple-950/50 text-purple-300 border border-purple-800/40 text-[10px] font-bold">
                            <HighlightedText text={app.badge || 'Kotlin + Compose'} query={searchQuery} />
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-xl font-black mb-2 text-zinc-100 group-hover:text-purple-400 transition-colors">
                        <HighlightedText text={app.name} query={searchQuery} />
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed mb-4 line-clamp-2">
                        <HighlightedText text={app.tagline || app.shortDescription} query={searchQuery} />
                      </p>

                      {/* Tech Stack Preview with match highlights */}
                      {app.techStack && app.techStack.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {app.techStack.slice(0, 3).map((tech) => (
                            <span
                              key={tech}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800/60 text-zinc-400 border border-zinc-800"
                            >
                              <HighlightedText text={tech} query={searchQuery} />
                            </span>
                          ))}
                        </div>
                      )}
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

        {/* Generative Engine Optimization (GEO) & FOSS Architecture Standards Section with anchor id="standards" */}
        <section id="standards" className="py-16 bg-zinc-900/40 border-y border-zinc-800 scroll-mt-20">
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
      </main>

      <Footer />
    </div>
  );
}
