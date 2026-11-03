'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Sparkles,
  Smartphone,
  ArrowRight,
  ShieldCheck,
  History,
  Trash2,
  Star,
  ExternalLink,
  Tag,
} from 'lucide-react';
import { ANDROID_APPS, AndroidApp } from '@/lib/appsData';
import {
  HighlightedText,
  filterApps,
  getRecentSearches,
  saveRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  POPULAR_SEARCH_TAGS,
} from '@/lib/searchUtils';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  apps?: AndroidApp[];
}

function CommandPaletteAppLogo({ app }: { app: AndroidApp }) {
  const [imgSrc, setImgSrc] = useState<string | null>(
    app.logoUrl || (app.slug === 'videohub' ? '/videohub-logo.png' : null)
  );

  useEffect(() => {
    setImgSrc(app.logoUrl || (app.slug === 'videohub' ? '/videohub-logo.png' : null));
  }, [app.logoUrl, app.slug]);

  if (imgSrc) {
    return (
      <img
        src={imgSrc}
        alt={app.name}
        className="w-full h-full object-cover"
        onError={() => {
          if (imgSrc !== '/videohub-logo.png') {
            setImgSrc('/videohub-logo.png');
          } else {
            setImgSrc(null);
          }
        }}
      />
    );
  }

  return <Smartphone className="w-5 h-5 text-white" />;
}

