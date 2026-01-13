import { getIncome } from '@/actions/finance.actions'
import { IncomeDataTable } from '@/components/finances/income-data-table'

export const metadata = {
  title: 'Ingresos | GymGo',
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

export default async function IncomePage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = params.page ? parseInt(params.page) : 1
  const pageSize = params.pageSize ? parseInt(params.pageSize) : 20

  const { data: income, count, error } = await getIncome({
    query: params.search,
    category: params.filter_category,
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
        <h1 className="text-2xl font-bold tracking-tight">Otros Ingresos</h1>
        <p className="text-muted-foreground">
          Ingresos adicionales (productos, servicios, etc.)
        </p>
      </div>

      <IncomeDataTable
        income={income || []}
        totalItems={count || 0}
      />
    </div>
  )
}
