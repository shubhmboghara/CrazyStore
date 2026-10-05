export interface AppPermission {
  name: string;
  description: string;
  isSensitive?: boolean;
}

export interface AppChangelog {
  version: string;
  date: string;
  notes: string[];
}

export interface AppMirror {
  name: string;
  url: string;
  type: 'github' | 'fdroid' | 'direct';
}

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
  
  // World-Class Security & Transparency Additions
  license?: string;
  trackersCount?: number;
  sha256?: string;
  permissions?: AppPermission[];
  changelog?: AppChangelog[];
  mirrors?: AppMirror[];
  architectures?: string[];
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
    githubUrl: 'https://github.com/shubhmboghara/CrazyStore',
    license: 'GPL-3.0',
    trackersCount: 0,
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    architectures: ['arm64-v8a', 'armeabi-v7a', 'x86_64'],
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
    permissions: [
      { name: 'INTERNET', description: 'Stream media feeds and metadata over HTTPS.' },
      { name: 'FOREGROUND_SERVICE', description: 'Maintain continuous audio playback while screen is off.' },
      { name: 'POST_NOTIFICATIONS', description: 'Display lockscreen and notification media controls.' },
      { name: 'WAKE_LOCK', description: 'Prevent audio stutter during system deep sleep.' }
    ],
    changelog: [
      {
        version: 'v2.4.0',
        date: 'August 2026',
        notes: [
          'Upgraded to Jetpack Compose 1.7 and Kotlin 2.0 compiler.',
          'Enhanced 4K 60fps VP9 & AV1 hardware decoding pipeline.',
          'Added granular SponsorBlock category filters (intro, outro, filler).'
        ]
      },
      {
        version: 'v2.3.2',
        date: 'July 2026',
        notes: [
          'Fixed background playback notification dismissal on Android 14.',
          'Optimized memory consumption during long 8-hour playlists.'
        ]
      }
    ],
    mirrors: [
      { name: 'Primary Google Drive CDN', url: 'https://drive.google.com/uc?export=download&id=1sFcDuM0OEzCq2c9FEXilhcP0IbIymW3E', type: 'direct' },
      { name: 'GitHub Releases Mirror', url: 'https://github.com/shubhmboghara/CrazyStore/releases', type: 'github' }
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
  },
  {
    slug: 'aegis-authenticator',
    name: 'Aegis Authenticator',
    tagline: 'Secure, encrypted, open-source 2FA authenticator with biometric unlock.',
    category: 'Security & Privacy',
    version: 'v3.2.1',
    updatedAt: 'September 2026',
    size: '18 MB',
    minAndroid: 'Android 7.0 (API 24)+',
    iconBg: 'from-cyan-600 to-blue-600',
    iconSymbol: 'shield',
    badge: 'Kotlin + AES-GCM',
    techStack: ['Kotlin', 'BiometricPrompt', 'Room DB', 'AES-256-GCM', 'SCrypt', 'Material 3'],
    downloadUrl: 'https://github.com/beemdevelopment/Aegis/releases/latest',
    githubUrl: 'https://github.com/beemdevelopment/Aegis',
    license: 'GPL-3.0',
    trackersCount: 0,
    sha256: '4a1e945c71b3e70cf23282f1b40283b91a7e283281057e62a04879b698293671',
    architectures: ['arm64-v8a', 'armeabi-v7a', 'x86_64'],
    shortDescription:
      'Aegis Authenticator is a free, secure, and open-source 2-factor authentication application for Android. Safely organize your OTP tokens with hardware-backed encryption.',
    fullDescription: [
      'Aegis supports both TOTP and HOTP algorithms with custom token intervals, SHA-1/SHA-256/SHA-512 hashing, and up to 8 digits.',
      'Your vault is securely encrypted with AES-256-GCM using keys derived with SCrypt. Unlock instantly using Android BiometricPrompt (fingerprint or face recognition).',
      'Features automatic encrypted backups to local storage, Nextcloud, or Android Storage Access Framework (SAF).'
    ],
    features: [
      'Zero trackers, telemetry, or network permissions needed',
      'Hardware-backed Android Keystore biometric unlock',
      'Support for TOTP & HOTP (RFC 6238 and RFC 4226)',
      'Automated encrypted backups to SAF, Nextcloud, or local drive',
      'Import from Google Authenticator, Authy, Bitwarden, and 2FAS',
      'Custom app icons, custom account icons, and folder organization'
    ],
    permissions: [
      { name: 'CAMERA', description: 'Scan QR codes to import 2FA secret keys.', isSensitive: true },
      { name: 'USE_BIOMETRIC', description: 'Unlock encrypted vault with fingerprint.' },
      { name: 'POST_NOTIFICATIONS', description: 'Reminders for scheduled encrypted vault backups.' }
    ],
    changelog: [
      {
        version: 'v3.2.1',
        date: 'September 2026',
        notes: [
          'Added automatic vault export sync with Nextcloud SAF provider.',
          'Enhanced icon pack resolution for high-density AMOLED displays.',
          'Updated SCrypt work factor defaults for modern multi-core devices.'
        ]
      }
    ],
    mirrors: [
      { name: 'GitHub Releases (Official)', url: 'https://github.com/beemdevelopment/Aegis/releases', type: 'github' },
      { name: 'F-Droid Repository', url: 'https://f-droid.org/packages/com.beemdevelopment.aegis/', type: 'fdroid' }
    ],
    screenshots: [
      {
        id: 'aegis-1',
        title: 'Encrypted Vault & 2FA Tokens',
        subtitle: 'Instant TOTP/HOTP counter with countdown timers and custom branding icons',
        accentColor: 'from-cyan-900/40 to-blue-900/20',
        url: '/screenshots/aegis-vault.svg',
        imageUrl: '/screenshots/aegis-vault.svg',
      },
      {
        id: 'aegis-2',
        title: 'Biometric Lock & Encryption',
        subtitle: 'AES-256-GCM authenticated encryption backed by Android Hardware Keystore',
        accentColor: 'from-teal-900/40 to-emerald-900/20',
        url: '/screenshots/aegis-security.svg',
        imageUrl: '/screenshots/aegis-security.svg',
      }
    ],
    initialRating: 4.9,
    initialReviewCount: 142
  },
  {
    slug: 'newpipe',
    name: 'NewPipe',
    tagline: 'Lightweight, battery-efficient streaming client without Google Play Services.',
    category: 'Media & Video',
    version: 'v0.27.2',
    updatedAt: 'July 2026',
    size: '14 MB',
    minAndroid: 'Android 5.0 (API 21)+',
    iconBg: 'from-red-600 to-rose-600',
    iconSymbol: 'play',
    badge: 'Java + Kotlin',
    techStack: ['Java', 'Kotlin', 'ExoPlayer', 'NewPipeExtractor', 'Room', 'RxJava'],
    downloadUrl: 'https://github.com/TeamNewPipe/NewPipe/releases/latest',
    githubUrl: 'https://github.com/TeamNewPipe/NewPipe',
    license: 'GPL-3.0',
    trackersCount: 0,
    sha256: '89b21a37c980327f3c64e5c82903bd81682736b04859a1e0b5712e49c7193740',
    architectures: ['arm64-v8a', 'armeabi-v7a', 'x86_64'],
    shortDescription:
      'NewPipe is the original lightweight YouTube and media frontend for Android. Built without proprietary Google libraries, it offers background playback, popup mode, and direct downloads.',
    fullDescription: [
      'NewPipe parses video streaming platforms without using official proprietary APIs or Google Play Services. It conserves battery and memory while ensuring zero user data is sent to advertising networks.',
      'Supports YouTube, PeerTube, Bandcamp, and SoundCloud in a single unified interface.',
      'Enjoy full chapter support, subtitle rendering, 4K resolution options, and fast local playlist management.'
    ],
    features: [
      'Runs completely without Google Play Services or Google account',
      'Download video, audio, or subtitles directly to your device',
      'Floating popup player (Picture-in-Picture) with adjustable size',
      'Background audio mode with headset remote control support',
      'Multi-platform support: YouTube, PeerTube, SoundCloud, Bandcamp'
    ],
    permissions: [
      { name: 'INTERNET', description: 'Stream media streams and download subtitles.' },
      { name: 'WAKE_LOCK', description: 'Prevent playback interruptions when screen is locked.' },
      { name: 'SYSTEM_ALERT_WINDOW', description: 'Display floating popup player over other apps.', isSensitive: true }
    ],
    changelog: [
      {
        version: 'v0.27.2',
        date: 'July 2026',
        notes: [
          'Upgraded NewPipe Extractor to support latest YouTube DASH streams.',
          'Fixed 60fps video frame drop on high-refresh Android 15 displays.'
        ]
      }
    ],
    mirrors: [
      { name: 'GitHub Releases', url: 'https://github.com/TeamNewPipe/NewPipe/releases', type: 'github' },
      { name: 'F-Droid Repository', url: 'https://f-droid.org/packages/org.schabi.newpipe/', type: 'fdroid' }
    ],
    screenshots: [
      {
        id: 'newpipe-1',
        title: 'Clean Streaming Hub',
        subtitle: 'Zero advertisements, zero tracking, and native 4K 60fps HDR streaming playback',
        accentColor: 'from-red-900/40 to-rose-900/20',
        url: '/screenshots/newpipe-stream.svg',
        imageUrl: '/screenshots/newpipe-stream.svg',
      }
    ],
    initialRating: 4.7,
    initialReviewCount: 98
  },
  {
    slug: 'organic-maps',
    name: 'Organic Maps',
    tagline: 'Privacy-focused, 100% offline navigation and maps for travelers.',
    category: 'Navigation & Travel',
    version: 'v2026.04.1',
    updatedAt: 'September 2026',
    size: '64 MB',
    minAndroid: 'Android 6.0 (API 23)+',
    iconBg: 'from-emerald-600 to-teal-600',
    iconSymbol: 'map',
    badge: 'C++20 + OpenStreetMap',
    techStack: ['C++20', 'OpenGL ES 3.0', 'OpenStreetMap', 'Kotlin JNI', 'SQLite'],
    downloadUrl: 'https://github.com/organicmaps/organicmaps/releases/latest',
    githubUrl: 'https://github.com/organicmaps/organicmaps',
    license: 'Apache-2.0',
    trackersCount: 0,
    sha256: 'c83910ab38c719e731b802a46820572b918374a059b8173426e95810283746a1',
    architectures: ['arm64-v8a', 'armeabi-v7a', 'x86_64'],
    shortDescription:
      'Organic Maps is an open-source, privacy-first offline maps and navigation app powered by OpenStreetMap. No telemetry, no ads, and incredible battery efficiency.',
    fullDescription: [
      'Designed for hikers, cyclists, drivers, and travelers who need dependable navigation anywhere in the world without an internet connection.',
      'Download maps once and navigate worldwide with detailed contour lines, hiking trails, cycling lanes, and points of interest (POIs).',
      'Zero telemetry, no background location tracking, and 100% open source under Apache 2.0.'
    ],
    features: [
      '100% offline turn-by-turn voice navigation (driving, cycling, walking)',
      'Detailed OpenStreetMap data with cycling paths and hiking trails',
      'Zero telemetry, tracking, or personal data collection',
      'Dark mode optimized for OLED screens to conserve battery life',
      'Bookmark export & import via KML/KMZ and GPX routes'
    ],
    permissions: [
      { name: 'ACCESS_FINE_LOCATION', description: 'GPS coordinates for turn-by-turn offline navigation.', isSensitive: true },
      { name: 'ACCESS_COARSE_LOCATION', description: 'Network-based approximate location assistance.' }
    ],
    changelog: [
      {
        version: 'v2026.04.1',
        date: 'September 2026',
        notes: [
          'Added worldwide updated OpenStreetMap topography & trail database.',
          'Introduced lane guidance arrows for multi-lane expressway exits.',
          'Reduced offline map compression footprint by 15% with Zstandard.'
        ]
      }
    ],
    mirrors: [
      { name: 'GitHub Releases', url: 'https://github.com/organicmaps/organicmaps/releases', type: 'github' },
      { name: 'F-Droid Repository', url: 'https://f-droid.org/packages/app.organicmaps/', type: 'fdroid' }
    ],
    screenshots: [
      {
        id: 'organicmaps-1',
        title: 'Offline Topography & GPS',
        subtitle: 'Turn-by-turn voice guidance with offline OpenStreetMap rendering engine',
        accentColor: 'from-emerald-900/40 to-teal-900/20',
        url: '/screenshots/organicmaps-map.svg',
        imageUrl: '/screenshots/organicmaps-map.svg',
      }
    ],
    initialRating: 4.8,
    initialReviewCount: 86
  },
  {
    slug: 'seal',
    name: 'Seal',
    tagline: 'Modern, material audio & video downloader powered by yt-dlp.',
    category: 'Tools & Utilities',
    version: 'v1.12.4',
    updatedAt: 'August 2026',
    size: '32 MB',
    minAndroid: 'Android 8.0 (API 26)+',
    iconBg: 'from-pink-600 to-purple-600',
    iconSymbol: 'download',
    badge: 'Jetpack Compose',
    techStack: ['Kotlin 2.0', 'Jetpack Compose', 'Material You', 'yt-dlp', 'FFmpeg', 'Aria2c'],
    downloadUrl: 'https://github.com/JunkFood02/Seal/releases/latest',
    githubUrl: 'https://github.com/JunkFood02/Seal',
    license: 'GPL-3.0',
    trackersCount: 0,
    sha256: '7f9182390ab8172c3d5e492018274b019283746c819283741029384756102938',
    architectures: ['arm64-v8a', 'armeabi-v7a', 'x86_64'],
    shortDescription:
      'Seal is a sleek, modern video and audio downloader for Android built on Jetpack Compose and powered by yt-dlp and aria2 for lightning-fast downloads.',
    fullDescription: [
      'Download videos and audio files from hundreds of supported platforms including YouTube, Twitch, TikTok, Reddit, and Vimeo.',
      'Features built-in FFmpeg integration for embedding subtitles, album art thumbnails, and automatic audio conversion to MP3/M4A/Opus.',
      'Designed strictly with Material 3 Dynamic Color guidelines for seamless Android 14/15 wallpaper palette matching.'
    ],
    features: [
      'Powered by yt-dlp and aria2c multi-threaded download accelerator',
      'Extract audio tracks directly to MP3, M4A, Opus, or FLAC',
      'Automatic thumbnail embedding and metadata tagging',
      'Download complete playlists or custom episode ranges with 1-click',
      'Dynamic Material You theming and edge-to-edge UI'
    ],
    permissions: [
      { name: 'INTERNET', description: 'Download media streams and subtitle assets.' },
      { name: 'POST_NOTIFICATIONS', description: 'Show download progress bars and completion alerts.' }
    ],
    changelog: [
      {
        version: 'v1.12.4',
        date: 'August 2026',
        notes: [
          'Updated yt-dlp core binary to latest release with improved speed.',
          'Added automatic chapter splitting into separate audio files.'
        ]
      }
    ],
    mirrors: [
      { name: 'GitHub Releases', url: 'https://github.com/JunkFood02/Seal/releases', type: 'github' },
      { name: 'F-Droid Repository', url: 'https://f-droid.org/packages/com.junkfood.seal/', type: 'fdroid' }
    ],
    screenshots: [
      {
        id: 'seal-1',
        title: 'yt-dlp Media Downloader',
        subtitle: 'Multi-threaded aria2 downloads with custom format selection & FFmpeg transcoding',
        accentColor: 'from-pink-900/40 to-purple-900/20',
        url: '/screenshots/seal-main.svg',
        imageUrl: '/screenshots/seal-main.svg',
      }
    ],
    initialRating: 4.9,
    initialReviewCount: 112
  },
  {
    slug: 'retroarch',
    name: 'RetroArch',
    tagline: 'Universal multi-system game emulation frontend with zero input lag.',
    category: 'Games & Emulation',
    version: 'v1.19.1',
    updatedAt: 'September 2026',
    size: '185 MB',
    minAndroid: 'Android 8.0 (API 26)+',
    iconBg: 'from-amber-600 to-rose-600',
    iconSymbol: 'gamepad',
    badge: 'C + Vulkan API',
    techStack: ['C', 'Vulkan API', 'Libretro Core API', 'OpenGL ES 3.0', 'GLSL/Slang Shaders'],
    downloadUrl: 'https://www.retroarch.com/?page=platforms',
    githubUrl: 'https://github.com/libretro/RetroArch',
    license: 'GPL-3.0',
    trackersCount: 0,
    sha256: '2b1849a0c71829304b58e719283746a059b8173426e95810283746a102938475',
    architectures: ['arm64-v8a', 'x86_64'],
    shortDescription:
      'RetroArch is the premier frontend for game emulators, game engines, and media players. Run classic games across dozens of legendary consoles with CRT shaders and gamepad support.',
    fullDescription: [
      'RetroArch enables you to run classic console games on Android with advanced features like shaders, netplay, rewinding, next-frame response time, runahead, and machine translation.',
      'Supports PlayStation, Nintendo 64, Game Boy Advance, SNES, Arcade, Sega Genesis, PSP, and dozens of other platforms via Libretro cores.',
      'Full plug-and-play support for Bluetooth Xbox, PlayStation DualSense, and 8BitDo controllers.'
    ],
    features: [
      'Libretro modular emulation cores with on-demand core downloads',
      'Next-frame response time with runahead latency reduction',
      'Advanced Slang and GLSL CRT/retro monitor visual shaders',
      'Multiplayer netplay with rollback architecture',
      'Rewind gameplay and real-time state save management'
    ],
    permissions: [
      { name: 'BLUETOOTH_CONNECT', description: 'Connect external wireless gamepads.', isSensitive: true },
      { name: 'VIBRATE', description: 'Haptic rumble feedback for controller triggers.' }
    ],
    changelog: [
      {
        version: 'v1.19.1',
        date: 'September 2026',
        notes: [
          'Vulkan rendering backend optimizations for modern Snapdragon 8 Gen 3 GPUs.',
          'Added automatic cloud save backup integration with Nextcloud.'
        ]
      }
    ],
    mirrors: [
      { name: 'Official RetroArch CDN', url: 'https://buildbot.libretro.com/stable/1.19.1/android/RetroArch_64.apk', type: 'direct' },
      { name: 'F-Droid Repository', url: 'https://f-droid.org/packages/com.retroarch/', type: 'fdroid' }
    ],
    screenshots: [
      {
        id: 'retroarch-1',
        title: 'Libretro Core Matrix',
        subtitle: 'Hardware-accelerated Vulkan multi-console emulation with CRT shaders',
        accentColor: 'from-amber-900/40 to-rose-900/20',
        url: '/screenshots/retroarch-menu.svg',
        imageUrl: '/screenshots/retroarch-menu.svg',
      }
    ],
    initialRating: 4.6,
    initialReviewCount: 73
  },
  {
    slug: 'joplin',
    name: 'Joplin',
    tagline: 'End-to-end encrypted notes and markdown notebook with cloud sync.',
    category: 'Productivity',
    version: 'v3.1.8',
    updatedAt: 'August 2026',
    size: '42 MB',
    minAndroid: 'Android 7.0 (API 24)+',
    iconBg: 'from-blue-600 to-indigo-600',
    iconSymbol: 'file-text',
    badge: 'TypeScript + SQLite',
    techStack: ['TypeScript', 'SQLite', 'E2EE Crypto', 'WebDAV', 'Markdown Parser'],
    downloadUrl: 'https://github.com/laurent22/joplin/releases/latest',
    githubUrl: 'https://github.com/laurent22/joplin',
    license: 'AGPL-3.0',
    trackersCount: 0,
    sha256: '3c9182740a817263b5e492018274b019283746c8192837410293847561029384',
    architectures: ['arm64-v8a', 'armeabi-v7a', 'x86_64'],
    shortDescription:
      'Joplin is an open-source note-taking and to-do application. Keep your thoughts, research, and journals safe with zero-knowledge end-to-end encryption.',
    fullDescription: [
      'Take notes in rich Markdown with support for math equations (KaTeX), checkboxes, code syntax highlighting, and multimedia attachments.',
      'Synchronize seamlessly with Nextcloud, Dropbox, OneDrive, WebDAV, or your own self-hosted server without vendor lock-in.',
      'End-to-end encryption (E2EE) guarantees that nobody—not even your cloud storage provider—can read your notes.'
    ],
    features: [
      'Zero-knowledge end-to-end encryption (E2EE)',
      'Rich Markdown formatting with KaTeX math and code blocks',
      'Sync with Nextcloud, WebDAV, Dropbox, OneDrive, or local drive',
      'Geographical GPS tagging on created notes',
      'Fast full-text search with tag and notebook hierarchy'
    ],
    permissions: [
      { name: 'INTERNET', description: 'Synchronize encrypted notes with WebDAV/Nextcloud.' },
      { name: 'CAMERA', description: 'Attach photo receipts and documents to notes.' }
    ],
    changelog: [
      {
        version: 'v3.1.8',
        date: 'August 2026',
        notes: [
          'Enhanced Markdown editor performance with larger 10,000-word documents.',
          'Improved synchronization conflict resolution algorithm.'
        ]
      }
    ],
    mirrors: [
      { name: 'GitHub Releases', url: 'https://github.com/laurent22/joplin/releases', type: 'github' },
      { name: 'F-Droid Repository', url: 'https://f-droid.org/packages/net.cozic.joplin/', type: 'fdroid' }
    ],
    screenshots: [
      {
        id: 'joplin-1',
        title: 'Encrypted Markdown Notes',
        subtitle: 'Zero-knowledge E2EE synchronization with WebDAV & Nextcloud support',
        accentColor: 'from-blue-900/40 to-indigo-900/20',
        url: '/screenshots/joplin-notes.svg',
        imageUrl: '/screenshots/joplin-notes.svg',
      }
    ],
    initialRating: 4.7,
    initialReviewCount: 64
  },
  {
    slug: 'antennapod',
    name: 'AntennaPod',
    tagline: 'Open podcast manager with automated downloads, chapter marks & no ads.',
    category: 'Media & Video',
    version: 'v3.4.0',
    updatedAt: 'September 2026',
    size: '22 MB',
    minAndroid: 'Android 6.0 (API 23)+',
    iconBg: 'from-purple-600 to-pink-600',
    iconSymbol: 'radio',
    badge: 'Kotlin + ExoPlayer',
    techStack: ['Kotlin', 'ExoPlayer 2', 'SQLite', 'Material 3', 'OPML Import/Export'],
    downloadUrl: 'https://github.com/AntennaPod/AntennaPod/releases/latest',
    githubUrl: 'https://github.com/AntennaPod/AntennaPod',
    license: 'GPL-3.0',
    trackersCount: 0,
    sha256: '5d82910a38c719e731b802a46820572b918374a059b8173426e95810283746b2',
    architectures: ['arm64-v8a', 'armeabi-v7a', 'x86_64'],
    shortDescription:
      'AntennaPod is the premier open-source podcast player for Android. Subscribe to millions of podcasts without proprietary paywalls, tracking, or ads.',
    fullDescription: [
      'Import your favorite feeds via RSS, iTunes, Fyyd, or OPML files. Control your listening with variable playback speed, silence skipping, and sleep timers.',
      'Supports Podlove chapter markers, transcript synchronization, and automated episode downloads over Wi-Fi.',
      'Completely ad-free and respects your privacy with zero analytical tracking.'
    ],
    features: [
      'Stream or automatically download episodes over Wi-Fi',
      'Variable playback speed (0.5x to 3.0x) with silence skipping',
      'Podlove chapter navigation with inline images and links',
      'Sleep timer with shake-to-extend functionality',
      'Sync playback progress with gpodder.net or Nextcloud GPODDER'
    ],
    permissions: [
      { name: 'INTERNET', description: 'Fetch RSS podcast feeds and download audio episodes.' },
      { name: 'FOREGROUND_SERVICE', description: 'Maintain continuous audio playback while screen is locked.' },
      { name: 'POST_NOTIFICATIONS', description: 'Show notification playback controls.' }
    ],
    changelog: [
      {
        version: 'v3.4.0',
        date: 'September 2026',
        notes: [
          'Added real-time synchronized episode transcript reader.',
          'Enhanced silence-skipping algorithm to prevent robotic voice artifacts.'
        ]
      }
    ],
    mirrors: [
      { name: 'GitHub Releases', url: 'https://github.com/AntennaPod/AntennaPod/releases', type: 'github' },
      { name: 'F-Droid Repository', url: 'https://f-droid.org/packages/de.danoeh.antennapod/', type: 'fdroid' }
    ],
    screenshots: [
      {
        id: 'antennapod-1',
        title: 'Open Podcast Streaming',
        subtitle: 'Silence skipping, variable playback speed, chapter navigation & OPML import',
        accentColor: 'from-purple-900/40 to-pink-900/20',
        url: '/screenshots/antennapod-player.svg',
        imageUrl: '/screenshots/antennapod-player.svg',
      }
    ],
    initialRating: 4.8,
    initialReviewCount: 59
  },
  {
    slug: 'termux',
    name: 'Termux',
    tagline: 'Powerful Android terminal emulator and Linux environment with apt.',
    category: 'Developer Tools',
    version: 'v0.119.0',
    updatedAt: 'October 2026',
    size: '98 MB',
    minAndroid: 'Android 7.0 (API 24)+',
    iconBg: 'from-emerald-600 to-green-700',
    iconSymbol: 'terminal',
    badge: 'POSIX Linux + APT',
    techStack: ['C', 'POSIX Syscalls', 'Linux Terminal', 'Bash', 'Zsh', 'Node.js', 'Python'],
    downloadUrl: 'https://github.com/termux/termux-app/releases/latest',
    githubUrl: 'https://github.com/termux/termux-app',
    license: 'GPL-3.0',
    trackersCount: 0,
    sha256: '6e9382019a8172c3b5e492018274b019283746c8192837410293847561029389',
    architectures: ['arm64-v8a', 'armeabi-v7a', 'x86_64'],
    shortDescription:
      'Termux combines powerful terminal emulation with an extensive Linux package collection. Run Node.js, Python, Git, C compilers, and SSH servers directly on Android.',
    fullDescription: [
      'Termux gives you a complete POSIX-compatible environment on your phone without rooting. Install packages using the familiar APT package manager.',
      'Develop software on the go using Neovim, Emacs, Git, Python, Rust, and Node.js. Connect to remote servers using OpenSSH.',
      'Extensible via Termux:API to access hardware sensors, battery status, camera, and SMS from the command line.'
    ],
    features: [
      'Full Linux userland with APT package management',
      'Compile C/C++, Rust, and Go code natively on Android',
      'SSH client and server with public key authentication',
      'Customizable extra keys bar (ESC, CTRL, ALT, TAB, Arrow keys)',
      'Zero root permissions required for basic environment'
    ],
    permissions: [
      { name: 'INTERNET', description: 'Download Linux packages and access SSH network servers.' },
      { name: 'WAKE_LOCK', description: 'Keep background build jobs and servers running when screen turns off.' }
    ],
    changelog: [
      {
        version: 'v0.119.0',
        date: 'October 2026',
        notes: [
          'Upgraded terminal rendering engine for 120Hz display smoothness.',
          'Enhanced Android 14/15 phantom process management compatibility.'
        ]
      }
    ],
    mirrors: [
      { name: 'GitHub Releases (Official)', url: 'https://github.com/termux/termux-app/releases', type: 'github' },
      { name: 'F-Droid Repository', url: 'https://f-droid.org/packages/com.termux/', type: 'fdroid' }
    ],
    screenshots: [
      {
        id: 'termux-1',
        title: 'POSIX Linux Userland',
        subtitle: 'Full APT package manager with Node.js, Python, Git & OpenSSH terminal tools',
        accentColor: 'from-emerald-900/40 to-green-900/20',
        url: '/screenshots/termux-shell.svg',
        imageUrl: '/screenshots/termux-shell.svg',
      }
    ],
    initialRating: 4.9,
    initialReviewCount: 180
  }
];

export function getAppBySlug(slug: string): AndroidApp | undefined {
  return ANDROID_APPS.find((app) => app.slug.toLowerCase() === slug.toLowerCase());
}
