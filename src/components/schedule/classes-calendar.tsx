'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format, addDays, isSameDay, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { Loader2, Users, Clock, MapPin, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { ClassWithTemplate } from '@/actions/class.actions'
import { getClassesByWeek } from '@/actions/class.actions'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { WeekNavigation, getWeekStart, formatDateForAPI } from './week-navigation'
import { CalendarSkeleton } from './calendar-skeleton'

interface ClassesCalendarProps {
  onClassClick?: (classItem: ClassWithTemplate) => void
}

// Generate time slots from 5:00 to 21:00
const TIME_SLOTS = Array.from({ length: 17 }, (_, i) => {
  const hour = i + 5
  return `${hour.toString().padStart(2, '0')}:00`
})

// Days of week starting Monday
const DAYS_ORDER = [0, 1, 2, 3, 4, 5, 6] // Offset from Monday

export function ClassesCalendar({ onClassClick }: ClassesCalendarProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [weekStart, setWeekStart] = useState<Date>(getWeekStart())
  const [classes, setClasses] = useState<ClassWithTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch classes when week changes
  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoading(true)
      setError(null)

      const weekEnd = addDays(weekStart, 6)
      const result = await getClassesByWeek({
        week_start: formatDateForAPI(weekStart),
        week_end: formatDateForAPI(weekEnd),
      })

      if (result.error) {
        setError(result.error)
        setClasses([])
      } else {
        setClasses(result.data || [])
      }

      setIsLoading(false)
    }

    fetchClasses()
  }, [weekStart])

  const handleWeekChange = (newWeekStart: Date) => {
    startTransition(() => {
      setWeekStart(newWeekStart)
    })
  }

  const handleGoToToday = () => {
    startTransition(() => {
      setWeekStart(getWeekStart())
    })
  }

  // Group classes by day and hour
  const getClassesForDayAndHour = (dayOffset: number, hour: string) => {
    const targetDate = addDays(weekStart, dayOffset)
    const hourNum = parseInt(hour.split(':')[0])

    return classes.filter((c) => {
      const classDate = new Date(c.start_time)
      const classHour = classDate.getHours()
      return isSameDay(classDate, targetDate) && classHour === hourNum
    })
  }

  // Get day label with date
  const getDayLabel = (dayOffset: number) => {
    const date = addDays(weekStart, dayOffset)
    const dayName = format(date, 'EEE', { locale: es })
    const dayNum = format(date, 'd')
    const isToday = isSameDay(date, new Date())

    return { dayName, dayNum, isToday, date }
  }

  // Count classes for a day
  const getClassCountForDay = (dayOffset: number) => {
    const targetDate = addDays(weekStart, dayOffset)
    return classes.filter((c) => isSameDay(new Date(c.start_time), targetDate)).length
  }

  if (error) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  // Show skeleton on initial load
  if (isLoading) {
    return <CalendarSkeleton />
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <WeekNavigation
            currentWeekStart={weekStart}
            onWeekChange={handleWeekChange}
            onGoToToday={handleGoToToday}
          />
          <div className="text-sm text-muted-foreground">
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando...
              </span>
            ) : (
              `${classes.length} clases esta semana`
            )}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="border rounded-lg overflow-hidden bg-background">
          {/* Header row with days */}
          <div className="grid grid-cols-8 border-b bg-muted/50">
            <div className="p-3 text-sm font-medium text-muted-foreground border-r">
              Hora
            </div>
            {DAYS_ORDER.map((dayOffset) => {
              const { dayName, dayNum, isToday } = getDayLabel(dayOffset)
              const classCount = getClassCountForDay(dayOffset)
              return (
                <div
                  key={dayOffset}
                  className={cn(
                    'p-3 text-center border-r last:border-r-0',
                    isToday && 'bg-primary/5'
                  )}
                >
                  <div className={cn('font-medium capitalize', isToday && 'text-primary')}>
                    {dayName}
                  </div>
                  <div className={cn(
                    'text-2xl font-bold',
                    isToday && 'text-primary'
                  )}>
                    {dayNum}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {classCount} {classCount === 1 ? 'clase' : 'clases'}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Time slots grid */}
          <div className="relative">
            {/* Overlay only when navigating between weeks (not initial load) */}
            {isPending && (
              <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {TIME_SLOTS.map((time) => (
              <div key={time} className="grid grid-cols-8 border-b last:border-b-0">
                {/* Time label */}
                <div className="p-2 text-sm text-muted-foreground border-r bg-muted/30 flex items-center justify-center">
                  {time}
                </div>

                {/* Day cells */}
                {DAYS_ORDER.map((dayOffset) => {
                  const cellClasses = getClassesForDayAndHour(dayOffset, time)
                  const { isToday } = getDayLabel(dayOffset)

                  return (
                    <div
                      key={`${dayOffset}-${time}`}
                      className={cn(
                        'min-h-[70px] p-1 border-r last:border-r-0',
                        isToday && 'bg-primary/5'
                      )}
                    >
                      {cellClasses.map((classItem) => (
                        <ClassCard
                          key={classItem.id}
                          classItem={classItem}
                          onClick={() => {
                            if (onClassClick) {
                              onClassClick(classItem)
                            } else {
                              router.push(`/dashboard/classes/${classItem.id}`)
                            }
                          }}
                        />
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Empty state */}
        {!isLoading && !isPending && classes.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay clases programadas para esta semana</p>
            <p className="text-sm mt-1">
              Ve a la vista de Plantilla para configurar tu horario semanal
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

// Class card component
interface ClassCardProps {
  classItem: ClassWithTemplate
  onClick: () => void
}

function ClassCard({ classItem, onClick }: ClassCardProps) {
  const startTime = new Date(classItem.start_time)
  const endTime = new Date(classItem.end_time)
  const now = new Date()

  // Determine status
  const isCancelled = classItem.is_cancelled
  const isFinished = endTime < now
  const isInProgress = startTime <= now && endTime >= now
  const isFull = classItem.current_bookings >= classItem.max_capacity

  const statusColor = isCancelled
    ? 'bg-destructive/10 border-destructive/30 text-destructive'
    : isFinished
    ? 'bg-muted border-muted-foreground/20 text-muted-foreground'
    : isInProgress
    ? 'bg-amber-500/10 border-amber-500/30'
    : isFull
    ? 'bg-orange-500/10 border-orange-500/30'
    : 'bg-primary/10 border-primary/20'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'rounded-md p-2 text-xs cursor-pointer transition-all mb-1',
            'hover:ring-2 hover:ring-primary/50',
            'border',
            statusColor
          )}
          onClick={onClick}
        >
          {/* Time */}
          <div className="font-medium">
            {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
          </div>

          {/* Name */}
          <div className="font-medium truncate">{classItem.name}</div>

          {/* Capacity */}
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>
              {classItem.current_bookings}/{classItem.max_capacity}
            </span>
            {isFull && !isCancelled && !isFinished && (
              <Badge variant="secondary" className="text-[10px] ml-1">
                Lleno
              </Badge>
            )}
          </div>

          {/* Status badges */}
          {isCancelled && (
            <Badge variant="destructive" className="text-[10px] mt-1">
              Cancelada
            </Badge>
          )}
          {isInProgress && !isCancelled && (
            <Badge variant="outline" className="text-[10px] mt-1 border-amber-500 text-amber-600">
              En curso
            </Badge>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-[220px]">
        <div className="space-y-1">
          <p className="font-medium">{classItem.name}</p>
          <p className="text-xs flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
          </p>
          {classItem.instructor_name && (
            <p className="text-xs text-muted-foreground">
              Coach: {classItem.instructor_name}
            </p>
          )}
          {classItem.location && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {classItem.location}
            </p>
          )}
          <p className="text-xs">
            Reservas: {classItem.current_bookings}/{classItem.max_capacity}
            {classItem.waitlist_enabled && ` (+${classItem.max_waitlist} espera)`}
          </p>
          {classItem.template_info && (
            <Badge variant="secondary" className="text-[10px]">
              De plantilla: {classItem.template_info.template_name}
            </Badge>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
