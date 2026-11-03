import React from 'react';
import { AndroidApp } from '@/lib/appsData';

export type SortOption = 'featured' | 'rating-desc' | 'name-asc' | 'name-desc' | 'size-asc';
export type QuickFilterOption = 'all' | 'zero-trackers' | 'compose' | 'material-you';

export interface FilterOptions {
  query?: string;
  category?: string;
  quickFilter?: QuickFilterOption;
  savedSlugs?: Set<string>;
}

/**
 * Splits text into matching and non-matching chunks for highlight rendering
 */
export function getHighlightChunks(text: string, query: string): Array<{ text: string; match: boolean }> {
  if (!text) return [];
  const trimmed = (query || '').trim();
  if (!trimmed) {
    return [{ text, match: false }];
  }

  // Escape special regex characters
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return parts
    .filter((part) => part.length > 0)
    .map((part) => ({
      text: part,
      match: part.toLowerCase() === trimmed.toLowerCase(),
    }));
}

/**
 * React Component to render highlighted text safely without dangerouslySetInnerHTML
 */
export function HighlightedText({
  text,
  query,
  className = '',
  highlightClassName = 'bg-purple-500/30 text-purple-200 font-semibold rounded-xs px-0.5',
}: {
  text: string;
  query: string;
  className?: string;
  highlightClassName?: string;
}) {
  const chunks = getHighlightChunks(text, query);

  return (
    <span className={className}>
      {chunks.map((chunk, idx) =>
        chunk.match ? (
          <mark key={idx} className={highlightClassName}>
            {chunk.text}
          </mark>
        ) : (
          <span key={idx}>{chunk.text}</span>
        )
      )}
    </span>
  );
}

/**
 * Calculate match score for ranking search results
 */
export function getAppSearchScore(app: AndroidApp, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 1;

  const name = (app.name || '').toLowerCase();
  const tagline = (app.tagline || '').toLowerCase();
  const category = (app.category || '').toLowerCase();
  const badge = (app.badge || '').toLowerCase();
  const shortDesc = (app.shortDescription || '').toLowerCase();
  const techStack = (app.techStack || []).map((t) => t.toLowerCase());
  const features = (app.features || []).map((f) => f.toLowerCase());

  let score = 0;

  if (name === q) score += 120;
  else if (name.startsWith(q)) score += 90;
  else if (name.includes(q)) score += 60;

  if (category === q) score += 40;
  else if (category.includes(q)) score += 25;

  if (badge.includes(q)) score += 30;

  if (techStack.some((t) => t === q)) score += 35;
  else if (techStack.some((t) => t.includes(q))) score += 20;

  if (tagline.includes(q)) score += 25;
  if (shortDesc.includes(q)) score += 15;
  if (features.some((f) => f.includes(q))) score += 15;

  return score;
}

/**
 * Filter applications by query, category, and quick filters
 */
export function filterApps(apps: AndroidApp[], options: FilterOptions): AndroidApp[] {
  const { query = '', category = 'All', quickFilter = 'all', savedSlugs = new Set() } = options;
  const q = query.trim().toLowerCase();

  return apps.filter((app) => {
    // 1. Category Filter
    if (category && category !== 'All') {
      if (app.category?.toLowerCase() !== category.toLowerCase()) return false;
    }

    // 2. Quick Filter
    if (quickFilter === 'zero-trackers') {
      if ((app.trackersCount ?? 0) !== 0) return false;
    } else if (quickFilter === 'compose') {
      const isCompose =
        app.badge?.toLowerCase().includes('compose') ||
        app.techStack?.some((t) => t.toLowerCase().includes('compose'));
      if (!isCompose) return false;
    } else if (quickFilter === 'material-you') {
      const isM3 =
        app.techStack?.some((t) => t.toLowerCase().includes('material 3') || t.toLowerCase().includes('material you')) ||
        app.features?.some((f) => f.toLowerCase().includes('material you'));
      if (!isM3) return false;
    }

    // 3. Search Query
    if (!q) return true;
    return getAppSearchScore(app, q) > 0;
  });
}

/**
 * Parse size string like "108 MB" or "15.4 MB" into megabytes number
 */
export function parseSizeMb(sizeStr?: string): number {
  if (!sizeStr) return 0;
  const match = sizeStr.match(/([\d.]+)\s*(MB|GB|KB)?/i);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  const unit = (match[2] || 'MB').toUpperCase();
  if (unit === 'GB') return val * 1024;
  if (unit === 'KB') return val / 1024;
  return val;
}

/**
 * Sort apps by user-selected criteria
 */
export function sortApps(
  apps: AndroidApp[],
  sortBy: SortOption,
  ratingsMap: Record<string, { avg: number; count: number }> = {},
  searchQuery = ''
): AndroidApp[] {
  const list = [...apps];
  const q = searchQuery.trim().toLowerCase();

  return list.sort((a, b) => {
    // If a search query is active and sorting is 'featured', sort by search relevance score first
    if (q && sortBy === 'featured') {
      const scoreA = getAppSearchScore(a, q);
      const scoreB = getAppSearchScore(b, q);
      if (scoreA !== scoreB) return scoreB - scoreA;
    }

    switch (sortBy) {
      case 'rating-desc': {
        const ratingA = ratingsMap[a.slug]?.avg ?? a.initialRating ?? 0;
        const ratingB = ratingsMap[b.slug]?.avg ?? b.initialRating ?? 0;
        if (ratingB !== ratingA) return ratingB - ratingA;
        const countA = ratingsMap[a.slug]?.count ?? a.initialReviewCount ?? 0;
        const countB = ratingsMap[b.slug]?.count ?? b.initialReviewCount ?? 0;
        return countB - countA;
      }
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'size-asc': {
        const sizeA = parseSizeMb(a.size);
        const sizeB = parseSizeMb(b.size);
        return sizeA - sizeB;
      }
      case 'featured':
      default:
        return 0; // Preserve default curated catalog ordering
    }
  });
}

// LocalStorage Recent Searches Management
const RECENT_SEARCHES_KEY = 'crazystore_recent_searches';
const MAX_RECENT_SEARCHES = 6;

export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string' && item.trim()) : [];
  } catch {
    return [];
  }
}

export function saveRecentSearch(query: string): string[] {
  if (typeof window === 'undefined') return [];
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return getRecentSearches();

  try {
    const existing = getRecentSearches();
    const updated = [trimmed, ...existing.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(
      0,
      MAX_RECENT_SEARCHES
    );
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function removeRecentSearch(query: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const existing = getRecentSearches();
    const updated = existing.filter((item) => item.toLowerCase() !== query.toLowerCase().trim());
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Ignore storage errors
  }
}

export const POPULAR_SEARCH_TAGS = [
  'VideoHub',
  'Compose',
  '0 Trackers',
  'ExoPlayer',
  'Kotlin',
  'Audio',
  'Material 3',
  'FOSS',
];
