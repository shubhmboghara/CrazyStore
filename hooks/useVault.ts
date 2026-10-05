'use client';

import { useState, useEffect, useCallback } from 'react';

const VAULT_STORAGE_KEY = 'crazystore_saved_vault';

export function useVault() {
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(VAULT_STORAGE_KEY);
      if (stored) {
        setSavedSlugs(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage errors
    } finally {
      setIsLoaded(true);
    }

    const handleVaultUpdated = () => {
      try {
        const stored = localStorage.getItem(VAULT_STORAGE_KEY);
        if (stored) {
          setSavedSlugs(JSON.parse(stored));
        } else {
          setSavedSlugs([]);
        }
      } catch {
        // Ignore
      }
    };

    window.addEventListener('crazystore_vault_updated', handleVaultUpdated);
    return () => window.removeEventListener('crazystore_vault_updated', handleVaultUpdated);
  }, []);

  const toggleSaved = useCallback((slug: string) => {
    const cleanSlug = slug.toLowerCase();
    setSavedSlugs((prev) => {
      const exists = prev.includes(cleanSlug);
      const updated = exists ? prev.filter((s) => s !== cleanSlug) : [...prev, cleanSlug];
      try {
        localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event('crazystore_vault_updated'));
      } catch {
        // Ignore
      }
      return updated;
    });
  }, []);

  const isSaved = useCallback(
    (slug: string) => {
      return savedSlugs.includes(slug.toLowerCase());
    },
    [savedSlugs]
  );

  return {
    savedSlugs,
    isSaved,
    toggleSaved,
    isLoaded,
    count: savedSlugs.length,
  };
}
