import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { getRoutine, getProgramDaysForStaff } from '@/actions/routine.actions'
import { Button } from '@/components/ui/button'
import { RoutineForm, ProgramForm } from '@/components/routines'
import type { ExerciseItem } from '@/schemas/routine.schema'

interface EditRoutinePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditRoutinePageProps) {
  const { id } = await params
  const { data: routine } = await getRoutine(id)
  return {
    title: routine ? `Editar ${routine.name} | GymGo` : 'Editar Rutina | GymGo',
  }
}

export default async function EditRoutinePage({ params }: EditRoutinePageProps) {
  const { id } = await params
  const { data: routine, error } = await getRoutine(id)

  if (error || !routine) {
    notFound()
  }

  // Check if this is a program (has days_per_week or workout_type is 'program')
  const isProgram = (routine.workout_type === 'program' || routine.days_per_week) && !routine.program_id

  if (isProgram) {
    // Fetch program days for editing
    const { data: programDays } = await getProgramDaysForStaff(id)

    const programForForm = {
      id: routine.id,
      name: routine.name,
      description: routine.description,
      durationWeeks: routine.duration_weeks || 8,
      daysPerWeek: routine.days_per_week || 3,
      isTemplate: routine.is_template,
      isActive: routine.is_active,
      assignedToMemberId: routine.assigned_to_member_id,
      days: (programDays || []).map(day => ({
        id: day.id,
        dayNumber: day.day_number || 1,
        name: day.name,
        focus: day.description || '',
        exercises: day.exercises || [],
      })),
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/routines/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Editar Programa</h1>
            <p className="text-muted-foreground">{routine.name}</p>
          </div>
        </div>

        <ProgramForm program={programForForm} mode="edit" />
      </div>
    )
  }

  // Regular routine (not a program)
  const routineForForm = {
    id: routine.id,
    name: routine.name,
    description: routine.description,
    workout_type: routine.workout_type,
    wod_type: routine.wod_type,
    wod_time_cap: routine.wod_time_cap,
    exercises: (routine.exercises as ExerciseItem[]) || [],
    assigned_to_member_id: routine.assigned_to_member_id,
    scheduled_date: routine.scheduled_date,
    is_template: routine.is_template,
    is_active: routine.is_active,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/routines/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Rutina</h1>
          <p className="text-muted-foreground">{routine.name}</p>
        </div>
      </div>

      <RoutineForm routine={routineForForm} mode="edit" />
    </div>
  )
}
