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
import { useToast } from '@/components/Toast';
import { trackEvent } from '@/lib/analytics';
import { Screenshots3DBackdrop, Screenshots3DPhoneView } from '@/components/three';
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
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Boxes,
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

  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'tech'>('overview');
  const [selected3DIdx, setSelected3DIdx] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState<number>(1);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const handleTabKeyDown = (e: React.KeyboardEvent, currentTab: 'overview' | 'reviews' | 'tech') => {
    const tabs: ('overview' | 'reviews' | 'tech')[] = ['overview', 'reviews', 'tech'];
    const currentIdx = tabs.indexOf(currentTab);
    let nextTab: 'overview' | 'reviews' | 'tech' | null = null;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextTab = tabs[(currentIdx + 1) % tabs.length];
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextTab = tabs[(currentIdx - 1 + tabs.length) % tabs.length];
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextTab = tabs[0];
    } else if (e.key === 'End') {
      e.preventDefault();
      nextTab = tabs[tabs.length - 1];
    }

    if (nextTab) {
      setActiveTab(nextTab);
      const targetElem = document.getElementById(`tab-${nextTab}`);
      targetElem?.focus();
    }
  };
  const { showToast } = useToast();
  const dialogRef = useRef<HTMLDialogElement>(null);

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

  // Synchronize native HTML5 <dialog> modal with state
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (lightboxIndex !== null) {
      if (!dialog.open) {
        try {
          dialog.showModal();
        } catch {
          // Fallback if dialog.showModal is not supported in environment
        }
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [lightboxIndex]);

  // Keyboard navigation & body scroll lock for screenshot lightbox
  useEffect(() => {
    setLightboxZoom(1);
    if (lightboxIndex === null) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

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
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxIndex, validPreviews.length]);

  // Mobile touch gesture support for Lightbox
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const distance = touchStartXRef.current - touchEndXRef.current;
    if (distance > 50) {
      // Swiped left -> next screenshot
      setLightboxIndex((prev) => (prev !== null && prev < validPreviews.length - 1 ? prev + 1 : 0));
    } else if (distance < -50) {
      // Swiped right -> prev screenshot
      setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : validPreviews.length - 1));
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
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

  const handleDownloadClick = (source: string) => {
    setIsDownloading(true);
    showToast(`Starting verified download: ${appData.name} APK (${appData.size})`, 'success');
    trackEvent({
      eventType: 'app_download',
      appSlug: appData.slug,
      appName: appData.name,
      isTaskCompleted: true,
      details: `Downloaded APK from ${source}: ${appData.name} (${appData.version})`,
    });
    setTimeout(() => {
      setIsDownloading(false);
    }, 2500);
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: appData.name,
          text: appData.shortDescription,
          url: window.location.href,
        });
        showToast('Application link shared successfully!', 'info');
      } catch {
        // Ignored
      }
    } else if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      showToast('Application link copied to clipboard!', 'info');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans text-zinc-100">
      <Navbar />

      <main id="main-content" tabIndex={-1} className="flex-1 pb-32 sm:pb-16 focus:outline-none">
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
            {/* Semantic Accessible Breadcrumb Navigation */}
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                <li>
                  <Link href="/" className="hover:text-purple-300 transition-colors flex items-center gap-1">
                    <ArrowLeft className="w-3.5 h-3.5" /> Storefront
                  </Link>
                </li>
                <li aria-hidden="true" className="text-zinc-400">/</li>
                <li>
                  <Link href="/#catalog" className="hover:text-purple-300 transition-colors">
                    Catalog
                  </Link>
                </li>
                <li aria-hidden="true" className="text-zinc-400">/</li>
                <li aria-current="page" className="text-zinc-100 font-bold truncate max-w-[200px]">
                  {appData.name}
                </li>
              </ol>
            </nav>

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
                  onClick={() => handleDownloadClick('header_cta')}
                  className={`w-full sm:w-auto px-8 py-4 rounded-2xl text-white font-bold text-sm text-center shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isDownloading
                      ? 'bg-emerald-600 shadow-emerald-600/30 ring-2 ring-emerald-400/50'
                      : 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/30'
                  }`}
                  aria-live="polite"
                >
                  {isDownloading ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-white animate-in zoom-in-75" />
                      <span>Downloading APK...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>Download APK</span>
                    </>
                  )}
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

        {/* Screenshots & Visuals Showcase (3D WebGL Studio) */}
        {validPreviews.length > 0 && (
          <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-6 sm:mt-8">
            <div className="bg-zinc-950/90 border border-zinc-800/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 md:p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
              {/* Subtle Ambient Three.js Particle & Grid Canvas */}
              <Screenshots3DBackdrop />

              {/* Section Header */}
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-800/80">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-purple-950/60 text-purple-400 border border-purple-800/50 shadow-inner shrink-0">
                    <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg md:text-xl font-black text-zinc-100 truncate">
                        Screenshots &amp; Visuals
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-800/60 text-[10px] sm:text-xs font-bold text-purple-300 shrink-0">
                        {validPreviews.length} High-Res Screens
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 truncate hidden xs:block">
                      Interactive 3D WebGL studio &bull; Drag to rotate 360° &bull; Scroll to zoom out &bull; Tap to open fullscreen
                    </p>
                  </div>
                </div>

              </div>

              {/* Active Screenshot Feature Highlight Banner */}
              <div className="relative z-10 mb-4 px-3.5 sm:px-4 py-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-black text-zinc-100 truncate">
                        {validPreviews[selected3DIdx]?.title || `Screen ${selected3DIdx + 1}`}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-950/80 text-purple-300 border border-purple-800/40 font-bold shrink-0">
                        {selected3DIdx + 1} of {validPreviews.length}
                      </span>
                    </div>
                    {validPreviews[selected3DIdx]?.subtitle && (
                      <p className="text-[11px] sm:text-xs text-zinc-400 truncate mt-0.5">
                        {validPreviews[selected3DIdx].subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(selected3DIdx)}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-purple-600/20 cursor-pointer active:scale-95"
                    title="Inspect Fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Inspect Fullscreen</span>
                  </button>
                  <a
                    href={validPreviews[selected3DIdx]?.imageUrl || validPreviews[selected3DIdx]?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors border border-zinc-700/60 cursor-pointer"
                    title="Open original vector in new tab"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Three.js 3D Smartphone Viewport */}
              <div className="relative z-10 pt-1">
                <Screenshots3DPhoneView
                  app={appData}
                  screenshots={validPreviews}
                  activeIdx={selected3DIdx}
                  onSelectScreenshot={(idx) => setSelected3DIdx(idx)}
                  onOpenLightbox={(idx) => setLightboxIndex(idx)}
                />
              </div>

              {/* Ambient bottom glow decoration */}
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-16 left-1/2 -translate-x-1/2 w-2/3 h-24 rounded-full opacity-15 blur-3xl"
                style={{ background: 'radial-gradient(ellipse, #a855f7 0%, #06b6d4 100%)' }}
              />
            </div>
          </section>
        )}

        {/* Content Tabs & Main Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Main Content Column (8 cols) */}
            <div className="lg:col-span-8 space-y-8">
              {/* Tab Navigation with WAI-ARIA pattern */}
              <div role="tablist" aria-label="Application Details Tabs" className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto hide-scrollbar no-scrollbar [scrollbar-width:none]">
                <button
                  type="button"
                  role="tab"
                  id="tab-overview"
                  aria-selected={activeTab === 'overview'}
                  aria-controls="panel-overview"
                  tabIndex={activeTab === 'overview' ? 0 : -1}
                  onClick={() => setActiveTab('overview')}
                  onKeyDown={(e) => handleTabKeyDown(e, 'overview')}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-400 ${
                    activeTab === 'overview'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-600/20'
                      : 'text-zinc-400 hover:bg-zinc-800/60'
                  }`}
                >
                  <Info className="w-4 h-4" /> About &amp; Features
                </button>
                <button
                  type="button"
                  role="tab"
                  id="tab-reviews"
                  aria-selected={activeTab === 'reviews'}
                  aria-controls="panel-reviews"
                  tabIndex={activeTab === 'reviews' ? 0 : -1}
                  onClick={() => setActiveTab('reviews')}
                  onKeyDown={(e) => handleTabKeyDown(e, 'reviews')}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-400 ${
                    activeTab === 'reviews'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-600/20'
                      : 'text-zinc-400 hover:bg-zinc-800/60'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" /> User Reviews ({totalCount})
                </button>
                <button
                  type="button"
                  role="tab"
                  id="tab-tech"
                  aria-selected={activeTab === 'tech'}
                  aria-controls="panel-tech"
                  tabIndex={activeTab === 'tech' ? 0 : -1}
                  onClick={() => setActiveTab('tech')}
                  onKeyDown={(e) => handleTabKeyDown(e, 'tech')}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-400 ${
                    activeTab === 'tech'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-600/20'
                      : 'text-zinc-400 hover:bg-zinc-800/60'
                  }`}
                >
                  <Code2 className="w-4 h-4" /> Tech Stack &amp; Source
                </button>
              </div>

              {/* Tab 1: Overview & About */}
              {activeTab === 'overview' && (
                <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview" tabIndex={0} className="space-y-8 animate-in fade-in duration-300">
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
                          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
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
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                        Specifications at a Glance
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 rounded-2xl bg-zinc-800/40 border border-zinc-700/40">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase block">Android Version</span>
                          <span className="text-xs sm:text-sm font-black text-zinc-100 mt-0.5 block">{appData.minAndroid}</span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-zinc-800/40 border border-zinc-700/40">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase block">Package Size</span>
                          <span className="text-xs sm:text-sm font-black text-zinc-100 mt-0.5 block">{appData.size}</span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-zinc-800/40 border border-zinc-700/40">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase block">Build Release</span>
                          <span className="text-xs sm:text-sm font-black text-zinc-100 mt-0.5 block">{appData.version}</span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-zinc-800/40 border border-zinc-700/40">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase block">UI Framework</span>
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
                        <span className="text-xs text-zinc-400">
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

              {/* Tab 2: User Reviews */}
              {activeTab === 'reviews' && (
                <div role="tabpanel" id="panel-reviews" aria-labelledby="tab-reviews" tabIndex={0} className="space-y-8 animate-in fade-in duration-300">
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
                <div role="tabpanel" id="panel-tech" aria-labelledby="tab-tech" tabIndex={0} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
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
                  onClick={() => handleDownloadClick('sidebar')}
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

        {/* Fullscreen Lightbox Modal (Native HTML5 <dialog> Platform Architecture) */}
        {lightboxIndex !== null && validPreviews[lightboxIndex] && (
          <dialog
            ref={dialogRef}
            aria-modal="true"
            aria-label="Screenshot lightbox modal"
            onCancel={(e) => {
              e.preventDefault();
              setLightboxIndex(null);
            }}
            className="fixed inset-0 m-0 p-0 w-full h-[100dvh] max-w-none max-h-none bg-black/95 backdrop:backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-5 text-zinc-100 border-0 select-none overscroll-contain z-50 animate-in fade-in"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Top Lightbox Bar */}
            <div
              className="w-full max-w-6xl flex items-center justify-between z-20 shrink-0 pb-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="min-w-0">
                  <span className="text-sm font-bold text-white block truncate">
                    {appData.name}
                  </span>
                  {validPreviews[lightboxIndex].title && (
                    <span className="text-xs text-purple-300 font-medium block truncate">
                      {validPreviews[lightboxIndex].title} ({lightboxIndex + 1} of {validPreviews.length})
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-2xl p-1 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setLightboxZoom((prev) => Math.max(1, +(prev - 0.35).toFixed(2)))}
                    disabled={lightboxZoom <= 1}
                    className="p-1.5 sm:p-2 rounded-xl hover:bg-white/20 text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    title="Zoom Out (-)"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-bold text-zinc-300 px-1 min-w-[3.5ch] text-center">
                    {Math.round(lightboxZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setLightboxZoom((prev) => Math.min(2.5, +(prev + 0.35).toFixed(2)))}
                    disabled={lightboxZoom >= 2.5}
                    className="p-1.5 sm:p-2 rounded-xl hover:bg-white/20 text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    title="Zoom In (+)"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  {lightboxZoom > 1 && (
                    <button
                      type="button"
                      onClick={() => setLightboxZoom(1)}
                      className="p-1.5 sm:p-2 rounded-xl hover:bg-white/20 text-purple-300 transition-colors cursor-pointer"
                      title="Reset Zoom"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Download / Open Original */}
                <a
                  href={validPreviews[lightboxIndex].imageUrl || validPreviews[lightboxIndex].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 sm:p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-md border border-white/10 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  title="Open original image in new tab"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Original</span>
                </a>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setLightboxIndex(null)}
                  className="p-2 sm:p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-md border border-white/10 cursor-pointer"
                  title="Close (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Central Stage */}
            <div
              className="relative flex-1 w-full min-h-0 flex items-center justify-center p-1 sm:p-2 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Navigation Left */}
              {validPreviews.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : validPreviews.length - 1));
                  }}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2.5 sm:p-3.5 rounded-full bg-black/60 hover:bg-purple-600 text-white transition-all backdrop-blur-md border border-white/15 z-30 shadow-2xl hover:scale-105 cursor-pointer"
                  title="Previous (Left Arrow)"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}

              {/* Central Zoomed Image - 100% visible, zero bottom cropping, interactive zoom scale */}
              <div className="relative z-10 w-full h-full max-h-full max-w-full flex items-center justify-center pointer-events-none">
                <img
                  src={validPreviews[lightboxIndex].imageUrl || validPreviews[lightboxIndex].url}
                  alt={validPreviews[lightboxIndex].title || appData.name}
                  style={{
                    transform: `scale(${lightboxZoom})`,
                    transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  className="max-h-full max-w-full w-auto h-auto object-contain rounded-xl sm:rounded-2xl shadow-2xl border border-white/15 bg-zinc-950 pointer-events-auto select-none"
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
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2.5 sm:p-3.5 rounded-full bg-black/60 hover:bg-purple-600 text-white transition-all backdrop-blur-md border border-white/15 z-30 shadow-2xl hover:scale-105 cursor-pointer"
                  title="Next (Right Arrow)"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}
            </div>

            {/* Bottom thumbnail strip & Keyboard tip */}
            <div
              className="w-full max-w-4xl flex flex-col items-center gap-1.5 sm:gap-2.5 z-20 shrink-0 pt-1 sm:pt-2 pb-1 sm:pb-2"
              onClick={(e) => e.stopPropagation()}
            >
              {validPreviews.length > 1 && (
                <div className="flex items-center justify-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 overflow-x-auto hide-scrollbar max-w-full">
                  {validPreviews.map((preview, idx) => (
                    <button
                      key={preview.id || idx}
                      type="button"
                      onClick={() => setLightboxIndex(idx)}
                      className={`w-9 h-13 sm:w-11 sm:h-16 rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all shrink-0 relative cursor-pointer ${
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
                Use Left &amp; Right Arrow keys or swipe to navigate &bull; Press Esc to close
              </span>
            </div>
          </dialog>
        )}

        {/* Mobile Sticky Download Action Bar with Safe-Area padding */}
        <div
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}
          className="fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 px-4 py-3 sm:hidden flex items-center justify-between gap-3 shadow-2xl"
        >
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
            onClick={() => handleDownloadClick('mobile_sticky_bar')}
            className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-lg transition-all cursor-pointer ${
              isDownloading
                ? 'bg-emerald-600 shadow-emerald-600/30 ring-2 ring-emerald-400/50'
                : 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/30'
            }`}
            aria-live="polite"
          >
            {isDownloading ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download</span>
              </>
            )}
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
