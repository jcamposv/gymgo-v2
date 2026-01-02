'use client'

import { FileX2, Loader2, SearchX } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DataTableEmptyProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

/**
 * Empty state when no data exists
 */
export function DataTableEmpty({
  title = 'No results',
  description = 'No data found. Try adjusting your filters or create a new item.',
  icon,
  action,
  className,
}: DataTableEmptyProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        className
      )}
    >
      <div className="rounded-full bg-muted p-4 mb-4">
        {icon || <FileX2 className="h-8 w-8 text-muted-foreground" />}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mt-1">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/**
 * Empty state specifically for filtered results
 */
export function DataTableNoResults({
  title = 'No results found',
  description = 'Try adjusting your search or filter to find what you\'re looking for.',
  onClearFilters,
  className,
}: Omit<DataTableEmptyProps, 'icon'> & { onClearFilters?: () => void }) {
  return (
    <DataTableEmpty
      title={title}
      description={description}
      icon={<SearchX className="h-8 w-8 text-muted-foreground" />}
      action={
        onClearFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-primary hover:underline"
          >
            Clear all filters
          </button>
        )
      }
      className={className}
    />
  )
}

interface DataTableLoadingProps {
  rows?: number
  columns?: number
  className?: string
}

/**
 * Loading skeleton for table
 */
export function DataTableLoading({
  rows = 5,
  columns = 4,
  className,
}: DataTableLoadingProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Header skeleton */}
      <div className="flex gap-4 p-4 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={`header-${i}`}
            className="h-4 bg-muted rounded animate-pulse"
            style={{ width: `${Math.random() * 50 + 50}px` }}
          />
        ))}
      </div>
      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="flex gap-4 p-4 border-b items-center"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={`cell-${rowIndex}-${colIndex}`}
              className="h-4 bg-muted rounded animate-pulse"
              style={{
                width: `${Math.random() * 80 + 40}px`,
                animationDelay: `${(rowIndex * columns + colIndex) * 50}ms`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Inline loading spinner
 */
export function DataTableSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-8', className)}>
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}
