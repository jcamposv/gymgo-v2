'use client'

import { useRouter } from 'next/navigation'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Calendar, Dumbbell, Clock } from 'lucide-react'

import type { Tables } from '@/types/database.types'
import { workoutTypeLabels, type ExerciseItem } from '@/schemas/routine.schema'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DataTable,
  DataTableColumnHeader,
  StatusBadge,
} from '@/components/data-table'

// =============================================================================
// TYPES
// =============================================================================

type Workout = Tables<'workouts'>

interface MemberWorkoutsHistoryTableProps {
  data: Workout[]
}

// =============================================================================
// COLUMNS
// =============================================================================

const historyColumns: ColumnDef<Workout>[] = [
  // Name column
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Rutina" />
    ),
    cell: ({ row }) => {
      const workout = row.original
      const exercises = (workout.exercises as ExerciseItem[]) || []
      return (
        <div>
          <div className="font-medium flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
            {workout.name}
          </div>
          {workout.description && (
            <div className="text-sm text-muted-foreground line-clamp-1 max-w-[250px]">
              {workout.description}
            </div>
          )}
          <div className="text-xs text-muted-foreground mt-1">
            {exercises.length} ejercicio{exercises.length !== 1 ? 's' : ''}
          </div>
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
      const type = row.getValue('workout_type') as string
      return (
        <Badge variant="secondary">
          {workoutTypeLabels[type] || type}
        </Badge>
      )
    },
  },
  // Status column
  {
    id: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const workout = row.original
      // Historical routines are always inactive
      return (
        <StatusBadge variant="default" dot>
          Finalizada
        </StatusBadge>
      )
    },
  },
  // Scheduled date column
  {
    accessorKey: 'scheduled_date',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fecha programada" />
    ),
    cell: ({ row }) => {
      const date = row.getValue('scheduled_date') as string | null
      if (date) {
        return (
          <div className="flex items-center gap-1 text-sm">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            {new Date(date).toLocaleDateString('es-MX', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </div>
        )
      }
      return <span className="text-muted-foreground">-</span>
    },
  },
  // Updated at (end date proxy)
  {
    accessorKey: 'updated_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fecha de finalizacion" />
    ),
    cell: ({ row }) => {
      const date = row.getValue('updated_at') as string
      return (
        <div className="flex items-center gap-1 text-sm">
          <Clock className="h-3 w-3 text-muted-foreground" />
          {new Date(date).toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </div>
      )
    },
  },
  // Actions column
  {
    id: 'actions',
    size: 80,
    cell: ({ row }) => <HistoryRowActions workout={row.original} />,
  },
]

// =============================================================================
// ROW ACTIONS
// =============================================================================

function HistoryRowActions({ workout }: { workout: Workout }) {
  const router = useRouter()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.push(`/member/workouts/${workout.id}`)}
    >
      <Eye className="h-4 w-4 mr-1" />
      Ver
    </Button>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function MemberWorkoutsHistoryTable({ data }: MemberWorkoutsHistoryTableProps) {
  const router = useRouter()

  return (
    <DataTable
      columns={historyColumns}
      data={data}
      mode="client"
      defaultPageSize={10}
      pageSizeOptions={[5, 10, 20]}
      sortable={true}
      defaultSort={[{ id: 'updated_at', desc: true }]}
      emptyTitle="Sin historial"
      emptyDescription="Aun no tienes rutinas en tu historial"
      onRowClick={(row) => router.push(`/member/workouts/${row.id}`)}
      getRowId={(row) => row.id}
    />
  )
}
