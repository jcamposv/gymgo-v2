'use client'

import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

import type { WorkoutWithMember } from '@/actions/routine.actions'
import { workoutTypes } from '@/schemas/routine.schema'
import { DataTable, type FilterConfig } from '@/components/data-table'
import { routineColumns } from './routines-columns'

interface RoutinesDataTableProps {
  routines: WorkoutWithMember[]
  totalItems: number
}

// Define filters for routines
const routineFilters: FilterConfig[] = [
  {
    id: 'workout_type',
    label: 'Tipo',
    type: 'select',
    options: workoutTypes.map((t) => ({ label: t.label, value: t.value })),
  },
  {
    id: 'is_template',
    label: 'Categoria',
    type: 'select',
    options: [
      { label: 'Plantillas', value: 'true' },
      { label: 'Asignadas', value: 'false' },
    ],
  },
  {
    id: 'is_active',
    label: 'Estado',
    type: 'select',
    options: [
      { label: 'Activa', value: 'true' },
      { label: 'Inactiva', value: 'false' },
    ],
  },
]

export function RoutinesDataTable({ routines, totalItems }: RoutinesDataTableProps) {
  const router = useRouter()

  return (
    <DataTable
      columns={routineColumns}
      data={routines}
      mode="server"
      totalItems={totalItems}
      defaultPageSize={20}
      searchable
      searchPlaceholder="Buscar rutinas..."
      filters={routineFilters}
      primaryAction={{
        id: 'new',
        label: 'Nueva rutina',
        icon: Plus,
        onClick: () => router.push('/dashboard/routines/new'),
      }}
      emptyTitle="No hay rutinas"
      emptyDescription="Crea tu primera rutina para comenzar a asignarlas a tus miembros"
    />
  )
}
