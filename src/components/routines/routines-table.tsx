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
  UserPlus,
  Dumbbell,
  Calendar,
} from 'lucide-react'

import { deleteRoutine, toggleRoutineStatus, duplicateRoutine } from '@/actions/routine.actions'
import { workoutTypeLabels, wodTypeLabels, type ExerciseItem } from '@/schemas/routine.schema'
import type { Json } from '@/types/database.types'

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

interface Member {
  id: string
  full_name: string
  email: string
}

interface Routine {
  id: string
  name: string
  description: string | null
  workout_type: string
  wod_type: string | null
  wod_time_cap: number | null
  exercises: Json
  assigned_to_member_id: string | null
  scheduled_date: string | null
  is_template: boolean
  is_active: boolean
  created_at: string
  member?: Member | null
}

interface RoutinesTableProps {
  routines: Routine[]
}

export function RoutinesTable({ routines }: RoutinesTableProps) {
  const router = useRouter()

  const handleDelete = async (id: string) => {
    const result = await deleteRoutine(id)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  const handleToggleStatus = async (id: string) => {
    const result = await toggleRoutineStatus(id)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  const handleDuplicate = async (id: string) => {
    const result = await duplicateRoutine(id)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  if (routines.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No hay rutinas creadas</p>
        <p className="text-sm text-muted-foreground mt-1">
          Crea tu primera rutina para comenzar a asignarlas a tus miembros
        </p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rutina</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Ejercicios</TableHead>
            <TableHead>Asignada a</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {routines.map((routine) => {
            const exercises = (routine.exercises as ExerciseItem[]) || []
            return (
              <TableRow key={routine.id}>
                <TableCell>
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
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {routine.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {exercises.length} ejercicio{exercises.length !== 1 ? 's' : ''}
                  </Badge>
                </TableCell>
                <TableCell>
                  {routine.member ? (
                    <div className="text-sm">
                      <p className="font-medium">{routine.member.full_name}</p>
                      <p className="text-muted-foreground text-xs">{routine.member.email}</p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {routine.scheduled_date ? (
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      {new Date(routine.scheduled_date).toLocaleDateString('es-MX')}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={routine.is_active ? 'default' : 'secondary'}>
                    {routine.is_active ? 'Activa' : 'Inactiva'}
                  </Badge>
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
                          onClick={() => router.push(`/dashboard/routines/${routine.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/dashboard/routines/${routine.id}/edit`)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(routine.id)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicar
                        </DropdownMenuItem>
                        {routine.is_template && (
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/routines/${routine.id}/assign`)}
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Asignar a miembro
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleToggleStatus(routine.id)}>
                          <Power className="mr-2 h-4 w-4" />
                          {routine.is_active ? 'Desactivar' : 'Activar'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar rutina</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta accion no se puede deshacer. Se eliminara la rutina
                          <strong> {routine.name}</strong>.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(routine.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
