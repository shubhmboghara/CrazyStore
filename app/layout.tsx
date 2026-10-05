import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/Toast';
import { AnalyticsTracker } from '@/components/AnalyticsTracker';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://crazy-store-rho.vercel.app').replace(/\/$/, '');

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'CrazyStore - Open-Source Android Apps & Verified APK Downloads',
    template: '%s | CrazyStore',
  },
  description:
    'Discover and download high-performance, open-source Android apps built with Kotlin & Jetpack Compose. Enjoy 100% ad-free, privacy-first APKs with verified user ratings.',
  keywords: [
    'VideoHub APK',
    'download VideoHub Android',
    'open source android apps',
    'kotlin jetpack compose apps',
    'ad free youtube client android',
    'safe apk download',
    'de-googled android apps',
    'sponsorblock android apk',
    'crazy store android',
    'best android apps 2026',
    'foss android apps',
    'material you android apps',
  ],
  authors: [{ name: 'Shubham Boghara', url: 'https://github.com/shubhmboghara' }],
  creator: 'CrazyStore',
  publisher: 'CrazyStore Open Source',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'CrazyStore Android Showcase',
    title: 'CrazyStore - Open-Source Android Apps & Verified APK Downloads',
    description:
      'Curated vault of high-performance, ad-free Android applications built natively with Kotlin & Jetpack Compose. Direct APK downloads & community reviews.',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'CrazyStore - Android Apps Showcase',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CrazyStore - Open-Source Android Apps & Verified APK Downloads',
    description:
      'Curated vault of high-performance, ad-free Android applications built natively with Kotlin & Jetpack Compose.',
    images: [`${siteUrl}/og-image.png`],
    creator: '@shubhamboghara',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'technology',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Global Structured Data (WebSite + Organization + ItemList) for Search Engines & Generative AI Engines
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: 'CrazyStore',
        description: 'Curated showcase of open-source Android applications built with Kotlin and Jetpack Compose.',
        publisher: {
          '@type': 'Organization',
          '@id': `${siteUrl}/#organization`,
          name: 'CrazyStore',
          url: siteUrl,
          logo: {
            '@type': 'ImageObject',
            url: `${siteUrl}/icon.png`,
          },
          sameAs: [
            'https://github.com/shubhmboghara',
            'https://linkedin.com/in/shubham-boghara-60b4a1343',
            'https://instagram.com/shubhambogharadotcom',
          ],
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteUrl}/#catalog`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'CollectionPage',
        '@id': `${siteUrl}/#catalog`,
        url: `${siteUrl}/#catalog`,
        name: 'CrazyStore Android App Catalog',
        isPartOf: {
          '@id': `${siteUrl}/#website`,
        },
        about: {
          '@type': 'Thing',
          name: 'Android Applications',
        },
      },
    ],
  };

  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="icon" href="/icon.png" sizes="512x512" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning className="bg-zinc-950 text-zinc-100 min-h-screen antialiased selection:bg-purple-500 selection:text-white">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:rounded-xl focus:bg-purple-600 focus:text-white focus:font-bold focus:text-xs focus:shadow-xl focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <ToastProvider>
            <AnalyticsTracker />
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


