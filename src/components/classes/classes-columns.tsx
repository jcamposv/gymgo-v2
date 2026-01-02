'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Eye,
  Pencil,
  Trash2,
  XCircle,
  Users,
  Clock,
  MapPin,
} from 'lucide-react'

import type { Tables } from '@/types/database.types'
import { classTypeLabels } from '@/schemas/class.schema'
import { deleteClass, cancelClass } from '@/actions/class.actions'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  DataTableColumnHeader,
  DataTableRowActions,
  StatusBadge,
} from '@/components/data-table'

type ClassItem = Tables<'classes'>

export const classColumns: ColumnDef<ClassItem>[] = [
  // Name & Type column
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Clase" />
    ),
    cell: ({ row }) => {
      const classItem = row.original
      return (
        <div>
          <div className="font-medium">{classItem.name}</div>
          {classItem.class_type && (
            <Badge variant="outline" className="mt-1">
              {classTypeLabels[classItem.class_type] ?? classItem.class_type}
            </Badge>
          )}
        </div>
      )
    },
  },
  // Schedule column
  {
    accessorKey: 'start_time',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Horario" />
    ),
    cell: ({ row }) => {
      const classItem = row.original
      return (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">
              {format(new Date(classItem.start_time), 'HH:mm', { locale: es })} -{' '}
              {format(new Date(classItem.end_time), 'HH:mm', { locale: es })}
            </div>
            <div className="text-sm text-muted-foreground">
              {format(new Date(classItem.start_time), 'EEEE d MMM', { locale: es })}
            </div>
          </div>
        </div>
      )
    },
  },
  // Instructor column
  {
    accessorKey: 'instructor_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Instructor" />
    ),
    cell: ({ row }) => {
      const instructor = row.getValue('instructor_name') as string | null
      return instructor ?? <span className="text-muted-foreground">Sin asignar</span>
    },
  },
  // Capacity column
  {
    accessorKey: 'current_bookings',
    header: 'Capacidad',
    cell: ({ row }) => {
      const classItem = row.original
      const current = classItem.current_bookings
      const max = classItem.max_capacity
      const percentage = (current / max) * 100

      const variant =
        percentage >= 90 ? 'error' : percentage >= 70 ? 'warning' : 'default'

      return (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <StatusBadge variant={variant}>
            {current}/{max}
          </StatusBadge>
        </div>
      )
    },
  },
  // Location column
  {
    accessorKey: 'location',
    header: 'Ubicacion',
    cell: ({ row }) => {
      const location = row.getValue('location') as string | null
      return location ? (
        <div className="flex items-center gap-1 text-sm">
          <MapPin className="h-3 w-3" />
          {location}
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  },
  // Status column
  {
    id: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const classItem = row.original
      if (classItem.is_cancelled) {
        return <StatusBadge variant="error">Cancelada</StatusBadge>
      }
      if (new Date(classItem.start_time) < new Date()) {
        return <StatusBadge variant="default">Finalizada</StatusBadge>
      }
      return <StatusBadge variant="success">Activa</StatusBadge>
    },
    filterFn: (row, id, value) => {
      const classItem = row.original
      if (value === 'cancelled') return classItem.is_cancelled
      if (value === 'finished') {
        return !classItem.is_cancelled && new Date(classItem.start_time) < new Date()
      }
      if (value === 'active') {
        return !classItem.is_cancelled && new Date(classItem.start_time) >= new Date()
      }
      return true
    },
  },
  // Actions column
  {
    id: 'actions',
    size: 50,
    cell: ({ row }) => <ClassRowActions classItem={row.original} />,
  },
]

function ClassRowActions({ classItem }: { classItem: ClassItem }) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const handleDelete = async () => {
    setIsLoading(true)
    const result = await deleteClass(classItem.id)
    setIsLoading(false)

    if (result.success) {
      setDeleteDialogOpen(false)
      router.refresh()
    }
  }

  const handleCancel = async () => {
    setIsLoading(true)
    const formData = new FormData()
    formData.set('cancellation_reason', cancelReason)

    const result = await cancelClass(classItem.id, { success: false, message: '' }, formData)
    setIsLoading(false)

    if (result.success) {
      setCancelDialogOpen(false)
      setCancelReason('')
      router.refresh()
    }
  }

  const actions = [
    {
      id: 'view',
      label: 'Ver detalles',
      icon: Eye,
      onClick: () => router.push(`/dashboard/classes/${classItem.id}`),
    },
    {
      id: 'edit',
      label: 'Editar',
      icon: Pencil,
      onClick: () => router.push(`/dashboard/classes/${classItem.id}/edit`),
    },
    {
      id: 'cancel',
      label: 'Cancelar clase',
      icon: XCircle,
      onClick: () => setCancelDialogOpen(true),
      hidden: classItem.is_cancelled,
    },
    {
      id: 'delete',
      label: 'Eliminar',
      icon: Trash2,
      onClick: () => setDeleteDialogOpen(true),
      variant: 'destructive' as const,
    },
  ]

  return (
    <>
      <DataTableRowActions row={classItem} actions={actions} />

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar clase</DialogTitle>
            <DialogDescription>
              Esta accion eliminara permanentemente la clase{' '}
              <span className="font-semibold">{classItem.name}</span> y todas
              las reservaciones asociadas. Esta accion no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar clase</DialogTitle>
            <DialogDescription>
              Se notificara a todos los miembros con reservacion que la clase ha sido cancelada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancel_reason">Razon de cancelacion (opcional)</Label>
              <Textarea
                id="cancel_reason"
                placeholder="Ej: Instructor enfermo, mantenimiento..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelDialogOpen(false)
                setCancelReason('')
              }}
              disabled={isLoading}
            >
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {isLoading ? 'Cancelando...' : 'Cancelar clase'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
