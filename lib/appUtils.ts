import { AndroidApp, ANDROID_APPS } from './appsData';

/**
 * Ensures that a download URL is well-formed with a protocol
 * so that clicking it never behaves as a relative app path.
 */
export function formatDownloadUrl(url?: string): string {
  if (!url) return '';
  let clean = url.trim();
  if (!clean) return '';
  
  // Remove wrapping quotes if pasted with quotes
  if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    clean = clean.slice(1, -1).trim();
  }

  // Prepend https:// if protocol is missing
  if (!clean.startsWith('http://') && !clean.startsWith('https://') && !clean.startsWith('/')) {
    clean = `https://${clean}`;
  }

  return clean;
}

/**
 * Converts a Google Drive share link into a direct APK download link
 * if a valid file ID is found.
 */
export function getGoogleDriveDirectDownloadUrl(url?: string): string {
  if (!url) return '';
  const clean = formatDownloadUrl(url);

  // Pattern: https://drive.google.com/file/d/{FILE_ID}/view...
  const fileIdMatch = clean.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch && fileIdMatch[1]) {
    return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
  }

  // Pattern: https://drive.google.com/open?id={FILE_ID}
  const openIdMatch = clean.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (openIdMatch && openIdMatch[1]) {
    return `https://drive.google.com/uc?export=download&id=${openIdMatch[1]}`;
  }

  // Pattern: https://drive.google.com/uc?id={FILE_ID} or similar
  const ucIdMatch = clean.match(/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/);
  if (ucIdMatch && ucIdMatch[1]) {
    return `https://drive.google.com/uc?export=download&id=${ucIdMatch[1]}`;
  }

  return clean;
}

/**
 * Normalizes an app record from Supabase or memory, resolving snake_case vs camelCase column differences.
 */
export function normalizeAppRecord(dbApp: any): any {
  if (!dbApp) return null;

  const downloadUrl =
    dbApp.downloadUrl ||
    dbApp.download_url ||
    dbApp.downloadurl ||
    '';

  const shortDescription =
    dbApp.shortDescription ||
    dbApp.short_description ||
    dbApp.shortdescription ||
    '';

  let fullDescription =
    dbApp.fullDescription ??
    dbApp.full_description ??
    dbApp.fulldescription ??
    [];

  if (typeof fullDescription === 'string') {
    try {
      const parsed = JSON.parse(fullDescription);
      fullDescription = Array.isArray(parsed) ? parsed : [fullDescription];
    } catch {
      fullDescription = [fullDescription];
    }
  }

  let features = dbApp.features ?? [];
  if (typeof features === 'string') {
    try {
      const parsed = JSON.parse(features);
      features = Array.isArray(parsed) ? parsed : features.split('\n').map((s: string) => s.trim()).filter(Boolean);
    } catch {
      features = features.split('\n').map((s: string) => s.trim()).filter(Boolean);
    }
  }

  let techStack =
    dbApp.techStack ??
    dbApp.tech_stack ??
    dbApp.techstack ??
    [];

  if (typeof techStack === 'string') {
    try {
      const parsed = JSON.parse(techStack);
      techStack = Array.isArray(parsed) ? parsed : techStack.split(',').map((s: string) => s.trim()).filter(Boolean);
    } catch {
      techStack = techStack.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
  }

  let screenshots = dbApp.screenshots ?? [];
  if (typeof screenshots === 'string') {
    try {
      screenshots = JSON.parse(screenshots);
    } catch {
      screenshots = [];
    }
  }

  return {
    ...dbApp,
    slug: dbApp.slug ? String(dbApp.slug).trim() : '',
    name: dbApp.name || '',
    tagline: dbApp.tagline || '',
    category: dbApp.category || 'Tools & Utilities',
    version: dbApp.version || 'v1.0.0',
    updatedAt: dbApp.updatedAt || dbApp.updated_at || dbApp.updatedat || 'August 2026',
    size: dbApp.size || '15 MB',
    minAndroid: dbApp.minAndroid || dbApp.min_android || dbApp.minandroid || 'Android 8.0 (API 26)+',
    iconBg: dbApp.iconBg || dbApp.icon_bg || dbApp.iconbg || 'from-purple-600 to-indigo-600',
    iconSymbol: dbApp.iconSymbol || dbApp.icon_symbol || dbApp.iconsymbol || 'smartphone',
    badge: dbApp.badge || 'Kotlin + Compose',
    logoUrl: dbApp.logoUrl || dbApp.logo_url || dbApp.logourl || '',
    bannerUrl: dbApp.bannerUrl || dbApp.banner_url || dbApp.bannerurl || '',
    githubUrl: dbApp.githubUrl || dbApp.github_url || dbApp.githuburl || '',
    downloadUrl: formatDownloadUrl(downloadUrl),
    shortDescription,
    fullDescription,
    features,
    techStack,
    screenshots,
    initialRating: dbApp.initialRating ?? dbApp.initial_rating ?? dbApp.initialrating ?? 5.0,
    initialReviewCount: dbApp.initialReviewCount ?? dbApp.initial_review_count ?? dbApp.initialreviewcount ?? 0,
    isCustom: dbApp.isCustom ?? dbApp.is_custom ?? dbApp.iscustom ?? true,
    createdAt: dbApp.createdAt || dbApp.created_at || dbApp.createdat || new Date().toISOString(),
  };
}
