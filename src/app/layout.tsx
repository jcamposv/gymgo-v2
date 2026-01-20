import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'

import { SWRProvider } from '@/components/providers/swr-provider'
import { JsonLd } from '@/components/seo/json-ld'
import {
  DEFAULT_METADATA,
  ORGANIZATION_SCHEMA,
  SOFTWARE_SCHEMA,
  WEBSITE_SCHEMA,
} from '@/lib/seo.config'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

/**
 * Global metadata for the application
 * Individual pages can override or extend this
 */
export const metadata: Metadata = DEFAULT_METADATA

/**
 * Viewport configuration
 * Separated from metadata per Next.js 14+ best practices
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* JSON-LD Structured Data */}
        <JsonLd data={ORGANIZATION_SCHEMA} />
        <JsonLd data={SOFTWARE_SCHEMA} />
        <JsonLd data={WEBSITE_SCHEMA} />
      </head>
      <body className={inter.className}>
        <SWRProvider>
          {children}
        </SWRProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
