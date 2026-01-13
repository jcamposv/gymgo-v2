'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { addDays, format, startOfWeek, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ClientClass } from '@/types/dashboard.types'

interface ClientClassScheduleProps {
  classes: ClientClass[]
  className?: string
}

const statusStyles = {
  confirmed: 'bg-lime-100 text-lime-700 hover:bg-lime-100',
  pending: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  cancelled: 'bg-gray-200 text-gray-600 hover:bg-gray-200',
}

const statusLabels = {
  confirmed: 'Confirmado',
  pending: 'Pendiente',
  cancelled: 'Cancelado',
}

export function ClientClassSchedule({ classes, className }: ClientClassScheduleProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [weekStart, setWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 }) // Start on Monday
  )

  // Generate dates for the horizontal date picker
  const dates = Array.from({ length: 14 }, (_, i) => addDays(weekStart, i))

  const handlePrevWeek = () => {
    setWeekStart(addDays(weekStart, -7))
  }

  const handleNextWeek = () => {
    setWeekStart(addDays(weekStart, 7))
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Reservas de Hoy</CardTitle>
        <Button variant="ghost" size="sm" className="text-primary">
          Ver Todo
        </Button>
      </CardHeader>
      <CardContent>
        {/* Date picker */}
        <div className="flex items-center gap-2 mb-4 overflow-hidden">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handlePrevWeek}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {dates.map((date) => {
              const isSelected = isSameDay(date, selectedDate)
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    'flex flex-col items-center px-3 py-2 rounded-lg min-w-[48px] transition-colors',
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  <span className="text-xs text-current opacity-70 capitalize">
                    {format(date, 'EEE', { locale: es })}
                  </span>
                  <span className="text-sm font-medium">{format(date, 'd')}</span>
                </button>
              )
            })}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleNextWeek}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Nombre</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Clase</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((classItem) => (
                <TableRow key={classItem.id}>
                  <TableCell className="font-medium">{classItem.name}</TableCell>
                  <TableCell>{classItem.date}</TableCell>
                  <TableCell>{classItem.time}</TableCell>
                  <TableCell>{classItem.trainer}</TableCell>
                  <TableCell>{classItem.className}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(statusStyles[classItem.status])}
                    >
                      {statusLabels[classItem.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
