'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Pencil, Trash2, Power, Copy, Globe, Play } from 'lucide-react'

import type { Tables } from '@/types/database.types'
import {
  categoryLabels,
  difficultyLabels,
  muscleGroupLabels,
} from '@/schemas/exercise.schema'
import {
  deleteExercise,
  toggleExerciseStatus,
  duplicateExercise,
} from '@/actions/exercise.actions'

import { Badge } from '@/components/ui/badge'
import {
  DataTableColumnHeader,
  DataTableRowActions,
  StatusBadge,
} from '@/components/data-table'

type Exercise = Tables<'exercises'>

export const exerciseColumns: ColumnDef<Exercise>[] = [
  // Media column - Priority: thumbnail_url > gif_url > video placeholder > N/A
  {
    id: 'media',
    header: 'Media',
    size: 60,
    enableSorting: false,
    cell: ({ row }) => {
      const exercise = row.original

      // Priority 1: thumbnail_url (always preferred)
      if (exercise.thumbnail_url) {
        return (
          <img
            src={exercise.thumbnail_url}
            alt={exercise.name}
            className="w-12 h-12 object-cover rounded"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        )
      }

      // Priority 2: gif_url (image/gif)
      if (exercise.gif_url) {
        return (
          <img
            src={exercise.gif_url}
            alt={exercise.name}
            className="w-12 h-12 object-cover rounded"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        )
      }

      // Priority 3: video_url exists - show video placeholder with badge
      if (exercise.video_url) {
        return (
          <div className="relative w-12 h-12 bg-muted rounded flex items-center justify-center">
            <Play className="h-5 w-5 text-muted-foreground" />
            <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] px-1 rounded">
              Video
            </div>
          </div>
        )
      }

      // Fallback: No media
      return (
        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
          <span className="text-xs text-muted-foreground">N/A</span>
        </div>
      )
    },
  },
  // Name column
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ejercicio" />
    ),
    cell: ({ row }) => {
      const exercise = row.original
      return (
        <div className="flex items-center gap-2">
          <div>
            <div className="font-medium flex items-center gap-1">
              {exercise.name}
              {exercise.is_global && (
                <Globe className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
            {exercise.description && (
              <div className="text-sm text-muted-foreground line-clamp-1 max-w-[250px]">
                {exercise.description}
              </div>
            )}
          </div>
        </div>
      )
    },
  },
  // Category column
  {
    accessorKey: 'category',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Categoria" />
    ),
    cell: ({ row }) => {
      const category = row.getValue('category') as string | null
      return category ? (
        <Badge variant="outline">
          {categoryLabels[category] || category}
        </Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  // Muscle groups column
  {
    accessorKey: 'muscle_groups',
    header: 'Musculos',
    enableSorting: false,
    cell: ({ row }) => {
      const muscles = row.getValue('muscle_groups') as string[] | null
      if (!muscles || muscles.length === 0) {
        return <span className="text-muted-foreground">-</span>
      }
      return (
        <div className="flex flex-wrap gap-1">
          {muscles.slice(0, 2).map((muscle) => (
            <Badge key={muscle} variant="secondary" className="text-xs">
              {muscleGroupLabels[muscle] || muscle}
            </Badge>
          ))}
          {muscles.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{muscles.length - 2}
            </Badge>
          )}
        </div>
      )
    },
  },
  // Difficulty column
  {
    accessorKey: 'difficulty',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Dificultad" />
    ),
    cell: ({ row }) => {
      const difficulty = row.getValue('difficulty') as string
      const variant =
        difficulty === 'beginner'
          ? 'success'
          : difficulty === 'intermediate'
          ? 'warning'
          : 'error'
      return (
        <StatusBadge variant={variant}>
          {difficultyLabels[difficulty] || difficulty}
        </StatusBadge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  // Status column
  {
    accessorKey: 'is_active',
    header: 'Estado',
    cell: ({ row }) => {
      const exercise = row.original
      if (exercise.is_global) {
        return <Badge variant="outline">Global</Badge>
      }
      return (
        <StatusBadge variant={exercise.is_active ? 'success' : 'default'} dot>
          {exercise.is_active ? 'Activo' : 'Inactivo'}
        </StatusBadge>
      )
    },
  },
  // Actions column
  {
    id: 'actions',
    size: 50,
    cell: ({ row }) => <ExerciseRowActions exercise={row.original} />,
  },
]

function ExerciseRowActions({ exercise }: { exercise: Exercise }) {
  const router = useRouter()

  const handleDelete = async () => {
    const result = await deleteExercise(exercise.id)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  const handleToggleStatus = async () => {
    const result = await toggleExerciseStatus(exercise.id)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  const handleDuplicate = async () => {
    const result = await duplicateExercise(exercise.id)
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
      onClick: () => router.push(`/dashboard/exercises/${exercise.id}`),
    },
    {
      id: 'edit',
      label: 'Editar',
      icon: Pencil,
      onClick: () => router.push(`/dashboard/exercises/${exercise.id}/edit`),
      hidden: exercise.is_global ?? false,
    },
    {
      id: 'duplicate',
      label: 'Duplicar',
      icon: Copy,
      onClick: handleDuplicate,
    },
    {
      id: 'toggle',
      label: exercise.is_active ? 'Desactivar' : 'Activar',
      icon: Power,
      onClick: handleToggleStatus,
      hidden: exercise.is_global ?? false,
    },
    {
      id: 'delete',
      label: 'Eliminar',
      icon: Trash2,
      onClick: handleDelete,
      variant: 'destructive' as const,
      hidden: exercise.is_global ?? false,
    },
  ]

  return <DataTableRowActions row={exercise} actions={actions} />
}
