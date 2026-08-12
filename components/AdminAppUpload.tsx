'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { AndroidApp } from '@/lib/appsData';
import {
  Upload,
  PlusCircle,
  Trash2,
  ExternalLink,
  AlertCircle,
  Loader2,
  Lock,
} from 'lucide-react';

interface AdminAppUploadProps {
  onAppUploaded?: () => void;
}

export function AdminAppUpload({ onAppUploaded }: AdminAppUploadProps) {
  const { showToast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);

  const [apps, setApps] = useState<AndroidApp[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
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

  // File Upload State
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [bannerUrl, setBannerUrl] = useState<string>('');

  // Fetch apps
  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!isAuthenticated) return;
      setIsLoadingApps(true);
      try {
        const res = await fetch('/api/apps');
        if (res.ok && isMounted) {
          const data = await res.json();
          setApps(data.apps || []);
        }
      } catch (err) {
        console.error('Error fetching apps:', err);
      } finally {
        if (isMounted) setIsLoadingApps(false);
      }
    }
    
    // Defer the execution slightly to avoid synchronous setState warning
    const timer = setTimeout(() => {
      load();
    }, 0);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isAuthenticated]);

  const fetchApps = async () => {
    setIsLoadingApps(true);
    try {
      const res = await fetch('/api/apps');
      if (res.ok) {
        const data = await res.json();
        setApps(data.apps || []);
      }
    } catch (err) {
      console.error('Error fetching apps:', err);
    } finally {
      setIsLoadingApps(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasscodeError(null);
    if (!passcode.trim()) {
      setPasscodeError('Please enter a valid admin passcode.');
      return;
    }

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        showToast('Admin catalog unlocked.', 'success');
      } else {
        setPasscodeError(data.error || 'Invalid passcode.');
      }
    } catch (err) {
      setPasscodeError('Failed to verify passcode. Please try again.');
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-');
    setSlug(autoSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('App name is required.');
      return;
    }

    if (!downloadUrl.trim()) {
      setFormError('APK link is required.');
      return;
    }

    if (!description.trim()) {
      setFormError('App description is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalLogoUrl = logoUrl;
      let finalBannerUrl = bannerUrl;

      // Upload Logo to ImageKit if provided
      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (res.ok) {
          const data = await res.json();
          finalLogoUrl = data.url;
        }
      }

      // Upload Banner to ImageKit if provided
      if (bannerFile) {
        const formData = new FormData();
        formData.append('file', bannerFile);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (res.ok) {
          const data = await res.json();
          finalBannerUrl = data.url;
        }
      }

      // Upload Screenshots to ImageKit
      const uploadedScreenshots = [];
      for (let i = 0; i < screenshotFiles.length; i++) {
        const file = screenshotFiles[i];
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (res.ok) {
          const data = await res.json();
          uploadedScreenshots.push({
            id: `screenshot-${i}-${Date.now()}`,
            url: data.url,
          });
        }
      }

      const response = await fetch('/api/apps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': passcode,
        },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          iconSymbol,
          logoUrl: finalLogoUrl,
          bannerUrl: finalBannerUrl,
          screenshots: uploadedScreenshots.length > 0 ? uploadedScreenshots : undefined,
          githubUrl: githubUrl.trim(),
          category,
          version: version.trim() || 'v1.0.0',
          downloadUrl: downloadUrl.trim(),
          shortDescription: description.trim(),
          fullDescription: description.trim(),
          features: features.split('\n').filter(f => f.trim().length > 0),
          size: size.trim() || '15 MB',
          minAndroid: minAndroid.trim() || 'Android 8.0+',
          badge,
          techStack,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data.error || 'Failed to upload app entry.';
        setFormError(msg);
        showToast(msg, 'error');
        setIsSubmitting(false);
        return;
      }

      showToast(`App "${name}" published successfully!`, 'success');

      // Reset Form
      setName('');
      setSlug('');
      setDescription('');
      setDownloadUrl('');
      setVersion('v1.0.0');
      setLogoFile(null);
      setBannerFile(null);
      setScreenshotFiles([]);
      setLogoUrl('');
      setBannerUrl('');
      setGithubUrl('');

      fetchApps();

      if (onAppUploaded) {
        onAppUploaded();
      }
    } catch (err) {
      console.error('Upload error:', err);
      const msg = 'Network error while publishing app.';
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (slug: string, appName: string) => {
    try {
      const res = await fetch(`/api/apps?slug=${slug}`, {
        method: 'DELETE',
        headers: {
          'x-admin-key': passcode,
        },
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Failed to delete app.', 'error');
        return;
      }

      showToast(`"${appName}" removed.`, 'info');
      fetchApps();
    } catch {
      showToast('Error removing app.', 'error');
    }
  };

  return (
    <div id="admin-app-upload-component" className="w-full space-y-6">
      {!isAuthenticated ? (
        <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md text-center max-w-md mx-auto space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center border border-purple-200 dark:border-purple-800/50">
            <Lock className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Admin Catalog Lock
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Unlock to upload new Android APKs and edit catalog entries.
            </p>
          </div>

          {passcodeError && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passcodeError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter secure passcode"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all"
            >
              Unlock Catalog Manager
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Upload Form Card */}
          <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Upload New Android App
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                Unlocked
              </span>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                  App Name <span className="text-purple-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. VideoHub Pro"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. videohub-pro"
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                    Icon Symbol
                  </label>
                  <select
                    value={iconSymbol}
                    onChange={(e) => setIconSymbol(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="smartphone">Smartphone</option>
                    <option value="play">Play Video</option>
                    <option value="activity">Fitness / Activity</option>
                    <option value="music">Music / Audio</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option>Media & Video</option>
                    <option>Health & Fitness</option>
                    <option>Audio & Music</option>
                    <option>Tools & Utilities</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                    Version
                  </label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="v1.0.0"
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                    App Logo (ImageKit)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                    App Banner (ImageKit)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                  App Screenshots (ImageKit - Multiple)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setScreenshotFiles(files);
                  }}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-[10px] text-zinc-500 mt-1">Select multiple images to show off your app interface.</p>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                  Google Drive APK Link <span className="text-purple-500">*</span>
                </label>
                <input
                  type="url"
                  value={downloadUrl}
                  onChange={(e) => setDownloadUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/.../view"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                  GitHub Repository Link (Optional)
                </label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username/repo"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                  App Description <span className="text-purple-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Features, Jetpack Compose UI description, etc."
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                  App Features (One per line)
                </label>
                <textarea
                  rows={3}
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  placeholder="100% Ad-free video&#10;Background playback"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none whitespace-pre-wrap"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload & Add to App Catalog
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Manage Catalog List */}
          <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                App Catalog Management
              </h3>
              <span className="text-[11px] font-mono text-zinc-500">
                {apps.length} items
              </span>
            </div>

            {isLoadingApps ? (
              <div className="p-6 text-center text-xs text-zinc-400">Loading catalog...</div>
            ) : apps.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500">
                No apps in catalog yet.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {apps.map((app) => (
                  <div
                    key={app.slug}
                    className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-2">
                        {app.name}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                        {app.category} • {app.version}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Link
                        href={`/apps/${app.slug}`}
                        target="_blank"
                        className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-purple-600"
                        title="View App Page"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={() => handleDelete(app.slug, app.name)}
                        className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-100"
                        title="Delete App"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
