import Link from 'next/link'
import { Plus, Dumbbell, Search } from 'lucide-react'

import { getExercises } from '@/actions/exercise.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ExercisesTable } from '@/components/exercises'

export const metadata = {
  title: 'Biblioteca de Ejercicios | GymGo',
}

interface ExercisesPageProps {
  searchParams: Promise<{
    query?: string
    category?: string
    difficulty?: string
    page?: string
  }>
}

export default async function ExercisesPage({ searchParams }: ExercisesPageProps) {
  const params = await searchParams
  const page = params.page ? parseInt(params.page) : 1

  const { data: exercises, count, error } = await getExercises({
    query: params.query,
    category: params.category,
    difficulty: params.difficulty as 'beginner' | 'intermediate' | 'advanced' | undefined,
    page,
    per_page: 20,
    include_global: true,
  })

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Biblioteca de Ejercicios</h1>
          <p className="text-muted-foreground">
            {count} ejercicios disponibles
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/exercises/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo ejercicio
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <form className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="query"
              placeholder="Buscar ejercicios..."
              defaultValue={params.query}
              className="pl-9"
            />
          </div>
        </form>
      </div>

      {exercises && exercises.length > 0 ? (
        <ExercisesTable exercises={exercises} />
      ) : (
        <div className="border rounded-lg p-12 text-center">
          <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-1">No hay ejercicios</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Crea tu primer ejercicio para comenzar a armar rutinas
          </p>
          <Button asChild>
            <Link href="/dashboard/exercises/new">
              <Plus className="mr-2 h-4 w-4" />
              Crear ejercicio
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
