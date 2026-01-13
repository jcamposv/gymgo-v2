import { Suspense } from 'react'
import Link from 'next/link'
import { Plus, CreditCard, Receipt, TrendingUp, Loader2 } from 'lucide-react'

import { getFinanceOverview } from '@/actions/finance.actions'
import { Button } from '@/components/ui/button'
import { PermissionGate } from '@/components/shared/permission-gate'
import { FinancesOverviewSection } from './finances-overview-section'

export const metadata = {
  title: 'Finanzas | GymGo',
}

interface PageProps {
  searchParams: Promise<{
    view?: string
    from?: string
    to?: string
    compare?: string
  }>
}

export default async function FinancesPage({ searchParams }: PageProps) {
  const params = await searchParams

  // Calculate initial date range (default to current month)
  const now = new Date()
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

  const startDate = params.from ? new Date(params.from).toISOString() : defaultFrom
  const endDate = params.to ? new Date(params.to).toISOString() : defaultTo
  const compare = params.compare === '1'

  // Calculate comparison period if needed
  let compareStartDate: string | undefined
  let compareEndDate: string | undefined

  if (compare) {
    const duration = new Date(endDate).getTime() - new Date(startDate).getTime()
    const prevEnd = new Date(new Date(startDate).getTime() - 1)
    const prevStart = new Date(prevEnd.getTime() - duration)
    compareStartDate = prevStart.toISOString()
    compareEndDate = prevEnd.toISOString()
  }

  // Fetch initial data on server
  const { data: initialOverview } = await getFinanceOverview({
    startDate,
    endDate,
    compare,
    compareStartDate,
    compareEndDate,
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finanzas</h1>
          <p className="text-muted-foreground">
            Resumen financiero de tu gimnasio
          </p>
        </div>
        <div className="flex gap-2">
          <PermissionGate permission="create_payments">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/finances/payments/new">
                <CreditCard className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Registrar pago</span>
                <span className="sm:hidden">Pago</span>
              </Link>
            </Button>
          </PermissionGate>
          <PermissionGate permission="create_expenses">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/finances/expenses/new">
                <Receipt className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Registrar gasto</span>
                <span className="sm:hidden">Gasto</span>
              </Link>
            </Button>
          </PermissionGate>
        </div>
      </div>

      <PermissionGate
        permission="view_gym_finances"
        fallback={
          <div className="rounded-lg border border-dashed p-8 text-center">
            <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Acceso restringido</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              No tienes permisos para ver el resumen financiero.
              Contacta al administrador si necesitas acceso.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <PermissionGate permission="create_payments">
                <Button asChild>
                  <Link href="/dashboard/finances/payments/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar pago
                  </Link>
                </Button>
              </PermissionGate>
              <PermissionGate permission="create_expenses">
                <Button asChild variant="outline">
                  <Link href="/dashboard/finances/expenses/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar gasto
                  </Link>
                </Button>
              </PermissionGate>
            </div>
          </div>
        }
      >
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <FinancesOverviewSection initialData={initialOverview} />
        </Suspense>
      </PermissionGate>
    </div>
  )
}
