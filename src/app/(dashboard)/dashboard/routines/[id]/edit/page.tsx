import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { getRoutine } from '@/actions/routine.actions'
import { Button } from '@/components/ui/button'
import { RoutineForm } from '@/components/routines'
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

  // Transform the routine data to match the form interface
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
          <h1 className="text-3xl font-bold tracking-tight">Editar Rutina</h1>
          <p className="text-muted-foreground">{routine.name}</p>
        </div>
      </div>

      <RoutineForm routine={routineForForm} mode="edit" />
    </div>
  )
}
