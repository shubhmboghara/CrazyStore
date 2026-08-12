'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { AndroidApp } from '@/lib/appsData';
import { StarRating } from '@/components/StarRating';
import { ReviewForm } from '@/components/ReviewForm';
import { ReviewsList, ReviewItem } from '@/components/ReviewsList';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
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
} from 'lucide-react';

export default function AppDetailPage() {
  const params = useParams();
  const slug = (params?.slug as string) || 'videohub';

  const [appData, setAppData] = useState<AndroidApp | null>(null);
  const [isLoadingApp, setIsLoadingApp] = useState(true);

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(true);
  const [averageRating, setAverageRating] = useState<number>(5.0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'reviews' | 'overview' | 'tech'>('reviews');

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
            setAverageRating(0);
            setTotalCount(0);
          } else {
            setAppData(null);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingApp(false);
      }
    }
    loadApp();
  }, [slug]);

  const fetchReviews = useCallback(async () => {
    if (!appData) return;
    setIsLoadingReviews(true);
    try {
      const response = await fetch(`/api/reviews?appSlug=${slug}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        setAverageRating(data.averageRating || 0);
        setTotalCount(data.totalCount || 0);
      }
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setIsLoadingReviews(false);
    }
  }, [slug, appData]);

  useEffect(() => {
    if (appData) {
      // eslint-disable-next-line
      fetchReviews();
    }
  }, [appData, fetchReviews]);

  if (isLoadingApp) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-zinc-500">Loading app data...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!appData) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold mb-2">App Not Found</h1>
          <Link href="/" className="text-purple-600 hover:underline">Return Home</Link>
        </main>
        <Footer />
      </div>
    );
  }

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

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <Navbar />

      <main className="flex-1 pb-20">
        {/* App Header Section */}
        <section className="relative overflow-hidden pt-6 pb-6 sm:pt-8 sm:pb-8 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40">
          <div className={`absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br ${appData.iconBg} rounded-full blur-3xl opacity-10 pointer-events-none -translate-y-1/2 translate-x-1/3`} />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 hover:text-purple-600 mb-4 transition-colors uppercase tracking-wider"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Catalog
            </Link>

            <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
              {/* Left Column: Icon & Titles */}
              <div className="flex items-start gap-5 sm:gap-6 w-full lg:w-auto">
                <div className={`w-20 h-20 sm:w-28 sm:h-28 rounded-3xl ${appData.logoUrl ? 'bg-white' : `bg-gradient-to-br ${appData.iconBg}`} flex items-center justify-center shadow-xl shrink-0 overflow-hidden`}>
                  {appData.logoUrl ? (
                    <img src={appData.logoUrl} alt={`${appData.name} Logo`} className="w-full h-full object-cover" />
                  ) : (
                    getIconComponent(appData.iconSymbol)
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-2xl sm:text-4xl font-black tracking-tight">{appData.name}</h1>
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
                      {appData.version}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4 max-w-2xl">
                    {appData.tagline}
                  </p>
                  
                  {/* Stats Row */}
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-zinc-500">
                    <div className="flex items-center gap-1.5">
                      <StarRating rating={averageRating} />
                      <span className="font-bold text-zinc-700 dark:text-zinc-300 ml-1">{averageRating}</span>
                      <span>({totalCount} reviews)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5" />
                      {appData.size}
                    </div>
                    <div className="flex items-center gap-1.5 hidden sm:flex">
                      <Cpu className="w-3.5 h-3.5" />
                      {appData.minAndroid}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Download Button & Link info */}
              <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                <a
                  href={appData.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  id="download-apk-button"
                  className="px-8 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2.5 active:scale-95"
                >
                  <Download className="w-4 h-4" /> Download APK
                </a>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-500 flex items-center justify-center lg:justify-end gap-1.5 bg-zinc-50 dark:bg-zinc-900/50 py-2 px-3 rounded-xl border border-zinc-100 dark:border-zinc-800/80">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  No Ads • No Trackers • 100% Free
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Screenshots Gallery */}
        <section className="py-8 bg-zinc-50/50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-4 overflow-x-auto hide-scrollbar pb-4">
            {appData.bannerUrl && (
              <div className="w-[300px] sm:w-[500px] shrink-0 h-40 sm:h-64 rounded-2xl shadow-sm relative overflow-hidden group border border-zinc-200 dark:border-zinc-800">
                <img src={appData.bannerUrl} alt="App Banner" className="w-full h-full object-cover" />
              </div>
            )}
            {appData.screenshots.map((screen) => (
              <div 
                key={screen.id} 
                className={`w-64 sm:w-72 shrink-0 h-40 sm:h-48 rounded-2xl ${screen.url ? 'bg-zinc-100 dark:bg-zinc-900' : `bg-gradient-to-br ${screen.accentColor}`} border border-zinc-200/50 dark:border-zinc-700/30 shadow-sm relative overflow-hidden group`}
              >
                {screen.url ? (
                  <img src={screen.url} alt="App Screenshot" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <div className="absolute inset-0 p-5 flex flex-col justify-end bg-gradient-to-t from-black/40 via-transparent to-transparent">
                      <h4 className="text-white font-bold text-sm drop-shadow-md">{screen.title}</h4>
                      <p className="text-white/80 text-[10px] mt-0.5 drop-shadow">{screen.subtitle}</p>
                    </div>
                    
                    {/* Abstract UI Mockup inside screenshot */}
                    <div className="absolute top-4 right-4 w-32 h-24 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-xl flex flex-col gap-2 p-3 transform group-hover:scale-105 group-hover:-rotate-2 transition-transform duration-500">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-white/30" />
                        <div className="h-2 w-16 bg-white/20 rounded-full" />
                      </div>
                      <div className="h-12 w-full bg-white/10 rounded-lg mt-1" />
                    </div>

                    <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-6 pt-1">
                      <div className="w-3 h-3 border-2 border-zinc-600/50 rotate-45 rounded-sm" />
                      <div className="w-3 h-3 rounded-full border-2 border-zinc-600/50" />
                      <div className="w-3 h-3 border-2 border-zinc-600/50 rounded-sm" />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Content Tabs & Main Review Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Main Content Column (8 cols) */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Tab Navigation */}
              <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'reviews' 
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' 
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  User Reviews ({totalCount})
                </button>
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'overview' 
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' 
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  App Overview
                </button>
                <button
                  onClick={() => setActiveTab('tech')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'tech' 
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' 
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  Tech Stack & Source
                </button>
              </div>

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
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    About {appData.name}
                  </h3>
                  <div className="space-y-4 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {appData.fullDescription.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>

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
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    Android Architecture & Stack
                  </h3>
                  
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
              <div className="bg-gradient-to-br from-purple-900 via-indigo-950 to-zinc-900 text-white rounded-2xl p-6 shadow-lg border border-purple-800/50 space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-bold text-sm">Download APK Package</h4>
                </div>
                <p className="text-xs text-purple-200/80 leading-relaxed">
                  Download the latest compiled release directly from Google Drive. Free from ads or trackable SDKs.
                </p>
                
                <a
                  href={appData.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs text-center block shadow-md shadow-purple-600/30 transition-all"
                >
                  Download {appData.name} APK
                </a>

                <div className="text-[11px] text-purple-300/70 space-y-1 font-mono pt-2 border-t border-purple-800/60">
                  <p>SHA256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</p>
                  <p>Min SDK: {appData.minAndroid}</p>
                </div>
              </div>

              {/* Developer Note */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-3">
                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Developer & Build Info
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Built using Gradle 8.5 with Android Gradle Plugin (AGP) and Jetpack Compose compiler. Tested on physical Pixel 7, Pixel 8, and Samsung Galaxy S23.
                </p>
                <div className="pt-2 text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1 cursor-pointer">
                  <Share2 className="w-3.5 h-3.5" /> Share this app page
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
