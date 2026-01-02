import { getPlans } from '@/actions/plan.actions'
import { PlansDataTable } from '@/components/plans'

export const metadata = {
  title: 'Planes | GymGo',
}

interface PageProps {
  searchParams: Promise<{
    search?: string
    page?: string
    pageSize?: string
    sortBy?: string
    sortDir?: 'asc' | 'desc'
    filter_billing_period?: string
    filter_is_active?: 'true' | 'false'
  }>
}

export default async function PlansPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = params.page ? parseInt(params.page) : 1
  const pageSize = params.pageSize ? parseInt(params.pageSize) : 20

  // Convert boolean filter
  const isActive = params.filter_is_active === 'true' ? true : params.filter_is_active === 'false' ? false : undefined

  const { data: plans, count, error } = await getPlans({
    query: params.search,
    billing_period: params.filter_billing_period,
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
        <h1 className="text-2xl font-bold tracking-tight">Planes de membresia</h1>
        <p className="text-muted-foreground">
          Gestiona los planes de membresia de tu gimnasio
        </p>
      </div>

      <PlansDataTable
        plans={plans || []}
        totalItems={count || 0}
      />
    </div>
  )
}
