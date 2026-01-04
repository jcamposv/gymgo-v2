'use client'

import { useRouter } from 'next/navigation'
import type { ColumnDef } from '@tanstack/react-table'
import { Calendar, Clock, User, MapPin, X } from 'lucide-react'

import type { BookingWithClass } from '@/actions/member-booking.actions'

import { Badge } from '@/components/ui/badge'
import {
  DataTable,
  DataTableColumnHeader,
  StatusBadge,
} from '@/components/data-table'
import { CancelReservationButton } from '@/components/member/cancel-reservation-button'

// =============================================================================
// TYPES
// =============================================================================

interface MemberBookingsTableProps {
  data: BookingWithClass[]
}

// =============================================================================
// STATUS HELPERS
// =============================================================================

function getStatusBadge(status: string) {
  switch (status) {
    case 'confirmed':
      return <StatusBadge variant="success" dot>Confirmada</StatusBadge>
    case 'waitlist':
      return <StatusBadge variant="warning" dot>Lista de espera</StatusBadge>
    default:
      return <StatusBadge variant="default">{status}</StatusBadge>
  }
}

// =============================================================================
// COLUMNS
// =============================================================================

const bookingsColumns: ColumnDef<BookingWithClass>[] = [
  // Class name column
  {
    id: 'class_name',
    accessorFn: (row) => row.class.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Clase" />
    ),
    cell: ({ row }) => {
      const booking = row.original
      return (
        <div>
          <div className="font-medium">{booking.class.name}</div>
          {booking.class.class_type && (
            <Badge variant="outline" className="text-xs mt-1">
              {booking.class.class_type}
            </Badge>
          )}
        </div>
      )
    },
  },
  // Date and time column
  {
    id: 'datetime',
    accessorFn: (row) => row.class.start_time,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fecha y hora" />
    ),
    cell: ({ row }) => {
      const booking = row.original
      const startDate = new Date(booking.class.start_time)
      const endDate = new Date(booking.class.end_time)
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            {startDate.toLocaleDateString('es-MX', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            {startDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            {' - '}
            {endDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      )
    },
  },
  // Instructor column
  {
    id: 'instructor',
    accessorFn: (row) => row.class.instructor_name,
    header: 'Instructor',
    cell: ({ row }) => {
      const instructor = row.original.class.instructor_name
      if (!instructor) return <span className="text-muted-foreground">-</span>
      return (
        <div className="flex items-center gap-1 text-sm">
          <User className="h-3 w-3 text-muted-foreground" />
          {instructor}
        </div>
      )
    },
  },
  // Location column
  {
    id: 'location',
    accessorFn: (row) => row.class.location,
    header: 'Ubicacion',
    cell: ({ row }) => {
      const location = row.original.class.location
      if (!location) return <span className="text-muted-foreground">-</span>
      return (
        <div className="flex items-center gap-1 text-sm">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          {location}
        </div>
      )
    },
  },
  // Status column
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const booking = row.original
      return (
        <div className="flex flex-col gap-1">
          {getStatusBadge(booking.status)}
          {booking.waitlist_position && (
            <span className="text-xs text-muted-foreground">
              Posicion #{booking.waitlist_position}
            </span>
          )}
        </div>
      )
    },
  },
  // Actions column
  {
    id: 'actions',
    size: 100,
    cell: ({ row }) => <BookingRowActions booking={row.original} />,
  },
]

// =============================================================================
// ROW ACTIONS
// =============================================================================

function BookingRowActions({ booking }: { booking: BookingWithClass }) {
  // Check if cancellation is allowed based on deadline
  const classStart = new Date(booking.class.start_time)
  const now = new Date()
  const deadlineHours = booking.class.cancellation_deadline_hours
  const deadlineTime = new Date(classStart.getTime() - deadlineHours * 60 * 60 * 1000)
  const canCancel = now < deadlineTime

  return (
    <CancelReservationButton
      bookingId={booking.id}
      className={booking.class.name}
      disabled={!canCancel}
      disabledReason={!canCancel ? `No puedes cancelar con menos de ${deadlineHours}h de anticipacion` : undefined}
    />
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function MemberBookingsTable({ data }: MemberBookingsTableProps) {
  return (
    <DataTable
      columns={bookingsColumns}
      data={data}
      mode="client"
      defaultPageSize={10}
      pageSizeOptions={[5, 10, 20]}
      sortable={true}
      defaultSort={[{ id: 'datetime', desc: false }]}
      emptyTitle="Sin reservas"
      emptyDescription="No tienes clases reservadas"
      getRowId={(row) => row.id}
    />
  )
}
