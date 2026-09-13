import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ANDROID_APPS, AndroidApp, getAppBySlug } from '@/lib/appsData';
import { AppDetailClient } from '@/components/AppDetailClient';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { formatDownloadUrl, normalizeAppRecord } from '@/lib/appUtils';

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getApp(slug: string): Promise<AndroidApp | null> {
  const normalizedSlug = slug.toLowerCase().trim();
  const defaultApp = getAppBySlug(normalizedSlug);
  const baseApp = defaultApp ? normalizeAppRecord(defaultApp) : null;

  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: dbApp, error } = await supabase
      .from('apps')
      .select('*')
      .ilike('slug', normalizedSlug)
      .maybeSingle();

    if (!error && dbApp) {
      const normalizedDbApp = normalizeAppRecord(dbApp);
      return {
        ...(baseApp || {}),
        ...normalizedDbApp,
        downloadUrl: normalizedDbApp.downloadUrl ? formatDownloadUrl(normalizedDbApp.downloadUrl) : (baseApp?.downloadUrl || ''),
        isCustom: true,
      } as AndroidApp;
    }
  } catch (err) {
    console.warn('Error fetching app from Supabase:', err);
  }

  return baseApp || null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const app = await getApp(slug);

  if (!app) {
    return {
      title: 'App Not Found',
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://crazystore.app';
  const pageUrl = `${siteUrl}/apps/${app.slug}`;
  const title = `${app.name} APK Download (${app.version}) - Ad-Free Android App | CrazyStore`;
  const description = `${app.tagline} Download verified ${app.name} APK (${app.size}) for Android. 100% free, open-source, and zero ads.`;

  return {
    title,
    description,
    keywords: [
      `${app.name} APK`,
      `download ${app.name} Android`,
      `${app.name} latest version`,
      ...app.techStack,
      'open source android app',
      'de-googled apk',
      'crazystore',
    ],
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: 'website',
      images: [
        {
          url: app.logoUrl || `${siteUrl}/og-image.png`,
          width: 512,
          height: 512,
          alt: `${app.name} Icon`,
        },
      ],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [app.logoUrl || `${siteUrl}/og-image.png`],
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const app = await getApp(slug);

  if (!app) {
    notFound();
    return null;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://crazystore.app';

  const appSchemaJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'MobileApplication',
        '@id': `${siteUrl}/apps/${app.slug}#software`,
        name: app.name,
        operatingSystem: app.minAndroid,
        applicationCategory:
          app.category === 'Media & Video' ? 'MultimediaApplication' : 'UtilitiesApplication',
        description: app.shortDescription,
        softwareVersion: app.version,
        fileSize: app.size,
        downloadUrl: app.downloadUrl,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: app.initialRating || 5.0,
          reviewCount: app.initialReviewCount || 1,
          bestRating: 5,
          worstRating: 1,
        },
        featureList: app.features.join(', '),
        author: {
          '@type': 'Organization',
          name: 'CrazyStore Open Source',
          url: siteUrl,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: siteUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Android Apps',
            item: `${siteUrl}/#catalog`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: app.name,
            item: `${siteUrl}/apps/${app.slug}`,
          },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `What is ${app.name} and what are its key features?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `${app.name} is an open-source Android application developed with ${app.techStack.join(', ')}. ${app.tagline} Key capabilities include: ${app.features.join(', ')}.`,
            },
          },
          {
            '@type': 'Question',
            name: `Is ${app.name} APK safe, ad-free, and verified?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Yes, ${app.name} is 100% free and open-source with zero advertisements, zero background trackers, and verified security.`,
            },
          },
          {
            '@type': 'Question',
            name: `How to install ${app.name} APK on Android?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Download the APK package (${app.size}) from CrazyStore at ${siteUrl}/apps/${app.slug}, open the downloaded file on your Android device, enable install from unknown sources if prompted, and complete installation.`,
            },
          },
          {
            '@type': 'Question',
            name: `Does ${app.name} require Google Play Services?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `No. ${app.name} operates 100% standalone and is fully compatible with de-Googled devices, MicroG, and standard Android systems.`,
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchemaJsonLd) }}
      />
      <AppDetailClient key={`${app.slug}-${app.updatedAt || ''}-${app.downloadUrl || ''}`} initialApp={app} />
    </>
  );
}
