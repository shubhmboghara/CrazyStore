'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { AndroidApp } from '@/lib/appsData';
import { formatDownloadUrl, getGoogleDriveDirectDownloadUrl, normalizeAppRecord } from '@/lib/appUtils';
import { AdminAnalytics } from '@/components/AdminAnalytics';
import { FaGithub } from 'react-icons/fa6';
import {
  Upload,
  PlusCircle,
  Trash2,
  ExternalLink,
  AlertCircle,
  Loader2,
  Lock,
  Edit2,
  MessageSquare,
  CornerDownRight,
  LayoutGrid,
  Info,
  Image as ImageIcon,
  Smartphone,
  Save,
  X,
  Link as LinkIcon,
  ArrowLeft,
  ArrowRight,
  Eye,
  Sliders,
  Activity,
  Search,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  RefreshCw,
  Star,
  KeyRound,
  EyeOff,
  FolderGit2,
  Code2,
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

export function AdminAppUpload() {
  const { showToast } = useToast();
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>('');
  const [showPasscode, setShowPasscode] = useState<boolean>(false);
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'analytics' | 'editor' | 'list' | 'reviews'>('analytics');

  // Apps State
  const [apps, setApps] = useState<AndroidApp[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState<boolean>(false);
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [catalogCategory, setCatalogCategory] = useState<string>('All');

  // Reviews State
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(false);
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});
  const [reviewSearch, setReviewSearch] = useState<string>('');
  const [reviewFilterRating, setReviewFilterRating] = useState<number | 'all'>('all');

  // Form State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  const [name, setName] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [tagline, setTagline] = useState<string>('');
  const [iconSymbol, setIconSymbol] = useState<string>('smartphone');
  const [iconBg, setIconBg] = useState<string>('from-purple-600 to-indigo-600');
  const [description, setDescription] = useState<string>('');
  const [features, setFeatures] = useState<string>('');
  const [category, setCategory] = useState<string>('Tools & Utilities');
  const [version, setVersion] = useState<string>('v1.0.0');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [size, setSize] = useState<string>('15 MB');
  const [minAndroid, setMinAndroid] = useState<string>('Android 8.0 (API 26)+');
  const [badge, setBadge] = useState<string>('Kotlin + Compose');
  const [techStack, setTechStack] = useState<string>('Kotlin, Jetpack Compose, Coroutines');
  const [githubUrl, setGithubUrl] = useState<string>('');

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);

  const [logoUrl, setLogoUrl] = useState<string>('');
  const [existingScreenshots, setExistingScreenshots] = useState<any[]>([]);
  const [deletingScreenshotId, setDeletingScreenshotId] = useState<string | null>(null);
  const [isDeletingLogo, setIsDeletingLogo] = useState<boolean>(false);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPasscode('');
    showToast('Logged out of admin portal', 'info');
  };

  const deleteImageFromImageKit = async (url: string) => {
    if (!url) return;
    try {
      await fetch(`/api/upload?url=${encodeURIComponent(url)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Failed to delete image from ImageKit:', err);
    }
  };

  const handleRemoveLogo = async () => {
    if (logoUrl) {
      setIsDeletingLogo(true);
      try {
        await deleteImageFromImageKit(logoUrl);
        setLogoUrl('');
        showToast('App Logo removed and deleted from ImageKit', 'info');
      } catch (err) {
        console.error(err);
        showToast('Failed to delete logo from ImageKit', 'error');
      } finally {
        setIsDeletingLogo(false);
      }
    }
    setLogoFile(null);
  };

  const handleDeleteExistingScreenshot = async (screenshot: any, index: number) => {
    const title = screenshot.title || `Preview #${index + 1}`;
    if (!confirm(`Are you sure you want to delete "${title}"? This will permanently remove the file from ImageKit.`)) return;

    setDeletingScreenshotId(screenshot.id || String(index));
    try {
      const targetUrl = screenshot.imageUrl || screenshot.url;
      if (targetUrl) {
        await deleteImageFromImageKit(targetUrl);
      }
      setExistingScreenshots((prev) => prev.filter((_, idx) => idx !== index));
      showToast(`Preview image #${index + 1} deleted from ImageKit & removed`, 'success');
    } catch (err) {
      console.error('Error removing preview image:', err);
      showToast('Error removing preview image', 'error');
    } finally {
      setDeletingScreenshotId(null);
    }
  };

  const moveExistingPreview = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= existingScreenshots.length) return;
    setExistingScreenshots((prev) => {
      const updated = [...prev];
      const [movedItem] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedItem);
      return updated;
    });
    showToast(`Reordered preview to position #${toIndex + 1}`, 'info');
  };

  const updateExistingPreviewTitle = (index: number, newTitle: string) => {
    setExistingScreenshots((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], title: newTitle };
      }
      return updated;
    });
  };

  const movePendingPreview = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= screenshotFiles.length) return;
    setScreenshotFiles((prev) => {
      const updated = [...prev];
      const [movedFile] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedFile);
      return updated;
    });
  };

  const handleRemovePendingScreenshot = (indexToRemove: number) => {
    setScreenshotFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const fetchApps = useCallback(async () => {
    setIsLoadingApps(true);
    try {
      const timestamp = new Date().getTime();
      const res = await fetch(`/api/apps?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setApps((data.apps || []).map((a: any) => normalizeAppRecord(a)));
      }
    } catch (error) {
      console.error('Error fetching apps:', error);
    } finally {
      setIsLoadingApps(false);
    }
  }, []);

  const fetchReviews = useCallback(async () => {
    setIsLoadingReviews(true);
    try {
      const timestamp = new Date().getTime();
      const res = await fetch(`/api/reviews?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsLoadingReviews(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated) {
      const loadInitial = async () => {
        setIsLoadingApps(true);
        setIsLoadingReviews(true);
        try {
          const [appsRes, reviewsRes] = await Promise.all([
            fetch('/api/apps', {
              cache: 'no-store',
              headers: { 'Cache-Control': 'no-cache' },
            }),
            fetch('/api/reviews', {
              cache: 'no-store',
              headers: { 'Cache-Control': 'no-cache' },
            }),
          ]);
          if (appsRes.ok && isMounted) {
            const appsData = await appsRes.json();
            setApps(appsData.apps || []);
          }
          if (reviewsRes.ok && isMounted) {
            const revData = await reviewsRes.json();
            setReviews(revData.reviews || []);
          }
        } catch (err) {
          console.error(err);
        } finally {
          if (isMounted) {
            setIsLoadingApps(false);
            setIsLoadingReviews(false);
          }
        }
      };
      loadInitial();
    }
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim().length === 0) {
      setPasscodeError('Please enter the admin passcode.');
      return;
    }
    setIsVerifying(true);
    setPasscodeError(null);
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });
      if (res.ok) {
        setIsAuthenticated(true);
        setPasscodeError(null);
        showToast('Admin access granted', 'success');
      } else {
        setPasscodeError('Invalid passcode. Please try again.');
      }
    } catch {
      setPasscodeError('Error connecting to verification server.');
    } finally {
      setIsVerifying(false);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      throw new Error('Failed to upload file: ' + file.name);
    }
    const data = await res.json();
    return data.url;
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingSlug(null);
    setName('');
    setSlug('');
    setTagline('');
    setIconSymbol('smartphone');
    setIconBg('from-purple-600 to-indigo-600');
    setDescription('');
    setFeatures('');
    setCategory('Tools & Utilities');
    setVersion('v1.0.0');
    setDownloadUrl('');
    setSize('15 MB');
    setMinAndroid('Android 8.0 (API 26)+');
    setBadge('Kotlin + Compose');
    setTechStack('Kotlin, Jetpack Compose, Coroutines');
    setGithubUrl('');
    setLogoFile(null);
    setScreenshotFiles([]);
    setLogoUrl('');
    setExistingScreenshots([]);
    setFormError(null);
  };

  const startEditing = (rawApp: any) => {
    const app = normalizeAppRecord(rawApp);
    setIsEditing(true);
    setEditingSlug(app.slug);
    setName(app.name || '');
    setSlug(app.slug || '');
    setTagline(app.tagline || '');
    setIconSymbol(app.iconSymbol || 'smartphone');
    setIconBg(app.iconBg || 'from-purple-600 to-indigo-600');

    const descText = app.shortDescription
      ? app.shortDescription
      : Array.isArray(app.fullDescription)
      ? app.fullDescription.join('\n\n')
      : typeof app.fullDescription === 'string'
      ? app.fullDescription
      : '';
    setDescription(descText);

    const featText = Array.isArray(app.features)
      ? app.features.join('\n')
      : typeof app.features === 'string'
      ? app.features
      : '';
    setFeatures(featText);

    setCategory(app.category || 'Tools & Utilities');
    setVersion(app.version || 'v1.0.0');
    setDownloadUrl(app.downloadUrl || '');
    setSize(app.size || '15 MB');
    setMinAndroid(app.minAndroid || 'Android 8.0 (API 26)+');
    setBadge(app.badge || 'Kotlin + Compose');

    const techText = Array.isArray(app.techStack)
      ? app.techStack.join(', ')
      : typeof app.techStack === 'string'
      ? app.techStack
      : '';
    setTechStack(techText);
    setGithubUrl(app.githubUrl || '');

    setLogoUrl(app.logoUrl || '');
    const parsedScreenshots = (app.screenshots || [])
      .map((s: any, idx: number) => ({
        id: s.id || `preview-${idx}-${app.slug || 'app'}`,
        title: s.title || `Preview #${idx + 1}`,
        subtitle: s.subtitle || 'App Preview',
        accentColor: s.accentColor || 'from-zinc-900/40 to-zinc-900/20',
        type: s.type || 'preview',
        imageUrl: s.imageUrl || s.url || '',
        url: s.url || s.imageUrl || '',
      }))
      .filter((s: any) => s.imageUrl || s.url);
    setExistingScreenshots(parsedScreenshots);

    setLogoFile(null);
    setScreenshotFiles([]);
    setFormError(null);

    setActiveTab('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      let finalLogoUrl = logoUrl;
      let screenshotsData: any[] = isEditing ? existingScreenshots : [];

      if (logoFile) {
        if (isEditing && logoUrl && logoUrl.includes('imagekit.io')) {
          deleteImageFromImageKit(logoUrl);
        }
        finalLogoUrl = await uploadFile(logoFile);
      }

      if (screenshotFiles.length > 0) {
        const uploadedScreenshots: any[] = [];
        for (let index = 0; index < screenshotFiles.length; index++) {
          const file = screenshotFiles[index];
          const url = await uploadFile(file);
          uploadedScreenshots.push({
            id: `preview-${index}-${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
            title: `Preview #${existingScreenshots.length + index + 1}`,
            subtitle: 'App Preview',
            accentColor: 'from-zinc-900/40 to-zinc-900/20',
            type: 'preview',
            imageUrl: url,
            url: url,
          });
        }
        screenshotsData = isEditing ? [...existingScreenshots, ...uploadedScreenshots] : uploadedScreenshots;
      }

      const payload = {
        originalSlug: isEditing ? editingSlug : undefined,
        name,
        slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        tagline,
        iconSymbol,
        iconBg: iconBg || 'from-purple-600 to-indigo-600',
        shortDescription: description,
        fullDescription: description,
        features,
        category,
        version,
        downloadUrl,
        size,
        minAndroid,
        badge,
        techStack,
        githubUrl,
        logoUrl: finalLogoUrl,
        bannerUrl: '',
        screenshots: screenshotsData,
      };

      const res = await fetch('/api/apps', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': passcode,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save app');
      }

      const resData = await res.json();
      const savedApp = resData.app ? normalizeAppRecord(resData.app) : null;

      showToast(isEditing ? 'App updated successfully!' : 'App published to catalog!', 'success');

      // Optimistically update local catalog state
      if (savedApp) {
        setApps((prevApps) => {
          const matchTarget = (isEditing && editingSlug ? editingSlug : savedApp.slug).toLowerCase();
          const index = prevApps.findIndex((a) => a.slug.toLowerCase() === matchTarget);
          if (index >= 0) {
            const updated = [...prevApps];
            updated[index] = savedApp;
            return updated;
          }
          return [savedApp, ...prevApps];
        });
      }

      resetForm();
      await fetchApps();

      // Dispatch global synchronization events across all tabs and open views
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('apps_updated', {
            detail: {
              slug: savedApp?.slug || payload.slug,
              action: isEditing ? 'update' : 'create',
            },
          })
        );
        try {
          localStorage.setItem('crazystore_apps_last_updated', String(new Date().toISOString()));
        } catch {
          // Ignore
        }
      }

      setActiveTab('list');
      
      // Force Next.js to re-fetch Server Components (like the Home page) to update the client router cache
      router.refresh();
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        setFormError('Invalid admin passcode. Please log in again.');
        setIsAuthenticated(false);
      } else {
        setFormError(err.message || 'An unexpected error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (slugToDelete: string) => {
    if (!confirm(`Are you sure you want to delete "${slugToDelete}"? This will permanently remove the app and associated ImageKit media.`)) return;
    try {
      const appToDelete = apps.find((a) => a.slug === slugToDelete);
      if (appToDelete) {
        const imagesToDelete = [
          appToDelete.logoUrl,
          appToDelete.bannerUrl,
          ...(appToDelete.screenshots?.map((s: any) => s.imageUrl || s.url) || []),
        ].filter(Boolean);

        if (imagesToDelete.length > 0) {
          try {
            await fetch('/api/upload', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ urls: imagesToDelete }),
            });
          } catch (e) {
            console.warn('Could not clean up images:', e);
          }
        }
      }

      const res = await fetch(`/api/apps?slug=${slugToDelete}`, {
        method: 'DELETE',
        headers: {
          'x-admin-key': passcode,
        },
      });
      if (res.ok) {
        showToast('App deleted successfully!', 'success');
        setApps((prev) => prev.filter((a) => a.slug.toLowerCase() !== slugToDelete.toLowerCase()));
        await fetchApps();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('apps_updated', {
              detail: { slug: slugToDelete, action: 'delete' },
            })
          );
          try {
            localStorage.setItem('crazystore_apps_last_updated', String(new Date().toISOString()));
          } catch {
            // Ignore
          }
        }
        if (isEditing && editingSlug === slugToDelete) {
          resetForm();
        }
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete app');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting app');
    }
  };

  const handleReplyReview = async (reviewId: number) => {
    const replyText = replyTexts[reviewId];
    if (!replyText || replyText.trim() === '') return;

    try {
      const res = await fetch('/api/reviews', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': passcode,
        },
        body: JSON.stringify({
          reviewId,
          adminReply: replyText,
        }),
      });

      if (res.ok) {
        showToast('Developer reply posted successfully!', 'success');
        setReplyTexts((prev) => ({ ...prev, [reviewId]: '' }));
        fetchReviews();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to submit reply');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting reply');
    }
  };

  const handleDeleteReviewAdmin = async (reviewId: string | number) => {
    if (!confirm('Are you sure you want to delete this user review?')) return;

    try {
      const res = await fetch(`/api/reviews?id=${reviewId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-key': passcode,
        },
      });

      if (res.ok) {
        showToast('Review deleted successfully!', 'success');
        fetchReviews();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete review');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting review');
    }
  };

  // Filtered Lists
  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const matchesSearch =
        catalogSearch.trim() === '' ||
        app.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        app.slug.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        app.category.toLowerCase().includes(catalogSearch.toLowerCase());
      const matchesCategory = catalogCategory === 'All' || app.category === catalogCategory;
      return matchesSearch && matchesCategory;
    });
  }, [apps, catalogSearch, catalogCategory]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchesSearch =
        reviewSearch.trim() === '' ||
        (r.name && r.name.toLowerCase().includes(reviewSearch.toLowerCase())) ||
        (r.reviewText && r.reviewText.toLowerCase().includes(reviewSearch.toLowerCase())) ||
        (r.appSlug && r.appSlug.toLowerCase().includes(reviewSearch.toLowerCase()));
      const matchesRating = reviewFilterRating === 'all' || r.rating === reviewFilterRating;
      return matchesSearch && matchesRating;
    });
  }, [reviews, reviewSearch, reviewFilterRating]);

  // --- Login Screen ---
  if (!isAuthenticated) {
    return (
      <div className="w-full min-h-[70vh] flex items-center justify-center py-12 px-4">
        <div className="relative w-full max-w-md">
          {/* Subtle ambient background glow */}
          <div className="absolute -top-10 -left-10 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl shadow-purple-900/10 space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30">
                <KeyRound className="w-8 h-8" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 text-xs font-bold mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Developer Console</span>
                </div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Admin Authorization
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
                  Enter your master security passcode to access publishing tools, media management, and analytics.
                </p>
              </div>
            </div>

            {passcodeError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-200 dark:border-rose-900/50 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passcodeError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                  <span>Passcode</span>
                  <button
                    type="button"
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {showPasscode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPasscode ? 'Hide' : 'Show'}</span>
                  </button>
                </label>
                <div className="relative">
                  <input
                    type={showPasscode ? 'text' : 'password'}
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter admin passcode"
                    autoFocus
                    className="w-full px-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-center font-mono text-base tracking-widest text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all shadow-inner"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Unlock Dashboard</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-center">
              <Link
                href="/"
                className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-purple-600 transition-colors"
              >
                ← Back to Public Store
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Live Device Preview Component ---
  const renderLivePreview = () => (
    <div className="w-full max-w-[340px] mx-auto bg-zinc-950 border-[7px] border-zinc-800 rounded-[2.8rem] overflow-hidden shadow-2xl relative h-[680px] flex flex-col ring-1 ring-white/10">
      {/* Device Top Speaker & Camera Island */}
      <div className="absolute top-2 inset-x-0 flex items-center justify-between px-6 z-30 text-[10px] font-bold text-zinc-400">
        <span>09:41</span>
        <div className="w-20 h-4 bg-zinc-900 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-zinc-800" />
        </div>
        <span>5G 100%</span>
      </div>

      <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-900 custom-scrollbar pb-10 pt-12">
        <div className="px-5 space-y-5">
          {/* Header Identity Row */}
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-950 rounded-2xl shadow-md border border-zinc-200 dark:border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
              {logoFile ? (
                <img src={URL.createObjectURL(logoFile)} className="w-full h-full object-cover" alt="Logo" />
              ) : logoUrl ? (
                <img src={logoUrl} className="w-full h-full object-cover" alt="Logo" />
              ) : (
                <Smartphone className="w-8 h-8 text-purple-600" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 truncate leading-tight">
                {name || 'Application Name'}
              </h3>
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400 truncate mt-0.5">
                {category || 'Tools & Utilities'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                  {version || 'v1.0.0'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                  {size || '15 MB'}
                </span>
              </div>
            </div>
          </div>

          {/* Tagline */}
          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
            {tagline || 'A high performance open-source Android utility built with modern Kotlin & Jetpack Compose.'}
          </p>

          {/* Install CTA Simulation */}
          <a
            href={formatDownloadUrl(downloadUrl) || '#'}
            target={downloadUrl ? '_blank' : undefined}
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!downloadUrl) {
                e.preventDefault();
                showToast('Please enter a download URL in Section 5 below to test.', 'info');
              }
            }}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-3 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-600/30 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 rotate-180" />
            <span>Install APK ({size || '15 MB'})</span>
          </a>

          {/* Screenshots Preview Gallery */}
          {(existingScreenshots.length > 0 || screenshotFiles.length > 0) && (
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Screenshots</span>
              <div className="flex gap-2.5 overflow-x-auto pb-2 custom-scrollbar">
                {existingScreenshots.map((s, i) => (
                  <div key={i} className="w-24 h-44 rounded-xl overflow-hidden bg-zinc-950 shrink-0 border border-zinc-800">
                    <img src={s.imageUrl || s.url} className="w-full h-full object-cover" alt="Preview" />
                  </div>
                ))}
                {screenshotFiles.map((f, i) => (
                  <div key={i} className="w-24 h-44 rounded-xl overflow-hidden bg-zinc-950 shrink-0 border border-purple-500/50">
                    <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" alt="Pending" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* About Section */}
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">About App</span>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-4">
              {description || 'Comprehensive details and features will appear here as you type in the editor.'}
            </p>
          </div>

          {/* Tech Badge */}
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Framework</span>
            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{badge || 'Kotlin + Compose'}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Header */}
      <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm overflow-hidden">
        {/* Subtle decorative background gradients */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 text-xs font-black tracking-wide border border-purple-200 dark:border-purple-800/60 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> CrazyStore Console
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              Developer & Catalog Control Center
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
              Publish and update open-source Kotlin Android apps, manage ImageKit CDN assets, monitor realtime telemetry, and moderate community reviews.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-all border border-zinc-200/60 dark:border-zinc-700/60 shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Store</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all border border-rose-200/60 dark:border-rose-800/40 cursor-pointer shadow-xs"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Portal</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800/80">
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/60 dark:border-zinc-800/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Catalog Apps</span>
            <span className="text-xl font-black text-zinc-900 dark:text-zinc-100">{apps.length}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/60 dark:border-zinc-800/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">User Reviews</span>
            <span className="text-xl font-black text-zinc-900 dark:text-zinc-100">{reviews.length}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/60 dark:border-zinc-800/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Media CDN</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> ImageKit Active
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/60 dark:border-zinc-800/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Status</span>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-1">
              <Sparkles className="w-3.5 h-3.5" /> Production Ready
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Segmented Tabs */}
      <div className="flex items-center justify-between gap-4 p-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-300 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Analytics & Traffic</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'editor'
                ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-300 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            {isEditing ? <Edit2 className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
            <span>{isEditing ? `Editing: ${name || 'App'}` : 'Publish New App'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'list'
                ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-300 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Manage Catalog</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
              {apps.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'reviews'
                ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-300 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>User Reviews</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
              {reviews.length}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchApps();
            fetchReviews();
            showToast('Refreshed apps & reviews data', 'info');
          }}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-bold transition-colors cursor-pointer border border-zinc-200/50 dark:border-zinc-700/50"
          title="Refresh Data"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync</span>
        </button>
      </div>

      {/* TAB 1: ANALYTICS */}
      {activeTab === 'analytics' && <AdminAnalytics passcode={passcode} />}

      {/* TAB 2: EDITOR (PUBLISH / EDIT) */}
      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* Form Side */}
          <div className="xl:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  {isEditing ? <Edit2 className="w-5 h-5 text-purple-600" /> : <PlusCircle className="w-5 h-5 text-purple-600" />}
                  <span>{isEditing ? `Edit "${editingSlug}"` : 'Publish New Android App'}</span>
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Configure metadata, Kotlin framework tags, Google Drive APK links, and preview screenshots.
                </p>
              </div>

              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel Edit</span>
                </button>
              )}
            </div>

            {formError && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-200 dark:border-rose-900/50 flex gap-3 items-start shadow-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{formError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Card 1: Basic Identity */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 text-sm">
                    <Info className="w-4 h-4 text-purple-600" />
                    <span>1. Core Identity & Category</span>
                  </h3>
                  <span className="text-[11px] font-semibold text-zinc-400">Required Info</span>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                        App Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (!isEditing && (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))) {
                            setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                          }
                        }}
                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                        placeholder="e.g. Pixel Pulse"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Custom Slug (URL identifier)
                      </label>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-600"
                        placeholder="pixel-pulse"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Tagline / Brief Summary
                    </label>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                      placeholder="e.g. Modern Material 3 habit tracker for Android"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Version</label>
                      <input
                        type="text"
                        value={version}
                        onChange={(e) => setVersion(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm"
                        placeholder="v1.0.0"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">APK Size</label>
                      <input
                        type="text"
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm"
                        placeholder="18 MB"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Tech Specs & Android Target */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 text-sm">
                    <Cpu className="w-4 h-4 text-purple-600" />
                    <span>2. Android Specifications & Tech Stack</span>
                  </h3>
                  <span className="text-[11px] font-semibold text-zinc-400">Engine Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Min Android OS</label>
                    <input
                      type="text"
                      value={minAndroid}
                      onChange={(e) => setMinAndroid(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm"
                      placeholder="Android 8.0 (API 26)+"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Badge Label</label>
                    <input
                      type="text"
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm"
                      placeholder="Kotlin + Compose"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Tech Stack</label>
                    <input
                      type="text"
                      value={techStack}
                      onChange={(e) => setTechStack(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm"
                      placeholder="Kotlin, Jetpack Compose, Room"
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Media & Screenshots Showcase */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 text-sm">
                    <ImageIcon className="w-4 h-4 text-purple-600" />
                    <span>3. Branding & Media Assets</span>
                  </h3>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Synced with ImageKit
                  </span>
                </div>

                <div className="space-y-6">
                  {/* App Logo Section */}
                  <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5 text-purple-600" /> App Logo (1:1 Ratio)
                        </label>
                        <p className="text-[11px] text-zinc-500 mt-0.5">High-DPI square icon for cards and store listing.</p>
                      </div>

                      {logoFile ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-200 dark:border-blue-800/40">
                          New File Staged
                        </span>
                      ) : logoUrl ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800/40">
                          Live on ImageKit
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 text-[10px] font-bold">
                          Using Default Icon
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-5">
                      <div className="w-20 h-20 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                        {logoFile ? (
                          <img src={URL.createObjectURL(logoFile)} alt="Logo Preview" className="w-full h-full object-cover" />
                        ) : logoUrl ? (
                          <img src={logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                        ) : (
                          <Smartphone className="w-8 h-8 text-purple-600" />
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{logoUrl || logoFile ? 'Change Logo' : 'Upload Logo'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                          />
                        </label>

                        {(logoUrl || logoFile) && (
                          <button
                            type="button"
                            disabled={isDeletingLogo}
                            onClick={handleRemoveLogo}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold transition-colors cursor-pointer"
                          >
                            {isDeletingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Screenshots Showcase */}
                  <div className="p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-purple-600" /> App Screenshots Gallery
                        </label>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          High-resolution screenshots for the device carousel. Reorder using ← / → controls.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {existingScreenshots.length > 0 && (
                          <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800/40">
                            {existingScreenshots.length} Live
                          </span>
                        )}
                        {screenshotFiles.length > 0 && (
                          <span className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-800/40">
                            {screenshotFiles.length} Staged
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Existing Live Screenshots */}
                    {existingScreenshots.length > 0 && (
                      <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {existingScreenshots.map((screenshot, idx) => (
                            <div
                              key={screenshot.id || idx}
                              className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 space-y-3 shadow-xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                  {idx === 0 ? 'Cover' : `#${idx + 1}`}
                                </span>

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => moveExistingPreview(idx, idx - 1)}
                                    className="p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-purple-100 dark:hover:bg-purple-950 disabled:opacity-30 cursor-pointer"
                                  >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === existingScreenshots.length - 1}
                                    onClick={() => moveExistingPreview(idx, idx + 1)}
                                    className="p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-purple-100 dark:hover:bg-purple-950 disabled:opacity-30 cursor-pointer"
                                  >
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={deletingScreenshotId === (screenshot.id || String(idx))}
                                    onClick={() => handleDeleteExistingScreenshot(screenshot, idx)}
                                    className="p-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                                  >
                                    {deletingScreenshotId === (screenshot.id || String(idx)) ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden bg-zinc-950 flex items-center justify-center">
                                <img
                                  src={screenshot.imageUrl || screenshot.url}
                                  alt={screenshot.title || `Preview ${idx + 1}`}
                                  className="w-full h-full object-contain"
                                />
                              </div>

                              <input
                                type="text"
                                value={screenshot.title || ''}
                                onChange={(e) => updateExistingPreviewTitle(idx, e.target.value)}
                                placeholder="Caption / Title"
                                className="w-full px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Staged New Files */}
                    {screenshotFiles.length > 0 && (
                      <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                          New Uploads ({screenshotFiles.length} Queued)
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {screenshotFiles.map((file, idx) => (
                            <div
                              key={idx}
                              className="rounded-2xl bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-900/60 p-3 space-y-3 shadow-xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold">
                                  Queued
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => movePendingPreview(idx, idx - 1)}
                                    className="p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-100 disabled:opacity-30 cursor-pointer"
                                  >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === screenshotFiles.length - 1}
                                    onClick={() => movePendingPreview(idx, idx + 1)}
                                    className="p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-100 disabled:opacity-30 cursor-pointer"
                                  >
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePendingScreenshot(idx)}
                                    className="p-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden bg-zinc-950 flex items-center justify-center">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`Pending ${file.name}`}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <p className="text-[11px] text-zinc-500 font-mono truncate">{file.name}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* File Picker Zone */}
                    <div className="p-6 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 shrink-0">
                          <PlusCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                            {existingScreenshots.length > 0 || screenshotFiles.length > 0
                              ? 'Add More Screenshots'
                              : 'Select Screenshot Files'}
                          </span>
                          <span className="text-[11px] text-zinc-500">PNG, JPEG, WebP. Hold Ctrl/Cmd to pick multiple.</span>
                        </div>
                      </div>

                      <label className="cursor-pointer px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20 inline-flex items-center gap-2 shrink-0">
                        <Upload className="w-4 h-4" />
                        <span>Select Files</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const newFiles = Array.from(e.target.files || []);
                            setScreenshotFiles((prev) => [...prev, ...newFiles]);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Description & Features */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 text-sm">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                    <span>4. App Narrative & Feature List</span>
                  </h3>
                  <span className="text-[11px] font-semibold text-zinc-400">Content</span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                      Full Description <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 leading-relaxed"
                      placeholder="Write a clear, compelling description of what this application does, its unique advantages, and how to use it..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Key Highlights & Features (One per line)
                    </label>
                    <textarea
                      value={features}
                      onChange={(e) => setFeatures(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                      placeholder="Modern Jetpack Compose UI&#10;Zero Ad Trackers & 100% Offline&#10;Material You Dynamic Theming"
                    />
                  </div>
                </div>
              </div>

              {/* Card 5: Links & Distribution */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 text-sm">
                    <LinkIcon className="w-4 h-4 text-purple-600" />
                    <span>5. Direct Download & GitHub Repository</span>
                  </h3>
                  <span className="text-[11px] font-semibold text-zinc-400">Distribution</span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                        Direct APK Download URL <span className="text-rose-500">*</span>
                      </label>
                      {downloadUrl && (
                        <a
                          href={formatDownloadUrl(downloadUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center gap-1 hover:underline"
                        >
                          <span>Test Link ↗</span>
                        </a>
                      )}
                    </div>
                    <input
                      type="url"
                      required
                      value={downloadUrl}
                      onChange={(e) => setDownloadUrl(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-600"
                      placeholder="https://drive.google.com/uc?export=download&id=... or https://drive.google.com/file/d/.../view"
                    />

                    {/* Google Drive Link Assistant */}
                    {downloadUrl && downloadUrl.includes('drive.google.com') && (
                      <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Google Drive Link Detected
                          </span>
                          {!downloadUrl.includes('export=download') && (
                            <button
                              type="button"
                              onClick={() => {
                                const direct = getGoogleDriveDirectDownloadUrl(downloadUrl);
                                setDownloadUrl(direct);
                                showToast('Converted to Direct Google Drive Download URL!', 'success');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] transition-colors cursor-pointer shadow-sm"
                            >
                              Auto-Convert to Direct Download Link
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-purple-800 dark:text-purple-300 font-mono break-all">
                          Final target: <span className="font-bold">{formatDownloadUrl(downloadUrl)}</span>
                        </p>
                      </div>
                    )}

                    <p className="text-[10px] text-zinc-400">Google Drive shareable or direct link, GitHub Releases APK asset, or direct CDN URL. Full URLs and short IDs are supported.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      GitHub Source Code URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-600"
                      placeholder="https://github.com/developer/app"
                    />
                  </div>
                </div>
              </div>

              {/* Action Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-base shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing & Syncing Media...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>{isEditing ? 'Save & Update Live App' : 'Publish Application to Store'}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Device Preview Side */}
          <div className="hidden xl:block xl:col-span-5 relative">
            <div className="sticky top-10 space-y-3">
              <div className="flex items-center justify-between px-2">
                <span className="font-bold text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                  Realtime Mobile Preview
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">Pixel 8 Pro Frame</span>
              </div>
              {renderLivePreview()}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MANAGE CATALOG */}
      {activeTab === 'list' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-purple-600" />
                <span>Live Applications Catalog</span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">Manage, test, edit, and maintain all published Android apps.</p>
            </div>

            <button
              type="button"
              onClick={() => {
                resetForm();
                setActiveTab('editor');
              }}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add New App</span>
            </button>
          </div>

          {/* Search & Filter bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Search apps by name, slug, or tag..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <select
              value={catalogCategory}
              onChange={(e) => setCatalogCategory(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value="All">All Categories ({apps.length})</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {isLoadingApps ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 animate-pulse space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                    <div className="space-y-1.5 flex-1">
                      <div className="w-24 h-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      <div className="w-16 h-3 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="text-center py-16 px-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-3">
              <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 mx-auto flex items-center justify-center">
                <Smartphone className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">No Apps Match Your Criteria</h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">Try clearing your search query or publish a new app.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredApps.map((app) => (
                <div
                  key={app.slug}
                  className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-xs hover:shadow-md hover:border-purple-300 dark:hover:border-purple-800/50 transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {app.logoUrl ? (
                        <img src={app.logoUrl} className="w-full h-full object-cover" alt={app.name} />
                      ) : (
                        <Smartphone className="w-6 h-6 text-purple-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-purple-600 transition-colors">
                        {app.name}
                      </h4>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">{app.tagline || app.category}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                          {app.version}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          {app.size}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-[10px] font-bold text-purple-600 dark:text-purple-300 truncate max-w-[100px]">
                          {app.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Download URL Quick Test in Admin List */}
                  {app.downloadUrl && (
                    <div className="px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-zinc-500 truncate font-mono text-[10px]" title={app.downloadUrl}>
                        {app.downloadUrl.replace(/^https?:\/\//, '')}
                      </span>
                      <a
                        href={formatDownloadUrl(app.downloadUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-700 dark:text-purple-400 font-bold shrink-0 flex items-center gap-0.5 hover:underline"
                      >
                        <span>Test APK ↗</span>
                      </a>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                    <Link
                      href={`/apps/${app.slug}`}
                      target="_blank"
                      className="flex-1 py-2 text-center rounded-xl bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>

                    {app.githubUrl && (
                      <a
                        href={app.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        title="GitHub Repo"
                      >
                        <FaGithub className="w-4 h-4" />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => startEditing(app)}
                      className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors cursor-pointer"
                      title="Edit App"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(app.slug)}
                      className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
                      title="Delete App"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: REVIEWS & USER FEEDBACK */}
      {activeTab === 'reviews' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-500" />
                <span>Community Feedback & Reviews</span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">Read user reviews and reply as verified developer.</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-200 dark:border-amber-800/40">
                {reviews.length} Total Reviews
              </span>
            </div>
          </div>

          {/* Search & Rating Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
              <input
                type="text"
                value={reviewSearch}
                onChange={(e) => setReviewSearch(e.target.value)}
                placeholder="Search reviews by user name, comment text, or app slug..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <select
              value={reviewFilterRating}
              onChange={(e) => setReviewFilterRating(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value="all">All Star Ratings</option>
              <option value="5">★★★★★ (5 Stars)</option>
              <option value="4">★★★★☆ (4 Stars)</option>
              <option value="3">★★★☆☆ (3 Stars)</option>
              <option value="2">★★☆☆☆ (2 Stars)</option>
              <option value="1">★☆☆☆☆ (1 Star)</option>
            </select>
          </div>

          {isLoadingReviews ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 animate-pulse space-y-3">
                  <div className="w-28 h-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="w-full h-12 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </div>
              ))}
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="text-center py-16 px-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 mx-auto flex items-center justify-center">
                <Star className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">No Reviews Found</h4>
              <p className="text-xs text-zinc-500">No user reviews currently match your filter criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredReviews.map((review) => (
                <div
                  key={review.id}
                  className="p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{review.name}</span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-xs font-bold">
                            ★ {review.rating}.0
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Target: <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">{review.appSlug}</span> •{' '}
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteReviewAdmin(review.id)}
                        className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                        title="Delete Review"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                      &quot;{review.reviewText}&quot;
                    </p>
                  </div>

                  {/* Developer Reply Area */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    {review.adminReply ? (
                      <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 flex gap-2.5 items-start">
                        <CornerDownRight className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                            Verified Developer Response
                          </span>
                          <p className="text-xs text-zinc-800 dark:text-zinc-200 font-medium">{review.adminReply}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={replyTexts[review.id] || ''}
                          onChange={(e) => setReplyTexts((prev) => ({ ...prev, [review.id]: e.target.value }))}
                          placeholder="Type official reply..."
                          className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                        />
                        <button
                          type="button"
                          onClick={() => handleReplyReview(review.id)}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap"
                        >
                          Reply
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
