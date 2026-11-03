'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Smartphone,
  ArrowRight,
  ShieldCheck,
  Star,
  ChevronRight,
} from 'lucide-react';
import { ANDROID_APPS, AndroidApp } from '@/lib/appsData';
import {
  HighlightedText,
  filterApps,
  getRecentSearches,
  saveRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
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

  return <Smartphone className="w-4 h-4 text-white" />;
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
      setTimeout(() => inputRef.current?.focus(), 40);
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
      className="fixed top-[10vh] sm:top-[14vh] inset-x-0 mx-auto z-50 p-0 rounded-2xl bg-zinc-950/95 border border-zinc-800 text-white max-w-xl w-[92vw] shadow-2xl shadow-black/80 backdrop:bg-black/60 backdrop:backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 ring-1 ring-white/5"
      aria-labelledby="command-palette-title"
    >
      <div className="flex flex-col max-h-[76vh]">
        {/* Borderless, Streamlined Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800/80 bg-zinc-900/30">
          <Search className="w-4 h-4 text-zinc-400 shrink-0 ml-0.5" />
          <input
            ref={inputRef}
            type="text"
            id="command-palette-title"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search verified apps, tech stacks, permissions..."
            className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 outline-none border-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 p-0"
            autoComplete="off"
            spellCheck="false"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Clear search input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 shadow-xs">
            ESC
          </kbd>
        </div>

        {/* Minimal Category Filter Tabs (only shown when multiple categories exist) */}
        {categoriesWithCounts.length > 2 && (
          <div className="flex items-center gap-1 px-4 py-2 border-b border-zinc-800/40 bg-zinc-950/60 text-xs overflow-x-auto no-scrollbar">
            {categoriesWithCounts.map(({ name, count }) => (
              <button
                key={name}
                type="button"
                onClick={() => setSelectedCategory(name)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === name
                    ? 'bg-purple-950/70 text-purple-200 border border-purple-800/50'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent'
                }`}
              >
                <span>{name}</span>
                <span className="text-[10px] text-zinc-500">({count})</span>
              </button>
            ))}
          </div>
        )}

        {/* Compact Recent Searches Strip (only when query is empty and recent searches exist) */}
        {!query && recentSearches.length > 0 && (
          <div className="px-4 py-2 border-b border-zinc-800/40 bg-zinc-950/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[11px] text-zinc-500 font-medium shrink-0">Recent:</span>
              {recentSearches.slice(0, 4).map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => handleApplyRecentSearch(term)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white transition-all cursor-pointer"
                >
                  <span>{term}</span>
                  <span
                    onClick={(e) => handleRemoveRecentSearch(e, term)}
                    className="text-zinc-500 hover:text-zinc-200 ml-0.5"
                    title="Remove search"
                  >
                    ×
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleClearAllRecent}
              className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors shrink-0 ml-2 cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}

        {/* Clean, Aesthetic Results List */}
        <div ref={listRef} className="p-2 overflow-y-auto max-h-[50vh] space-y-1 focus:outline-hidden" role="listbox">
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
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'bg-purple-950/30 border border-purple-800/40 text-white shadow-xs'
                      : 'hover:bg-zinc-900/50 border border-transparent text-zinc-300'
                  }`}
                >
                  {/* Left: App Identity */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl bg-gradient-to-br ${
                        app.iconBg || 'from-purple-600 to-indigo-600'
                      } flex items-center justify-center text-white shrink-0 shadow-xs border border-white/10 overflow-hidden`}
                    >
                      <CommandPaletteAppLogo app={app} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-zinc-100 truncate">
                          <HighlightedText text={app.name} query={query} />
                        </span>

                        <span className="text-[11px] text-zinc-500 truncate hidden xs:inline">
                          {app.category}
                        </span>

                        <span className="text-[10px] font-mono text-zinc-500 px-1.5 py-0.2 rounded bg-zinc-900/80 border border-zinc-800/60 shrink-0">
                          {app.version}
                        </span>

                        {app.initialRating && (
                          <span className="text-[10px] font-medium text-amber-300/90 flex items-center gap-0.5 shrink-0">
                            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                            <span>{app.initialRating.toFixed(1)}</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-zinc-400 truncate mt-0.5 max-w-sm sm:max-w-md">
                        <HighlightedText text={app.tagline} query={query} />
                      </p>
                    </div>
                  </div>

                  {/* Right: Metadata & Select Indicator */}
                  <div className="flex items-center gap-2.5 shrink-0 ml-3">
                    <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline-block">
                      {app.size}
                    </span>

                    {isSelected ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-purple-900/50 text-purple-200 border border-purple-700/40 flex items-center gap-1 animate-in fade-in duration-100">
                        <span>Open</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-10 px-4 text-center space-y-2">
              <p className="text-sm font-medium text-zinc-200">
                No apps found for &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                Try searching by app name, description, or technology stack.
              </p>
            </div>
          )}
        </div>

        {/* Minimalist Professional Footer */}
        <div className="px-4 py-2.5 border-t border-zinc-800/60 bg-zinc-950/70 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] font-mono">
                ↑↓
              </kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] font-mono">
                ↵
              </kbd>
              <span>select</span>
            </span>
            <span className="hidden xs:flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] font-mono">
                esc
              </kbd>
              <span>close</span>
            </span>
          </div>

          <div className="flex items-center gap-1 text-zinc-500">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[10px]">Verified Open-Source</span>
          </div>
        </div>
      </div>
    </dialog>
  );
}
