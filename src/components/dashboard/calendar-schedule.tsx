'use client'

import { useState } from 'react'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import type { CalendarEvent } from '@/types/dashboard.types'

interface CalendarScheduleProps {
  events: CalendarEvent[]
  className?: string
  selectedDate?: Date
  onDateChange?: (date: Date) => void
}

const timeSlots = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '01:00',
  '02:00',
  '03:00',
  '04:00',
  '05:00',
]

function getEventPosition(startTime: string, endTime: string) {
  const startHour = parseInt(startTime.split(':')[0])
  const endHour = parseInt(endTime.split(':')[0])
  const duration = endHour - startHour
  const topOffset = startHour - 8 // Start at 08:00

  return {
    top: topOffset * 48, // 48px per hour slot
    height: duration * 48,
  }
}

export function CalendarSchedule({
  events,
  className,
  selectedDate: controlledDate,
  onDateChange,
}: CalendarScheduleProps) {
  const [internalDate, setInternalDate] = useState<Date>(new Date(2028, 6, 12)) // July 12, 2028
  const [month, setMonth] = useState<Date>(new Date(2028, 6, 1)) // July 2028

  const selectedDate = controlledDate ?? internalDate
  const handleDateChange = onDateChange ?? setInternalDate

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">{format(month, 'MMMM yyyy')}</h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setMonth(subMonths(month, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setMonth(addMonths(month, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar */}
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && handleDateChange(date)}
          month={month}
          onMonthChange={setMonth}
          className="p-0"
          classNames={{
            months: 'flex flex-col',
            month: 'space-y-2',
            caption: 'hidden',
            caption_label: 'hidden',
            nav: 'hidden',
            table: 'w-full border-collapse',
            head_row: 'flex w-full',
            head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-[0.7rem] flex-1 text-center',
            row: 'flex w-full mt-1',
            cell: 'text-center text-sm p-0 relative flex-1 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
            day: 'h-8 w-8 mx-auto p-0 font-normal aria-selected:opacity-100 hover:bg-muted rounded-md flex items-center justify-center',
            day_selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
            day_today: 'bg-accent text-accent-foreground',
            day_outside: 'text-muted-foreground opacity-50',
            day_disabled: 'text-muted-foreground opacity-50',
            day_hidden: 'invisible',
          }}
        />
      </CardHeader>

      <CardContent className="border-t pt-4">
        {/* Day header */}
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium">
            {format(selectedDate, 'EEEE, d MMMM')}
          </h4>
          <Button size="icon" className="h-8 w-8 rounded-full bg-lime-400 hover:bg-lime-500 text-black">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Timeline */}
        <div className="relative h-[400px] overflow-y-auto">
          {/* Time labels */}
          <div className="absolute left-0 top-0 w-12 text-xs text-muted-foreground">
            {timeSlots.map((time) => (
              <div key={time} className="h-12 flex items-start">
                {time}
              </div>
            ))}
          </div>

          {/* Events container */}
          <div className="ml-14 relative">
            {/* Grid lines */}
            {timeSlots.map((time) => (
              <div key={time} className="h-12 border-t border-dashed border-muted" />
            ))}

            {/* Event cards */}
            {events.map((event) => {
              const position = getEventPosition(event.startTime, event.endTime)
              return (
                <div
                  key={event.id}
                  className="absolute left-0 right-0 rounded-lg px-2 py-1 text-xs"
                  style={{
                    top: position.top,
                    height: position.height - 4,
                    backgroundColor: event.color,
                  }}
                >
                  <p className="font-medium text-black truncate">{event.title}</p>
                  <p className="text-black/70 text-[10px]">
                    {event.startTime.replace(':', ':')} AM - {event.endTime.replace(':', ':')} PM
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
