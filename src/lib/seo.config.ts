import type { Metadata } from 'next'

// =============================================================================
// SEO CONFIGURATION FOR GYMGO
// =============================================================================

/**
 * Base URL for the application
 * Used for canonical URLs and Open Graph
 */
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.gymgo.io'

/**
 * Marketing/Landing site URL (if separate)
 */
export const MARKETING_URL = 'https://gymgo.io'

/**
 * Brand information
 */
export const BRAND = {
  name: 'GymGo',
  tagline: 'Software de gestión para gimnasios y centros fitness',
  description:
    'GymGo es la plataforma todo-en-uno para administrar tu gimnasio, box de CrossFit o centro fitness. Gestiona miembros, pagos, clases, rutinas y más.',
  shortDescription:
    'Plataforma todo-en-uno para administrar gimnasios, boxes de CrossFit y centros fitness.',
  email: 'contact@gymgo.io',
  twitter: '@gymgo_io',
  locale: 'es_MX',
  language: 'es',
} as const

/**
 * SEO Keywords (use sparingly, focus on content)
 */
export const KEYWORDS = [
  'software gimnasio',
  'gestión gimnasio',
  'administrar gimnasio',
  'software crossfit',
  'gestión box crossfit',
  'software fitness',
  'control de miembros gimnasio',
  'pagos gimnasio',
  'reserva clases gimnasio',
  'app gimnasio',
  'SaaS fitness',
  'GymGo',
] as const

/**
 * Open Graph image configuration
 */
export const OG_IMAGE = {
  url: `${SITE_URL}/og-image.png`,
  width: 1200,
  height: 630,
  alt: 'GymGo - Software de gestión para gimnasios',
  type: 'image/png',
} as const

/**
 * Twitter card configuration
 */
export const TWITTER_CONFIG = {
  card: 'summary_large_image',
  site: '@gymgo_io',
  creator: '@gymgo_io',
} as const

/**
 * Default metadata for the entire application
 * Applied in app/layout.tsx
 */
export const DEFAULT_METADATA: Metadata = {
  // Basic metadata
  title: {
    default: `${BRAND.name} | ${BRAND.tagline}`,
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.description,
  keywords: KEYWORDS.join(', '),

  // Application info
  applicationName: BRAND.name,
  authors: [{ name: BRAND.name, url: MARKETING_URL }],
  creator: BRAND.name,
  publisher: BRAND.name,

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Icons
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },

  // Open Graph
  openGraph: {
    type: 'website',
    locale: BRAND.locale,
    url: SITE_URL,
    siteName: BRAND.name,
    title: `${BRAND.name} | ${BRAND.tagline}`,
    description: BRAND.description,
    images: [OG_IMAGE],
  },

  // Twitter
  twitter: {
    card: TWITTER_CONFIG.card,
    site: TWITTER_CONFIG.site,
    creator: TWITTER_CONFIG.creator,
    title: `${BRAND.name} | ${BRAND.tagline}`,
    description: BRAND.description,
    images: [OG_IMAGE.url],
  },

  // Verification (add your verification codes here)
  // verification: {
  //   google: 'your-google-verification-code',
  // },

  // Alternates for i18n (future-proof)
  alternates: {
    canonical: SITE_URL,
    languages: {
      'es-MX': SITE_URL,
      // 'en-US': `${SITE_URL}/en`, // Future
    },
  },

  // Category
  category: 'technology',

  // Manifest
  manifest: '/manifest.json',
}

/**
 * Metadata for pages that should NOT be indexed
 * Used for dashboard, settings, and other private pages
 */
export const PRIVATE_PAGE_METADATA: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

/**
 * Helper function to generate page-specific metadata
 */
export function generatePageMetadata({
  title,
  description,
  path = '',
  image,
  noIndex = false,
}: {
  title: string
  description?: string
  path?: string
  image?: string
  noIndex?: boolean
}): Metadata {
  const url = `${SITE_URL}${path}`
  const pageDescription = description || BRAND.shortDescription
  const ogImage = image || OG_IMAGE.url

  return {
    title,
    description: pageDescription,
    ...(noIndex && PRIVATE_PAGE_METADATA),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${title} | ${BRAND.name}`,
      description: pageDescription,
      url,
      images: [{ url: ogImage, width: OG_IMAGE.width, height: OG_IMAGE.height }],
    },
    twitter: {
      title: `${title} | ${BRAND.name}`,
      description: pageDescription,
      images: [ogImage],
    },
  }
}

/**
 * JSON-LD Schema for Organization
 */
export const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: BRAND.name,
  url: MARKETING_URL,
  logo: `${SITE_URL}/default-logo.svg`,
  description: BRAND.description,
  email: BRAND.email,
  sameAs: [
    // Add social profiles here
    // 'https://twitter.com/gymgo_io',
    // 'https://www.linkedin.com/company/gymgo',
    // 'https://www.instagram.com/gymgo_io',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    email: BRAND.email,
    contactType: 'customer service',
    availableLanguage: ['Spanish', 'English'],
  },
}

/**
 * JSON-LD Schema for SoftwareApplication
 */
export const SOFTWARE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: BRAND.name,
  description: BRAND.description,
  url: MARKETING_URL,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, iOS, Android',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'MXN',
    description: 'Prueba gratuita disponible',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '150',
    bestRating: '5',
    worstRating: '1',
  },
  author: {
    '@type': 'Organization',
    name: BRAND.name,
  },
  featureList: [
    'Gestión de miembros',
    'Control de pagos y membresías',
    'Reserva de clases',
    'Rutinas personalizadas',
    'Check-in digital',
    'Reportes y analytics',
    'App móvil para miembros',
    'Notificaciones por WhatsApp',
  ],
}

/**
 * JSON-LD Schema for WebSite (for sitelinks search box)
 */
export const WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: BRAND.name,
  url: MARKETING_URL,
  description: BRAND.description,
  inLanguage: BRAND.language,
  publisher: {
    '@type': 'Organization',
    name: BRAND.name,
  },
}
