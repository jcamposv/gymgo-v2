'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Eye,
  Pencil,
  Trash2,
  Power,
  Copy,
  UserPlus,
  Calendar,
} from 'lucide-react'

import type { WorkoutWithMember } from '@/actions/routine.actions'
import { deleteRoutine, toggleRoutineStatus, duplicateRoutine } from '@/actions/routine.actions'
import { workoutTypeLabels, wodTypeLabels, type ExerciseItem } from '@/schemas/routine.schema'

import { Badge } from '@/components/ui/badge'
import {
  DataTableColumnHeader,
  DataTableRowActions,
  StatusBadge,
} from '@/components/data-table'

export const routineColumns: ColumnDef<WorkoutWithMember>[] = [
  // Name column
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Rutina" />
    ),
    cell: ({ row }) => {
      const routine = row.original
      return (
        <div>
          <div className="font-medium flex items-center gap-2">
            {routine.name}
            {routine.is_template && (
              <Badge variant="outline" className="text-xs">
                Plantilla
              </Badge>
            )}
          </div>
          {routine.description && (
            <div className="text-sm text-muted-foreground line-clamp-1 max-w-[250px]">
              {routine.description}
            </div>
          )}
        </div>
      )
    },
  },
  // Type column
  {
    accessorKey: 'workout_type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tipo" />
    ),
    cell: ({ row }) => {
      const routine = row.original
      return (
        <div className="flex flex-col gap-1">
          <Badge variant="secondary">
            {workoutTypeLabels[routine.workout_type] || routine.workout_type}
          </Badge>
          {routine.workout_type === 'wod' && routine.wod_type && (
            <span className="text-xs text-muted-foreground">
              {wodTypeLabels[routine.wod_type] || routine.wod_type}
              {routine.wod_time_cap && ` - ${routine.wod_time_cap} min`}
            </span>
          )}
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  // Exercises count column
  {
    id: 'exercises_count',
    header: 'Ejercicios',
    cell: ({ row }) => {
      const exercises = (row.original.exercises as ExerciseItem[]) || []
      return (
        <Badge variant="outline">
          {exercises.length} ejercicio{exercises.length !== 1 ? 's' : ''}
        </Badge>
      )
    },
  },
  // Assigned to column
  {
    id: 'assigned_to',
    header: 'Asignada a',
    cell: ({ row }) => {
      const routine = row.original
      if (routine.member) {
        return (
          <div className="text-sm">
            <p className="font-medium">{routine.member.full_name}</p>
            <p className="text-muted-foreground text-xs">{routine.member.email}</p>
          </div>
        )
      }
      return <span className="text-muted-foreground">-</span>
    },
  },
  // Scheduled date column
  {
    accessorKey: 'scheduled_date',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fecha" />
    ),
    cell: ({ row }) => {
      const date = row.getValue('scheduled_date') as string | null
      if (date) {
        return (
          <div className="flex items-center gap-1 text-sm">
            <Calendar className="h-3 w-3" />
            {new Date(date).toLocaleDateString('es-MX')}
          </div>
        )
      }
      return <span className="text-muted-foreground">-</span>
    },
  },
  // Status column
  {
    accessorKey: 'is_active',
    header: 'Estado',
    cell: ({ row }) => {
      const isActive = row.getValue('is_active') as boolean
      return (
        <StatusBadge variant={isActive ? 'success' : 'default'} dot>
          {isActive ? 'Activa' : 'Inactiva'}
        </StatusBadge>
      )
    },
  },
  // Actions column
  {
    id: 'actions',
    size: 50,
    cell: ({ row }) => <RoutineRowActions routine={row.original} />,
  },
]

function RoutineRowActions({ routine }: { routine: WorkoutWithMember }) {
  const router = useRouter()

  const handleDelete = async () => {
    const result = await deleteRoutine(routine.id)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  const handleToggleStatus = async () => {
    const result = await toggleRoutineStatus(routine.id)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  const handleDuplicate = async () => {
    const result = await duplicateRoutine(routine.id)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  const actions = [
    {
      id: 'view',
      label: 'Ver detalles',
      icon: Eye,
      onClick: () => router.push(`/dashboard/routines/${routine.id}`),
    },
    {
      id: 'edit',
      label: 'Editar',
      icon: Pencil,
      onClick: () => router.push(`/dashboard/routines/${routine.id}/edit`),
    },
    {
      id: 'duplicate',
      label: 'Duplicar',
      icon: Copy,
      onClick: handleDuplicate,
    },
    {
      id: 'assign',
      label: 'Asignar a miembro',
      icon: UserPlus,
      onClick: () => router.push(`/dashboard/routines/${routine.id}/assign`),
      hidden: !routine.is_template,
    },
    {
      id: 'toggle',
      label: routine.is_active ? 'Desactivar' : 'Activar',
      icon: Power,
      onClick: handleToggleStatus,
    },
    {
      id: 'delete',
      label: 'Eliminar',
      icon: Trash2,
      onClick: handleDelete,
      variant: 'destructive' as const,
    },
  ]

  return <DataTableRowActions row={routine} actions={actions} />
}
