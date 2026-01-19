'use client'

import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { ColumnDef } from '@tanstack/react-table'
import { Trophy, CalendarDays, Dumbbell, FileText, Gauge } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { DataTable, DataTableColumnHeader, type FilterConfig } from '@/components/data-table'
import type { ExerciseBenchmark } from '@/types/benchmark.types'
import { formatBenchmarkValue } from '@/types/benchmark.types'

// =============================================================================
// TYPES
// =============================================================================

interface PRHistoryTableProps {
  benchmarks: ExerciseBenchmark[]
  totalItems: number
  isLoading?: boolean
  exercises?: { id: string; name: string; category: string | null }[]
  onExerciseFilterChange?: (exerciseId: string | null) => void
  selectedExerciseId?: string | null
}

// =============================================================================
// COLUMN DEFINITIONS
// =============================================================================

const prHistoryColumns: ColumnDef<ExerciseBenchmark>[] = [
  // Date column
  {
    accessorKey: 'achieved_at',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
    cell: ({ row }) => {
      const date = row.getValue('achieved_at') as string
      return (
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {format(parseISO(date), "d MMM yyyy", { locale: es })}
          </span>
        </div>
      )
    },
  },
  // Exercise column
  {
    accessorKey: 'exercise',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Ejercicio" />,
    cell: ({ row }) => {
      const exercise = row.original.exercise
      return (
        <div className="flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium text-sm">{exercise?.name || 'Ejercicio'}</p>
            {exercise?.category && (
              <p className="text-xs text-muted-foreground">{exercise.category}</p>
            )}
          </div>
        </div>
      )
    },
  },
  // Value column
  {
    accessorKey: 'value',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Valor" />,
    cell: ({ row }) => {
      const benchmark = row.original
      const isPR = benchmark.is_pr
      return (
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">
            {formatBenchmarkValue(benchmark.value, benchmark.unit)}
          </span>
          {isPR && (
            <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
              <Trophy className="h-3 w-3 mr-1" />
              PR
            </Badge>
          )}
        </div>
      )
    },
  },
  // Reps column
  {
    accessorKey: 'reps',
    header: 'Reps',
    cell: ({ row }) => {
      const reps = row.getValue('reps') as number | null
      return reps ? (
        <span className="text-sm">{reps} reps</span>
      ) : (
        <span className="text-sm text-muted-foreground">-</span>
      )
    },
  },
  // RPE column
  {
    accessorKey: 'rpe',
    header: 'RPE',
    cell: ({ row }) => {
      const rpe = row.getValue('rpe') as number | null
      if (!rpe) return <span className="text-sm text-muted-foreground">-</span>

      // Color code RPE
      let color = 'text-green-600'
      if (rpe >= 8) color = 'text-red-600'
      else if (rpe >= 6) color = 'text-yellow-600'

      return (
        <div className="flex items-center gap-1">
          <Gauge className="h-3 w-3 text-muted-foreground" />
          <span className={`text-sm font-medium ${color}`}>{rpe}</span>
        </div>
      )
    },
  },
  // Notes column
  {
    accessorKey: 'notes',
    header: 'Notas',
    cell: ({ row }) => {
      const notes = row.getValue('notes') as string | null
      if (!notes) return <span className="text-sm text-muted-foreground">-</span>

      return (
        <div className="flex items-center gap-1 max-w-[200px]">
          <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="text-sm text-muted-foreground truncate" title={notes}>
            {notes}
          </span>
        </div>
      )
    },
  },
]

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PRHistoryTable({
  benchmarks,
  totalItems,
  isLoading,
  exercises = [],
  selectedExerciseId,
}: PRHistoryTableProps) {
  // Build exercise filter options
  const exerciseFilterOptions = useMemo(() => {
    return exercises.map((e) => ({
      label: e.name,
      value: e.id,
    }))
  }, [exercises])

  // Define filters (exercise filter)
  const filters: FilterConfig[] = useMemo(() => {
    if (exerciseFilterOptions.length === 0) return []

    return [
      {
        id: 'exercise_id',
        label: 'Ejercicio',
        type: 'select',
        options: exerciseFilterOptions,
        placeholder: 'Todos los ejercicios',
      },
    ]
  }, [exerciseFilterOptions])

  return (
    <DataTable
      columns={prHistoryColumns}
      data={benchmarks}
      mode="server"
      totalItems={totalItems}
      defaultPageSize={10}
      pageSizeOptions={[5, 10, 20]}
      loading={isLoading}
      filters={filters.length > 0 ? filters : undefined}
      emptyTitle="No hay registros de PRs"
      emptyDescription="Registra el primer PR para ver el historial"
    />
  )
}
