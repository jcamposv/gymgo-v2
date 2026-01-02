import { getRoutines } from '@/actions/routine.actions'
import { RoutinesDataTable } from '@/components/routines'

export const metadata = {
  title: 'Rutinas | GymGo',
}

interface RoutinesPageProps {
  searchParams: Promise<{
    search?: string
    page?: string
    pageSize?: string
    sortBy?: string
    sortDir?: 'asc' | 'desc'
    filter_workout_type?: 'routine' | 'wod' | 'program'
    filter_is_template?: 'true' | 'false'
    filter_is_active?: 'true' | 'false'
  }>
}

export default async function RoutinesPage({ searchParams }: RoutinesPageProps) {
  const params = await searchParams
  const page = params.page ? parseInt(params.page) : 1
  const pageSize = params.pageSize ? parseInt(params.pageSize) : 20

  // Convert boolean filters
  const isTemplate = params.filter_is_template === 'true' ? true : params.filter_is_template === 'false' ? false : undefined
  const isActive = params.filter_is_active === 'true' ? true : params.filter_is_active === 'false' ? false : undefined

  const { data: routines, count, error } = await getRoutines({
    query: params.search,
    workout_type: params.filter_workout_type,
    is_template: isTemplate,
    is_active: isActive,
    page,
    per_page: pageSize,
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
        <h1 className="text-2xl font-bold tracking-tight">Rutinas</h1>
        <p className="text-muted-foreground">
          {count} rutina{count !== 1 ? 's' : ''} en total
        </p>
      </div>

      <RoutinesDataTable
        routines={routines || []}
        totalItems={count || 0}
      />
    </div>
  )
}
