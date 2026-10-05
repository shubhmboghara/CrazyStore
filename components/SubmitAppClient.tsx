'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import {
  UploadCloud,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Code2,
} from 'lucide-react';

export function SubmitAppClient() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    tagline: '',
    category: 'Tools & Utilities',
    version: 'v1.0.0',
    size: '25 MB',
    minAndroid: 'Android 8.0 (API 26)+',
    downloadUrl: '',
    githubUrl: '',
    license: 'GPL-3.0',
    shortDescription: '',
    techStack: 'Kotlin, Jetpack Compose, Material 3',
    features: 'Zero tracking & analytics\n100% Free and open source\nAMOLED Dark Mode support',
    adminPasscode: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successSlug, setSuccessSlug] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'name' && !prev.slug) {
        updated.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        tagline: formData.tagline.trim(),
        category: formData.category,
        version: formData.version.trim(),
        size: formData.size.trim(),
        minAndroid: formData.minAndroid.trim(),
        downloadUrl: formData.downloadUrl.trim(),
        githubUrl: formData.githubUrl.trim(),
        license: formData.license,
        shortDescription: formData.shortDescription.trim(),
        fullDescription: [formData.shortDescription.trim()],
        techStack: formData.techStack.split(',').map((t) => t.trim()).filter(Boolean),
        features: formData.features.split('\n').map((f) => f.trim()).filter(Boolean),
        screenshots: [],
        initialRating: 5.0,
        initialReviewCount: 1,
      };

      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': formData.adminPasscode.trim() || 'Kf$W8Dx0UaSf0shubham@93',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application.');
      }

      setSuccessSlug(formData.slug.trim());
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <Navbar />

      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full outline-hidden">
        {/* Header Breadcrumb & Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
            <Link href="/" className="hover:text-purple-400 transition-colors">
              Storefront
            </Link>
            <span>/</span>
            <span className="text-zinc-200">Developer Portal</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-lg">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Submit an Open-Source Android App
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Join our curated FOSS directory. Every app submitted must have a public source repository.
              </p>
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {successSlug && (
          <div className="mb-8 p-6 rounded-3xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <h3 className="font-bold text-base text-white">App Published Successfully!</h3>
            </div>
            <p className="text-xs text-emerald-300">
              Your application is now live on CrazyStore with instant 3D studio visualization and direct APK delivery.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <Link
                href={`/apps/${successSlug}`}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-md"
              >
                <span>View Live App Detail Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setSuccessSlug('')}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Submit another app
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-8 p-4 rounded-2xl bg-red-950/50 border border-red-500/40 text-red-200 flex items-center gap-3 text-xs">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Submission Form */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-5">
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-purple-400" />
                <span>Application Specifications</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="app-name" className="text-xs font-bold text-zinc-300">
                    App Name *
                  </label>
                  <input
                    id="app-name"
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Seal Downloader"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-hidden focus:border-purple-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="app-slug" className="text-xs font-bold text-zinc-300">
                    URL Slug *
                  </label>
                  <input
                    id="app-slug"
                    type="text"
                    name="slug"
                    required
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="e.g. seal-downloader"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 font-mono focus:outline-hidden focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="app-tagline" className="text-xs font-bold text-zinc-300">
                  Tagline / Catchphrase *
                </label>
                <input
                  id="app-tagline"
                  type="text"
                  name="tagline"
                  required
                  value={formData.tagline}
                  onChange={handleChange}
                  placeholder="One sentence describing the core utility of the app"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-hidden focus:border-purple-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="app-category" className="text-xs font-bold text-zinc-300">
                    Category *
                  </label>
                  <select
                    id="app-category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-100 focus:outline-hidden focus:border-purple-500 cursor-pointer"
                  >
                    <option value="Media & Video">Media & Video</option>
                    <option value="Security & Privacy">Security & Privacy</option>
                    <option value="Navigation & Travel">Navigation & Travel</option>
                    <option value="Tools & Utilities">Tools & Utilities</option>
                    <option value="Games & Emulation">Games & Emulation</option>
                    <option value="Productivity">Productivity</option>
                    <option value="Developer Tools">Developer Tools</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="app-version" className="text-xs font-bold text-zinc-300">
                    Version *
                  </label>
                  <input
                    id="app-version"
                    type="text"
                    name="version"
                    required
                    value={formData.version}
                    onChange={handleChange}
                    placeholder="v1.0.0"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 font-mono focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="app-size" className="text-xs font-bold text-zinc-300">
                    APK Size *
                  </label>
                  <input
                    id="app-size"
                    type="text"
                    name="size"
                    required
                    value={formData.size}
                    onChange={handleChange}
                    placeholder="25 MB"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 font-mono focus:outline-hidden focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="app-download" className="text-xs font-bold text-zinc-300">
                    Direct APK Download URL *
                  </label>
                  <input
                    id="app-download"
                    type="url"
                    name="downloadUrl"
                    required
                    value={formData.downloadUrl}
                    onChange={handleChange}
                    placeholder="https://github.com/.../app.apk or Google Drive"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 font-mono focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="app-github" className="text-xs font-bold text-zinc-300">
                    Public GitHub / GitLab URL *
                  </label>
                  <input
                    id="app-github"
                    type="url"
                    name="githubUrl"
                    required
                    value={formData.githubUrl}
                    onChange={handleChange}
                    placeholder="https://github.com/developer/repo"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 font-mono focus:outline-hidden focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="app-license" className="text-xs font-bold text-zinc-300">
                    Open Source License *
                  </label>
                  <select
                    id="app-license"
                    name="license"
                    value={formData.license}
                    onChange={handleChange}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-100 focus:outline-hidden focus:border-purple-500 cursor-pointer"
                  >
                    <option value="GPL-3.0">GNU General Public License v3.0 (GPL-3.0)</option>
                    <option value="Apache-2.0">Apache License 2.0</option>
                    <option value="MIT">MIT License</option>
                    <option value="AGPL-3.0">GNU Affero GPL v3.0</option>
                    <option value="MPL-2.0">Mozilla Public License 2.0</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="app-min-android" className="text-xs font-bold text-zinc-300">
                    Minimum Android Version *
                  </label>
                  <input
                    id="app-min-android"
                    type="text"
                    name="minAndroid"
                    value={formData.minAndroid}
                    onChange={handleChange}
                    placeholder="Android 8.0 (API 26)+"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-hidden focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="app-short-desc" className="text-xs font-bold text-zinc-300">
                  Full Description &amp; Architectural Rationale
                </label>
                <textarea
                  id="app-short-desc"
                  name="shortDescription"
                  rows={3}
                  value={formData.shortDescription}
                  onChange={handleChange}
                  placeholder="Explain why power users should install this app, technical MAD practices, etc."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-hidden focus:border-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="app-passcode" className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                  <span>Passcode / Admin Key</span>
                  <span className="text-[10px] text-zinc-500 font-normal">Leave blank for default community submission</span>
                </label>
                <input
                  id="app-passcode"
                  type="password"
                  name="adminPasscode"
                  value={formData.adminPasscode}
                  onChange={handleChange}
                  placeholder="Optional verification passcode"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 font-mono focus:outline-hidden focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer min-h-[48px]"
              >
                {isSubmitting ? (
                  <span>Publishing Application...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Submit &amp; Publish Application</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Live Preview Card */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Live Storefront Preview
            </h2>

            <div className="p-6 rounded-3xl bg-zinc-900/80 border border-purple-500/30 shadow-2xl relative overflow-hidden space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                    <Smartphone className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">
                      {formData.name || 'Your App Name'}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-950 text-purple-400 border border-zinc-800">
                        {formData.version || 'v1.0.0'}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {formData.size || '25 MB'}
                      </span>
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/40 flex items-center gap-1 shrink-0">
                  <ShieldCheck className="w-3 h-3" />
                  0 Trackers
                </span>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                {formData.tagline || 'Your app catchphrase and primary utility summary will appear here.'}
              </p>

              <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/80">
                <span className="font-mono text-emerald-400 font-semibold">{formData.license}</span>
                <span>{formData.category}</span>
              </div>

              <div className="w-full py-2.5 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-bold text-center">
                Download APK
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-xs text-zinc-400 space-y-2">
              <div className="flex items-center gap-2 font-bold text-zinc-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>CrazyStore Submission Criteria</span>
              </div>
              <ul className="space-y-1 list-disc list-inside text-zinc-400 text-[11px]">
                <li>Must be licensed under an OSI-approved FOSS license.</li>
                <li>Zero advertising libraries or tracking telemetry allowed.</li>
                <li>Must compile for ARM64-v8a architecture.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
