'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AndroidApp } from '@/lib/appsData';
import { formatDownloadUrl, normalizeAppRecord } from '@/lib/appUtils';
import { StarRating } from '@/components/StarRating';
import { ReviewForm } from '@/components/ReviewForm';
import { ReviewsList, ReviewItem } from '@/components/ReviewsList';
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
} from 'lucide-react';

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
  const [copied, setCopied] = useState(false);

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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col font-sans text-zinc-900 dark:text-zinc-100">
      <Navbar />

      <main className="flex-1 pb-16">
        {/* Top Header Banner */}
        <section className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 py-10 sm:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline mb-6"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Catalog
            </Link>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-start gap-5">
                <div
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br ${
                    appData.iconBg || 'from-purple-600 to-indigo-600'
                  } flex items-center justify-center shadow-xl shadow-purple-500/20 shrink-0 overflow-hidden`}
                >
                  {appData.logoUrl ? (
                    <img src={appData.logoUrl} alt={appData.name} className="w-full h-full object-cover" />
                  ) : (
                    getIconComponent(appData.iconSymbol)
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 text-[10px] font-bold">
                      {appData.badge || 'Kotlin + Compose'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-bold">
                      {appData.version}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100">
                    {appData.name}
                  </h1>

                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
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
                    className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-zinc-900 dark:bg-zinc-800 text-white font-bold text-sm text-center hover:bg-zinc-800 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    <FaGithub className="w-5 h-5" /> GitHub Source
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Content Tabs & Main Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Main Content Column (8 cols) */}
            <div className="lg:col-span-8 space-y-8">
              {/* Tab Navigation */}
              <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2 overflow-x-auto hide-scrollbar no-scrollbar [scrollbar-width:none]">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                    activeTab === 'overview'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-600/20'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <Info className="w-4 h-4" /> About & Features
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('reviews')}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                    activeTab === 'reviews'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-600/20'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
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
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <Code2 className="w-4 h-4" /> Tech Stack & Source
                </button>
              </div>

              {/* Tab 1: Overview & About */}
              {activeTab === 'overview' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  {/* Primary About Card */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800/80 pb-5">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40">
                          <Info className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">
                            About {appData.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                            Complete application overview and capabilities
                          </p>
                        </div>
                      </div>

                      <span className="self-start sm:self-auto px-3 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs border border-zinc-200 dark:border-zinc-700/60">
                        {appData.category || 'Android Application'}
                      </span>
                    </div>

                    {/* Full Description */}
                    <div className="space-y-4 text-sm sm:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
                      {appData.fullDescription.map((paragraph, index) => (
                        <p key={index} className="leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    {/* Key Highlights */}
                    <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/80 space-y-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <h4 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100">
                          Key Features & Highlights
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {appData.features.map((feature, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 sm:p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700/50 flex items-start gap-3 hover:border-purple-400/60 dark:hover:border-purple-600/50 transition-colors"
                          >
                            <div className="p-1.5 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5 shadow-xs">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                            <span className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 leading-snug">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Specs Bento */}
                    <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/80">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
                        Specifications at a Glance
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-700/40">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase block">Android Version</span>
                          <span className="text-xs sm:text-sm font-black text-zinc-900 dark:text-zinc-100 mt-0.5 block">{appData.minAndroid}</span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-700/40">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase block">Package Size</span>
                          <span className="text-xs sm:text-sm font-black text-zinc-900 dark:text-zinc-100 mt-0.5 block">{appData.size}</span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-700/40">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase block">Build Release</span>
                          <span className="text-xs sm:text-sm font-black text-zinc-900 dark:text-zinc-100 mt-0.5 block">{appData.version}</span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-700/40">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase block">UI Framework</span>
                          <span className="text-xs sm:text-sm font-black text-purple-600 dark:text-purple-400 mt-0.5 block">Jetpack Compose</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Community Reviews Teaser Card */}
                  <div className="bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent dark:from-purple-950/30 dark:via-indigo-950/20 border border-purple-200/60 dark:border-purple-800/40 rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                        <span className="text-base font-black text-zinc-900 dark:text-zinc-100">
                          {averageRating.toFixed(1)} / 5.0 Rating
                        </span>
                        <span className="text-xs text-zinc-500">
                          ({totalCount} verified user {totalCount === 1 ? 'review' : 'reviews'})
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
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
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
                  <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                    Android Architecture & Stack
                  </h3>

                  {appData.githubUrl && (
                    <div className="p-4 rounded-2xl bg-zinc-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-zinc-800 text-white">
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
                        className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40 text-center"
                      >
                        <span className="font-bold text-xs text-purple-700 dark:text-purple-300 block">
                          {tech}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-2">
                    <span className="text-xs font-bold text-zinc-500 block uppercase">Requirements</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                      <div>Minimum Android: <span className="font-bold text-zinc-900 dark:text-zinc-100">{appData.minAndroid}</span></div>
                      <div>Architecture: <span className="font-bold text-zinc-900 dark:text-zinc-100">arm64-v8a, armeabi-v7a, x86_64</span></div>
                      <div>Internet Permission: <span className="font-bold text-zinc-900 dark:text-zinc-100">Optional</span></div>
                      <div>Google Play Services: <span className="font-bold text-zinc-900 dark:text-zinc-100">Not Required (100% De-Googled)</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar Column (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Quick Info Bento Box */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-5">
                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  App Meta & Specs
                </h4>

                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500 flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5" /> File Size
                    </span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{appData.size}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5" /> Min Android
                    </span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{appData.minAndroid}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Release Date
                    </span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{appData.updatedAt || 'Recent'}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Security
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Verified & Safe</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="w-full py-3 px-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" /> {copied ? 'Link Copied!' : 'Share Application'}
                  </button>
                </div>
              </div>

              {/* App Specs & Safety Card */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-4">
                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  App Details & Security
                </h4>

                <div className="space-y-3 text-xs divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-zinc-500">Category</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{appData.category || 'Media & Utilities'}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2.5">
                    <span className="text-zinc-500">Package Size</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{appData.size}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2.5">
                    <span className="text-zinc-500">Target Platform</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{appData.minAndroid}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2.5">
                    <span className="text-zinc-500">License</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">Open Source (MIT / Apache)</span>
                  </div>
                  <div className="flex items-center justify-between pt-2.5">
                    <span className="text-zinc-500">Safety & Ads</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
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
                      className="w-full py-2.5 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                    >
                      <FaGithub className="w-4 h-4" /> View on GitHub
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
