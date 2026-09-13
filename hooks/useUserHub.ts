'use client';

import { useState, useEffect, useCallback } from 'react';
import { AndroidApp } from '@/lib/appsData';

export interface DownloadedAppRecord {
  slug: string;
  name: string;
  category: string;
  version: string;
  size?: string;
  iconSymbol?: string;
  iconBg?: string;
  downloadUrl?: string;
  downloadedAt: string;
}

export interface AppRequestItem {
  id: string;
  title: string;
  category: string;
  description: string;
  githubUrl?: string;
  apkUrl?: string;
  requesterName?: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'in-review';
  upvotes: number;
}

export interface UserPreferences {
  username: string;
  avatarColor: string;
  preferredSource: 'direct' | 'github' | 'drive';
  autoCheckUpdates: boolean;
  theme: 'system' | 'light' | 'dark';
}

const STORAGE_KEY_DOWNLOADS = 'crazystore_downloaded_apps';
const STORAGE_KEY_REQUESTS = 'crazystore_app_requests';
const STORAGE_KEY_PREFS = 'crazystore_user_prefs';

const DEFAULT_PREFS: UserPreferences = {
  username: 'Android Explorer',
  avatarColor: 'from-purple-500 to-indigo-600',
  preferredSource: 'direct',
  autoCheckUpdates: true,
  theme: 'system',
};

export function useUserHub() {
  const [downloadedApps, setDownloadedApps] = useState<DownloadedAppRecord[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DOWNLOADS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [appRequests, setAppRequests] = useState<AppRequestItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY_REQUESTS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [userPrefs, setUserPrefs] = useState<UserPreferences>(() => {
    if (typeof window === 'undefined') return DEFAULT_PREFS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PREFS);
      return stored ? { ...DEFAULT_PREFS, ...JSON.parse(stored) } : DEFAULT_PREFS;
    } catch {
      return DEFAULT_PREFS;
    }
  });

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      try {
        if (e.key === STORAGE_KEY_DOWNLOADS && e.newValue) {
          setDownloadedApps(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEY_REQUESTS && e.newValue) {
          setAppRequests(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEY_PREFS && e.newValue) {
          setUserPrefs(JSON.parse(e.newValue));
        }
      } catch {
        // ignore
      }
    };

    const handleHubSync = (e: any) => {
      if (e.detail?.downloads) setDownloadedApps(e.detail.downloads);
      if (e.detail?.requests) setAppRequests(e.detail.requests);
      if (e.detail?.prefs) setUserPrefs(e.detail.prefs);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('crazystore_hub_sync', handleHubSync);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('crazystore_hub_sync', handleHubSync);
    };
  }, []);

  const recordDownload = useCallback((app: AndroidApp | { slug: string; name: string; category?: string; version?: string; iconSymbol?: string; iconBg?: string; downloadUrl?: string }) => {
    setDownloadedApps((prev) => {
      const existsIndex = prev.findIndex((d) => d.slug.toLowerCase() === app.slug.toLowerCase());
      const record: DownloadedAppRecord = {
        slug: app.slug,
        name: app.name,
        category: app.category || 'Tools & Utilities',
        version: app.version || 'v1.0.0',
        size: '18.4 MB',
        iconSymbol: app.iconSymbol,
        iconBg: app.iconBg,
        downloadUrl: app.downloadUrl,
        downloadedAt: new Date().toISOString(),
      };

      let updated: DownloadedAppRecord[];
      if (existsIndex >= 0) {
        updated = [...prev];
        updated[existsIndex] = record;
      } else {
        updated = [record, ...prev];
      }

      try {
        localStorage.setItem(STORAGE_KEY_DOWNLOADS, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('crazystore_hub_sync', { detail: { downloads: updated } }));
      } catch {
        // ignore
      }

      return updated;
    });
  }, []);

  const removeDownload = useCallback((slug: string) => {
    setDownloadedApps((prev) => {
      const updated = prev.filter((d) => d.slug.toLowerCase() !== slug.toLowerCase());
      try {
        localStorage.setItem(STORAGE_KEY_DOWNLOADS, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('crazystore_hub_sync', { detail: { downloads: updated } }));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const isDownloaded = useCallback((slug: string) => {
    return downloadedApps.some((d) => d.slug.toLowerCase() === slug.toLowerCase());
  }, [downloadedApps]);

  const submitRequest = useCallback((request: Omit<AppRequestItem, 'id' | 'createdAt' | 'status' | 'upvotes'>) => {
    const newItem: AppRequestItem = {
      ...request,
      id: 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString(),
      status: 'pending',
      upvotes: 1,
    };

    setAppRequests((prev) => {
      const updated = [newItem, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('crazystore_hub_sync', { detail: { requests: updated } }));
      } catch {
        // ignore
      }
      return updated;
    });

    return newItem;
  }, []);

  const removeRequest = useCallback((id: string) => {
    setAppRequests((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('crazystore_hub_sync', { detail: { requests: updated } }));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const updatePreferences = useCallback((prefs: Partial<UserPreferences>) => {
    setUserPrefs((prev) => {
      const updated = { ...prev, ...prefs };
      try {
        localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('crazystore_hub_sync', { detail: { prefs: updated } }));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  return {
    downloadedApps,
    downloadCount: downloadedApps.length,
    recordDownload,
    removeDownload,
    isDownloaded,
    appRequests,
    submitRequest,
    removeRequest,
    userPrefs,
    updatePreferences,
  };
}
