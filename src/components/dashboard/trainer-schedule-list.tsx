'use client'

import { MoreHorizontal } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { TrainerSchedule } from '@/types/dashboard.types'

interface TrainerScheduleListProps {
  trainers: TrainerSchedule[]
  className?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function TrainerScheduleList({ trainers, className }: TrainerScheduleListProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Horario de Instructores</CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {trainers.map((trainer) => (
          <div
            key={trainer.id}
            className="flex items-center gap-3 py-2"
          >
            <Avatar className="h-10 w-10 shrink-0 border-2 border-lime-300">
              <AvatarImage src={trainer.avatarUrl} alt={trainer.name} />
              <AvatarFallback className="bg-lime-100 text-lime-700 text-xs">
                {getInitials(trainer.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{trainer.name}</p>
              <p className="text-xs text-muted-foreground truncate">{trainer.activity}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Badge
                variant={trainer.status === 'available' ? 'default' : 'destructive'}
                className={cn(
                  'text-xs',
                  trainer.status === 'available'
                    ? 'bg-lime-100 text-lime-700 hover:bg-lime-100'
                    : 'bg-red-100 text-red-700 hover:bg-red-100'
                )}
              >
                {trainer.status === 'available' ? 'Disponible' : 'No disponible'}
              </Badge>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {trainer.startTime} - {trainer.endTime}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
