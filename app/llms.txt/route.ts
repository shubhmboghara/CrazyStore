import { NextResponse } from 'next/server';
import { ANDROID_APPS } from '@/lib/appsData';

export async function GET() {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://crazy-store-rho.vercel.app').replace(/\/$/, '');

  const appsListText = ANDROID_APPS.map(
    (app) => `- [${app.name}](${baseUrl}/apps/${app.slug}): ${app.tagline} (Version: ${app.version}, Size: ${app.size}, Min Android: ${app.minAndroid})`
  ).join('\n');

  const content = `# CrazyStore - Open-Source Android Apps & Verified APK Repository
> CrazyStore is a curated, privacy-first repository of high-performance, ad-free Android applications built natively with Kotlin and Jetpack Compose.

## Core Value Proposition
- 100% Free & Open-Source (FOSS)
- Zero trackers, zero telemetry, zero embedded advertisements
- Native Android architecture using Modern Android Development (MAD) standards
- Standalone APK downloads with direct installation support (no Google Play Services required)

## Featured Android Applications
${appsListText}

## Deep Documentation
- Full application catalog and technical specifications: ${baseUrl}/llms-full.txt
- Official Website: ${baseUrl}
- GitHub Organization: https://github.com/shubhmboghara
`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
