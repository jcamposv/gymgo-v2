'use client'

import useSWR from 'swr'
import { useSWRConfig } from 'swr'
import { getReportSummary } from '@/actions/reports.actions'
import { reportKeys, financeKeyMatchers } from '@/lib/swr/keys'
import { FetcherError } from '@/lib/swr/fetcher'

// =============================================================================
// TYPES
// =============================================================================

export interface ReportSummary {
  period: string
  totalMembers: number
  activeMembers: number
  newMembers: number
  totalCheckIns: number
  totalClasses: number
  totalRevenue: number
  avgCheckInsPerDay: number
  popularClassTypes: { type: string; count: number }[]
  membersByStatus: { status: string; count: number }[]
  revenueByMonth: { month: string; revenue: number }[]
}

export type ReportPeriod = 'week' | 'month' | 'year'

export interface UseReportSummaryOptions {
  /** Initial data from server-side rendering */
  fallbackData?: ReportSummary
  /** Enable/disable the hook */
  enabled?: boolean
  /** Revalidate on window focus */
  revalidateOnFocus?: boolean
}

export interface UseReportSummaryReturn {
  data: ReportSummary | null
  isLoading: boolean
  isValidating: boolean
  error: Error | null
  mutate: () => Promise<ReportSummary | null | undefined>
}

// =============================================================================
// FETCHER
// =============================================================================

async function fetchReportSummary(key: string): Promise<ReportSummary | null> {
  const [, params] = JSON.parse(key) as [string, { startDate: string; endDate: string }]

  // Calculate period from date range
  const startDate = new Date(params.startDate)
  const endDate = new Date(params.endDate)
  const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

  let period: ReportPeriod = 'month'
  if (diffDays <= 7) {
    period = 'week'
  } else if (diffDays >= 365) {
    period = 'year'
  }

  const result = await getReportSummary(period)

  if (result.error) {
    throw new FetcherError(result.error, 400)
  }

  return result.data
}

// =============================================================================
// MAIN HOOK
// =============================================================================

/**
 * Hook for fetching report summary data with SWR.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useReportSummary({
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31',
 * })
 *
 * if (isLoading) return <Skeleton />
 * if (error) return <Error />
 *
 * return <ReportCards data={data} />
 * ```
 */
export function useReportSummary(
  params: { startDate: string; endDate: string },
  options: UseReportSummaryOptions = {}
): UseReportSummaryReturn {
  const {
    fallbackData,
    enabled = true,
    revalidateOnFocus = false,
  } = options

  const swrKey = enabled ? reportKeys.summary(params) : null

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<ReportSummary | null>(
    swrKey,
    fetchReportSummary,
    {
      fallbackData: fallbackData ?? undefined,
      revalidateOnFocus,
      keepPreviousData: true,
      dedupingInterval: 10000, // Reports change less frequently
    }
  )

  return {
    data: data ?? null,
    isLoading,
    isValidating,
    error: error ?? null,
    mutate,
  }
}

// =============================================================================
// INVALIDATION UTILITIES
// =============================================================================

/**
 * Invalidate all report-related cache entries.
 * Useful after mutations that affect report data.
 */
export function useInvalidateReports() {
  const { mutate } = useSWRConfig()

  return () => {
    mutate(
      (key) => financeKeyMatchers.isReportKey(key),
      undefined,
      { revalidate: true }
    )
  }
}
