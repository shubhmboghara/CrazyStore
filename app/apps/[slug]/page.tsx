'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AndroidApp } from '@/lib/appsData';
import { StarRating } from '@/components/StarRating';
import { ReviewForm } from '@/components/ReviewForm';
import { ReviewsList, ReviewItem } from '@/components/ReviewsList';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { FaGithub } from 'react-icons/fa';
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
  ExternalLink,
  Play,
  Activity,
  Music,
  ImageIcon,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react';

export default function AppDetailPage() {
  const params = useParams();
  const slug = (params?.slug as string) || '';

  const [appData, setAppData] = useState<AndroidApp | null>(null);
  const [isLoadingApp, setIsLoadingApp] = useState(true);

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(true);
  const [averageRating, setAverageRating] = useState<number>(5.0);
  const [totalCount, setTotalCount] = useState<number>(0);

  const [activeTab, setActiveTab] = useState<'reviews' | 'overview' | 'tech' | 'previews'>('reviews');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const validPreviews = (appData?.screenshots || [])
    .map((s, idx) => ({
      id: s.id || `preview-${idx}`,
      title: s.title || `Preview #${idx + 1}`,
      subtitle: s.subtitle || 'App Preview',
      accentColor: s.accentColor || 'from-zinc-900/40 to-zinc-900/20',
      type: s.type || 'preview',
      imageUrl: s.imageUrl || s.url || '',
      url: s.url || s.imageUrl || '',
    }))
    .filter((s) => Boolean(s.imageUrl || s.url));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : validPreviews.length - 1));
      }
      if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev !== null && prev < validPreviews.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, validPreviews.length]);

  useEffect(() => {
    async function loadApp() {
      setIsLoadingApp(true);
      try {
        const res = await fetch('/api/apps');
        if (res.ok) {
          const data = await res.json();
          const apps = data.apps || [];
          const found = apps.find((a: AndroidApp) => a.slug.toLowerCase() === slug.toLowerCase());
          if (found) {
            setAppData(found);
          }
        }
      } catch (err) {
        console.error('Error fetching app:', err);
      } finally {
        setIsLoadingApp(false);
      }
    }
    if (slug) loadApp();
  }, [slug]);

  const fetchReviews = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await fetch(`/api/reviews?appSlug=${slug}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setAverageRating(data.averageRating || 0);
        setTotalCount(data.totalCount || 0);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setIsLoadingReviews(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;

    const runFetch = async () => {
      try {
        const res = await fetch(`/api/reviews?appSlug=${slug}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setReviews(data.reviews || []);
          setAverageRating(data.averageRating || 0);
          setTotalCount(data.totalCount || 0);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        if (isMounted) {
          setIsLoadingReviews(false);
        }
      }
    };

    runFetch();

    return () => {
      isMounted = false;
    };
  }, [slug]);

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

  if (isLoadingApp) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-zinc-500 font-bold text-sm">Loading application...</p>
        </main>
      </div>
    );
  }

  if (!appData) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <Smartphone className="w-12 h-12 text-purple-500" />
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Application Not Found</h2>
          <p className="text-xs text-zinc-500">The app you are looking for does not exist or has been removed.</p>
          <Link href="/" className="px-6 py-3 rounded-xl bg-purple-600 text-white font-bold text-xs shadow-md shadow-purple-600/20 hover:bg-purple-700 transition-colors">
            Return to Catalog
          </Link>
        </main>
      </div>
    );
  }

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
                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br ${appData.iconBg || 'from-purple-600 to-indigo-600'} flex items-center justify-center shadow-xl shadow-purple-500/20 shrink-0 overflow-hidden`}>
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
                  href={appData.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm text-center shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" /> Download APK
                </a>
                {appData.githubUrl && (
                  <a
                    href={appData.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-zinc-900 dark:bg-zinc-800 text-white font-bold text-sm text-center hover:bg-zinc-800 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    <FaGithub className="w-5 h-5" /> GitHub Source
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Previews Showcase (if uploaded) */}
        {validPreviews.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      App Previews Showcase
                      <span className="px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 text-xs font-bold border border-purple-200 dark:border-purple-800/40">
                        {validPreviews.length} {validPreviews.length === 1 ? 'Preview' : 'Previews'}
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Explore native application screenshots in sequential order. Click any device to zoom.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('previews')}
                  className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 shrink-0"
                >
                  View Grid Gallery <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Horizontal Device Previews Showcase */}
              <div className="relative group">
                <div
                  id="previews-scroll-container"
                  className="flex items-center gap-6 overflow-x-auto pb-6 pt-2 px-2 scroll-smooth hide-scrollbar snap-x"
                >
                  {validPreviews.map((preview, idx) => (
                    <div
                      key={preview.id || idx}
                      onClick={() => setLightboxIndex(idx)}
                      className="shrink-0 w-44 sm:w-56 aspect-[9/19] rounded-[2.2rem] bg-zinc-900 border-[5px] border-zinc-800 dark:border-zinc-700 shadow-xl hover:shadow-2xl hover:border-purple-500 dark:hover:border-purple-500 transition-all duration-300 cursor-pointer relative group/mockup overflow-hidden snap-start flex flex-col"
                    >
                      {/* Mobile Notch Indicator */}
                      <div className="absolute top-2 inset-x-0 flex justify-center z-20 pointer-events-none">
                        <div className="w-16 h-3.5 bg-black rounded-full flex items-center justify-end px-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
                        </div>
                      </div>

                      {/* Screen Image */}
                      <img
                        src={preview.imageUrl || preview.url}
                        alt={preview.title || `Preview ${idx + 1}`}
                        className="w-full h-full object-cover group-hover/mockup:scale-105 transition-transform duration-300"
                      />

                      {/* Sequence Badge */}
                      <div className="absolute top-3 left-3 z-20">
                        <span className="px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-black backdrop-blur-md border border-white/10 shadow-sm">
                          #{String(idx + 1).padStart(2, '0')}
                        </span>
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 opacity-0 group-hover/mockup:opacity-100 transition-opacity p-4 flex flex-col justify-between z-20">
                        <div className="flex justify-end">
                          <span className="p-2 rounded-xl bg-purple-600 text-white shadow-lg">
                            <Maximize2 className="w-4 h-4" />
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 block">
                            Preview {idx + 1} of {validPreviews.length}
                          </span>
                          <span className="text-xs font-bold text-white drop-shadow truncate block mt-0.5">
                            {preview.title || `Preview #${idx + 1}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Content Tabs & Main Review Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Main Content Column (8 cols) */}
            <div className="lg:col-span-8 space-y-8">
              {/* Tab Navigation */}
              <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2 overflow-x-auto hide-scrollbar">
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === 'reviews'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  User Reviews ({totalCount})
                </button>
                {validPreviews.length > 0 && (
                  <button
                    onClick={() => setActiveTab('previews')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === 'previews'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" /> App Previews ({validPreviews.length})
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === 'overview'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  App Overview
                </button>
                <button
                  onClick={() => setActiveTab('tech')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === 'tech'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  Tech Stack & Source
                </button>
              </div>

              {/* Tab: Previews Gallery */}
              {activeTab === 'previews' && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <div>
                      <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-purple-600 dark:text-purple-400" /> App Previews Full Gallery
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1">
                        High-resolution device screens. Click any preview image to open interactive full-screen viewer.
                      </p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40">
                      {validPreviews.length} Previews
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                    {validPreviews.map((preview, idx) => (
                      <div
                        key={preview.id || idx}
                        onClick={() => setLightboxIndex(idx)}
                        className="group relative aspect-[9/19] rounded-[2rem] overflow-hidden bg-zinc-900 border-4 border-zinc-800 dark:border-zinc-700 shadow-md hover:shadow-2xl hover:border-purple-500 transition-all cursor-pointer flex flex-col"
                      >
                        <img
                          src={preview.imageUrl || preview.url}
                          alt={preview.title || `Preview ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between">
                          <div className="flex justify-between items-center">
                            <span className="px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-bold">
                              #{idx + 1}
                            </span>
                            <span className="p-1.5 rounded-lg bg-purple-600 text-white">
                              <Maximize2 className="w-3.5 h-3.5" />
                            </span>
                          </div>
                          <span className="text-xs font-bold text-white truncate">
                            {preview.title || `Preview #${idx + 1}`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 1: Reviews & Submission */}
              {activeTab === 'reviews' && (
                <div className="space-y-8 animate-in fade-in">
                  <ReviewForm appSlug={appData.slug} onReviewSubmitted={fetchReviews} />
                  <ReviewsList
                    reviews={reviews}
                    isLoading={isLoadingReviews}
                    averageRating={averageRating}
                    totalCount={totalCount}
                  />
                </div>
              )}

              {/* Tab 2: Overview */}
              {activeTab === 'overview' && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in">
                  <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                    About {appData.name}
                  </h3>
                  <div className="space-y-4 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {appData.fullDescription.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>

                  {/* Previews reel in Overview */}
                  {validPreviews.length > 0 && (
                    <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          App Preview Showcase
                        </h4>
                        <button
                          onClick={() => setActiveTab('previews')}
                          className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          View Full Gallery ({validPreviews.length})
                        </button>
                      </div>
                      <div className="flex items-center gap-4 overflow-x-auto pb-2 hide-scrollbar">
                        {validPreviews.map((preview, idx) => (
                          <div
                            key={preview.id || idx}
                            onClick={() => setLightboxIndex(idx)}
                            className="shrink-0 w-32 aspect-[9/19] rounded-2xl overflow-hidden border-2 border-zinc-200 dark:border-zinc-800 shadow-sm cursor-pointer hover:border-purple-500 transition-all"
                          >
                            <img
                              src={preview.imageUrl || preview.url}
                              alt={preview.title || `Preview ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3">
                      Key Highlights & Features
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {appData.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                          <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Tab 3: Tech Stack */}
              {activeTab === 'tech' && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in">
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
                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 space-y-2">
                    <p>
                      <strong>Architecture Pattern:</strong> MVVM with Clean Architecture principles, StateFlow, and Jetpack ViewModel.
                    </p>
                    <p>
                      <strong>UI Engine:</strong> 100% Jetpack Compose with Material 3 design system and Dynamic Color palette.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar Column (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* APK Download Box */}
              <div className="bg-gradient-to-br from-purple-900 via-indigo-950 to-zinc-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg border border-purple-800/50 space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-bold text-sm">Download APK Package</h4>
                </div>
                <p className="text-xs text-purple-200/80 leading-relaxed">
                  Download the compiled release directly. Free from ads or trackable SDKs.
                </p>
                <a
                  href={appData.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 px-4 rounded-2xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs text-center block shadow-md shadow-purple-600/30 transition-all"
                >
                  Download {appData.name} APK
                </a>
                <div className="text-[11px] text-purple-300/70 space-y-1 font-mono pt-2 border-t border-purple-800/60">
                  <p>Min SDK: {appData.minAndroid}</p>
                  <p>Size: {appData.size}</p>
                </div>
              </div>

              {/* Developer Note */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-3">
                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Developer & Build Info
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Built using Gradle 8.5 with Android Gradle Plugin (AGP) and Jetpack Compose compiler.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Fullscreen Lightbox Modal */}
        {lightboxIndex !== null && validPreviews[lightboxIndex] && (
          <div
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Top Lightbox Controls */}
            <div
              className="absolute top-4 inset-x-4 sm:inset-x-8 flex items-center justify-between z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs font-bold backdrop-blur-md border border-white/10">
                  Preview {lightboxIndex + 1} of {validPreviews.length}
                </span>
                <span className="text-sm font-bold text-white/90 hidden sm:inline-block">
                  {validPreviews[lightboxIndex].title || appData.name}
                </span>
              </div>

              <button
                onClick={() => setLightboxIndex(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-md border border-white/10"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Buttons */}
            {validPreviews.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : validPreviews.length - 1));
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3.5 rounded-full bg-white/10 hover:bg-purple-600 text-white transition-all backdrop-blur-md border border-white/10 z-10"
                  title="Previous Preview (Left Arrow)"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((prev) => (prev !== null && prev < validPreviews.length - 1 ? prev + 1 : 0));
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3.5 rounded-full bg-white/10 hover:bg-purple-600 text-white transition-all backdrop-blur-md border border-white/10 z-10"
                  title="Next Preview (Right Arrow)"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Main Preview Container */}
            <div
              className="max-h-[82vh] max-w-full flex items-center justify-center p-2 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={validPreviews[lightboxIndex].imageUrl || validPreviews[lightboxIndex].url}
                alt={validPreviews[lightboxIndex].title || `Preview ${lightboxIndex + 1}`}
                className="max-h-[78vh] w-auto max-w-[90vw] rounded-3xl shadow-2xl border border-white/15 object-contain"
              />
            </div>

            {/* Bottom thumbnail strip */}
            {validPreviews.length > 1 && (
              <div
                className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-2 px-4 overflow-x-auto hide-scrollbar z-10"
                onClick={(e) => e.stopPropagation()}
              >
                {validPreviews.map((preview, idx) => (
                  <button
                    key={preview.id || idx}
                    onClick={() => setLightboxIndex(idx)}
                    className={`w-12 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      idx === lightboxIndex ? 'border-purple-500 scale-105 shadow-lg shadow-purple-500/30' : 'border-white/20 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={preview.imageUrl || preview.url}
                      alt={`Thumb ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
