import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/min-side', '/api'],
      },
    ],
    sitemap: 'https://helgelandsia.no/sitemap.xml',
  }
}
