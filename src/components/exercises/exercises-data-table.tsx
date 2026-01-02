'use client'

import { useRouter } from 'next/navigation'
import { Plus, Dumbbell } from 'lucide-react'

import type { Tables } from '@/types/database.types'
import {
  categories,
  difficulties,
} from '@/schemas/exercise.schema'
import { DataTable, type FilterConfig } from '@/components/data-table'
import { exerciseColumns } from './exercises-columns'

interface ExercisesDataTableProps {
  exercises: Tables<'exercises'>[]
  totalItems: number
}

// Define filters for exercises
const exerciseFilters: FilterConfig[] = [
  {
    id: 'category',
    label: 'Categoria',
    type: 'select',
    options: categories.map((c) => ({ label: c.label, value: c.value })),
  },
  {
    id: 'difficulty',
    label: 'Dificultad',
    type: 'select',
    options: difficulties.map((d) => ({ label: d.label, value: d.value })),
  },
]

export function ExercisesDataTable({ exercises, totalItems }: ExercisesDataTableProps) {
  const router = useRouter()

  return (
    <DataTable
      columns={exerciseColumns}
      data={exercises}
      mode="server"
      totalItems={totalItems}
      defaultPageSize={20}
      searchable
      searchPlaceholder="Buscar ejercicios..."
      filters={exerciseFilters}
      primaryAction={{
        id: 'new',
        label: 'Nuevo ejercicio',
        icon: Plus,
        onClick: () => router.push('/dashboard/exercises/new'),
      }}
      emptyTitle="No hay ejercicios"
      emptyDescription="Crea tu primer ejercicio para comenzar a armar rutinas"
    />
  )
}
