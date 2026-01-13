'use client'

import { Loader2 } from 'lucide-react'

import type { FinanceOverview } from '@/actions/finance.actions'
import { useFinanceDateRange, useFinanceOverview } from '@/hooks'
import { FinanceDateToolbar } from '@/components/finances/finance-date-toolbar'
import { FinanceOverviewCards } from '@/components/finances'

interface FinancesOverviewSectionProps {
  initialData: FinanceOverview | null
}

export function FinancesOverviewSection({ initialData }: FinancesOverviewSectionProps) {
  const { fromISO, toISO, compare, previousPeriod, periodLabel } = useFinanceDateRange()

  const { data, error, isLoading, isValidating } = useFinanceOverview(
    {
      startDate: fromISO,
      endDate: toISO,
      compare,
      compareStartDate: previousPeriod?.from.toISOString(),
      compareEndDate: previousPeriod?.to.toISOString(),
    },
    {
      fallbackData: initialData,
      keepPreviousData: true, // Smooth transitions when changing dates
    }
  )

  // Only show loading on initial load, not during revalidation
  const isInitialLoading = isLoading && !data
  const isPending = isLoading || isValidating

  return (
    <div className="space-y-6">
      {/* Date toolbar */}
      <FinanceDateToolbar loading={isPending} />

      {/* Period indicator */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando datos de: <span className="font-medium text-foreground">{periodLabel}</span>
        </p>
        {isValidating && !isInitialLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Actualizando...
          </div>
        )}
      </div>

      {/* Content */}
      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
          <p className="text-destructive">{error.message}</p>
        </div>
      ) : isInitialLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : data ? (
        <FinanceOverviewCards data={data} loading={isValidating} />
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No hay datos disponibles para este periodo</p>
        </div>
      )}
    </div>
  )
}
