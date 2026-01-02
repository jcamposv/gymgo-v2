'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
} from 'lucide-react'
import { toast } from 'sonner'

import { cancelBooking, checkInBooking, markNoShow } from '@/actions/booking.actions'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface Booking {
  id: string
  status: string
  waitlist_position: number | null
  checked_in_at: string | null
  created_at: string
  member?: {
    id: string
    full_name: string
    email: string
    status: string
  }
}

interface ClassBookingsTableProps {
  bookings: Booking[]
  isPast: boolean
  isCancelled: boolean
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  confirmed: { label: 'Confirmado', variant: 'default' },
  waitlist: { label: 'Lista de espera', variant: 'secondary' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
  no_show: { label: 'No asistio', variant: 'outline' },
}

export function ClassBookingsTable({ bookings, isPast, isCancelled }: ClassBookingsTableProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null)
  const [cancellationReason, setCancellationReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleCheckIn = async (bookingId: string) => {
    setIsLoading(true)
    const result = await checkInBooking(bookingId)
    setIsLoading(false)

    if (result.success) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
  }

  const handleCancel = async () => {
    if (!bookingToCancel) return

    setIsLoading(true)
    const result = await cancelBooking(bookingToCancel.id, cancellationReason)
    setIsLoading(false)

    if (result.success) {
      toast.success(result.message)
      setCancelDialogOpen(false)
      setBookingToCancel(null)
      setCancellationReason('')
    } else {
      toast.error(result.message)
    }
  }

  const handleMarkNoShow = async (bookingId: string) => {
    setIsLoading(true)
    const result = await markNoShow(bookingId)
    setIsLoading(false)

    if (result.success) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
  }

  // Filter and sort bookings
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed')
  const waitlistBookings = bookings.filter(b => b.status === 'waitlist').sort((a, b) => (a.waitlist_position || 0) - (b.waitlist_position || 0))
  const otherBookings = bookings.filter(b => b.status !== 'confirmed' && b.status !== 'waitlist')

  const allBookings = [...confirmedBookings, ...waitlistBookings, ...otherBookings]

  if (allBookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-muted-foreground">No hay reservaciones para esta clase</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Miembro</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Reservado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allBookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>
                  {booking.member ? (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs">
                          {getInitials(booking.member.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{booking.member.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {booking.member.email}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Miembro no encontrado</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusConfig[booking.status]?.variant || 'secondary'}>
                      {statusConfig[booking.status]?.label || booking.status}
                    </Badge>
                    {booking.status === 'waitlist' && booking.waitlist_position && (
                      <span className="text-xs text-muted-foreground">
                        #{booking.waitlist_position}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {booking.checked_in_at ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm">
                        {format(new Date(booking.checked_in_at), 'HH:mm', { locale: es })}
                      </span>
                    </div>
                  ) : booking.status === 'cancelled' ? (
                    <span className="text-sm text-muted-foreground">-</span>
                  ) : (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Pendiente</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(booking.created_at), 'dd MMM HH:mm', { locale: es })}
                </TableCell>
                <TableCell className="text-right">
                  {booking.status !== 'cancelled' && !isCancelled && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!booking.checked_in_at && booking.status === 'confirmed' && !isPast && (
                          <DropdownMenuItem onClick={() => handleCheckIn(booking.id)}>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Check-in
                          </DropdownMenuItem>
                        )}
                        {isPast && !booking.checked_in_at && booking.status === 'confirmed' && (
                          <DropdownMenuItem onClick={() => handleMarkNoShow(booking.id)}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Marcar no asistio
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setBookingToCancel(booking)
                            setCancelDialogOpen(true)
                          }}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancelar reserva
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar reserva</DialogTitle>
            <DialogDescription>
              Cancelar la reserva de{' '}
              <span className="font-semibold">{bookingToCancel?.member?.full_name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Razon de cancelacion (opcional)</Label>
              <Textarea
                id="reason"
                placeholder="Ingresa la razon de cancelacion..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelDialogOpen(false)
                setCancellationReason('')
              }}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {isLoading ? 'Cancelando...' : 'Confirmar cancelacion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
