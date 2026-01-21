import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo.config'

/**
 * Robots.txt configuration
 * Controls search engine crawler access
 *
 * Rules:
 * - Allow all public pages
 * - Disallow all dashboard/app pages
 * - Disallow auth pages
 * - Disallow API routes
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/dashboard/*',
          '/member',
          '/member/*',
          '/settings',
          '/settings/*',
          '/onboarding',
          '/onboarding/*',
          '/auth/*',
          '/api/*',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
