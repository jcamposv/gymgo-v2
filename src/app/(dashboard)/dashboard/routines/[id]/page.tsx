import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Pencil, Calendar, User, Dumbbell } from 'lucide-react'

import { getRoutine, getProgramDaysForStaff, type ProgramDayWithExercises, type ExerciseItemWithMedia } from '@/actions/routine.actions'
import { workoutTypeLabels, wodTypeLabels } from '@/schemas/routine.schema'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { AssignDialog, ExerciseCard } from '@/components/routines'

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

  // Check if this is a program (workout_type is 'program' OR has days_per_week, and not a child day)
  const isProgram = (routine.workout_type === 'program' || routine.days_per_week) && !routine.program_id

  // Fetch program days if this is a program
  let programDays: ProgramDayWithExercises[] = []
  if (isProgram) {
    const { data: days } = await getProgramDaysForStaff(id)
    programDays = days || []
  }

  const exercises = (routine.exercises as ExerciseItemWithMedia[]) || []

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
                {routine.workout_type ? (workoutTypeLabels[routine.workout_type] || routine.workout_type) : 'Sin tipo'}
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

      {/* Program Days (if this is a program) */}
      {isProgram && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-lime-600" />
              Dias del programa ({programDays.length})
            </CardTitle>
            <CardDescription>
              {routine.duration_weeks} semanas - {routine.days_per_week} dias por semana
            </CardDescription>
          </CardHeader>
          <CardContent>
            {programDays.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No hay dias configurados en este programa
              </p>
            ) : (
              <Accordion type="multiple" className="w-full">
                {programDays.map((day) => (
                  <AccordionItem key={day.id} value={day.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-lime-100 text-lime-700 font-bold text-sm">
                          {day.day_number}
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{day.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {day.exercises.length} ejercicios
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        {day.exercises.map((exercise, index) => (
                          <ExerciseCard
                            key={`${exercise.exercise_id}-${index}`}
                            exercise={exercise}
                            index={index}
                            variant="compact"
                          />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      )}

      {/* Regular Exercises (for non-program routines) */}
      {!isProgram && (
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
                  <ExerciseCard
                    key={`${exercise.exercise_id}-${index}`}
                    exercise={exercise}
                    index={index}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
