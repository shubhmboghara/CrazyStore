'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { AndroidApp } from '@/lib/appsData';
import { formatDownloadUrl, normalizeAppRecord } from '@/lib/appUtils';
import { StarRating } from '@/components/StarRating';
import { ReviewForm } from '@/components/ReviewForm';
import { ReviewsList, ReviewItem } from '@/components/ReviewsList';
import { LazyScreenshot } from '@/components/LazyScreenshot';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { GeoKnowledgeBase } from '@/components/GeoKnowledgeBase';
import { trackEvent } from '@/lib/analytics';
import { FaGithub } from 'react-icons/fa6';
import {
  Download,
  ArrowLeft,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  HardDrive,
  Cpu,
  Share2,
  Play,
  Activity,
  Music,
  Sparkles,
  Info,
  MessageSquare,
  Code2,
  Star,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  ImageIcon,
} from 'lucide-react';

function AppLogoImage({
  src,
  alt,
  fallback,
  className = 'w-full h-full object-cover',
}: {
  src?: string;
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

interface AppDetailClientProps {
  initialApp: AndroidApp;
}

export function AppDetailClient({ initialApp }: AppDetailClientProps) {
  const [appData, setAppData] = useState<AndroidApp>(() => normalizeAppRecord(initialApp));
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(true);
  const [averageRating, setAverageRating] = useState<number>(initialApp.initialRating || 5.0);
  const [totalCount, setTotalCount] = useState<number>(initialApp.initialReviewCount || 0);

  const [activeTab, setActiveTab] = useState<'overview' | 'screenshots' | 'reviews' | 'tech'>('overview');
  const [copied, setCopied] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const previewsContainerRef = useRef<HTMLDivElement | null>(null);

  // Normalize valid screenshots uploaded by admin
  const validPreviews = (appData.screenshots || [])
    .map((s: any, idx: number) => {
      if (typeof s === 'string') {
        const trimmed = s.trim();
        return trimmed
          ? { id: `screenshot-${idx}`, url: trimmed, imageUrl: trimmed, title: `Screenshot ${idx + 1}`, subtitle: '' }
          : null;
      }
      const rawUrl = s?.imageUrl || s?.url || '';
      if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) return null;
      return {
        id: s.id || `screenshot-${idx}`,
        url: rawUrl.trim(),
        imageUrl: rawUrl.trim(),
        title: s.title || `Screenshot ${idx + 1}`,
        subtitle: s.subtitle || '',
      };
    })
    .filter(Boolean) as { id: string; url: string; imageUrl: string; title: string; subtitle?: string }[];

  // Keyboard navigation for screenshot lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : validPreviews.length - 1));
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev !== null && prev < validPreviews.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, validPreviews.length]);

  const scrollPreviews = (direction: 'left' | 'right') => {
    if (previewsContainerRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      previewsContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Fetch the latest fresh app details directly from the API on mount or slug change
  useEffect(() => {
    let isSubscribed = true;

    async function loadFreshAppDetails() {
      try {
        const res = await fetch(`/api/apps?slug=${encodeURIComponent(initialApp.slug)}&t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });
        if (res.ok && isSubscribed) {
          const data = await res.json();
          if (data.app) {
            setAppData(normalizeAppRecord(data.app));
          }
        }
      } catch (err) {
        console.warn('Could not fetch fresh app data from API:', err);
      }
    }

    loadFreshAppDetails();

    const handleAppsUpdated = (e: any) => {
      if (!e.detail?.slug || e.detail.slug.toLowerCase() === initialApp.slug.toLowerCase()) {
        loadFreshAppDetails();
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'crazystore_apps_last_updated') {
        loadFreshAppDetails();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadFreshAppDetails();
      }
    };

    const handleFocus = () => {
      loadFreshAppDetails();
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
  }, [initialApp]);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?appSlug=${appData.slug}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        if (typeof data.averageRating === 'number' && data.averageRating > 0) {
          setAverageRating(data.averageRating);
        }
        if (typeof data.totalCount === 'number') {
          setTotalCount(data.totalCount);
        }
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setIsLoadingReviews(false);
    }
  }, [appData.slug]);

  useEffect(() => {
    let isSubscribed = true;

    async function loadInitialReviews() {
      try {
        const res = await fetch(`/api/reviews?appSlug=${appData.slug}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (res.ok && isSubscribed) {
          const data = await res.json();
          setReviews(data.reviews || []);
          if (typeof data.averageRating === 'number' && data.averageRating > 0) {
            setAverageRating(data.averageRating);
          }
          if (typeof data.totalCount === 'number') {
            setTotalCount(data.totalCount);
          }
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        if (isSubscribed) {
          setIsLoadingReviews(false);
        }
      }
    }

    loadInitialReviews();

    trackEvent({
      eventType: 'app_view',
      appSlug: appData.slug,
      appName: appData.name,
      path: `/apps/${appData.slug}`,
      details: `Visited App Profile: ${appData.name}`,
    });

    return () => {
      isSubscribed = false;
    };
  }, [appData.name, appData.slug]);

  const getIconComponent = (symbol: string) => {
    switch (symbol) {
      case 'play':
        return <Play className="w-8 h-8 text-white fill-white" />;
      case 'activity':
        return <Activity className="w-8 h-8 text-white" />;
      case 'music':
        return <Music className="w-8 h-8 text-white" />;
      default:
        return <Smartphone className="w-8 h-8 text-white" />;
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: appData.name,
          text: appData.shortDescription,
          url: window.location.href,
        });
      } catch {
        // Ignored
      }
    } else if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans text-zinc-100">
      <Navbar />

      <main className="flex-1 pb-16">
        {/* Top Header Banner with optional Admin Banner Backdrop */}
        <section className="relative bg-zinc-900 border-b border-zinc-800 py-10 sm:py-12 overflow-hidden">
          {appData.bannerUrl && (
            <div className="absolute inset-0 pointer-events-none z-0">
              <img
                src={appData.bannerUrl}
                alt={`${appData.name} Banner`}
                className="w-full h-full object-cover object-center opacity-25 blur-xs scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/60 via-zinc-950/85 to-zinc-950" />
            </div>
          )}

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-400 hover:underline mb-6"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Catalog
            </Link>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-start gap-5">
                <div
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br ${
                    appData.iconBg || 'from-purple-600 to-indigo-600'
                  } flex items-center justify-center shadow-xl shadow-purple-500/20 shrink-0 overflow-hidden relative`}
                >
                  <AppLogoImage
                    key={appData.logoUrl || appData.slug}
                    src={appData.logoUrl}
                    alt={appData.name}
                    fallback={getIconComponent(appData.iconSymbol)}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md bg-purple-950/80 text-purple-300 border border-purple-800/50 text-[10px] font-bold">
                      {appData.badge || 'Kotlin + Compose'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-zinc-800 text-zinc-400 text-[10px] font-bold">
                      {appData.version}
                    </span>
                    {validPreviews.length > 0 && (
                      <span className="px-2.5 py-0.5 rounded-md bg-zinc-800/80 text-purple-300 border border-purple-800/40 text-[10px] font-bold flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-purple-400" /> {validPreviews.length} Screenshots
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-black text-zinc-100">
                    {appData.name}
                  </h1>

                  <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
                    {appData.tagline || appData.shortDescription}
                  </p>

                  <div className="pt-2 flex items-center gap-3">
                    <StarRating rating={averageRating} showNumber={true} reviewCount={totalCount} />
                  </div>
                </div>
              </div>

              {/* Download & GitHub CTA Buttons */}
              <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
                <a
                  href={formatDownloadUrl(appData.downloadUrl) || `/api/download?slug=${encodeURIComponent(appData.slug)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    trackEvent({
                      eventType: 'app_download',
                      appSlug: appData.slug,
                      appName: appData.name,
                      isTaskCompleted: true,
                      details: `Downloaded APK: ${appData.name} (${appData.version})`,
                    });
                  }}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm text-center shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-5 h-5" /> Download APK
                </a>
                {appData.githubUrl && (
                  <a
                    href={appData.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      trackEvent({
                        eventType: 'github_click',
                        appSlug: appData.slug,
                        appName: appData.name,
                        details: `Viewed GitHub Source: ${appData.name}`,
                      });
                    }}
                    className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-zinc-800 text-white font-bold text-sm text-center hover:bg-zinc-700 transition-all flex items-center justify-center gap-2 shadow-md border border-zinc-700/50"
                  >
                    <FaGithub className="w-5 h-5" /> GitHub Source
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* App Screenshots / Visual Showcase Carousel */}
        {validPreviews.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-950/60 text-purple-400 border border-purple-800/40">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-zinc-100 flex items-center gap-2">
                      App Screenshots & Visuals
                    </h3>
                    <p className="text-xs text-zinc-400">
                      High-resolution captures uploaded by admin ({validPreviews.length} images) &bull; Tap any image to expand
                    </p>
                  </div>
                </div>

                {/* Carousel Navigation Arrows */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => scrollPreviews('left')}
                    className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors border border-zinc-700/50 cursor-pointer"
                    aria-label="Scroll screenshots left"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollPreviews('right')}
                    className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors border border-zinc-700/50 cursor-pointer"
                    aria-label="Scroll screenshots right"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Horizontal Scroll Carousel */}
              <div
                ref={previewsContainerRef}
                className="flex items-start gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth hide-scrollbar no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              >
                {validPreviews.map((preview, idx) => {
                  const hasCustomTitle = Boolean(
                    preview.title &&
                    !/^screenshot\s*\d*$/i.test(preview.title.trim()) &&
                    !/^preview\s*\d*$/i.test(preview.title.trim())
                  );

                  return (
                    <div
                      key={preview.id || idx}
                      onClick={() => {
                        setLightboxIndex(idx);
                        trackEvent({
                          eventType: 'screenshot_view',
                          appSlug: appData.slug,
                          appName: appData.name,
                          details: `Explored Visuals: ${hasCustomTitle ? preview.title : `Preview ${idx + 1}`} (${appData.name})`,
                        });
                      }}
                      className="shrink-0 w-60 sm:w-64 md:w-72 group cursor-pointer snap-start flex flex-col items-center"
                    >
                      <LazyScreenshot
                        src={preview.imageUrl || preview.url}
                        alt={appData.name}
                        title={preview.title}
                        hasCustomTitle={hasCustomTitle}
                        aspectClass="h-[420px] sm:h-[480px] md:h-[500px]"
                        rootRef={previewsContainerRef}
                        priority={idx < 4}
                      />

                      <div className="mt-3 text-center w-full px-2">
                        <span className="text-xs sm:text-sm font-semibold text-zinc-300 block truncate group-hover:text-purple-400 transition-colors">
                          {preview.title}
                        </span>
                        {preview.subtitle && (
                          <span className="text-[11px] text-zinc-500 block truncate mt-0.5">
                            {preview.subtitle}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Content Tabs & Main Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Main Content Column (8 cols) */}
            <div className="lg:col-span-8 space-y-8">
              {/* Tab Navigation */}
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto hide-scrollbar no-scrollbar [scrollbar-width:none]">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                    activeTab === 'overview'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-600/20'
                      : 'text-zinc-400 hover:bg-zinc-800/60'
                  }`}
                >
                  <Info className="w-4 h-4" /> About & Features
                </button>
                {validPreviews.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('screenshots')}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                      activeTab === 'screenshots'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-600/20'
                        : 'text-zinc-400 hover:bg-zinc-800/60'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" /> Screenshots ({validPreviews.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab('reviews')}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                    activeTab === 'reviews'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-600/20'
                      : 'text-zinc-400 hover:bg-zinc-800/60'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" /> User Reviews ({totalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('tech')}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                    activeTab === 'tech'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-600/20'
                      : 'text-zinc-400 hover:bg-zinc-800/60'
                  }`}
                >
                  <Code2 className="w-4 h-4" /> Tech Stack & Source
                </button>
              </div>

              {/* Tab 1: Overview & About */}
              {activeTab === 'overview' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  {/* Primary About Card */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-5">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-purple-950/60 text-purple-400 border border-purple-800/40">
                          <Info className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-black text-zinc-100">
                            About {appData.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                            Complete application overview and capabilities
                          </p>
                        </div>
                      </div>

                      <span className="self-start sm:self-auto px-3 py-1 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs border border-zinc-700/60">
                        {appData.category || 'Android Application'}
                      </span>
                    </div>

                    {/* Full Description */}
                    <div className="space-y-4 text-sm sm:text-base text-zinc-300 leading-relaxed font-normal">
                      {appData.fullDescription.map((paragraph, index) => (
                        <p key={index} className="leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    {/* Key Highlights */}
                    <div className="pt-6 border-t border-zinc-800/80 space-y-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <h4 className="text-base sm:text-lg font-black text-zinc-100">
                          Key Features & Highlights
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {appData.features.map((feature, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 sm:p-4 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 flex items-start gap-3 hover:border-purple-600/50 transition-colors"
                          >
                            <div className="p-1.5 rounded-xl bg-purple-950/80 text-purple-400 shrink-0 mt-0.5 shadow-xs">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                            <span className="text-xs sm:text-sm font-semibold text-zinc-200 leading-snug">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Specs Bento */}
                    <div className="pt-6 border-t border-zinc-800/80">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
                        Specifications at a Glance
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 rounded-2xl bg-zinc-800/40 border border-zinc-700/40">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase block">Android Version</span>
                          <span className="text-xs sm:text-sm font-black text-zinc-100 mt-0.5 block">{appData.minAndroid}</span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-zinc-800/40 border border-zinc-700/40">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase block">Package Size</span>
                          <span className="text-xs sm:text-sm font-black text-zinc-100 mt-0.5 block">{appData.size}</span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-zinc-800/40 border border-zinc-700/40">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase block">Build Release</span>
                          <span className="text-xs sm:text-sm font-black text-zinc-100 mt-0.5 block">{appData.version}</span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-zinc-800/40 border border-zinc-700/40">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase block">UI Framework</span>
                          <span className="text-xs sm:text-sm font-black text-purple-400 mt-0.5 block">Jetpack Compose</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Community Reviews Teaser Card */}
                  <div className="bg-gradient-to-r from-purple-950/30 via-indigo-950/20 to-transparent border border-purple-800/40 rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                        <span className="text-base font-black text-zinc-100">
                          {averageRating.toFixed(1)} / 5.0 Rating
                        </span>
                        <span className="text-xs text-zinc-500">
                          ({totalCount} verified user {totalCount === 1 ? 'review' : 'reviews'})
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-400">
                        Have you tried {appData.name}? Share your feedback and rating with the community.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('reviews')}
                      className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-600/20 transition-all shrink-0 flex items-center gap-2 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{totalCount > 0 ? 'Read All Reviews' : 'Leave First Review'}</span>
                    </button>
                  </div>

                  {/* GEO Knowledge Base & Instant Answers FAQ */}
                  <GeoKnowledgeBase app={appData} />
                </div>
              )}

              {/* Tab: Screenshots & Visual Gallery */}
              {activeTab === 'screenshots' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-purple-950/60 text-purple-400 border border-purple-800/40">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-black text-zinc-100">
                            {appData.name} Screenshot Gallery
                          </h3>
                          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                            High-resolution UI captures &bull; Click any screenshot to view in full resolution
                          </p>
                        </div>
                      </div>

                      <span className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-purple-950/60 text-purple-300 border border-purple-800/40 text-xs font-bold">
                        {validPreviews.length} Images
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {validPreviews.map((preview, idx) => {
                        const hasCustomTitle = Boolean(
                          preview.title &&
                          !/^screenshot\s*\d*$/i.test(preview.title.trim()) &&
                          !/^preview\s*\d*$/i.test(preview.title.trim())
                        );

                        return (
                          <div
                            key={preview.id || idx}
                            onClick={() => {
                              setLightboxIndex(idx);
                              trackEvent({
                                eventType: 'screenshot_view',
                                appSlug: appData.slug,
                                appName: appData.name,
                                details: `Explored Visuals: ${hasCustomTitle ? preview.title : `Preview ${idx + 1}`} (${appData.name})`,
                              });
                            }}
                            className="group cursor-pointer flex flex-col items-center"
                          >
                            <LazyScreenshot
                              src={preview.imageUrl || preview.url}
                              alt={appData.name}
                              title={preview.title}
                              hasCustomTitle={hasCustomTitle}
                              aspectClass="h-[440px] sm:h-[480px]"
                              priority={idx < 3}
                            />

                            <div className="mt-3 text-center w-full px-2">
                              <span className="text-xs sm:text-sm font-bold text-zinc-300 block truncate group-hover:text-purple-400 transition-colors">
                                {preview.title}
                              </span>
                              {preview.subtitle && (
                                <span className="text-[11px] text-zinc-500 block truncate mt-0.5">
                                  {preview.subtitle}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: User Reviews */}
              {activeTab === 'reviews' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <ReviewForm appSlug={appData.slug} onReviewSubmitted={fetchReviews} />
                  <ReviewsList
                    reviews={reviews}
                    isLoading={isLoadingReviews}
                    averageRating={averageRating}
                    totalCount={totalCount}
                  />
                </div>
              )}

              {/* Tab 3: Tech Stack & Architecture */}
              {activeTab === 'tech' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
                  <h3 className="text-lg font-black text-zinc-100">
                    Android Architecture & Stack
                  </h3>

                  {appData.githubUrl && (
                    <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-zinc-900 text-white">
                          <FaGithub className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="font-bold text-sm block text-white">GitHub Source Repository</span>
                          <span className="text-xs text-zinc-400 font-mono line-clamp-1">{appData.githubUrl}</span>
                        </div>
                      </div>
                      <a
                        href={appData.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shrink-0 transition-colors text-center"
                      >
                        Open Source Code
                      </a>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {appData.techStack.map((tech) => (
                      <div
                        key={tech}
                        className="p-3 rounded-xl bg-purple-950/40 border border-purple-900/40 text-center"
                      >
                        <span className="font-bold text-xs text-purple-300 block">
                          {tech}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-800/50 border border-zinc-700/60 space-y-2">
                    <span className="text-xs font-bold text-zinc-400 block uppercase">Requirements</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300">
                      <div>Minimum Android: <span className="font-bold text-zinc-100">{appData.minAndroid}</span></div>
                      <div>Architecture: <span className="font-bold text-zinc-100">arm64-v8a, armeabi-v7a, x86_64</span></div>
                      <div>Internet Permission: <span className="font-bold text-zinc-100">Optional</span></div>
                      <div>Google Play Services: <span className="font-bold text-zinc-100">Not Required (100% De-Googled)</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar Column (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Quick Download Card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-md space-y-5">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${
                      appData.iconBg || 'from-purple-600 to-indigo-600'
                    } flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0 overflow-hidden relative`}
                  >
                    <AppLogoImage
                      key={appData.logoUrl || appData.slug}
                      src={appData.logoUrl}
                      alt={appData.name}
                      fallback={getIconComponent(appData.iconSymbol)}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base text-zinc-100 truncate">
                      {appData.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded-md bg-purple-950/80 text-purple-300 border border-purple-800/50 text-[10px] font-bold">
                        {appData.version}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {appData.size}
                      </span>
                    </div>
                  </div>
                </div>

                <a
                  href={formatDownloadUrl(appData.downloadUrl) || `/api/download?slug=${encodeURIComponent(appData.slug)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    trackEvent({
                      eventType: 'app_download',
                      appSlug: appData.slug,
                      appName: appData.name,
                      isTaskCompleted: true,
                      details: `Downloaded APK from sidebar: ${appData.name} (${appData.version})`,
                    });
                  }}
                  className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm text-center shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-5 h-5" /> Download APK ({appData.size})
                </a>

                <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>100% Free &bull; Verified Safe &bull; No Ads</span>
                </div>
              </div>

              {/* Quick Info Bento Box */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-sm space-y-5">
                <h4 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  App Meta & Specs
                </h4>

                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-zinc-800">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5" /> File Size
                    </span>
                    <span className="font-bold text-zinc-100">{appData.size}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-zinc-800">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5" /> Min Android
                    </span>
                    <span className="font-bold text-zinc-100">{appData.minAndroid}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-zinc-800">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Release Date
                    </span>
                    <span className="font-bold text-zinc-100">{appData.updatedAt || 'Recent'}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-zinc-800">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Security
                    </span>
                    <span className="font-bold text-emerald-400">Verified & Safe</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="w-full py-3 px-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-zinc-700/50"
                  >
                    <Share2 className="w-4 h-4" /> {copied ? 'Link Copied!' : 'Share Application'}
                  </button>
                </div>
              </div>

              {/* App Specs & Safety Card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xs space-y-4">
                <h4 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  App Details & Security
                </h4>

                <div className="space-y-3 text-xs divide-y divide-zinc-800/80">
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-zinc-400">Category</span>
                    <span className="font-semibold text-zinc-200">{appData.category || 'Media & Utilities'}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2.5">
                    <span className="text-zinc-400">Package Size</span>
                    <span className="font-semibold text-zinc-200">{appData.size}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2.5">
                    <span className="text-zinc-400">Target Platform</span>
                    <span className="font-semibold text-zinc-200">{appData.minAndroid}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2.5">
                    <span className="text-zinc-400">License</span>
                    <span className="font-semibold text-purple-400">Open Source (MIT / Apache)</span>
                  </div>
                  <div className="flex items-center justify-between pt-2.5">
                    <span className="text-zinc-400">Safety & Ads</span>
                    <span className="font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 100% Free & No Ads
                    </span>
                  </div>
                </div>

                {appData.githubUrl && (
                  <div className="pt-2">
                    <a
                      href={appData.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-zinc-700/50"
                    >
                      <FaGithub className="w-4 h-4" /> View on GitHub
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Fullscreen Lightbox Modal (Google Play / App Store Style) */}
        {lightboxIndex !== null && validPreviews[lightboxIndex] && (
          <div
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in select-none"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Top Lightbox Bar */}
            <div
              className="w-full max-w-6xl flex items-center justify-between z-20 pb-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-sm font-bold text-white block">
                    {appData.name}
                  </span>
                  {validPreviews[lightboxIndex].title && (
                    <span className="text-xs text-purple-300 font-medium block">
                      {validPreviews[lightboxIndex].title} ({lightboxIndex + 1} of {validPreviews.length})
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Download / Open Original */}
                <a
                  href={validPreviews[lightboxIndex].imageUrl || validPreviews[lightboxIndex].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-md border border-white/10 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  title="Open original image in new tab"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Original</span>
                </a>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setLightboxIndex(null)}
                  className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-md border border-white/10 cursor-pointer"
                  title="Close (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Central Stage */}
            <div
              className="relative flex-1 w-full flex items-center justify-center p-2 min-h-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Navigation Left */}
              {validPreviews.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : validPreviews.length - 1));
                  }}
                  className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-full bg-black/60 hover:bg-purple-600 text-white transition-all backdrop-blur-md border border-white/15 z-30 shadow-2xl hover:scale-105 cursor-pointer"
                  title="Previous (Left Arrow)"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Central Zoomed Image */}
              <div className="relative z-10 max-h-[78vh] flex items-center justify-center shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden border border-white/15 bg-zinc-950">
                <img
                  src={validPreviews[lightboxIndex].imageUrl || validPreviews[lightboxIndex].url}
                  alt={validPreviews[lightboxIndex].title || appData.name}
                  className="max-h-[76vh] w-auto max-w-[85vw] object-contain rounded-2xl sm:rounded-3xl"
                />
              </div>

              {/* Navigation Right */}
              {validPreviews.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((prev) => (prev !== null && prev < validPreviews.length - 1 ? prev + 1 : 0));
                  }}
                  className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-full bg-black/60 hover:bg-purple-600 text-white transition-all backdrop-blur-md border border-white/15 z-30 shadow-2xl hover:scale-105 cursor-pointer"
                  title="Next (Right Arrow)"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Bottom thumbnail strip & Keyboard tip */}
            <div
              className="w-full max-w-4xl flex flex-col items-center gap-2.5 z-20 pt-2"
              onClick={(e) => e.stopPropagation()}
            >
              {validPreviews.length > 1 && (
                <div className="flex items-center justify-center gap-2.5 px-3 py-2 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 overflow-x-auto hide-scrollbar max-w-full">
                  {validPreviews.map((preview, idx) => (
                    <button
                      key={preview.id || idx}
                      type="button"
                      onClick={() => setLightboxIndex(idx)}
                      className={`w-11 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 relative cursor-pointer ${
                        idx === lightboxIndex
                          ? 'border-purple-500 scale-105 shadow-lg shadow-purple-500/50 ring-2 ring-purple-400'
                          : 'border-white/20 opacity-50 hover:opacity-100 hover:border-white/60'
                      }`}
                    >
                      <img
                        src={preview.imageUrl || preview.url}
                        alt={preview.title || `Screenshot thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              <span className="text-[11px] text-zinc-400 font-medium hidden sm:inline-block">
                Use Left & Right Arrow keys to navigate &bull; Press Esc to close
              </span>
            </div>
          </div>
        )}

        {/* Mobile Sticky Download Action Bar */}
        <div className="fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 px-4 py-3 sm:hidden flex items-center justify-between gap-3 shadow-2xl">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-11 h-11 rounded-xl bg-gradient-to-br ${
                appData.iconBg || 'from-purple-600 to-indigo-600'
              } flex items-center justify-center shrink-0 overflow-hidden relative shadow-md`}
            >
              <AppLogoImage
                key={appData.logoUrl || appData.slug}
                src={appData.logoUrl}
                alt={appData.name}
                fallback={getIconComponent(appData.iconSymbol)}
              />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-sm text-zinc-100 block truncate">
                {appData.name}
              </span>
              <span className="text-[11px] text-zinc-400 block">
                {appData.version} &bull; {appData.size}
              </span>
            </div>
          </div>

          <a
            href={formatDownloadUrl(appData.downloadUrl) || `/api/download?slug=${encodeURIComponent(appData.slug)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackEvent({
                eventType: 'app_download',
                appSlug: appData.slug,
                appName: appData.name,
                isTaskCompleted: true,
                details: `Downloaded APK from mobile bottom bar: ${appData.name}`,
              });
            }}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-lg shadow-purple-600/30 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
