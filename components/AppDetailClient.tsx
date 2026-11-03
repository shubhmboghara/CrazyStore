'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { AndroidApp } from '@/lib/appsData';
import { formatDownloadUrl, normalizeAppRecord, mergeAppWithDefaults } from '@/lib/appUtils';
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
import { DataSafetyCard } from '@/components/DataSafetyCard';
import { DownloadQrModal } from '@/components/DownloadQrModal';
import { checkDeviceCompatibility } from '@/lib/deviceCompatibility';
import { FaGithub } from 'react-icons/fa6';
import {
  Download,
  ArrowLeft,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
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
    ZoomIn,
  ZoomOut,
  RotateCcw,
  Boxes,
  QrCode,
  FileCheck,
} from 'lucide-react';

function AppLogoImage({
  src,
  alt,
  fallback,
  fallbackSrc,
  className = 'w-full h-full object-cover',
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

interface AppDetailClientProps {
  initialApp: AndroidApp;
}

export function AppDetailClient({ initialApp }: AppDetailClientProps) {
  const [appData, setAppData] = useState<AndroidApp>(() => normalizeAppRecord(initialApp));
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(true);
  const [averageRating, setAverageRating] = useState<number>(initialApp.initialRating || 5.0);
  const [totalCount, setTotalCount] = useState<number>(initialApp.initialReviewCount || 0);

  const [activeTab, setActiveTab] = useState<'reviews' | 'overview' | 'safety' | 'tech'>('reviews');
  const [selected3DIdx, setSelected3DIdx] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState<number>(1);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Advanced App Store Feature Modals & Utilities
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#about' || hash === '#overview') {
        setActiveTab('overview');
      } else if (hash === '#safety' || hash === '#privacy') {
        setActiveTab('safety');
      } else if (hash === '#tech' || hash === '#source') {
        setActiveTab('tech');
      } else if (hash === '#reviews') {
        setActiveTab('reviews');
      }
    }
  }, []);

  const compat = useMemo(() => checkDeviceCompatibility(appData.minAndroid), [appData.minAndroid]);

  const handleTabKeyDown = (e: React.KeyboardEvent, currentTab: 'reviews' | 'overview' | 'safety' | 'tech') => {
    const tabs: ('reviews' | 'overview' | 'safety' | 'tech')[] = ['reviews', 'overview', 'safety', 'tech'];
    const currentIdx = tabs.indexOf(currentTab);
    let nextTab: 'reviews' | 'overview' | 'safety' | 'tech' | null = null;

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
            setAppData(mergeAppWithDefaults(initialApp, data.app));
          }
        }
      } catch (err) {
        console.warn('Could not fetch fresh app data from API:', err);
      }
    }

    // Only fetch if initialApp was missing, otherwise retain server-rendered state
    if (!initialApp || !initialApp.name) {
      loadFreshAppDetails();
    }

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

    window.addEventListener('apps_updated', handleAppsUpdated);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      isSubscribed = false;
      window.removeEventListener('apps_updated', handleAppsUpdated);
      window.removeEventListener('storage', handleStorageChange);
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
                    key={appData.slug}
                    src={appData.logoUrl}
                    fallbackSrc={appData.slug === 'videohub' ? '/videohub-logo.png' : undefined}
                    alt={appData.name}
                    fallback={getIconComponent(appData.iconSymbol)}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md bg-purple-950/80 text-purple-300 border border-purple-800/50 text-[10px] font-bold">
                      {appData.badge || 'Kotlin + Compose'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-zinc-800 text-zinc-400 text-[10px] font-bold">
                      {appData.version}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 text-[10px] font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      0 Trackers
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-zinc-900 text-zinc-300 border border-zinc-800 text-[10px] font-mono font-bold">
                      {appData.license || 'GPL-3.0'}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-black text-zinc-100">
                    {appData.name}
                  </h1>

                  <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
                    {appData.tagline || appData.shortDescription}
                  </p>

                  <div className="pt-1 flex items-center gap-4 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('reviews');
                        document.getElementById('panel-reviews')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="hover:opacity-85 transition-opacity cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded-lg p-0.5"
                      title="View user reviews"
                      aria-label={`Rating: ${averageRating.toFixed(1)} out of 5 stars with ${totalCount} reviews. Click to view user reviews.`}
                    >
                      <div className="pointer-events-none">
                        <StarRating rating={averageRating} showNumber={true} reviewCount={totalCount} />
                      </div>
                    </button>

                    {/* Automatic Device Compatibility Indicator */}
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-300 px-2.5 py-1 rounded-xl bg-zinc-950 border border-zinc-800">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          compat.status === 'compatible'
                            ? 'bg-emerald-400 shadow-xs shadow-emerald-400/50 animate-pulse'
                            : compat.status === 'warning'
                            ? 'bg-amber-400'
                            : 'bg-purple-400'
                        }`}
                      />
                      <span>{compat.message}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Download & Feature Action Buttons */}
              <div className="w-full sm:w-auto flex flex-col gap-2.5">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <a
                    href={formatDownloadUrl(appData.downloadUrl) || `/api/download?slug=${encodeURIComponent(appData.slug)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleDownloadClick('header_cta')}
                    className={`w-full sm:w-auto px-7 py-3.5 rounded-2xl text-white font-bold text-sm text-center shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
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
                      className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-zinc-800 text-white font-bold text-sm text-center hover:bg-zinc-700 transition-all flex items-center justify-center gap-2 shadow-md border border-zinc-700/50"
                    >
                      <FaGithub className="w-5 h-5" /> GitHub Source
                    </a>
                  )}
                </div>

                {/* Secondary Quick-Action Tools */}
                <div className="flex items-center gap-1.5 justify-start sm:justify-end overflow-x-auto hide-scrollbar max-w-full pb-1 pt-1 [scrollbar-width:none]">
                  {/* Scan QR Code button */}
                  <button
                    type="button"
                    onClick={() => setIsQrModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer min-h-[36px] shrink-0"
                    title="Scan QR Code to install directly on phone"
                  >
                    <QrCode className="w-3.5 h-3.5 text-purple-400" />
                    <span>Scan QR</span>
                  </button>

                  {/* Share button */}
                  <button
                    type="button"
                    onClick={handleShare}
                    className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer min-h-[36px] shrink-0"
                    title="Share app profile"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Share</span>
                  </button>
                </div>
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
          <div className="space-y-6 sm:space-y-8">
            {/* Tab Navigation with WAI-ARIA pattern */}
            <div role="tablist" aria-label="Application Details Tabs" className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto hide-scrollbar no-scrollbar [scrollbar-width:none]">
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
                  id="tab-safety"
                  aria-selected={activeTab === 'safety'}
                  aria-controls="panel-safety"
                  tabIndex={activeTab === 'safety' ? 0 : -1}
                  onClick={() => setActiveTab('safety')}
                  onKeyDown={(e) => handleTabKeyDown(e, 'safety')}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-400 ${
                    activeTab === 'safety'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-600/20'
                      : 'text-zinc-400 hover:bg-zinc-800/60'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Data Safety &amp; Privacy
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

              {/* Tab 1: User Reviews (Primary focus) */}
              {activeTab === 'reviews' && (
                <div role="tabpanel" id="panel-reviews" aria-labelledby="tab-reviews" tabIndex={0} className="space-y-8 animate-in fade-in duration-300">
                  <ReviewsList
                    reviews={reviews}
                    isLoading={isLoadingReviews}
                    averageRating={averageRating}
                    totalCount={totalCount}
                    onWriteReviewClick={() => {
                      const el = document.getElementById('review-form-container');
                      el?.scrollIntoView({ behavior: 'smooth' });
                      const input = document.getElementById('review-text-input');
                      input?.focus();
                    }}
                  />
                  <ReviewForm appSlug={appData.slug} onReviewSubmitted={fetchReviews} />
                </div>
              )}

              {/* Tab 2: Overview & About */}
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

              {/* Tab 3: Data Safety & Privacy */}
              {activeTab === 'safety' && (
                <div role="tabpanel" id="panel-safety" aria-labelledby="tab-safety" tabIndex={0} className="space-y-6 outline-hidden animate-in fade-in duration-300">
                  <DataSafetyCard app={appData} />
                </div>
              )}

              {/* Tab 4: Tech Stack & Architecture */}
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
                key={appData.slug}
                src={appData.logoUrl}
                fallbackSrc={appData.slug === 'videohub' ? '/videohub-logo.png' : undefined}
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

      {/* Advanced Feature Modals */}
      <DownloadQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        appName={appData.name}
        version={appData.version}
        downloadUrl={formatDownloadUrl(appData.downloadUrl) || `/api/download?slug=${encodeURIComponent(appData.slug)}`}
      />
    </div>
  );
}
