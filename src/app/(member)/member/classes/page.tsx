import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarDays, Clock, MapPin, User, Users } from 'lucide-react'

export default async function MemberClassesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get profile
  const { data: profileData } = await supabase
    .from('profiles')
    .select('organization_id, email')
    .eq('id', user?.id ?? '')
    .single()

  const profile = profileData as { organization_id: string; email: string } | null

  // Get upcoming classes
  let upcomingClasses: Array<{
    id: string
    name: string
    description: string | null
    start_time: string
    end_time: string
    instructor_name: string | null
    location: string | null
    max_capacity: number
    current_bookings: number
  }> = []

  if (profile?.organization_id) {
    const { data: classesData } = await supabase
      .from('classes')
      .select('id, name, description, start_time, end_time, instructor_name, location, max_capacity, current_bookings')
      .eq('organization_id', profile.organization_id)
      .eq('is_cancelled', false)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(10)

    upcomingClasses = (classesData || []) as typeof upcomingClasses
  }

  // Get member's bookings
  let myBookings: Array<{
    id: string
    status: string
    class: {
      id: string
      name: string
      start_time: string
      instructor_name: string | null
    }
  }> = []

  if (profile?.organization_id) {
    const { data: memberData } = await supabase
      .from('members')
      .select('id')
      .eq('organization_id', profile.organization_id)
      .eq('email', profile.email)
      .single()

    const member = memberData as { id: string } | null

    if (member) {
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          id, status,
          classes:class_id (id, name, start_time, instructor_name)
        `)
        .eq('member_id', member.id)
        .in('status', ['confirmed', 'waitlist'])
        .order('created_at', { ascending: false })
        .limit(5)

      // Transform the data
      myBookings = ((bookingsData || []) as Array<{
        id: string
        status: string
        classes: { id: string; name: string; start_time: string; instructor_name: string | null }
      }>).map(b => ({
        id: b.id,
        status: b.status,
        class: b.classes
      }))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clases</h1>
        <p className="text-muted-foreground">
          Explora y reserva clases disponibles en el gimnasio
        </p>
      </div>

      {/* My Bookings */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Mis Reservas</h2>

        {myBookings.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {myBookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{booking.class.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(booking.class.start_time)}
                      </p>
                      {booking.class.instructor_name && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <User className="h-3 w-3" />
                          {booking.class.instructor_name}
                        </p>
                      )}
                    </div>
                    <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                      {booking.status === 'confirmed' ? 'Confirmada' : 'Lista de espera'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <CalendarDays className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-muted-foreground">No tienes clases reservadas</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upcoming Classes */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Proximas Clases</h2>

        {upcomingClasses.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingClasses.map((cls) => (
              <ClassCard key={cls.id} classData={cls} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <CalendarDays className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
              <p className="text-muted-foreground">
                No hay clases programadas proximamente
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// COMPONENTS
// =============================================================================

interface ClassCardProps {
  classData: {
    id: string
    name: string
    description: string | null
    start_time: string
    end_time: string
    instructor_name: string | null
    location: string | null
    max_capacity: number
    current_bookings: number
  }
}

function ClassCard({ classData }: ClassCardProps) {
  const spotsLeft = classData.max_capacity - classData.current_bookings
  const isFull = spotsLeft <= 0

  return (
    <Card className="hover:border-lime-300 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{classData.name}</CardTitle>
          <Badge variant={isFull ? 'secondary' : 'default'} className={!isFull ? 'bg-lime-600' : ''}>
            {isFull ? 'Lleno' : `${spotsLeft} lugares`}
          </Badge>
        </div>
        <CardDescription>{classData.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            {formatDate(classData.start_time)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatTime(classData.start_time)}
          </span>
        </div>

        {classData.instructor_name && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            {classData.instructor_name}
          </div>
        )}

        {classData.location && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {classData.location}
          </div>
        )}

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {classData.current_bookings}/{classData.max_capacity} reservados
        </div>

        <Button
          className="w-full mt-2"
          variant={isFull ? 'outline' : 'default'}
          disabled={isFull}
        >
          {isFull ? 'Unirse a lista de espera' : 'Reservar clase'}
        </Button>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// HELPERS
// =============================================================================

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
