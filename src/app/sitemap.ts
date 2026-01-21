import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo.config'

/**
 * Sitemap configuration
 * Only includes public, indexable pages
 *
 * Note: Since this is the app (dashboard) subdomain,
 * we only include auth pages that are publicly accessible.
 * The main marketing pages would be on the landing site.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  // Public pages on the app subdomain
  const publicPages = [
    {
      url: `${SITE_URL}/login`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/register`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
  ]

  return publicPages
}
