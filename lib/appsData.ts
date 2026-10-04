export interface AndroidApp {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  version: string;
  updatedAt: string;
  size: string;
  minAndroid: string;
  iconBg: string;
  iconSymbol: string;
  badge: string;
  techStack: string[];
  downloadUrl: string;
  shortDescription: string;
  fullDescription: string[];
  features: string[];
  screenshots: {
    id: string;
    title?: string;
    subtitle?: string;
    accentColor?: string;
    type?: 'feed' | 'player' | 'settings' | 'stats' | string;
    url?: string;
    imageUrl?: string;
  }[];
  initialRating: number;
  initialReviewCount: number;
  isCustom?: boolean;
  logoUrl?: string;
  bannerUrl?: string;
  githubUrl?: string;
  description?: string;
}

export const ANDROID_APPS: AndroidApp[] = [
  {
    slug: 'videohub',
    name: 'VideoHub',
    tagline: 'Ad-free, open-source YouTube client with background audio & SponsorBlock.',
    category: 'Media & Video',
    version: 'v2.4.0',
    updatedAt: 'August 2026',
    size: '108 MB',
    minAndroid: 'Android 8.0 (API 26)+',
    iconBg: 'from-purple-600 to-indigo-600',
    iconSymbol: 'play',
    badge: 'Kotlin + Compose',
    techStack: ['Kotlin 2.0', 'Jetpack Compose', 'Coroutines', 'ExoPlayer', 'Material 3', 'Ktor'],
    downloadUrl: 'https://drive.google.com/uc?export=download&id=1sFcDuM0OEzCq2c9FEXilhcP0IbIymW3E',
    shortDescription:
      'VideoHub is a clean, lightning-fast YouTube client built from scratch using 100% native Kotlin and Jetpack Compose. Enjoy ad-free streaming, picture-in-picture, background audio mode, and SponsorBlock.',
    fullDescription: [
      'VideoHub is engineered for Android power users who want a privacy-focused, zero-bloat media player. Built with Modern Android Development (MAD) practices including Jetpack Compose declarative UI and ExoPlayer audio/video pipeline.',
      'Enjoy seamless background playback, customizable gestures for brightness and volume, 4K HDR stream quality selection, and built-in SponsorBlock to skip non-content segments automatically.',
      'No Google Play Services required — operates smoothly on MicroG or completely de-Googled devices.'
    ],
    features: [
      '100% Ad-free video and audio streaming',
      'Automatic SponsorBlock segment skipping',
      'Background playback with media controls notification',
      'Picture-in-Picture (PiP) multitasking mode',
      'Variable playback speed (0.25x to 3.0x)',
      'Custom theme generator with Dynamic Material You colors',
      'Zero user tracking or analytics telemetry'
    ],
    screenshots: [
      {
        id: '1',
        title: 'Trending Feed & Discovery',
        subtitle: 'Fluid 120Hz Jetpack Compose LazyColumn with real-time video previews & ad-free streaming',
        accentColor: 'from-purple-900/40 to-purple-600/20',
        type: 'feed',
        url: '/screenshots/videohub-feed.svg',
        imageUrl: '/screenshots/videohub-feed.svg',
      },
      {
        id: '2',
        title: 'Immersive 4K ExoPlayer',
        subtitle: 'Hardware-accelerated 4K 60fps playback with live SponsorBlock skip markers and gesture HUD',
        accentColor: 'from-indigo-900/40 to-purple-900/20',
        type: 'player',
        url: '/screenshots/videohub-player.svg',
        imageUrl: '/screenshots/videohub-player.svg',
      },
      {
        id: '3',
        title: 'Background Audio & Lockscreen',
        subtitle: 'AMOLED lockscreen controller, 320kbps Opus Hi-Fi audio, waveform visualizer & time-saved telemetry',
        accentColor: 'from-violet-900/40 to-fuchsia-900/20',
        type: 'stats',
        url: '/screenshots/videohub-audio.svg',
        imageUrl: '/screenshots/videohub-audio.svg',
      },
      {
        id: '4',
        title: 'Material You & Settings',
        subtitle: 'Android 15 Dynamic Color palettes, granular SponsorBlock filters & 100% De-Googled privacy controls',
        accentColor: 'from-fuchsia-900/40 to-pink-900/20',
        type: 'settings',
        url: '/screenshots/videohub-settings.svg',
        imageUrl: '/screenshots/videohub-settings.svg',
      },
    ],
    initialRating: 4.8,
    initialReviewCount: 24
  }
];

export function getAppBySlug(slug: string): AndroidApp | undefined {
  return ANDROID_APPS.find((app) => app.slug.toLowerCase() === slug.toLowerCase());
}
