'use client';

import { useSyncExternalStore, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'crazystore_favorite_slugs';

function getFavoritesSnapshot(): string {
  if (typeof window === 'undefined') return '[]';
  return localStorage.getItem(STORAGE_KEY) || '[]';
}

function getServerSnapshot(): string {
  return '[]';
}

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};

  const handleStorage = () => callback();
  window.addEventListener('storage', handleStorage);
  window.addEventListener('crazystore_favorites_updated', handleStorage);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('crazystore_favorites_updated', handleStorage);
  };
}

export function useFavorites() {
  const favoritesJson = useSyncExternalStore(
    subscribe,
    getFavoritesSnapshot,
    getServerSnapshot
  );

  const favorites: string[] = useMemo(() => {
    try {
      return JSON.parse(favoritesJson);
    } catch {
      return [];
    }
  }, [favoritesJson]);

  const toggleFavorite = useCallback((slug: string) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const current: string[] = stored ? JSON.parse(stored) : [];
      let updated: string[];

      if (current.includes(slug)) {
        updated = current.filter((s) => s !== slug);
      } else {
        updated = [...current, slug];
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('crazystore_favorites_updated'));
    } catch (err) {
      console.error('Failed to update favorites:', err);
    }
  }, []);

  const isFavorite = useCallback(
    (slug: string) => favorites.includes(slug),
    [favorites]
  );

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    count: favorites.length,
  };
}
