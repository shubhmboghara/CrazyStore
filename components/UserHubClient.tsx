'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserHub, AppRequestItem, DownloadedAppRecord } from '@/hooks/useUserHub';
import { useFavorites } from '@/hooks/useFavorites';
import { useToast } from '@/components/Toast';
import { AndroidApp } from '@/lib/appsData';
import { normalizeAppRecord, formatDownloadUrl } from '@/lib/appUtils';
import {
  Smartphone,
  Heart,
  Download,
  Star,
  Sparkles,
  Settings,
  PlusCircle,
  Clock,
  ArrowRight,
  Trash2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  ThumbsUp,
  Send,
  Layers,
  Search,
  HardDrive,
  RefreshCw,
  User,
  Sliders,
  Bell,
  Code2,
  Tag,
  AlertCircle,
  HelpCircle,
  FileCode,
  Zap,
} from 'lucide-react';

const CATEGORIES = [
  'Tools & Utilities',
  'Productivity',
  'Communication',
  'Entertainment',
  'Education',
  'Finance',
  'Health & Fitness',
  'Customization',
];

export function UserHubClient({ initialApps }: { initialApps: AndroidApp[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const { favorites, toggleFavorite } = useFavorites();
  const {
    downloadedApps,
    downloadCount,
    recordDownload,
    removeDownload,
    appRequests,
    submitRequest,
    removeRequest,
    userPrefs,
    updatePreferences,
  } = useUserHub();

  const [activeTab, setActiveTab] = useState<'library' | 'favorites' | 'requests' | 'settings'>('library');
  const [allApps, setAllApps] = useState<AndroidApp[]>(initialApps);
  const [isLoadingApps, setIsLoadingApps] = useState<boolean>(false);
  const [librarySearch, setLibrarySearch] = useState<string>('');

  // Request App Form State
  const [reqTitle, setReqTitle] = useState<string>('');
  const [reqCategory, setReqCategory] = useState<string>('Tools & Utilities');
  const [reqDescription, setReqDescription] = useState<string>('');
  const [reqGithub, setReqGithub] = useState<string>('');
  const [reqApk, setReqApk] = useState<string>('');
  const [isSubmittingReq, setIsSubmittingReq] = useState<boolean>(false);
  const [communityRequests, setCommunityRequests] = useState<AppRequestItem[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState<boolean>(false);

  // Settings state
  const [usernameInput, setUsernameInput] = useState<string>(userPrefs.username);
  const [avatarColorInput, setAvatarColorInput] = useState<string>(userPrefs.avatarColor);
  const [mirrorInput, setMirrorInput] = useState<'direct' | 'github' | 'drive'>(userPrefs.preferredSource);

  // Fetch all apps fresh
  useEffect(() => {
    async function fetchApps() {
      try {
        const res = await fetch(`/api/apps?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.apps) {
            setAllApps(data.apps.map((a: any) => normalizeAppRecord(a)));
          }
        }
      } catch (err) {
        console.error('Failed to load apps in UserHub:', err);
      }
    }
    fetchApps();
  }, []);

  // Fetch community requests from API
  const loadRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const res = await fetch(`/api/requests?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.requests) {
          setCommunityRequests(data.requests);
        }
      }
    } catch {
      // fallback
      setCommunityRequests(appRequests);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // Filtered favorite apps
  const favoriteAppObjects = useMemo(() => {
    return allApps.filter((a) => favorites.includes(a.slug.toLowerCase()));
  }, [allApps, favorites]);

  // Filtered library apps
  const filteredLibrary = useMemo(() => {
    if (!librarySearch.trim()) return downloadedApps;
    const q = librarySearch.toLowerCase();
    return downloadedApps.filter(
      (a) => a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
    );
  }, [downloadedApps, librarySearch]);

  // Handle new app request submission
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle.trim() || !reqDescription.trim()) {
      showToast('Please fill in the app title and description', 'error');
      return;
    }

    setIsSubmittingReq(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: reqTitle.trim(),
          category: reqCategory,
          description: reqDescription.trim(),
          githubUrl: reqGithub.trim() || undefined,
          apkUrl: reqApk.trim() || undefined,
          requesterName: userPrefs.username,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showToast('App request submitted for review!', 'success');
        submitRequest({
          title: reqTitle.trim(),
          category: reqCategory,
          description: reqDescription.trim(),
          githubUrl: reqGithub.trim() || undefined,
          apkUrl: reqApk.trim() || undefined,
          requesterName: userPrefs.username,
        });
        setReqTitle('');
        setReqDescription('');
        setReqGithub('');
        setReqApk('');
        loadRequests();
      } else {
        showToast('Failed to submit request to server', 'error');
      }
    } catch {
      // Local fallback
      submitRequest({
        title: reqTitle.trim(),
        category: reqCategory,
        description: reqDescription.trim(),
        githubUrl: reqGithub.trim() || undefined,
        apkUrl: reqApk.trim() || undefined,
        requesterName: userPrefs.username,
      });
      showToast('Saved to local requests!', 'success');
      setReqTitle('');
      setReqDescription('');
      loadRequests();
    } finally {
      setIsSubmittingReq(false);
    }
  };

  // Upvote request
  const handleUpvote = async (id: string) => {
    try {
      const res = await fetch('/api/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, upvote: true }),
      });
      if (res.ok) {
        setCommunityRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, upvotes: (r.upvotes || 0) + 1 } : r))
        );
        showToast('Upvoted!', 'success');
      }
    } catch {
      showToast('Could not upvote right now', 'error');
    }
  };

  // Save profile settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updatePreferences({
      username: usernameInput.trim() || 'Android Explorer',
      avatarColor: avatarColorInput,
      preferredSource: mirrorInput,
    });
    showToast('Preferences updated successfully!', 'success');
  };

  // Calculate approximate local library size
  const totalLibraryMb = (downloadedApps.length * 18.5).toFixed(1);

  return (
    <div className="space-y-8">
      {/* Top Profile & Hub Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950/40 via-zinc-900/60 to-indigo-950/40 border border-zinc-800/80 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div
              className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-tr ${userPrefs.avatarColor} p-1 shadow-xl flex items-center justify-center`}
            >
              <div className="w-full h-full bg-zinc-950/80 rounded-[14px] flex items-center justify-center backdrop-blur-sm">
                <User className="w-8 h-8 md:w-10 md:h-10 text-purple-300" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  CrazyStore User Hub
                </span>
                <span className="text-xs text-zinc-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified Member
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1">
                {userPrefs.username}
              </h1>
              <p className="text-sm text-zinc-400 mt-0.5">
                Manage your downloaded Kotlin apps, wishlist, and community requests.
              </p>
            </div>
          </div>

          {/* Quick Metrics Header */}
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <div className="flex-1 md:flex-initial px-4 py-2.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-center min-w-[100px]">
              <div className="text-xl font-black text-white">{downloadedApps.length}</div>
              <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Installed</div>
            </div>
            <div className="flex-1 md:flex-initial px-4 py-2.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-center min-w-[100px]">
              <div className="text-xl font-black text-rose-400">{favorites.length}</div>
              <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Wishlist</div>
            </div>
            <div className="flex-1 md:flex-initial px-4 py-2.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-center min-w-[100px]">
              <div className="text-xl font-black text-amber-400">{communityRequests.length}</div>
              <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Requests</div>
            </div>
          </div>
        </div>

        {/* Portal Switcher Bar */}
        <div className="mt-6 pt-6 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Back to Storefront
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/50 text-xs font-semibold text-purple-300 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-purple-400" /> Switch to Admin Portal ↗
            </Link>
          </div>
          <div className="text-xs text-zinc-500 font-mono">
            CrazyStore App Hub • Storage: ~{totalLibraryMb} MB
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-200 dark:border-zinc-800 scrollbar-none">
        <button
          onClick={() => setActiveTab('library')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
            activeTab === 'library'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>My Library</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === 'library' ? 'bg-purple-700 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            {downloadedApps.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
            activeTab === 'favorites'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Saved / Wishlist</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === 'favorites' ? 'bg-purple-700 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            {favorites.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
            activeTab === 'requests'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Community Requests</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === 'requests' ? 'bg-purple-700 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            {communityRequests.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Hub Preferences</span>
        </button>
      </div>

      {/* Tab 1: My Library */}
      {activeTab === 'library' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-purple-500" />
                Downloaded Applications ({downloadedApps.length})
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                APKs previously downloaded on this device. You can re-download or update them anytime.
              </p>
            </div>

            {downloadedApps.length > 0 && (
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search installed apps..."
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}
          </div>

          {filteredLibrary.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center bg-zinc-50/50 dark:bg-zinc-900/30">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center mx-auto mb-4 text-purple-600 dark:text-purple-400">
                <Download className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Your Library is Empty</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mt-1 mb-6">
                When you download verified APKs from CrazyStore, they will be tracked here for instant updates and offline management.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-purple-500/25 hover:scale-105 transition-transform"
              >
                <Smartphone className="w-4 h-4" /> Explore Catalog Now
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredLibrary.map((item) => (
                <div
                  key={item.slug}
                  className="group relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${
                            item.iconBg || 'from-purple-600 to-indigo-600'
                          } p-0.5 shadow-md flex items-center justify-center shrink-0`}
                        >
                          <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                            <Smartphone className="w-6 h-6 text-purple-300" />
                          </div>
                        </div>
                        <div>
                          <Link
                            href={`/apps/${item.slug}`}
                            className="font-bold text-zinc-900 dark:text-white text-base hover:text-purple-500 transition-colors line-clamp-1"
                          >
                            {item.name}
                          </Link>
                          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                            {item.category}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          removeDownload(item.slug);
                          showToast('Removed from local library', 'info');
                        }}
                        title="Remove from Library history"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Tag className="w-3 h-3 text-purple-400" /> {item.version || 'v1.0.0'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.downloadedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                    <Link
                      href={`/apps/${item.slug}`}
                      className="flex-1 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold text-center transition-colors"
                    >
                      View Details
                    </Link>
                    {item.downloadUrl && (
                      <a
                        href={item.downloadUrl}
                        download
                        className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors"
                        title="Re-download APK"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Saved / Wishlist */}
      {activeTab === 'favorites' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              Saved & Wishlist Apps ({favoriteAppObjects.length})
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Apps bookmarked for later installation or monitoring.
            </p>
          </div>

          {favoriteAppObjects.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center bg-zinc-50/50 dark:bg-zinc-900/30">
              <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center mx-auto mb-4 text-rose-500">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">No Wishlist Apps Yet</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mt-1 mb-6">
                Click the heart icon on any app card or app details page to bookmark it in your personal wishlist.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-purple-500/25 hover:scale-105 transition-transform"
              >
                Browse Storefront
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {favoriteAppObjects.map((app) => (
                <div
                  key={app.slug}
                  className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-5 shadow-sm flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${
                          app.iconBg || 'from-purple-600 to-indigo-600'
                        } p-0.5 shadow-md flex items-center justify-center shrink-0`}
                      >
                        <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                          <Smartphone className="w-6 h-6 text-purple-300" />
                        </div>
                      </div>
                      <div>
                        <Link
                          href={`/apps/${app.slug}`}
                          className="font-bold text-zinc-900 dark:text-white text-base hover:text-purple-500 transition-colors line-clamp-1"
                        >
                          {app.name}
                        </Link>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">{app.category}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        toggleFavorite(app.slug);
                        showToast('Removed from wishlist', 'info');
                      }}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Remove from wishlist"
                    >
                      <Heart className="w-4 h-4 fill-rose-500" />
                    </button>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mt-3">
                    {app.tagline || app.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                    <Link
                      href={`/apps/${app.slug}`}
                      className="flex-1 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold text-center transition-colors"
                    >
                      Inspect App
                    </Link>
                    {app.downloadUrl && (
                      <a
                        href={formatDownloadUrl(app.downloadUrl)}
                        download
                        onClick={() => recordDownload(app)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Install
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Community App Requests */}
      {activeTab === 'requests' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Submission Form */}
          <div className="lg:col-span-1">
            <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl sticky top-24">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Request an App</h3>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
                Know an awesome open-source Kotlin or Compose Android app? Tell our admin team and community to add it!
              </p>

              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
                    App Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lawnchair Launcher"
                    value={reqTitle}
                    onChange={(e) => setReqTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
                    Category
                  </label>
                  <select
                    value={reqCategory}
                    onChange={(e) => setReqCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
                    Why add this app? *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe core features and why Android enthusiasts will love it..."
                    value={reqDescription}
                    onChange={(e) => setReqDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
                    GitHub / Source Code URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={reqGithub}
                    onChange={(e) => setReqGithub(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReq}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmittingReq ? 'Submitting...' : 'Submit Community Request'}
                </button>
              </form>
            </div>
          </div>

          {/* Community Requests Feed */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Community Wishlist Requests</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Upvote apps you want the CrazyStore admin team to index and verify.
                </p>
              </div>

              <button
                onClick={loadRequests}
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-purple-500 transition-colors"
                title="Refresh requests"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingRequests ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {communityRequests.length === 0 ? (
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 text-center text-zinc-500 text-sm">
                No active requests right now. Be the first to suggest an app!
              </div>
            ) : (
              communityRequests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-zinc-900 dark:text-white text-base">{req.title}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        {req.category}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          req.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : req.status === 'in-review'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">{req.description}</p>

                    <div className="flex items-center gap-3 text-[11px] text-zinc-400 pt-1">
                      <span>Requested by <strong className="text-zinc-300">{req.requesterName || 'Community'}</strong></span>
                      <span>•</span>
                      <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                      {req.githubUrl && (
                        <>
                          <span>•</span>
                          <a
                            href={req.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:underline flex items-center gap-1"
                          >
                            <FileCode className="w-3 h-3" /> GitHub Repo
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => handleUpvote(req.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/50 text-purple-700 dark:text-purple-300 text-xs font-bold transition-all"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-purple-500" />
                      <span>{req.upvotes || 1}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Preferences & Settings */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl mx-auto rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 md:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">User Hub Preferences</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Personalize your experience across CrazyStore.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 mb-2">
                Display Name / Handle
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Your username"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 mb-2">
                Avatar Gradient Theme
              </label>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { name: 'Purple Cosmic', class: 'from-purple-500 to-indigo-600' },
                  { name: 'Emerald Forest', class: 'from-emerald-500 to-teal-600' },
                  { name: 'Sunset Orange', class: 'from-amber-500 to-rose-600' },
                  { name: 'Cyber Blue', class: 'from-cyan-500 to-blue-600' },
                ].map((grad) => (
                  <button
                    key={grad.name}
                    type="button"
                    onClick={() => setAvatarColorInput(grad.class)}
                    className={`h-12 rounded-xl bg-gradient-to-tr ${grad.class} p-0.5 transition-all ${
                      avatarColorInput === grad.class ? 'ring-2 ring-purple-500 scale-105 shadow-md' : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="w-full h-full bg-zinc-950/60 rounded-[10px] flex items-center justify-center text-[10px] font-bold text-white">
                      {grad.name.split(' ')[0]}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 mb-2">
                Preferred Download Source
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'direct', label: 'Direct APK CDN' },
                  { id: 'github', label: 'GitHub Releases' },
                  { id: 'drive', label: 'Google Drive' },
                ].map((src) => (
                  <button
                    key={src.id}
                    type="button"
                    onClick={() => setMirrorInput(src.id as any)}
                    className={`py-3 px-2 text-xs font-bold rounded-xl border transition-all ${
                      mirrorInput === src.id
                        ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {src.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Clear local download history and favorites?')) {
                    localStorage.removeItem('crazystore_downloaded_apps');
                    localStorage.removeItem('crazystore_favorites');
                    window.location.reload();
                  }
                }}
                className="text-xs text-rose-500 hover:underline font-semibold"
              >
                Reset Local Library Data
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-md transition-all"
              >
                Save Preferences
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
