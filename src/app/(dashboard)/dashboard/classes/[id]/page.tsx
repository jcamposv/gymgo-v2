import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, Pencil, Clock, Users, MapPin, Calendar, User } from 'lucide-react'

import { getClassWithBookings } from '@/actions/class.actions'
import { getClassBookings } from '@/actions/booking.actions'
import { getInstructor } from '@/actions/instructor.actions'
import { ClassBookingsTable } from '@/components/bookings'
import { AddBookingDialog } from '@/components/bookings/add-booking-dialog'
import { UserAvatar } from '@/components/shared/user-avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const metadata = {
  title: 'Detalle de Clase | GymGo',
}

interface PageProps {
  params: Promise<{ id: string }>
}

const classTypeLabels: Record<string, string> = {
  crossfit: 'CrossFit',
  yoga: 'Yoga',
  pilates: 'Pilates',
  spinning: 'Spinning',
  hiit: 'HIIT',
  strength: 'Fuerza',
  cardio: 'Cardio',
  functional: 'Funcional',
  boxing: 'Box',
  mma: 'MMA',
  stretching: 'Estiramiento',
  open_gym: 'Open Gym',
  personal: 'Personal',
  other: 'Otro',
}

export default async function ClassDetailPage({ params }: PageProps) {
  const { id } = await params
  const [classResult, bookingsResult] = await Promise.all([
    getClassWithBookings(id),
    getClassBookings(id),
  ])

  if (classResult.error || !classResult.data) {
    notFound()
  }

  const classData = classResult.data
  const bookings = bookingsResult.data ?? []
  const isPast = new Date(classData.start_time) < new Date()

  // Fetch instructor data if there's an instructor_id
  const instructor = classData.instructor_id
    ? (await getInstructor(classData.instructor_id)).data
    : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/classes">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{classData.name}</h1>
              {classData.is_cancelled ? (
                <Badge variant="destructive">Cancelada</Badge>
              ) : isPast ? (
                <Badge variant="secondary">Finalizada</Badge>
              ) : (
                <Badge variant="default">Activa</Badge>
              )}
            </div>
            {classData.class_type && (
              <Badge variant="outline" className="mt-1">
                {classTypeLabels[classData.class_type] ?? classData.class_type}
              </Badge>
            )}
          </div>
        </div>
        {!classData.is_cancelled && !isPast && (
          <Button asChild>
            <Link href={`/dashboard/classes/${classData.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Horario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(classData.start_time), 'EEEE d MMMM yyyy', { locale: es })}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(new Date(classData.start_time), 'HH:mm', { locale: es })} - {format(new Date(classData.end_time), 'HH:mm', { locale: es })}
                <span className="text-muted-foreground ml-2">({classData.duration_minutes} min)</span>
              </span>
            </div>
            {classData.location && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{classData.location}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capacidad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Reservaciones</span>
              </div>
              <span className="font-bold text-lg">
                {classData.current_bookings}/{classData.max_capacity}
              </span>
            </div>
            {classData.waitlist_enabled && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Lista de espera max.</span>
                <span>{classData.max_waitlist}</span>
              </div>
            )}
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${Math.min(((classData.current_bookings ?? 0) / (classData.max_capacity ?? 1)) * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instructor</CardTitle>
          </CardHeader>
          <CardContent>
            {instructor ? (
              <div className="flex items-center gap-3">
                <UserAvatar
                  src={instructor.avatar_url}
                  name={instructor.full_name}
                  size="lg"
                />
                <div>
                  <p className="font-medium">{instructor.full_name || classData.instructor_name}</p>
                  <p className="text-sm text-muted-foreground">{instructor.email}</p>
                </div>
              </div>
            ) : classData.instructor_name ? (
              <div className="flex items-center gap-3">
                <UserAvatar name={classData.instructor_name} size="lg" />
                <p className="font-medium">{classData.instructor_name}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">Sin asignar</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reglas de reserva</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reserva abre</span>
              <span>{classData.booking_opens_hours}h antes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reserva cierra</span>
              <span>{classData.booking_closes_minutes} min antes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cancelacion hasta</span>
              <span>{classData.cancellation_deadline_hours}h antes</span>
            </div>
          </CardContent>
        </Card>

        {classData.description && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Descripcion</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{classData.description}</p>
            </CardContent>
          </Card>
        )}

        {classData.is_cancelled && classData.cancellation_reason && (
          <Card className="md:col-span-2 border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Razon de cancelacion</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{classData.cancellation_reason}</p>
            </CardContent>
          </Card>
        )}

        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Reservaciones ({bookings.filter(b => b.status !== 'cancelled').length})</CardTitle>
                <CardDescription>Lista de miembros con reserva</CardDescription>
              </div>
              {!classData.is_cancelled && !isPast && (
                <AddBookingDialog classId={classData.id} />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ClassBookingsTable
              bookings={bookings}
              isPast={isPast}
              isCancelled={classData.is_cancelled ?? false}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
