'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Check, ArrowRightLeft, Smartphone, ShieldCheck, Download } from 'lucide-react';
import { AndroidApp, ANDROID_APPS } from '@/lib/appsData';

interface AppCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseApp: AndroidApp;
  allApps?: AndroidApp[];
}

export function AppCompareModal({
  isOpen,
  onClose,
  baseApp,
  allApps = ANDROID_APPS,
}: AppCompareModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  
  // Pick another app to compare against (default to first other app)
  const otherApps = allApps.filter((a) => a.slug !== baseApp.slug);
  const [selectedSlug, setSelectedSlug] = useState<string>(otherApps[0]?.slug || '');

  const compareApp = otherApps.find((a) => a.slug === selectedSlug) || otherApps[0];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  if (!isOpen || !compareApp) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 m-auto z-50 p-0 rounded-3xl bg-zinc-950 border border-zinc-800 text-white max-w-4xl w-[94vw] shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      aria-labelledby="compare-modal-title"
    >
      <div className="flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h2 id="compare-modal-title" className="text-base font-black text-zinc-100 tracking-tight">
                Side-by-Side App Comparison
              </h2>
              <p className="text-xs text-zinc-400">
                Compare architecture, permissions, and security parameters
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Close compare modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Comparison Table */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Target selector */}
          <div className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800">
            <span className="text-xs text-zinc-400 font-medium">Compare {baseApp.name} against:</span>
            <select
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-purple-300 font-bold focus:outline-hidden cursor-pointer"
            >
              {otherApps.map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.name} ({a.category})
                </option>
              ))}
            </select>
          </div>

          {/* Grid Cards Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            {/* App 1 (Base App) */}
            <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-800/40 space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${
                    baseApp.iconBg || 'from-purple-600 to-indigo-600'
                  } flex items-center justify-center text-white shrink-0 shadow-lg`}
                >
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-100">{baseApp.name}</h3>
                  <span className="text-[11px] font-mono text-purple-400">{baseApp.version}</span>
                </div>
              </div>
              <p className="text-xs text-zinc-400 line-clamp-2">{baseApp.tagline}</p>
            </div>

            {/* App 2 (Comparison App) */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${
                    compareApp.iconBg || 'from-cyan-600 to-blue-600'
                  } flex items-center justify-center text-white shrink-0 shadow-lg`}
                >
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-100">{compareApp.name}</h3>
                  <span className="text-[11px] font-mono text-cyan-400">{compareApp.version}</span>
                </div>
              </div>
              <p className="text-xs text-zinc-400 line-clamp-2">{compareApp.tagline}</p>
            </div>
          </div>

          {/* Feature Matrix Rows */}
          <div className="border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800/80 text-xs">
            {/* Row 1: Category */}
            <div className="grid grid-cols-3 p-3.5 bg-zinc-950/60 items-center">
              <span className="text-zinc-500 font-medium">Category</span>
              <span className="text-zinc-200 font-bold">{baseApp.category}</span>
              <span className="text-zinc-200 font-bold">{compareApp.category}</span>
            </div>

            {/* Row 2: License */}
            <div className="grid grid-cols-3 p-3.5 items-center">
              <span className="text-zinc-500 font-medium">Open Source License</span>
              <span className="text-emerald-400 font-mono font-bold">{baseApp.license || 'GPL-3.0'}</span>
              <span className="text-emerald-400 font-mono font-bold">{compareApp.license || 'GPL-3.0'}</span>
            </div>

            {/* Row 3: Trackers (Exodus) */}
            <div className="grid grid-cols-3 p-3.5 bg-zinc-950/60 items-center">
              <span className="text-zinc-500 font-medium">Trackers & Telemetry</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> 0 Trackers
              </span>
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> 0 Trackers
              </span>
            </div>

            {/* Row 4: Package Size */}
            <div className="grid grid-cols-3 p-3.5 items-center">
              <span className="text-zinc-500 font-medium">APK Download Size</span>
              <span className="text-zinc-300 font-mono font-semibold">{baseApp.size}</span>
              <span className="text-zinc-300 font-mono font-semibold">{compareApp.size}</span>
            </div>

            {/* Row 5: Min Android */}
            <div className="grid grid-cols-3 p-3.5 bg-zinc-950/60 items-center">
              <span className="text-zinc-500 font-medium">Minimum Android</span>
              <span className="text-zinc-300">{baseApp.minAndroid}</span>
              <span className="text-zinc-300">{compareApp.minAndroid}</span>
            </div>

            {/* Row 6: Tech Stack */}
            <div className="grid grid-cols-3 p-3.5 items-center">
              <span className="text-zinc-500 font-medium">Tech Architecture</span>
              <span className="text-zinc-300 font-mono text-[11px]">{baseApp.badge}</span>
              <span className="text-zinc-300 font-mono text-[11px]">{compareApp.badge}</span>
            </div>

            {/* Row 7: Permissions Count */}
            <div className="grid grid-cols-3 p-3.5 bg-zinc-950/60 items-center">
              <span className="text-zinc-500 font-medium">Required Permissions</span>
              <span className="text-zinc-300 font-mono">{(baseApp.permissions || []).length || 3} permissions</span>
              <span className="text-zinc-300 font-mono">{(compareApp.permissions || []).length || 3} permissions</span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <a
              href={`/api/download?slug=${baseApp.slug}`}
              className="py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Download {baseApp.name}</span>
            </a>
            <a
              href={`/api/download?slug=${compareApp.slug}`}
              className="py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-zinc-700"
            >
              <Download className="w-4 h-4" />
              <span>Download {compareApp.name}</span>
            </a>
          </div>
        </div>
      </div>
    </dialog>
  );
}
