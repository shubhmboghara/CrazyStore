'use client';

import { useState, useEffect } from 'react';

const FAVORITES_STORAGE_KEY = 'crazystore_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === FAVORITES_STORAGE_KEY && e.newValue) {
        try {
          setFavorites(JSON.parse(e.newValue));
        } catch {
          // Ignore
        }
      }
    };

    const handleCustomEvent = (e: any) => {
      if (e.detail?.favorites) {
        setFavorites(e.detail.favorites);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('favorites_updated', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('favorites_updated', handleCustomEvent);
    };
  }, []);

  const toggleFavorite = (slug: string) => {
    setFavorites((prev) => {
      const normalized = slug.toLowerCase();
      const updated = prev.includes(normalized)
        ? prev.filter((s) => s !== normalized)
        : [...prev, normalized];

      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('favorites_updated', { detail: { favorites: updated } })
          );
        }
      } catch {
        // Ignore
      }

      return updated;
    });
  };

  const isFavorite = (slug: string) => {
    return favorites.includes(slug.toLowerCase());
  };

  return {
    favorites,
    count: favorites.length,
    isFavorite,
    toggleFavorite,
  };
}