export function CommandPalette({ isOpen, onClose, apps = ANDROID_APPS }: CommandPaletteProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [activeApps, setActiveApps] = useState<AndroidApp[]>(apps);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    setActiveApps(apps);
  }, [apps]);

  // Sync with live database apps on modal open
  useEffect(() => {
    if (isOpen) {
      let isSubscribed = true;
      fetch('/api/apps')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (isSubscribed && data && Array.isArray(data.apps) && data.apps.length > 0) {
            setActiveApps(data.apps);
          }
        })
        .catch(() => {});
      return () => {
        isSubscribed = false;
      };
    }
  }, [isOpen]);

  // Refresh recent searches when opening dialog
  useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecentSearches());
    }
  }, [isOpen]);

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
      setSelectedCategory('All');
    }
  }, [isOpen]);

  // Categories list with counts
  const categoriesWithCounts = useMemo(() => {
    const counts = new Map<string, number>();
    activeApps.forEach((a) => {
      if (a.category) {
        counts.set(a.category, (counts.get(a.category) || 0) + 1);
      }
    });
    return [
      { name: 'All', count: activeApps.length },
      ...Array.from(counts.entries()).map(([name, count]) => ({ name, count })),
    ];
  }, [activeApps]);

  // Filtered and ranked apps
  const filteredApps = useMemo(() => {
    return filterApps(activeApps, {
      query,
      category: selectedCategory,
    });
  }, [activeApps, query, selectedCategory]);

  // Keep selected index bounded
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, selectedCategory]);

  // Auto-scroll selected element into view
  useEffect(() => {
    if (!listRef.current) return;
    const selectedElement = listRef.current.querySelector<HTMLElement>(`[data-index="${selectedIndex}"]`);
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  const handleSelectApp = useCallback(
    (slug: string) => {
      if (query.trim()) {
        saveRecentSearch(query.trim());
      }
      onClose();
      router.push(`/apps/${slug}`);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [onClose, query, router]
  );

  const handleApplyRecentSearch = (term: string) => {
    setQuery(term);
    inputRef.current?.focus();
  };

  const handleRemoveRecentSearch = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    const updated = removeRecentSearch(term);
    setRecentSearches(updated);
  };

  const handleClearAllRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearRecentSearches();
    setRecentSearches([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (filteredApps.length > 0 ? (prev + 1) % filteredApps.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filteredApps.length > 0 ? (prev - 1 + filteredApps.length) % filteredApps.length : 0
      );
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
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
      onClose={onClose}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 m-auto z-50 p-0 rounded-3xl bg-zinc-950/95 border border-zinc-800 text-white max-w-2xl w-[94vw] shadow-2xl shadow-purple-950/40 backdrop:bg-black/80 backdrop:backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      aria-labelledby="command-palette-title"
    >
      <div className="flex flex-col max-h-[82vh]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800/80 bg-zinc-900/70">
          <div className="p-1.5 rounded-lg bg-purple-950/80 border border-purple-800/40 text-purple-400 shrink-0">
            <Search className="w-4 h-4" />
          </div>
          <input
            ref={inputRef}
            type="text"
            id="command-palette-title"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search verified apps, tech stacks, permissions..."
            className="w-full bg-transparent text-sm sm:text-base text-zinc-100 placeholder-zinc-500 focus:outline-hidden"
            autoComplete="off"
            spellCheck="false"
          />

          {/* Matches pill badge */}
          {query.trim() && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-950/90 text-purple-300 border border-purple-800/40 whitespace-nowrap shrink-0">
              {filteredApps.length} {filteredApps.length === 1 ? 'match' : 'matches'}
            </span>
          )}

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer transition-colors"
              aria-label="Clear search input"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer transition-colors"
            aria-label="Close command palette"
          >
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700">
              ESC
            </span>
          </button>
        </div>

        {/* Quick Category Filter Chips */}
        <div className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 overflow-x-auto border-b border-zinc-900/90 bg-zinc-950/90 text-xs no-scrollbar">
          {categoriesWithCounts.map(({ name, count }) => (
            <button
              key={name}
              type="button"
              onClick={() => setSelectedCategory(name)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === name
                  ? 'bg-purple-950 text-purple-200 border border-purple-700/60 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
              }`}
            >
              <span>{name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedCategory === name ? 'bg-purple-900 text-purple-300' : 'bg-zinc-900 text-zinc-500'
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Dynamic Context Header (Recent Searches or Popular Tags when query is empty) */}
        {!query && (
          <div className="px-5 py-3 border-b border-zinc-900 bg-zinc-950/60 space-y-2.5">
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5 text-[11px] text-zinc-400 font-medium">
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <History className="w-3.5 h-3.5 text-purple-400" />
                    <span>Recent Searches</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearAllRecent}
                    className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear history</span>
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => handleApplyRecentSearch(term)}
                      className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-purple-950/50 border border-zinc-800 hover:border-purple-800/50 text-xs text-zinc-300 hover:text-purple-200 transition-all cursor-pointer"
                    >
                      <span>{term}</span>
                      <span
                        onClick={(e) => handleRemoveRecentSearch(e, term)}
                        className="text-zinc-500 hover:text-zinc-200 p-0.5 rounded-sm"
                        title="Remove search"
                      >
                        ×
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular trending keywords */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5 text-[11px] text-zinc-400 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Trending &amp; Popular Tags</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {POPULAR_SEARCH_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleApplyRecentSearch(tag)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800/80 text-xs text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
                  >
                    <Tag className="w-3 h-3 text-purple-400/80" />
                    <span>{tag}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results List */}
        <div ref={listRef} className="p-3 overflow-y-auto max-h-[52vh] space-y-1.5 focus:outline-hidden" role="listbox">
          {filteredApps.length > 0 ? (
            filteredApps.map((app, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={app.slug}
                  data-index={idx}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelectApp(app.slug)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'bg-purple-950/70 border border-purple-700/60 text-white shadow-lg shadow-purple-950/30 ring-1 ring-purple-600/30'
                      : 'hover:bg-zinc-900/70 border border-transparent text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${
                        app.iconBg || 'from-purple-600 to-indigo-600'
                      } flex items-center justify-center text-white shrink-0 shadow-md ring-1 ring-white/10 overflow-hidden relative`}
                    >
                      <CommandPaletteAppLogo app={app} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-zinc-100 truncate">
                          <HighlightedText text={app.name} query={query} />
                        </span>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800 shrink-0">
                          {app.version}
                        </span>

                        {app.initialRating && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-950/70 text-amber-300 border border-amber-800/40 flex items-center gap-1 shrink-0">
                            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                            <span>{app.initialRating.toFixed(1)}</span>
                          </span>
                        )}

                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 shrink-0 hidden sm:inline-flex items-center gap-1">
                          <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                          <span>0 Trackers</span>
                        </span>
                      </div>

                      <p className="text-xs text-zinc-400 truncate mt-1">
                        <HighlightedText text={app.tagline} query={query} />
                      </p>

                      {/* Tech stack matching badges */}
                      {app.techStack && app.techStack.length > 0 && (
                        <div className="flex items-center gap-1 mt-1.5 overflow-hidden">
                          {app.techStack.slice(0, 4).map((tech) => (
                            <span
                              key={tech}
                              className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900/90 text-zinc-400 border border-zinc-800/60"
                            >
                              <HighlightedText text={tech} query={query} />
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="text-xs text-zinc-500 font-mono hidden md:inline-block">{app.size}</span>
                    <div
                      className={`p-2 rounded-xl transition-all ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/40 translate-x-0.5'
                          : 'text-zinc-500 bg-zinc-900/60'
                      }`}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 px-6 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-zinc-200">
                  No applications found for &ldquo;{query}&rdquo;
                </p>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Try checking for typos or searching for general keywords like &ldquo;video&rdquo;, &ldquo;audio&rdquo;, or &ldquo;compose&rdquo;.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setSelectedCategory('All');
                    inputRef.current?.focus();
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-purple-600/20"
                >
                  Clear Search
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-5 py-3 border-t border-zinc-900 bg-zinc-950 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
                ↑
              </kbd>{' '}
              <kbd className="px-1.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
                ↓
              </kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
                ↵
              </kbd>{' '}
              Select
            </span>
            <span className="hidden sm:inline">
              <kbd className="px-1.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
                ESC
              </kbd>{' '}
              Close
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-purple-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">100% Verified Open-Source</span>
          </div>
        </div>
      </div>
    </dialog>
  );
}
