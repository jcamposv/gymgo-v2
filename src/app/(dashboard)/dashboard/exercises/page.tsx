import { getExercises } from '@/actions/exercise.actions'
import { ExercisesDataTable } from '@/components/exercises'

export const metadata = {
  title: 'Biblioteca de Ejercicios | GymGo',
}

interface ExercisesPageProps {
  searchParams: Promise<{
    search?: string
    page?: string
    pageSize?: string
    sortBy?: string
    sortDir?: 'asc' | 'desc'
    filter_category?: string
    filter_difficulty?: string
  }>
}

export default async function ExercisesPage({ searchParams }: ExercisesPageProps) {
  const params = await searchParams
  const page = params.page ? parseInt(params.page) : 1
  const pageSize = params.pageSize ? parseInt(params.pageSize) : 20

  const { data: exercises, count, error } = await getExercises({
    query: params.search,
    category: params.filter_category,
    difficulty: params.filter_difficulty as 'beginner' | 'intermediate' | 'advanced' | undefined,
    page,
    per_page: pageSize,
    include_global: true,
    sort_by: params.sortBy,
    sort_dir: params.sortDir,
  })

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Biblioteca de Ejercicios</h1>
        <p className="text-muted-foreground">
          {count} ejercicios disponibles
        </p>
      </div>

      <ExercisesDataTable
        exercises={exercises || []}
        totalItems={count || 0}
      />
    </div>
  )
}
