/**
 * JSON-LD Structured Data Component
 *
 * Renders JSON-LD schema markup for SEO
 * Used for Organization, SoftwareApplication, WebSite schemas
 *
 * @example
 * <JsonLd data={ORGANIZATION_SCHEMA} />
 */

interface JsonLdProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
