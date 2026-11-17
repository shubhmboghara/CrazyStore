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
import { Screenshots3DPhoneView } from '@/components/three';
import { ScreenshotsSimpleGallery } from '@/components/ScreenshotsSimpleGallery';
import { DataSafetyCard } from '@/components/DataSafetyCard';
import { DownloadQrModal } from '@/components/DownloadQrModal';
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

  // Normalize valid screenshots uploaded by admin, with fallback to default app previews
  const validPreviews = React.useMemo(() => {
    const list = (appData.screenshots || [])
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

    if (list.length === 0 && appData.slug?.toLowerCase() === 'videohub') {
      return [
        {
          id: '1',
          title: 'Trending Feed & Discovery',
          subtitle: '',
          url: 'https://ik.imagekit.io/shubhambogharadev/android-apps/Screenshot_20260925-133227.VideoHub_qzdtxn6-x.png',
          imageUrl: 'https://ik.imagekit.io/shubhambogharadev/android-apps/Screenshot_20260925-133227.VideoHub_qzdtxn6-x.png',
        },
        {
          id: '2',
          title: 'Immersive 4K ExoPlayer',
          subtitle: '',
          url: 'https://ik.imagekit.io/shubhambogharadev/android-apps/Screenshot_20260925-133306.VideoHub_dgH1K76Qy.png',
          imageUrl: 'https://ik.imagekit.io/shubhambogharadev/android-apps/Screenshot_20260925-133306.VideoHub_dgH1K76Qy.png',
        },
        {
          id: '3',
          title: 'Background Audio & Lockscreen',
          subtitle: '',
          url: 'https://ik.imagekit.io/shubhambogharadev/android-apps/Screenshot_20260925-133323.VideoHub_LEK80RUfT.png',
          imageUrl: 'https://ik.imagekit.io/shubhambogharadev/android-apps/Screenshot_20260925-133323.VideoHub_LEK80RUfT.png',
        },
        {
          id: '4',
          title: 'Material You & Settings',
          subtitle: '',
          url: 'https://ik.imagekit.io/shubhambogharadev/android-apps/Screenshot_20260925-134542.VideoHub_i3VA3Z_90.png',
          imageUrl: 'https://ik.imagekit.io/shubhambogharadev/android-apps/Screenshot_20260925-134542.VideoHub_i3VA3Z_90.png',
        },
      ];
    }
    return list;
  }, [appData.screenshots, appData.slug]);

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
            <nav aria-label="Breadcrumb" className="mb-5">
              <ol className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                <li>
                  <Link href="/" className="hover:text-purple-300 transition-colors flex items-center gap-1">
                    <ArrowLeft className="w-3.5 h-3.5" /> Home
                  </Link>
                </li>
                <li aria-hidden="true" className="text-zinc-600">/</li>
                <li>
                  <Link href="/#catalog" className="hover:text-purple-300 transition-colors">
                    Catalog
                  </Link>
                </li>
                <li aria-hidden="true" className="text-zinc-600">/</li>
                <li aria-current="page" className="text-zinc-100 font-bold truncate max-w-[200px]">
                  {appData.name}
                </li>
              </ol>
            </nav>

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
              <div className="flex items-start gap-4 sm:gap-5 w-full min-w-0">
                <div
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${
                    appData.iconBg || 'from-purple-600 to-indigo-600'
                  } flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0 overflow-hidden relative`}
                >
                  <AppLogoImage
                    key={appData.slug}
                    src={appData.logoUrl}
                    fallbackSrc={appData.slug === 'videohub' ? '/videohub-logo.png' : undefined}
                    alt={appData.name}
                    fallback={getIconComponent(appData.iconSymbol)}
                  />
                </div>

                <div className="space-y-1.5 min-w-0 flex-1">
                  <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 break-words tracking-tight">
                    {appData.name}
                  </h1>

                  <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
                    {appData.tagline || appData.shortDescription}
                  </p>

                  <div className="pt-0.5 flex items-center gap-3 sm:gap-4 flex-wrap">
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
                  </div>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="w-full lg:w-auto flex flex-wrap items-center gap-2 pt-1 lg:pt-0">
                <a
                  href={formatDownloadUrl(appData.downloadUrl) || `/api/download?slug=${encodeURIComponent(appData.slug)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleDownloadClick('header_cta')}
                  className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap shadow-xs ${
                    isDownloading
                      ? 'bg-emerald-600 ring-2 ring-emerald-400/50'
                      : 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/30 hover:-translate-y-0.5 active:translate-y-0'
                  }`}
                  aria-live="polite"
                >
                  {isDownloading ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Downloading APK...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download APK {appData.size ? `(${appData.size})` : ''}</span>
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
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap"
                  >
                    <FaGithub className="w-4 h-4 text-zinc-400" />
                    <span>Source</span>
                  </a>
                )}

                {/* Scan QR Code button */}
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap"
                  title="Scan QR Code to install directly on phone"
                  aria-label="Scan QR Code to install directly on phone"
                >
                  <QrCode className="w-3.5 h-3.5 text-purple-400" />
                  <span>QR Code</span>
                </button>

                {/* Share button */}
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap"
                  title="Share app profile"
                  aria-label="Share app profile"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Screenshots & Visuals Showcase */}
        {validPreviews.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8">
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-xs">
              <div className="relative z-10">
                <ScreenshotsSimpleGallery
                  screenshots={validPreviews}
                  onOpenLightbox={(idx) => setLightboxIndex(idx)}
                />
              </div>

              {/* Compatibility hook for 3D Phone View */}
              <div className="hidden" aria-hidden="true">
                <Screenshots3DPhoneView
                  app={appData}
                  screenshots={validPreviews}
                  activeIdx={selected3DIdx}
                  onSelectScreenshot={(idx) => setSelected3DIdx(idx)}
                  onOpenLightbox={(idx) => setLightboxIndex(idx)}
                />
              </div>
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
            className="fixed inset-0 m-0 p-0 w-full h-[100dvh] max-w-none max-h-none bg-zinc-950/95 backdrop-blur-2xl flex flex-col items-center justify-between p-3 sm:p-6 text-zinc-100 border-0 select-none overscroll-contain z-50 animate-in fade-in"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Floating Top Header Bar */}
            <div
              className="w-full max-w-3xl flex items-center justify-between z-20 shrink-0 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 shadow-2xl transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              {/* App Identity & Current Screenshot Title */}
              <div className="flex items-center gap-3 min-w-0 pr-3">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${appData.iconBg || 'from-purple-600 to-indigo-600'} flex items-center justify-center shrink-0 overflow-hidden shadow-sm`}>
                  <AppLogoImage
                    key={appData.slug}
                    src={appData.logoUrl}
                    fallbackSrc={appData.slug === 'videohub' ? '/videohub-logo.png' : undefined}
                    alt={appData.name}
                    fallback={getIconComponent(appData.iconSymbol)}
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-semibold text-zinc-100 block truncate">
                    {appData.name}
                  </span>
                  {validPreviews[lightboxIndex].title && (
                    <span className="text-[11px] text-zinc-400 font-medium block truncate">
                      {validPreviews[lightboxIndex].title}
                    </span>
                  )}
                </div>
              </div>

              {/* Controls: Sleek Zoom & Close */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 bg-zinc-800/80 rounded-xl p-1 border border-zinc-700/60">
                  <button
                    type="button"
                    onClick={() => setLightboxZoom((prev) => Math.max(1, +(prev - 0.35).toFixed(2)))}
                    disabled={lightboxZoom <= 1}
                    className="p-1 sm:p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-300 hover:text-white disabled:opacity-25 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    aria-label="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-semibold text-zinc-300 px-1.5 min-w-[3.5ch] text-center tabular-nums">
                    {Math.round(lightboxZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setLightboxZoom((prev) => Math.min(2.5, +(prev + 0.35).toFixed(2)))}
                    disabled={lightboxZoom >= 2.5}
                    className="p-1 sm:p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-300 hover:text-white disabled:opacity-25 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    aria-label="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  {lightboxZoom > 1 && (
                    <button
                      type="button"
                      onClick={() => setLightboxZoom(1)}
                      className="p-1 sm:p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      aria-label="Reset Zoom"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="w-px h-5 bg-zinc-800 mx-0.5 hidden sm:block" />

                {/* Clean Modern Close Button */}
                <button
                  type="button"
                  onClick={() => setLightboxIndex(null)}
                  className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all border border-zinc-700/60 shadow-sm cursor-pointer hover:scale-105 active:scale-95"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Central Stage */}
            <div
              className="relative flex-1 w-full min-h-0 flex items-center justify-center p-2 sm:p-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Subtle ambient lighting behind preview */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[300px] sm:w-[460px] h-[550px] bg-gradient-to-b from-purple-900/10 via-zinc-800/10 to-transparent rounded-full blur-3xl opacity-40" />
              </div>

              {/* Navigation Left */}
              {validPreviews.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : validPreviews.length - 1));
                  }}
                  className="absolute left-2 sm:left-6 md:left-12 top-1/2 -translate-y-1/2 p-3 sm:p-3.5 rounded-2xl bg-zinc-900/85 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all backdrop-blur-xl border border-zinc-700/70 z-30 shadow-2xl hover:scale-110 active:scale-95 cursor-pointer"
                  aria-label="Previous screenshot"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}

              {/* Central Screenshot */}
              <div className="relative z-10 w-full h-full max-h-full max-w-full flex items-center justify-center pointer-events-none">
                <img
                  src={validPreviews[lightboxIndex].imageUrl || validPreviews[lightboxIndex].url}
                  alt={validPreviews[lightboxIndex].title || appData.name}
                  style={{
                    transform: `scale(${lightboxZoom})`,
                    transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  className="max-h-full max-w-full w-auto h-auto object-contain rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] ring-1 ring-white/10 bg-zinc-950 pointer-events-auto select-none"
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
                  className="absolute right-2 sm:right-6 md:right-12 top-1/2 -translate-y-1/2 p-3 sm:p-3.5 rounded-2xl bg-zinc-900/85 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all backdrop-blur-xl border border-zinc-700/70 z-30 shadow-2xl hover:scale-110 active:scale-95 cursor-pointer"
                  aria-label="Next screenshot"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}
            </div>

            {/* Bottom floating thumbnail dock */}
            <div
              className="w-full max-w-xl flex flex-col items-center z-20 shrink-0 pb-1 sm:pb-2"
              onClick={(e) => e.stopPropagation()}
            >
              {validPreviews.length > 1 && (
                <div className="flex items-center justify-center gap-2.5 px-3 py-2 rounded-2xl bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 shadow-2xl overflow-x-auto hide-scrollbar max-w-full">
                  {validPreviews.map((preview, idx) => (
                    <button
                      key={preview.id || idx}
                      type="button"
                      onClick={() => setLightboxIndex(idx)}
                      className={`h-14 sm:h-16 aspect-[9/19.5] rounded-xl overflow-hidden transition-all shrink-0 relative cursor-pointer bg-zinc-950 flex items-center justify-center p-0.5 ${
                        idx === lightboxIndex
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-black border border-white/50 shadow-xl scale-105'
                          : 'border border-zinc-700/60 opacity-50 hover:opacity-100 hover:border-zinc-500 hover:scale-102'
                      }`}
                    >
                      <img
                        src={preview.imageUrl || preview.url}
                        alt={preview.title || `Screenshot thumbnail ${idx + 1}`}
                        className="w-full h-full object-contain rounded-lg"
                      />
                    </button>
                  ))}
                </div>
              )}
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
