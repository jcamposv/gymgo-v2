'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const statusBadgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-secondary text-secondary-foreground',
        success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
        orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  children: React.ReactNode
  className?: string
  dot?: boolean
}

/**
 * Colored status badge matching Figma design
 * Supports semantic variants: success, warning, error, info
 */
export function StatusBadge({
  children,
  variant,
  className,
  dot = false,
}: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ variant }), className)}>
      {dot && (
        <span
          className={cn(
            'mr-1.5 h-1.5 w-1.5 rounded-full',
            variant === 'success' && 'bg-green-500',
            variant === 'warning' && 'bg-yellow-500',
            variant === 'error' && 'bg-red-500',
            variant === 'info' && 'bg-blue-500',
            variant === 'purple' && 'bg-purple-500',
            variant === 'orange' && 'bg-orange-500',
            !variant && 'bg-current'
          )}
        />
      )}
      {children}
    </span>
  )
}

/**
 * Map common status strings to badge variants
 */
export function getStatusVariant(
  status: string
): VariantProps<typeof statusBadgeVariants>['variant'] {
  const statusMap: Record<string, VariantProps<typeof statusBadgeVariants>['variant']> = {
    // Active/Success states
    active: 'success',
    completed: 'success',
    paid: 'success',
    confirmed: 'success',
    approved: 'success',
    published: 'success',
    // Warning states
    pending: 'warning',
    scheduled: 'warning',
    processing: 'warning',
    waiting: 'warning',
    // Error/Inactive states
    inactive: 'error',
    cancelled: 'error',
    failed: 'error',
    rejected: 'error',
    expired: 'error',
    overdue: 'error',
    // Info states
    draft: 'info',
    new: 'info',
    // Other
    premium: 'purple',
    vip: 'orange',
  }

  return statusMap[status.toLowerCase()] || 'default'
}

/**
 * Auto-styled status badge based on status string
 */
export function AutoStatusBadge({
  status,
  className,
  dot = true,
}: {
  status: string
  className?: string
  dot?: boolean
}) {
  return (
    <StatusBadge variant={getStatusVariant(status)} className={className} dot={dot}>
      {status}
    </StatusBadge>
  )
}
