'use client'

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameWeek } from 'date-fns'
import { es } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface WeekNavigationProps {
  currentWeekStart: Date
  onWeekChange: (newWeekStart: Date) => void
  onGoToToday: () => void
}

export function WeekNavigation({
  currentWeekStart,
  onWeekChange,
  onGoToToday,
}: WeekNavigationProps) {
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })
  const today = new Date()
  const isCurrentWeek = isSameWeek(currentWeekStart, today, { weekStartsOn: 1 })

  const handlePrevWeek = () => {
    onWeekChange(subWeeks(currentWeekStart, 1))
  }

  const handleNextWeek = () => {
    onWeekChange(addWeeks(currentWeekStart, 1))
  }

  // Format: "13 - 19 Ene 2026"
  const formatWeekRange = () => {
    const startDay = format(currentWeekStart, 'd', { locale: es })
    const endDay = format(weekEnd, 'd', { locale: es })
    const month = format(weekEnd, 'MMM', { locale: es })
    const year = format(weekEnd, 'yyyy')

    // Si es el mismo mes
    if (currentWeekStart.getMonth() === weekEnd.getMonth()) {
      return `${startDay} - ${endDay} ${month} ${year}`
    }
    // Si son meses diferentes
    const startMonth = format(currentWeekStart, 'MMM', { locale: es })
    return `${startDay} ${startMonth} - ${endDay} ${month} ${year}`
  }

  return (
    <div className="flex items-center gap-2">
      {/* Navigation buttons */}
      <div className="flex items-center">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevWeek}
          className="rounded-r-none"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleNextWeek}
          className="rounded-l-none border-l-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Week display */}
      <div className="flex items-center gap-2">
        <span className="font-medium text-sm min-w-[160px]">
          {formatWeekRange()}
        </span>
        {isCurrentWeek && (
          <Badge variant="secondary" className="text-xs">
            Esta semana
          </Badge>
        )}
      </div>

      {/* Today button */}
      {!isCurrentWeek && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onGoToToday}
          className="text-xs"
        >
          <Calendar className="h-3 w-3 mr-1" />
          Hoy
        </Button>
      )}
    </div>
  )
}

// Helper to get the Monday of the current week
export function getWeekStart(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 }) // 1 = Monday
}

// Helper to get week number
export function getWeekNumber(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1)
  const diff = date.getTime() - startOfYear.getTime()
  const oneWeek = 7 * 24 * 60 * 60 * 1000
  return Math.ceil((diff / oneWeek) + 1)
}

// Helper to format date for API calls (YYYY-MM-DD)
export function formatDateForAPI(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}
