import { getExpenses } from '@/actions/finance.actions'
import { ExpensesDataTable } from '@/components/finances/expenses-data-table'
import { getCurrentLocationId } from '@/lib/auth/get-current-location'

export const metadata = {
  title: 'Gastos | GymGo',
}

interface PageProps {
  searchParams: Promise<{
    search?: string
    page?: string
    pageSize?: string
    sortBy?: string
    sortDir?: 'asc' | 'desc'
    filter_category?: string
  }>
}

export default async function ExpensesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = params.page ? parseInt(params.page) : 1
  const pageSize = params.pageSize ? parseInt(params.pageSize) : 20

  // Get current location from cookie for filtering
  const locationId = await getCurrentLocationId()

  const { data: expenses, count, error } = await getExpenses({
    query: params.search,
    category: params.filter_category,
    location_id: locationId || undefined,
    include_org_wide: true, // Include org-wide expenses when filtering by location
    page,
    per_page: pageSize,
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
        <h1 className="text-2xl font-bold tracking-tight">Gastos</h1>
        <p className="text-muted-foreground">
          Historial de gastos del gimnasio
        </p>
      </div>

      <ExpensesDataTable
        expenses={expenses || []}
        totalItems={count || 0}
      />
    </div>
  )
}
