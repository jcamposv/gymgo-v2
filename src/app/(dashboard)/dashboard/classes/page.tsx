import { getClasses } from '@/actions/class.actions'
import { ClassesDataTable } from '@/components/classes'

export const metadata = {
  title: 'Clases | GymGo',
}

interface PageProps {
  searchParams: Promise<{
    search?: string
    page?: string
    pageSize?: string
    sortBy?: string
    sortDir?: 'asc' | 'desc'
    filter_class_type?: string
    filter_status?: 'active' | 'cancelled' | 'finished'
  }>
}

export default async function ClassesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = params.page ? parseInt(params.page) : 1
  const pageSize = params.pageSize ? parseInt(params.pageSize) : 20

  const { data: classes, count, error } = await getClasses({
    query: params.search,
    class_type: params.filter_class_type,
    status: params.filter_status,
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
        <h1 className="text-2xl font-bold tracking-tight">Clases</h1>
        <p className="text-muted-foreground">
          Gestiona las clases y horarios de tu gimnasio
        </p>
      </div>

      <ClassesDataTable
        classes={classes || []}
        totalItems={count || 0}
      />
    </div>
  )
}
