'use client'

import { useRouter } from 'next/navigation'
import { Plus, Dumbbell, Play } from 'lucide-react'

import type { Tables } from '@/types/database.types'
import {
  categories,
  difficulties,
} from '@/schemas/exercise.schema'
import { DataTable, type FilterConfig } from '@/components/data-table'
import type { MobileCardConfig } from '@/components/data-table/types'
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

type Exercise = Tables<'exercises'>

const exerciseMobileCardConfig: MobileCardConfig<Exercise> = {
  titleField: 'name',
  primaryFields: ['category', 'muscle_groups'],
  renderAvatar: (row) => {
    if (row.thumbnail_url) {
      return (
        <img
          src={row.thumbnail_url}
          alt={row.name}
          className="w-12 h-12 object-cover rounded"
        />
      )
    }
    if (row.gif_url) {
      return (
        <img
          src={row.gif_url}
          alt={row.name}
          className="w-12 h-12 object-cover rounded"
        />
      )
    }
    if (row.video_url) {
      return (
        <div className="relative w-12 h-12 bg-muted rounded flex items-center justify-center">
          <Play className="h-5 w-5 text-muted-foreground" />
        </div>
      )
    }
    return (
      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
        <Dumbbell className="h-5 w-5 text-muted-foreground" />
      </div>
    )
  },
}

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
      mobileCardConfig={exerciseMobileCardConfig}
      onRowClick={(exercise) => router.push(`/dashboard/exercises/${exercise.id}`)}
    />
  )
}
