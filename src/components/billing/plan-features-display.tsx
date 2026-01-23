'use client'

/**
 * Plan Features Display
 *
 * User-friendly plan feature display component.
 * Shows features grouped by section with clear badges.
 * NO technical jargon - designed for gym owners.
 */

import { Check, Clock, Minus, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  PLAN_FEATURE_SECTIONS,
  COMING_SOON_FEATURES,
  type PlanTier,
  type PlanFeatureItem,
} from '@/lib/pricing.config'

// =============================================================================
// TYPES
// =============================================================================

interface PlanFeaturesDisplayProps {
  planId: PlanTier
  /** Show all sections or compact view */
  variant?: 'full' | 'compact'
  /** Show coming soon section */
  showComingSoon?: boolean
  /** Max features to show in compact mode */
  maxFeatures?: number
  className?: string
}

// =============================================================================
// FEATURE STATUS ICON
// =============================================================================

function FeatureStatusIcon({ status }: { status: PlanFeatureItem['status'] }) {
  switch (status) {
    case 'included':
      return <Check className="h-4 w-4 text-primary shrink-0" />
    case 'limited':
      return <Check className="h-4 w-4 text-primary shrink-0" />
    case 'coming_soon':
      return <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
    case 'not_included':
      return <Minus className="h-4 w-4 text-muted-foreground/50 shrink-0" />
    default:
      return null
  }
}

// =============================================================================
// FEATURE BADGE
// =============================================================================

function FeatureBadge({ status, value }: { status: PlanFeatureItem['status']; value?: string }) {
  if (status === 'not_included') {
    return null
  }

  if (status === 'coming_soon') {
    return (
      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
        Pronto
      </Badge>
    )
  }

  if (value) {
    return (
      <span className="text-xs text-muted-foreground font-medium">
        {value}
      </span>
    )
  }

  return null
}

// =============================================================================
// SINGLE FEATURE ITEM
// =============================================================================

function FeatureItem({ feature }: { feature: PlanFeatureItem }) {
  const isNotIncluded = feature.status === 'not_included'

  const content = (
    <li
      className={cn(
        'flex items-center justify-between gap-2 py-1.5',
        isNotIncluded && 'opacity-50'
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <FeatureStatusIcon status={feature.status} />
        <span
          className={cn(
            'text-sm truncate',
            isNotIncluded ? 'text-muted-foreground line-through' : 'text-foreground'
          )}
        >
          {feature.label}
        </span>
        {feature.tooltip && !isNotIncluded && (
          <Info className="h-3.5 w-3.5 text-muted-foreground/60" />
        )}
      </div>
      <FeatureBadge status={feature.status} value={feature.value} />
    </li>
  )

  if (feature.tooltip && !isNotIncluded) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px]">
            <p className="text-xs">{feature.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return content
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PlanFeaturesDisplay({
  planId,
  variant = 'full',
  showComingSoon = false,
  maxFeatures = 6,
  className,
}: PlanFeaturesDisplayProps) {
  const sections = PLAN_FEATURE_SECTIONS[planId]

  if (!sections) return null

  // Compact view: flatten and limit features
  if (variant === 'compact') {
    const allFeatures = sections.flatMap((s) => s.features)
    const visibleFeatures = allFeatures
      .filter((f) => f.status !== 'not_included')
      .slice(0, maxFeatures)
    const remainingCount = allFeatures.filter((f) => f.status !== 'not_included').length - maxFeatures

    return (
      <div className={className}>
        <ul className="space-y-1">
          {visibleFeatures.map((feature, idx) => (
            <FeatureItem key={idx} feature={feature} />
          ))}
        </ul>
        {remainingCount > 0 && (
          <p className="text-xs text-muted-foreground mt-2 pl-6">
            +{remainingCount} más...
          </p>
        )}
      </div>
    )
  }

  // Full view: show all sections
  return (
    <div className={cn('space-y-6', className)}>
      {sections.map((section, sectionIdx) => (
        <div key={sectionIdx}>
          <h4 className="text-sm font-medium text-foreground mb-2">
            {section.title}
          </h4>
          <ul className="space-y-0.5">
            {section.features.map((feature, featureIdx) => (
              <FeatureItem key={featureIdx} feature={feature} />
            ))}
          </ul>
        </div>
      ))}

      {/* Coming Soon Section */}
      {showComingSoon && COMING_SOON_FEATURES.length > 0 && (
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            Proximamente
          </h4>
          <ul className="space-y-2">
            {COMING_SOON_FEATURES.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <Clock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-foreground">{feature.label}</span>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// SIMPLE FEATURE LIST (for plan cards)
// =============================================================================

interface SimpleFeatureListProps {
  features: string[]
  maxItems?: number
  className?: string
}

export function SimpleFeatureList({
  features,
  maxItems = 8,
  className,
}: SimpleFeatureListProps) {
  const visibleFeatures = features.slice(0, maxItems)
  const remainingCount = features.length - maxItems

  return (
    <div className={className}>
      <ul className="space-y-2">
        {visibleFeatures.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm">
            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span className="text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>
      {remainingCount > 0 && (
        <p className="text-xs text-muted-foreground mt-2 pl-6">
          +{remainingCount} más...
        </p>
      )}
    </div>
  )
}

// =============================================================================
// NOT INCLUDED LIST
// =============================================================================

interface NotIncludedListProps {
  items: string[]
  className?: string
}

export function NotIncludedList({ items, className }: NotIncludedListProps) {
  if (!items || items.length === 0) return null

  return (
    <div className={cn('pt-4 border-t', className)}>
      <p className="text-xs text-muted-foreground mb-2">No incluido:</p>
      <ul className="space-y-1">
        {items.map((item, idx) => (
          <li key={idx} className="text-xs text-muted-foreground/70 flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
