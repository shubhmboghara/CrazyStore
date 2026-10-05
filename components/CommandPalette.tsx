'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Sparkles, Smartphone, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { ANDROID_APPS, AndroidApp } from '@/lib/appsData';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  apps?: AndroidApp[];
}

export function CommandPalette({ isOpen, onClose, apps = ANDROID_APPS }: CommandPaletteProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Dialog open/close lifecycle
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      if (dialog.open) {
        dialog.close();
      }
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Categories list
  const categories = useMemo(() => {
    const cats = new Set<string>();
    apps.forEach((a) => {
      if (a.category) cats.add(a.category);
    });
    return ['All', ...Array.from(cats)];
  }, [apps]);

  // Filtered apps based on query and selected category
  const filteredApps = useMemo(() => {
    const q = query.toLowerCase().trim();
    return apps.filter((app) => {
      const matchesCategory = selectedCategory === 'All' || app.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!q) return true;

      const matchesName = app.name.toLowerCase().includes(q);
      const matchesTagline = app.tagline.toLowerCase().includes(q);
      const matchesCategoryName = app.category.toLowerCase().includes(q);
      const matchesTech = (app.techStack || []).some((t) => t.toLowerCase().includes(q));
      const matchesFeatures = (app.features || []).some((f) => f.toLowerCase().includes(q));

      return matchesName || matchesTagline || matchesCategoryName || matchesTech || matchesFeatures;
    });
  }, [apps, query, selectedCategory]);

  // Keep selected index bounded
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, selectedCategory]);

  const handleSelectApp = (slug: string) => {
    onClose();
    router.push(`/apps/${slug}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (filteredApps.length > 0 ? (prev + 1) % filteredApps.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (filteredApps.length > 0 ? (prev - 1 + filteredApps.length) % filteredApps.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredApps[selectedIndex]) {
        handleSelectApp(filteredApps[selectedIndex].slug);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 m-auto z-50 p-0 rounded-3xl bg-zinc-950 border border-zinc-800 text-white max-w-2xl w-[94vw] shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      aria-labelledby="command-palette-title"
    >
      <div className="flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800/80 bg-zinc-900/60">
          <Search className="w-5 h-5 text-purple-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            id="command-palette-title"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search verified apps, tech stacks, permissions..."
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden"
            autoComplete="off"
            spellCheck="false"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-zinc-400 hover:text-white"
              aria-label="Clear search input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
            aria-label="Close command palette"
          >
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700">ESC</span>
          </button>
        </div>

        {/* Quick Category Filter Chips */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 overflow-x-auto border-b border-zinc-900 bg-zinc-950/90 text-xs no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-purple-950 text-purple-300 border border-purple-800/50'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="p-3 overflow-y-auto max-h-[50vh] space-y-1" role="listbox">
          {filteredApps.length > 0 ? (
            filteredApps.map((app, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={app.slug}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelectApp(app.slug)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-purple-950/60 border border-purple-800/40 text-white'
                      : 'hover:bg-zinc-900/60 border border-transparent text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
                        app.iconBg || 'from-purple-600 to-indigo-600'
                      } flex items-center justify-center text-white shrink-0 shadow-md`}
                    >
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-zinc-100 truncate">{app.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800 shrink-0">
                          {app.version}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 shrink-0 hidden sm:inline-block">
                          0 Trackers
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">{app.tagline}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-xs text-zinc-500 font-mono hidden md:inline-block">{app.size}</span>
                    <div
                      className={`p-1.5 rounded-xl transition-colors ${
                        isSelected ? 'bg-purple-600 text-white' : 'text-zinc-500'
                      }`}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-zinc-500 text-xs">
              No apps found matching &ldquo;{query}&rdquo;.
            </div>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-5 py-2.5 border-t border-zinc-900 bg-zinc-950 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">↑</kbd> <kbd className="px-1.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">↵</kbd> Select</span>
          </div>
          <div className="flex items-center gap-1.5 text-purple-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Verified Open-Source</span>
          </div>
        </div>
      </div>
    </dialog>
  );
}
