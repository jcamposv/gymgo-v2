'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { Calendar, Clock, User, MapPin, CheckCircle2, XCircle } from 'lucide-react'

import type { BookingWithClass } from '@/actions/member-booking.actions'

import { Badge } from '@/components/ui/badge'
import {
  DataTable,
  DataTableColumnHeader,
  StatusBadge,
} from '@/components/data-table'

// =============================================================================
// TYPES
// =============================================================================

interface MemberClassHistoryTableProps {
  data: BookingWithClass[]
}

// =============================================================================
// STATUS HELPERS
// =============================================================================

function getAttendanceStatus(booking: BookingWithClass) {
  if (booking.checked_in_at || booking.status === 'attended') {
    return (
      <StatusBadge variant="success" dot>
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Asistio
      </StatusBadge>
    )
  }
  if (booking.status === 'no_show') {
    return (
      <StatusBadge variant="error" dot>
        <XCircle className="h-3 w-3 mr-1" />
        No asistio
      </StatusBadge>
    )
  }
  // Confirmed but class already passed - likely no_show
  return (
    <StatusBadge variant="default">
      Pendiente
    </StatusBadge>
  )
}

// =============================================================================
// COLUMNS
// =============================================================================

const historyColumns: ColumnDef<BookingWithClass>[] = [
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
              year: 'numeric',
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
  // Attendance status column
  {
    id: 'attendance',
    header: 'Asistencia',
    cell: ({ row }) => getAttendanceStatus(row.original),
  },
  // Check-in time column
  {
    id: 'checked_in_at',
    accessorKey: 'checked_in_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Check-in" />
    ),
    cell: ({ row }) => {
      const checkedInAt = row.original.checked_in_at
      if (!checkedInAt) return <span className="text-muted-foreground">-</span>
      return (
        <div className="text-sm text-muted-foreground">
          {new Date(checkedInAt).toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      )
    },
  },
]

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function MemberClassHistoryTable({ data }: MemberClassHistoryTableProps) {
  return (
    <DataTable
      columns={historyColumns}
      data={data}
      mode="client"
      defaultPageSize={10}
      pageSizeOptions={[5, 10, 20]}
      sortable={true}
      defaultSort={[{ id: 'datetime', desc: true }]}
      emptyTitle="Sin historial"
      emptyDescription="Aun no tienes historial de clases"
      getRowId={(row) => row.id}
    />
  )
}
