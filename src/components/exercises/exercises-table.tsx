'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Power,
  Copy,
  Globe,
} from 'lucide-react'

import { deleteExercise, toggleExerciseStatus, duplicateExercise } from '@/actions/exercise.actions'
import {
  categoryLabels,
  difficultyLabels,
  muscleGroupLabels,
} from '@/schemas/exercise.schema'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Exercise {
  id: string
  name: string
  description: string | null
  category: string | null
  muscle_groups: string[] | null
  equipment: string[] | null
  difficulty: string
  gif_url: string | null
  is_global: boolean
  is_active: boolean
}

interface ExercisesTableProps {
  exercises: Exercise[]
}

export function ExercisesTable({ exercises }: ExercisesTableProps) {
  const router = useRouter()

  const handleDelete = async (id: string) => {
    const result = await deleteExercise(id)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  const handleToggleStatus = async (id: string) => {
    const result = await toggleExerciseStatus(id)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  const handleDuplicate = async (id: string) => {
    const result = await duplicateExercise(id)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  if (exercises.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">No hay ejercicios</p>
        <p className="text-sm text-muted-foreground mt-1">
          Crea tu primer ejercicio para comenzar a armar rutinas
        </p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">Media</TableHead>
            <TableHead>Ejercicio</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Musculos</TableHead>
            <TableHead>Dificultad</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {exercises.map((exercise) => (
            <TableRow key={exercise.id}>
              <TableCell>
                {exercise.gif_url ? (
                  <img
                    src={exercise.gif_url}
                    alt={exercise.name}
                    className="w-12 h-12 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">N/A</span>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div>
                    <div className="font-medium flex items-center gap-1">
                      {exercise.name}
                      {exercise.is_global && (
                        <Globe className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    {exercise.description && (
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {exercise.description}
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {exercise.category ? (
                  <Badge variant="outline">
                    {categoryLabels[exercise.category] || exercise.category}
                  </Badge>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {exercise.muscle_groups?.slice(0, 2).map((muscle) => (
                    <Badge key={muscle} variant="secondary" className="text-xs">
                      {muscleGroupLabels[muscle] || muscle}
                    </Badge>
                  ))}
                  {exercise.muscle_groups && exercise.muscle_groups.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{exercise.muscle_groups.length - 2}
                    </Badge>
                  )}
                  {(!exercise.muscle_groups || exercise.muscle_groups.length === 0) && '-'}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    exercise.difficulty === 'beginner'
                      ? 'secondary'
                      : exercise.difficulty === 'intermediate'
                      ? 'default'
                      : 'destructive'
                  }
                >
                  {difficultyLabels[exercise.difficulty] || exercise.difficulty}
                </Badge>
              </TableCell>
              <TableCell>
                {exercise.is_global ? (
                  <Badge variant="outline">Global</Badge>
                ) : (
                  <Badge variant={exercise.is_active ? 'default' : 'secondary'}>
                    {exercise.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <AlertDialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/dashboard/exercises/${exercise.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalles
                      </DropdownMenuItem>
                      {!exercise.is_global && (
                        <DropdownMenuItem
                          onClick={() => router.push(`/dashboard/exercises/${exercise.id}/edit`)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleDuplicate(exercise.id)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicar
                      </DropdownMenuItem>
                      {!exercise.is_global && (
                        <>
                          <DropdownMenuItem onClick={() => handleToggleStatus(exercise.id)}>
                            <Power className="mr-2 h-4 w-4" />
                            {exercise.is_active ? 'Desactivar' : 'Activar'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Eliminar ejercicio</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta accion no se puede deshacer. Se eliminara el ejercicio
                        <strong> {exercise.name}</strong>.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(exercise.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
