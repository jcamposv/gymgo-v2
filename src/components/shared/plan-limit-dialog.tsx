'use client'

/**
 * Plan Limit Dialog
 *
 * Modal dialog shown when a plan limit is exceeded.
 * Provides clear feedback and upgrade CTA.
 */

import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowUpCircle, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LIMIT_TYPE_LABELS, type PlanLimitErrorData } from '@/lib/plan-limit-errors'

// =============================================================================
// TYPES
// =============================================================================

interface PlanLimitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: PlanLimitErrorData | null
  /** Custom upgrade URL (default: /pricing) */
  upgradeUrl?: string
  /** Whether to show the upgrade button */
  showUpgrade?: boolean
}

// =============================================================================
// COMPONENT
// =============================================================================

export function PlanLimitDialog({
  open,
  onOpenChange,
  data,
  upgradeUrl = '/pricing',
  showUpgrade = true,
}: PlanLimitDialogProps) {
  const router = useRouter()

  if (!data) return null

  const limitLabel = data.limitType
    ? LIMIT_TYPE_LABELS[data.limitType] || data.limitType
    : null

  const handleUpgrade = () => {
    onOpenChange(false)
    router.push(upgradeUrl)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 mb-4">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <DialogTitle className="text-center">
            {limitLabel
              ? `Límite de ${limitLabel} alcanzado`
              : 'Límite de plan alcanzado'}
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            {data.message}
          </DialogDescription>
        </DialogHeader>

        {/* Usage info if available */}
        {data.current !== undefined && data.limit !== undefined && data.limit > 0 && (
          <div className="my-4 p-4 bg-muted rounded-lg">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Uso actual</span>
              <span className="font-medium">
                {data.current} / {data.limit}
              </span>
            </div>
            <div className="h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all"
                style={{ width: `${Math.min(100, (data.current / data.limit) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Reset date if available */}
        {data.resetDate && (
          <p className="text-sm text-muted-foreground text-center mb-4">
            Se reinicia el <span className="font-medium">{data.resetDate}</span>
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-2">
          {showUpgrade && (
            <Button onClick={handleUpgrade} className="w-full">
              <ArrowUpCircle className="mr-2 h-4 w-4" />
              Mejorar plan
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// USAGE INDICATOR COMPONENT
// =============================================================================

interface UsageIndicatorProps {
  label: string
  current: number
  limit: number
  showBar?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function UsageIndicator({
  label,
  current,
  limit,
  showBar = true,
  size = 'md',
}: UsageIndicatorProps) {
  const isUnlimited = limit === -1
  const percentage = isUnlimited ? 0 : Math.min(100, (current / limit) * 100)

  const getBarColor = () => {
    if (isUnlimited) return 'bg-green-500'
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-amber-500'
    return 'bg-green-500'
  }

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  const barHeights = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2',
  }

  return (
    <div className="space-y-1">
      <div className={`flex justify-between ${sizeClasses[size]}`}>
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {current} / {isUnlimited ? 'Ilimitado' : limit}
        </span>
      </div>
      {showBar && !isUnlimited && (
        <div className={`${barHeights[size]} bg-muted rounded-full overflow-hidden`}>
          <div
            className={`h-full ${getBarColor()} transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  )
}
