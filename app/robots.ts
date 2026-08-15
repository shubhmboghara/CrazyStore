import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/admin/'],
      },
      {
        userAgent: [
          'Googlebot',
          'Bingbot',
          'Applebot',
          'DuckDuckBot',
          'Yandex',
          'Baiduspider',
          'GPTBot',
          'ChatGPT-User',
          'Google-Extended',
          'ClaudeBot',
          'PerplexityBot',
          'CCBot',
          'cohere-ai',
          'Bytespider',
        ],
        allow: '/',
        disallow: ['/admin', '/api/admin/'],
      },
    ],
    sitemap: 'https://crazystore.app/sitemap.xml',
    host: 'https://crazystore.app',
  };
}
