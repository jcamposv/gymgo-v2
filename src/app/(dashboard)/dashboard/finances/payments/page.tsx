import { getPayments } from '@/actions/finance.actions'
import { PaymentsDataTable } from '@/components/finances/payments-data-table'

export const metadata = {
  title: 'Pagos | GymGo',
}

interface PageProps {
  searchParams: Promise<{
    search?: string
    page?: string
    pageSize?: string
    sortBy?: string
    sortDir?: 'asc' | 'desc'
    filter_status?: string
    filter_payment_method?: string
  }>
}

export default async function PaymentsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = params.page ? parseInt(params.page) : 1
  const pageSize = params.pageSize ? parseInt(params.pageSize) : 20

  const { data: payments, count, error } = await getPayments({
    query: params.search,
    status: params.filter_status,
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
        <h1 className="text-2xl font-bold tracking-tight">Pagos</h1>
        <p className="text-muted-foreground">
          Historial de pagos de membresias
        </p>
      </div>

      <PaymentsDataTable
        payments={payments || []}
        totalItems={count || 0}
      />
    </div>
  )
}
