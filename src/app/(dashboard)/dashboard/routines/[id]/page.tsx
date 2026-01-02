import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Pencil, Calendar, User, Clock, Dumbbell } from 'lucide-react'

import { getRoutine } from '@/actions/routine.actions'
import { workoutTypeLabels, wodTypeLabels, type ExerciseItem } from '@/schemas/routine.schema'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AssignDialog } from '@/components/routines'

interface RoutinePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: RoutinePageProps) {
  const { id } = await params
  const { data: routine } = await getRoutine(id)
  return {
    title: routine ? `${routine.name} | GymGo` : 'Rutina | GymGo',
  }
}

export default async function RoutinePage({ params }: RoutinePageProps) {
  const { id } = await params
  const { data: routine, error } = await getRoutine(id)

  if (error || !routine) {
    notFound()
  }

  const exercises = (routine.exercises as ExerciseItem[]) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/routines">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{routine.name}</h1>
              {routine.is_template && (
                <Badge variant="outline">Plantilla</Badge>
              )}
              <Badge variant={routine.is_active ? 'default' : 'secondary'}>
                {routine.is_active ? 'Activa' : 'Inactiva'}
              </Badge>
            </div>
            {routine.description && (
              <p className="text-muted-foreground">{routine.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {routine.is_template && (
            <AssignDialog routineId={routine.id} routineName={routine.name} />
          )}
          <Button asChild>
            <Link href={`/dashboard/routines/${routine.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {workoutTypeLabels[routine.workout_type] || routine.workout_type}
              </span>
            </div>
            {routine.workout_type === 'wod' && routine.wod_type && (
              <p className="text-sm text-muted-foreground mt-1">
                {wodTypeLabels[routine.wod_type] || routine.wod_type}
                {routine.wod_time_cap && ` - ${routine.wod_time_cap} min`}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Asignada a
            </CardTitle>
          </CardHeader>
          <CardContent>
            {routine.member ? (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{routine.member.full_name}</p>
                  <p className="text-sm text-muted-foreground">{routine.member.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Sin asignar</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fecha programada
            </CardTitle>
          </CardHeader>
          <CardContent>
            {routine.scheduled_date ? (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {new Date(routine.scheduled_date).toLocaleDateString('es-MX', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            ) : (
              <p className="text-muted-foreground">Sin fecha programada</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ejercicios ({exercises.length})</CardTitle>
          <CardDescription>
            Lista de ejercicios en esta rutina
          </CardDescription>
        </CardHeader>
        <CardContent>
          {exercises.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No hay ejercicios en esta rutina
            </p>
          ) : (
            <div className="space-y-4">
              {exercises.map((exercise, index) => (
                <div
                  key={`${exercise.exercise_id}-${index}`}
                  className="flex items-start gap-4 p-4 border rounded-lg"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{exercise.exercise_name}</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {exercise.sets && (
                        <Badge variant="outline">
                          {exercise.sets} series
                        </Badge>
                      )}
                      {exercise.reps && (
                        <Badge variant="outline">
                          {exercise.reps} reps
                        </Badge>
                      )}
                      {exercise.weight && (
                        <Badge variant="outline">
                          {exercise.weight}
                        </Badge>
                      )}
                      {exercise.rest_seconds && (
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          {exercise.rest_seconds}s descanso
                        </Badge>
                      )}
                      {exercise.tempo && (
                        <Badge variant="secondary">
                          Tempo: {exercise.tempo}
                        </Badge>
                      )}
                    </div>
                    {exercise.notes && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {exercise.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
