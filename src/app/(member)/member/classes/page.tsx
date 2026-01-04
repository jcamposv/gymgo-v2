import {
  CalendarDays,
  Clock,
  MapPin,
  User,
  Users,
  AlertCircle,
  History,
  CalendarCheck,
  CalendarPlus,
} from 'lucide-react'

import {
  getMyClassBookings,
  getMyClassHistory,
  getAvailableClasses,
  type AvailableClass,
} from '@/actions/member-booking.actions'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MemberBookingsTable } from '@/components/member/member-bookings-table'
import { MemberClassHistoryTable } from '@/components/member/member-class-history-table'
import { ReserveClassButton } from '@/components/member/reserve-class-button'

export default async function MemberClassesPage() {
  // Fetch all data in parallel
  const [bookingsResult, historyResult, availableResult] = await Promise.all([
    getMyClassBookings(),
    getMyClassHistory(),
    getAvailableClasses(),
  ])

  const { data: myBookings, memberId, error: bookingsError } = bookingsResult
  const { data: historyBookings, error: historyError } = historyResult
  const { data: availableClasses, error: availableError } = availableResult

  // Counts for tabs
  const bookingsCount = myBookings?.length || 0
  const historyCount = historyBookings?.length || 0
  const availableCount = availableClasses?.length || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clases</h1>
        <p className="text-muted-foreground">
          Reserva clases, gestiona tus reservas y revisa tu historial
        </p>
      </div>

      {/* Error State - No member profile */}
      {bookingsError && !memberId && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <p className="text-destructive font-medium">{bookingsError}</p>
            <p className="text-sm text-destructive/80 mt-2">
              Contacta a tu gimnasio para que te asocien como miembro
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main Content with Tabs */}
      {memberId && (
        <Tabs defaultValue="reservas" className="space-y-4">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="reservas" className="gap-2">
              <CalendarCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Mis reservas</span>
              <span className="sm:hidden">Reservas</span>
              {bookingsCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {bookingsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="historial" className="gap-2">
              <History className="h-4 w-4" />
              Historial
              {historyCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {historyCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="disponibles" className="gap-2">
              <CalendarPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Proximas</span>
              <span className="sm:hidden">Clases</span>
              {availableCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {availableCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ============================================================= */}
          {/* TAB: MIS RESERVAS */}
          {/* ============================================================= */}
          <TabsContent value="reservas" className="space-y-4">
            {bookingsError ? (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="py-8 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                  <p className="text-destructive font-medium">{bookingsError}</p>
                </CardContent>
              </Card>
            ) : !myBookings || myBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CalendarCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
                  <p className="text-muted-foreground font-medium">
                    No tienes reservas activas
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Explora las proximas clases disponibles y reserva tu lugar
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5 text-lime-600" />
                    Mis reservas
                  </CardTitle>
                  <CardDescription>
                    Clases que tienes reservadas proximamente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MemberBookingsTable data={myBookings} />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ============================================================= */}
          {/* TAB: HISTORIAL */}
          {/* ============================================================= */}
          <TabsContent value="historial" className="space-y-4">
            {historyError ? (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="py-8 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                  <p className="text-destructive font-medium">{historyError}</p>
                </CardContent>
              </Card>
            ) : !historyBookings || historyBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
                  <p className="text-muted-foreground font-medium">
                    Aun no tienes historial de clases
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Las clases a las que asistas apareceran aqui
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="h-5 w-5 text-muted-foreground" />
                    Historial de clases
                  </CardTitle>
                  <CardDescription>
                    Clases a las que has asistido
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MemberClassHistoryTable data={historyBookings} />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ============================================================= */}
          {/* TAB: PROXIMAS CLASES */}
          {/* ============================================================= */}
          <TabsContent value="disponibles" className="space-y-4">
            {availableError ? (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="py-8 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                  <p className="text-destructive font-medium">{availableError}</p>
                </CardContent>
              </Card>
            ) : !availableClasses || availableClasses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CalendarDays className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
                  <p className="text-muted-foreground font-medium">
                    No hay clases disponibles por ahora
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Las proximas clases programadas apareceran aqui
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableClasses.map((cls) => (
                  <AvailableClassCard key={cls.id} classData={cls} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

// =============================================================================
// AVAILABLE CLASS CARD COMPONENT
// =============================================================================

interface AvailableClassCardProps {
  classData: AvailableClass
}

function AvailableClassCard({ classData }: AvailableClassCardProps) {
  const spotsLeft = classData.max_capacity - classData.current_bookings
  const isFull = spotsLeft <= 0

  // Check if booking window is open
  const now = new Date()
  const classStart = new Date(classData.start_time)
  const classEnd = new Date(classData.end_time)

  // Booking opens X hours before class
  const openTime = new Date(classStart.getTime() - classData.booking_opens_hours * 60 * 60 * 1000)
  // Booking closes X minutes before class
  const closeTime = new Date(classStart.getTime() - classData.booking_closes_minutes * 60 * 1000)

  const isBookingOpen = now >= openTime && now <= closeTime
  const bookingNotOpenYet = now < openTime
  const bookingClosed = now > closeTime

  // Determine disabled state and reason
  let disabled = false
  let disabledReason: string | undefined

  if (bookingNotOpenYet) {
    disabled = true
    const daysUntilOpen = Math.ceil((openTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const hoursUntilOpen = Math.ceil((openTime.getTime() - now.getTime()) / (1000 * 60 * 60))
    if (daysUntilOpen > 1) {
      disabledReason = `Las reservas abren en ${daysUntilOpen} dias`
    } else if (hoursUntilOpen > 1) {
      disabledReason = `Las reservas abren en ${hoursUntilOpen} horas`
    } else {
      disabledReason = 'Las reservas abren pronto'
    }
  } else if (bookingClosed) {
    disabled = true
    disabledReason = 'Las reservas estan cerradas'
  }

  return (
    <Card className={`hover:border-lime-300 transition-colors ${classData.hasMyBooking ? 'border-lime-400 bg-lime-50/30' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{classData.name}</CardTitle>
            {classData.class_type && (
              <Badge variant="outline" className="mt-1 text-xs">
                {classData.class_type}
              </Badge>
            )}
          </div>
          <Badge
            variant={classData.hasMyBooking ? 'default' : isFull ? 'secondary' : 'default'}
            className={classData.hasMyBooking ? 'bg-lime-600' : !isFull ? 'bg-lime-600' : ''}
          >
            {classData.hasMyBooking
              ? classData.myBookingStatus === 'confirmed'
                ? 'Reservada'
                : 'En lista'
              : isFull
              ? 'Lleno'
              : `${spotsLeft} lugar${spotsLeft !== 1 ? 'es' : ''}`}
          </Badge>
        </div>
        {classData.description && (
          <CardDescription className="line-clamp-2 mt-1">
            {classData.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Date and time */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            {classStart.toLocaleDateString('es-MX', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {classStart.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Instructor */}
        {classData.instructor_name && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            {classData.instructor_name}
          </div>
        )}

        {/* Location */}
        {classData.location && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {classData.location}
          </div>
        )}

        {/* Capacity */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {classData.current_bookings}/{classData.max_capacity} reservados
          {classData.waitlist_enabled && isFull && (
            <span className="text-xs ml-1">(lista de espera disponible)</span>
          )}
        </div>

        {/* Reserve button */}
        <div className="pt-2">
          <ReserveClassButton
            classId={classData.id}
            className={classData.name}
            isFull={isFull}
            waitlistEnabled={classData.waitlist_enabled}
            hasMyBooking={classData.hasMyBooking}
            myBookingStatus={classData.myBookingStatus}
            disabled={disabled}
            disabledReason={disabledReason}
          />
        </div>
      </CardContent>
    </Card>
  )
}
