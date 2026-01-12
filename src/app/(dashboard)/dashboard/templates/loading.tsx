import { Skeleton } from '@/components/ui/skeleton'
import { CalendarSkeleton } from '@/components/schedule'

export default function TemplatesLoading() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          {/* Tabs skeleton */}
          <Skeleton className="h-10 w-[280px]" />
        </div>
        {/* Actions skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>

      {/* Calendar skeleton */}
      <CalendarSkeleton />
    </div>
  )
}
