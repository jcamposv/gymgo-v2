'use client'

import { Calendar, MoreHorizontal } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { appointmentLabels, formatAppointmentDate } from '@/lib/i18n'
import type { MemberAppointment, AppointmentStatus } from '@/types/member.types'

interface AppointmentCardProps {
  upcomingAppointments: MemberAppointment[]
  pastAppointments: MemberAppointment[]
  className?: string
}

const statusStyles: Record<AppointmentStatus, string> = {
  confirmed: 'bg-lime-100 text-lime-700 hover:bg-lime-100',
  pending: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  completed: 'bg-lime-100 text-lime-700 hover:bg-lime-100',
  cancelled: 'bg-gray-100 text-gray-600 hover:bg-gray-100',
}

const statusLabels: Record<AppointmentStatus, string> = {
  confirmed: appointmentLabels.confirmed,
  pending: appointmentLabels.pending,
  completed: appointmentLabels.completed,
  cancelled: appointmentLabels.cancelled,
}

interface AppointmentItemProps {
  appointment: MemberAppointment
}

function AppointmentItem({ appointment }: AppointmentItemProps) {
  return (
    <div className="py-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{appointment.class_name}</p>
          <p className="text-sm font-semibold">{appointment.trainer_name}</p>
        </div>
        <Badge
          variant="secondary"
          className={cn('text-xs shrink-0', statusStyles[appointment.status])}
        >
          {statusLabels[appointment.status]}
        </Badge>
      </div>
      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
        <Calendar className="h-3 w-3" />
        <span>{formatAppointmentDate(appointment.scheduled_at)}</span>
      </div>
    </div>
  )
}

export function AppointmentCard({
  upcomingAppointments,
  pastAppointments,
  className,
}: AppointmentCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">{appointmentLabels.title}</CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upcoming Workouts */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">{appointmentLabels.upcomingWorkouts}</h4>
          {upcomingAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">{appointmentLabels.noUpcoming}</p>
          ) : (
            <div className="divide-y">
              {upcomingAppointments.map((appt) => (
                <AppointmentItem key={appt.id} appointment={appt} />
              ))}
            </div>
          )}
        </div>

        {/* History */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">{appointmentLabels.history}</h4>
          {pastAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">{appointmentLabels.noPast}</p>
          ) : (
            <div className="divide-y">
              {pastAppointments.slice(0, 3).map((appt) => (
                <AppointmentItem key={appt.id} appointment={appt} />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
