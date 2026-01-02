import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { getExercise } from '@/actions/exercise.actions'
import { Button } from '@/components/ui/button'
import { ExerciseForm } from '@/components/exercises'

interface EditExercisePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditExercisePageProps) {
  const { id } = await params
  const { data: exercise } = await getExercise(id)
  return {
    title: exercise ? `Editar ${exercise.name} | GymGo` : 'Editar Ejercicio | GymGo',
  }
}

export default async function EditExercisePage({ params }: EditExercisePageProps) {
  const { id } = await params
  const { data: exercise, error } = await getExercise(id)

  if (error || !exercise) {
    notFound()
  }

  // Can't edit global exercises
  if (exercise.is_global) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/exercises/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Ejercicio</h1>
          <p className="text-muted-foreground">{exercise.name}</p>
        </div>
      </div>

      <ExerciseForm exercise={exercise} mode="edit" />
    </div>
  )
}
