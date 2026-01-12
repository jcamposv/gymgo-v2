'use client'

import { Skeleton } from '@/components/ui/skeleton'

// Days of week starting Monday
const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

// Time slots to show (5:00 to 21:00 = 17 slots, show fewer for skeleton)
const TIME_SLOTS = ['05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '17:00', '18:00', '19:00', '20:00']

export function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      {/* Week Navigation Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20" /> {/* Nav buttons */}
          <Skeleton className="h-5 w-40" /> {/* Date range */}
        </div>
        <Skeleton className="h-5 w-32" /> {/* Class count */}
      </div>

      {/* Calendar Grid Skeleton */}
      <div className="border rounded-lg overflow-hidden bg-background">
        {/* Header row */}
        <div className="grid grid-cols-8 border-b bg-muted/50">
          <div className="p-3 border-r">
            <Skeleton className="h-4 w-10 mx-auto" />
          </div>
          {DAYS.map((day) => (
            <div key={day} className="p-3 text-center border-r last:border-r-0">
              <Skeleton className="h-4 w-8 mx-auto mb-1" />
              <Skeleton className="h-7 w-7 mx-auto mb-1" />
              <Skeleton className="h-3 w-12 mx-auto" />
            </div>
          ))}
        </div>

        {/* Time slots */}
        {TIME_SLOTS.map((time, index) => (
          <div key={time} className="grid grid-cols-8 border-b last:border-b-0">
            {/* Time label */}
            <div className="p-2 border-r bg-muted/30 flex items-center justify-center">
              <Skeleton className="h-4 w-10" />
            </div>

            {/* Day cells - randomly show some skeleton slots */}
            {DAYS.map((day, dayIndex) => {
              // Show skeleton class cards in some cells (pseudo-random based on index)
              const showSlot = (index + dayIndex) % 3 === 0

              return (
                <div
                  key={`${day}-${time}`}
                  className="min-h-[70px] p-1 border-r last:border-r-0"
                >
                  {showSlot && (
                    <div className="rounded-md border p-2 space-y-2">
                      <Skeleton className="h-3 w-16" /> {/* Time */}
                      <Skeleton className="h-4 w-full" /> {/* Name */}
                      <Skeleton className="h-3 w-12" /> {/* Capacity */}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export function TemplateSkeleton() {
  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Header row */}
      <div className="grid grid-cols-8 border-b bg-muted/50">
        <div className="p-3 border-r">
          <Skeleton className="h-4 w-10 mx-auto" />
        </div>
        {DAYS.map((day) => (
          <div key={day} className="p-3 text-center border-r last:border-r-0">
            <Skeleton className="h-4 w-12 mx-auto mb-1" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        ))}
      </div>

      {/* Time slots */}
      {TIME_SLOTS.map((time, index) => (
        <div key={time} className="grid grid-cols-8 border-b last:border-b-0">
          {/* Time label */}
          <div className="p-2 border-r bg-muted/30 flex items-center justify-center">
            <Skeleton className="h-4 w-10" />
          </div>

          {/* Day cells */}
          {DAYS.map((day, dayIndex) => {
            const showSlot = (index + dayIndex) % 4 === 0

            return (
              <div
                key={`${day}-${time}`}
                className="min-h-[60px] p-1 border-r last:border-r-0"
              >
                {showSlot && (
                  <div className="rounded-md border bg-primary/5 p-2 space-y-1">
                    <Skeleton className="h-3 w-10" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
