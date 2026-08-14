'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { AndroidApp } from '@/lib/appsData';
import { FaGithub } from 'react-icons/fa';
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
  Sliders
} from 'lucide-react';

export function AdminAppUpload() {
  const { showToast } = useToast();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'editor' | 'list' | 'reviews'>('editor');

  // Apps State
  const [apps, setApps] = useState<AndroidApp[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState<boolean>(false);
  
  // Reviews State
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(false);
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});

  // Form State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  const [name, setName] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [tagline, setTagline] = useState<string>('');
  const [iconSymbol, setIconSymbol] = useState<string>('smartphone');
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
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [bannerUrl, setBannerUrl] = useState<string>('');
  const [existingScreenshots, setExistingScreenshots] = useState<any[]>([]);
  const [deletingScreenshotId, setDeletingScreenshotId] = useState<string | null>(null);
  const [isDeletingLogo, setIsDeletingLogo] = useState<boolean>(false);
  const [isDeletingBanner, setIsDeletingBanner] = useState<boolean>(false);

  useEffect(() => {
    // Intentionally omitting automatic authentication check so the user is
    // always prompted for the passcode when navigating to /admin.
  }, []);

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

  const handleRemoveBanner = async () => {
    if (bannerUrl) {
      setIsDeletingBanner(true);
      try {
        await deleteImageFromImageKit(bannerUrl);
        setBannerUrl('');
        showToast('Feature Banner removed and deleted from ImageKit', 'info');
      } catch (err) {
        console.error(err);
        showToast('Failed to delete banner from ImageKit', 'error');
      } finally {
        setIsDeletingBanner(false);
      }
    }
    setBannerFile(null);
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

  const fetchApps = async () => {
    setIsLoadingApps(true);
    try {
      const res = await fetch('/api/apps');
      if (res.ok) {
        const data = await res.json();
        setApps(data.apps || []);
      }
    } catch (error) {
      console.error('Error fetching apps:', error);
    } finally {
      setIsLoadingApps(false);
    }
  };

  const fetchReviews = async () => {
    setIsLoadingReviews(true);
    try {
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated) {
      const loadInitial = async () => {
        setIsLoadingApps(true);
        setIsLoadingReviews(true);
        try {
          const [appsRes, reviewsRes] = await Promise.all([
            fetch('/api/apps'),
            fetch('/api/reviews')
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
    if (passcode.trim().length > 0) {
      try {
        const res = await fetch('/api/admin/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passcode: passcode.trim() }),
        });
        if (res.ok) {
          setIsAuthenticated(true);
          setPasscodeError(null);
        } else {
          setPasscodeError('Invalid passcode. Please try again.');
        }
      } catch (err) {
        setPasscodeError('Error verifying passcode.');
      }
    } else {
      setPasscodeError('Please enter a passcode.');
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
    setBannerFile(null);
    setScreenshotFiles([]);
    setLogoUrl('');
    setBannerUrl('');
    setExistingScreenshots([]);
    setFormError(null);
  };

  const startEditing = (app: any) => {
    setIsEditing(true);
    setEditingSlug(app.slug);
    setName(app.name);
    setSlug(app.slug);
    setTagline(app.tagline || '');
    setIconSymbol(app.iconSymbol || 'smartphone');
    setDescription(app.shortDescription);
    setFeatures(app.features ? app.features.join('\n') : '');
    setCategory(app.category);
    setVersion(app.version);
    setDownloadUrl(app.downloadUrl);
    setSize(app.size);
    setMinAndroid(app.minAndroid);
    setBadge(app.badge);
    setTechStack(app.techStack ? app.techStack.join(', ') : '');
    setGithubUrl(app.githubUrl || '');
    
    setLogoUrl(app.logoUrl || '');
    setBannerUrl(app.bannerUrl || '');
    const parsedScreenshots = (app.screenshots || []).map((s: any, idx: number) => ({
      id: s.id || `preview-${idx}-${Date.now()}`,
      title: s.title || `Preview #${idx + 1}`,
      subtitle: s.subtitle || 'App Preview',
      accentColor: s.accentColor || 'from-zinc-900/40 to-zinc-900/20',
      type: s.type || 'preview',
      imageUrl: s.imageUrl || s.url || '',
      url: s.url || s.imageUrl || '',
    })).filter((s: any) => s.imageUrl || s.url);
    setExistingScreenshots(parsedScreenshots);
    
    setLogoFile(null);
    setBannerFile(null);
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
      let finalBannerUrl = bannerUrl;
      let screenshotsData: any[] = isEditing ? existingScreenshots : [];

      if (logoFile) {
        // If replacing an existing logo, clean up the old one from ImageKit
        if (isEditing && logoUrl && logoUrl.includes('imagekit.io')) {
          deleteImageFromImageKit(logoUrl);
        }
        finalLogoUrl = await uploadFile(logoFile);
      }
      if (bannerFile) {
        // If replacing an existing banner, clean up the old one from ImageKit
        if (isEditing && bannerUrl && bannerUrl.includes('imagekit.io')) {
          deleteImageFromImageKit(bannerUrl);
        }
        finalBannerUrl = await uploadFile(bannerFile);
      }
      if (screenshotFiles.length > 0) {
        const uploadedScreenshots: any[] = [];
        for (let index = 0; index < screenshotFiles.length; index++) {
          const file = screenshotFiles[index];
          const url = await uploadFile(file);
          uploadedScreenshots.push({
            id: `preview-${Date.now()}-${index}`,
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
        slug,
        tagline,
        iconSymbol,
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
        bannerUrl: finalBannerUrl,
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

      showToast(isEditing ? 'App updated successfully!' : 'App uploaded successfully!', 'success');
      resetForm();
      fetchApps();
      setActiveTab('list');
    } catch (err: any) {
      console.error(err);
      if (err.message.includes('401') || err.message.includes('Unauthorized')) {
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
    if (!confirm(`Are you sure you want to delete ${slugToDelete}? This will also clean up associated images.`)) return;
    try {
      // Find app to clean up its images from ImageKit
      const appToDelete = apps.find(a => a.slug === slugToDelete);
      if (appToDelete) {
        const imagesToDelete = [
          appToDelete.logoUrl,
          appToDelete.bannerUrl,
          ...(appToDelete.screenshots?.map((s: any) => s.imageUrl || s.url) || [])
        ].filter(Boolean);
        
        if (imagesToDelete.length > 0) {
          try {
            await fetch('/api/upload', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ urls: imagesToDelete })
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
        showToast('App and associated media deleted successfully!', 'success');
        fetchApps();
        if (isEditing && editingSlug === slugToDelete) {
          resetForm();
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
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
          adminReply: replyText
        }),
      });

      if (res.ok) {
        showToast('Reply submitted successfully!', 'success');
        setReplyTexts(prev => ({ ...prev, [reviewId]: '' }));
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

  if (!isAuthenticated) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="p-8 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-black/50 text-center max-w-md w-full mx-auto space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-900 text-white mx-auto flex items-center justify-center shadow-lg shadow-zinc-900/30">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              Admin Portal
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
              Unlock the dashboard to manage your catalog, update apps, and reply to user reviews.
            </p>
          </div>
          {passcodeError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-sm font-medium border border-rose-100 dark:border-rose-900/50 flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passcodeError}</span>
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4 pt-2">
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter secure passcode"
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-shadow"
            />
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-sm transition-colors"
            >
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Live Preview Component ---
  const renderLivePreview = () => (
    <div className="w-full max-w-sm mx-auto bg-zinc-100 dark:bg-zinc-950 border-[8px] border-zinc-800 dark:border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl relative h-[720px] flex flex-col ring-1 ring-white/10">
      {/* Mobile Notch/Island */}
      <div className="absolute top-0 inset-x-0 h-7 flex justify-center z-20">
        <div className="w-32 h-7 bg-zinc-800 rounded-b-3xl"></div>
      </div>
      
      <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-900 custom-scrollbar pb-10">
        {/* Banner Area */}
        <div className="relative h-56 bg-zinc-200 dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-800">
          {(bannerFile || bannerUrl) ? (
            <img src={bannerFile ? URL.createObjectURL(bannerFile) : bannerUrl} className="w-full h-full object-cover" alt="Banner" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-900/20 to-zinc-900/20 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600">
              <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">No Banner</span>
            </div>
          )}
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-zinc-900 via-transparent to-transparent"></div>
        </div>

        <div className="px-5 -mt-12 relative z-10">
          {/* App Logo */}
          <div className="w-24 h-24 bg-white dark:bg-zinc-950 rounded-2xl shadow-xl border-4 border-white dark:border-zinc-900 overflow-hidden">
            {(logoFile || logoUrl) ? (
              <img src={logoFile ? URL.createObjectURL(logoFile) : logoUrl} className="w-full h-full object-cover" alt="Logo" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-100 to-zinc-100 dark:from-zinc-900/40 dark:to-zinc-900/40 flex items-center justify-center">
                <Smartphone className="w-10 h-10 text-zinc-900 dark:text-zinc-100" />
              </div>
            )}
          </div>

          {/* Header Info */}
          <div className="mt-4">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 leading-tight tracking-tight">
              {name || 'Your App Name'}
            </h2>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mt-1">
              {tagline || 'Your catchy tagline will appear here.'}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-semibold">
            <span className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              {category || 'Category'}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              {size || 'Size'}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
              {version || 'v1.0.0'}
            </span>
          </div>

          <button className="w-full bg-zinc-900 text-white rounded-2xl py-3.5 font-bold mt-6 flex items-center justify-center gap-2 shadow-lg shadow-zinc-900/20">
            <Upload className="w-4 h-4 rotate-180" /> Install APK
          </button>

          {/* Description */}
          <div className="mt-8 space-y-3">
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              About this app
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
              {description || 'The full description of your application will be displayed here. Start typing in the form to see this preview update instantly.'}
            </p>
          </div>

          {/* Features */}
          {features && (
            <div className="mt-8 space-y-3">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">Key Features</h3>
              <ul className="space-y-2">
                {features.split('\n').map((f, i) => f.trim() && (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 mt-2 shrink-0"></div>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-600 text-white">
              <Smartphone className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Developer Admin Portal
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Upload new Android apps, manage Google Drive APK download links, and monitor reviews catalog.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:text-purple-600 transition-colors"
          >
            View Public Site
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="w-full space-y-6">
      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-2">
        <div className="flex space-x-6 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('editor')}
            className={`pb-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'editor'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            {isEditing ? <Edit2 className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
            {isEditing ? 'Edit App Details' : 'Add New App'}
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`pb-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'list'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Manage Catalog
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'reviews'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            User Reviews
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="mb-3 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-rose-100 dark:bg-zinc-800 dark:hover:bg-rose-950/50 text-zinc-600 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
          title="Lock Admin Portal"
        >
          <Lock className="w-3.5 h-3.5" />
          Lock Portal
        </button>
      </div>

      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* Form Side */}
          <div className="xl:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                {isEditing ? 'Update App Details' : 'Publish New App'}
              </h2>
              {isEditing && (
                <button
                  onClick={resetForm}
                  className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Cancel Edit
                </button>
              )}
            </div>

            {formError && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-sm font-medium border border-rose-100 dark:border-rose-900/50 flex gap-3 items-start shadow-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{formError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info Section */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-5">
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 text-sm border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <Info className="w-4 h-4 text-zinc-900 dark:text-zinc-100" /> Core Identity
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">App Name *</label>
                      <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" placeholder="e.g. FocusFlow" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Custom Slug (URL)</label>
                      <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" placeholder="Leave blank to auto-generate" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tagline</label>
                    <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" placeholder="e.g. The ultimate productivity tool" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Category</label>
                      <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Version</label>
                      <input type="text" value={version} onChange={(e) => setVersion(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Size</label>
                      <input type="text" value={size} onChange={(e) => setSize(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-5">
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 text-sm border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <MessageSquare className="w-4 h-4 text-zinc-900 dark:text-zinc-100" /> Details & Content
                </h4>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Full Description *</label>
                    <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 custom-scrollbar" placeholder="Describe your app..." />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Key Features (One per line)</label>
                    <textarea value={features} onChange={(e) => setFeatures(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 custom-scrollbar" placeholder="Feature 1\nFeature 2" />
                  </div>
                </div>
              </div>

              {/* Media Section */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 text-sm">
                    <ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Branding & Media Management
                  </h4>
                  <span className="text-[11px] font-semibold text-zinc-400">
                    Synced with ImageKit Storage
                  </span>
                </div>

                <div className="space-y-6">
                  {/* Top Grid: Logo & Feature Banner */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* App Logo Card */}
                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" /> App Logo (1:1)
                          </label>
                          {logoFile ? (
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                              New File Selected
                            </span>
                          ) : logoUrl ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                              Live on ImageKit
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 text-[10px] font-bold">
                              Using Default Icon
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 mb-3">Square icon for app cards and header.</p>

                        {/* Logo Preview Container */}
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-center overflow-hidden shrink-0 relative group">
                            {logoFile ? (
                              <img
                                src={URL.createObjectURL(logoFile)}
                                alt="Logo Preview"
                                className="w-full h-full object-cover"
                              />
                            ) : logoUrl ? (
                              <img
                                src={logoUrl}
                                alt="Logo Preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Smartphone className="w-8 h-8 text-zinc-400" />
                            )}
                          </div>

                          <div className="flex-1 space-y-2">
                            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold transition-all shadow-sm">
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
                              <div>
                                <button
                                  type="button"
                                  disabled={isDeletingLogo}
                                  onClick={handleRemoveLogo}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold transition-colors"
                                >
                                  {isDeletingLogo ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                  <span>Remove Logo</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Feature Banner Card */}
                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" /> Feature Banner (16:9)
                          </label>
                          {bannerFile ? (
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                              New File Selected
                            </span>
                          ) : bannerUrl ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                              Live on ImageKit
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 text-[10px] font-bold">
                              No Banner
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 mb-3">Optional wide banner for detail showcase.</p>

                        {/* Banner Preview Frame */}
                        <div className="w-full h-24 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-center overflow-hidden relative mb-3">
                          {bannerFile ? (
                            <img
                              src={URL.createObjectURL(bannerFile)}
                              alt="Banner Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : bannerUrl ? (
                            <img
                              src={bannerUrl}
                              alt="Banner Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center text-zinc-400 text-xs flex items-center gap-2">
                              <ImageIcon className="w-4 h-4" />
                              <span>No Banner Uploaded</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold transition-all shadow-sm">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{bannerUrl || bannerFile ? 'Change Banner' : 'Upload Banner'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                            />
                          </label>

                          {(bannerUrl || bannerFile) && (
                            <button
                              type="button"
                              disabled={isDeletingBanner}
                              onClick={handleRemoveBanner}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold transition-colors"
                            >
                              {isDeletingBanner ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                              <span>Remove Banner</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* App Previews (Multiple) Management Section */}
                  <div className="p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" /> App Previews Showcase Gallery
                        </label>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          Upload high-resolution preview images. Reorder images using the arrow controls (← / →) and remove individual previews from ImageKit anytime.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {existingScreenshots.length > 0 && (
                          <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800/40 shadow-xs">
                            {existingScreenshots.length} Live on ImageKit
                          </span>
                        )}
                        {screenshotFiles.length > 0 && (
                          <span className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-800/40 shadow-xs">
                            {screenshotFiles.length} New to Upload
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Saved Previews from ImageKit */}
                    {existingScreenshots.length > 0 && (
                      <div className="space-y-3 pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                            <Sliders className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            Current Preview Sequence ({existingScreenshots.length} images)
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            Use ← → buttons to adjust display order on the public app page
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {existingScreenshots.map((screenshot, idx) => (
                            <div
                              key={screenshot.id || idx}
                              className="relative group rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all flex flex-col p-3 space-y-3"
                            >
                                {/* Top Bar with Reorder/Delete */}
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                      {idx === 0 ? 'Primary Cover' : `Image ${idx + 1}`}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    {/* Move Left / Up */}
                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={() => moveExistingPreview(idx, idx - 1)}
                                      className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-purple-100 dark:hover:bg-purple-950/60 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                      title="Move Left in sequence"
                                    >
                                      <ArrowLeft className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Move Right / Down */}
                                    <button
                                      type="button"
                                      disabled={idx === existingScreenshots.length - 1}
                                      onClick={() => moveExistingPreview(idx, idx + 1)}
                                      className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-purple-100 dark:hover:bg-purple-950/60 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                      title="Move Right in sequence"
                                    >
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Delete from ImageKit */}
                                    <button
                                      type="button"
                                      disabled={deletingScreenshotId === (screenshot.id || String(idx))}
                                      onClick={() => handleDeleteExistingScreenshot(screenshot, idx)}
                                      className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 transition-colors ml-1"
                                      title="Permanently delete this preview image from ImageKit"
                                    >
                                      {deletingScreenshotId === (screenshot.id || String(idx)) ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Trash2 className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Preview Frame Thumbnail */}
                                <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80">
                                  <img
                                    src={screenshot.imageUrl || screenshot.url}
                                    alt={screenshot.title || `Preview ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute bottom-2 right-2">
                                    <a
                                      href={screenshot.imageUrl || screenshot.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-colors inline-flex"
                                      title="Open full image"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </a>
                                  </div>
                                </div>

                                {/* Editable Title/Caption */}
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                    Optional Caption
                                  </label>
                                  <input
                                    type="text"
                                    value={screenshot.title || ''}
                                    onChange={(e) => updateExistingPreviewTitle(idx, e.target.value)}
                                    placeholder="e.g. Dashboard Dark Mode"
                                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-600"
                                  />
                                </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pending Selected Files Preview */}
                    {screenshotFiles.length > 0 && (
                      <div className="space-y-3 pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                            New Uploads ({screenshotFiles.length} images queued)
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            Will be uploaded to ImageKit on save
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {screenshotFiles.map((file, idx) => (
                            <div
                              key={idx}
                              className="relative group rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-900/60 shadow-sm flex flex-col p-3 space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <span className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-800/40">
                                  Queued
                                </span>

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => movePendingPreview(idx, idx - 1)}
                                    className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-blue-100 disabled:opacity-30 transition-colors"
                                    title="Move Left"
                                  >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === screenshotFiles.length - 1}
                                    onClick={() => movePendingPreview(idx, idx + 1)}
                                    className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-blue-100 disabled:opacity-30 transition-colors"
                                    title="Move Right"
                                  >
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePendingScreenshot(idx)}
                                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 transition-colors ml-1"
                                    title="Unselect"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="w-full aspect-[9/16] rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-950 border border-blue-100 dark:border-blue-900/40">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`Pending ${file.name}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              <div className="text-[11px] text-zinc-500 font-mono truncate">
                                {file.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add More Previews Picker Area */}
                    <div className="p-5 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 shrink-0">
                          <PlusCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                            {existingScreenshots.length > 0 || screenshotFiles.length > 0
                              ? 'Add More Preview Images'
                              : 'Select Preview Images'}
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            Upload PNG, JPEG, or WebP. Hold Ctrl/Cmd to select multiple previews at once.
                          </span>
                        </div>
                      </div>

                      <label className="cursor-pointer px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20 inline-flex items-center gap-2 shrink-0">
                        <Upload className="w-4 h-4" />
                        <span>Select Preview Files</span>
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

              {/* Links Section */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-5">
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 text-sm border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <LinkIcon className="w-4 h-4 text-zinc-900 dark:text-zinc-100" /> Download & Links
                </h4>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">APK Download URL *</label>
                    <input type="url" required value={downloadUrl} onChange={(e) => setDownloadUrl(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 font-mono" placeholder="https://drive.google.com/..." />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">GitHub / Source URL (Optional)</label>
                    <input type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 font-mono" placeholder="https://github.com/..." />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-black text-base shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" /> {isEditing ? 'Save & Update Live App' : 'Publish App to Catalog'}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Live Preview Side (Hidden on Mobile) */}
          <div className="hidden xl:block xl:col-span-5 relative">
            <div className="sticky top-10 space-y-4">
               <div className="flex items-center justify-between px-2">
                 <h3 className="font-black text-sm uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Live Device Preview</h3>
               </div>
               {renderLivePreview()}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'list' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col min-h-[60vh]">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-6">
            <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">Live Catalog</h3>
            <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-950/80 text-zinc-700 dark:text-zinc-300">
              {apps.length} Apps Published
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            {isLoadingApps ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
              </div>
            ) : apps.length === 0 ? (
              <div className="text-center py-20 px-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
                <p className="text-base font-medium text-zinc-500 dark:text-zinc-400">Your catalog is empty.</p>
                <button onClick={() => setActiveTab('editor')} className="mt-4 text-sm font-bold text-zinc-900 hover:underline">
                  Publish your first app
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {apps.map((app) => (
                  <div
                    key={app.slug}
                    className="flex flex-col justify-between gap-4 p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md hover:border-zinc-200 dark:hover:border-zinc-900/50 transition-all"
                  >
                    <div className="flex items-start gap-4">
                       <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shrink-0">
                         {app.logoUrl ? (
                           <img src={app.logoUrl} className="w-full h-full object-cover" alt="Logo" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-zinc-900">
                              <Smartphone className="w-6 h-6" />
                           </div>
                         )}
                       </div>
                       <div>
                         <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">{app.name}</h4>
                         <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">{app.tagline || app.category}</p>
                         <div className="flex items-center gap-2 mt-2">
                           <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">{app.version}</span>
                           <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">{app.size}</span>
                         </div>
                       </div>
                    </div>
                    
                     <div className="flex items-center gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
                      <Link href={`/apps/${app.slug}`} target="_blank" className="flex-1 py-2 text-center rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1">
                        View <ExternalLink className="w-3 h-3" />
                      </Link>
                      {app.githubUrl && (
                        <a
                          href={app.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center"
                          title="View GitHub Repository"
                        >
                          <FaGithub className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => startEditing(app)}
                        className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                        title="Edit App"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(app.slug)}
                        className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
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
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm min-h-[60vh]">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-6">
            <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">User Feedback</h3>
          </div>

          <div className="space-y-6">
            {isLoadingReviews ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-20 px-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
                <p className="text-base font-medium text-zinc-500 dark:text-zinc-400">No reviews have been submitted yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.map((review) => (
                  <div key={review.id} className="p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100">{review.name}</span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold tracking-wider">
                              ★ {review.rating}.0
                            </span>
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            App: <span className="font-mono text-zinc-900 dark:text-zinc-100">{review.appSlug}</span> • {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteReviewAdmin(review.id)}
                          className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
                          title="Delete this review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">&quot;{review.reviewText}&quot;</p>
                    </div>
                    
                    <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-zinc-800/80">
                      {review.adminReply ? (
                        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-900/30 flex gap-3 items-start">
                          <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-900/50 flex items-center justify-center shrink-0 mt-0.5">
                            <CornerDownRight className="w-3 h-3 text-zinc-700 dark:text-zinc-400" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-400 block mb-1">Developer Reply</span>
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200 leading-relaxed">{review.adminReply}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={replyTexts[review.id] || ''}
                            onChange={(e) => setReplyTexts(prev => ({ ...prev, [review.id]: e.target.value }))}
                            placeholder="Type a developer reply..."
                            className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                          />
                          <button
                            onClick={() => handleReplyReview(review.id)}
                            className="px-5 py-2.5 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-bold rounded-xl transition-colors whitespace-nowrap shadow-md"
                          >
                            Send Reply
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
