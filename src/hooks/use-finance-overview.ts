'use client'

import useSWR from 'swr'
import { getFinanceOverview, type FinanceOverview } from '@/actions/finance.actions'
import { financeKeys, type FinanceOverviewParams } from '@/lib/swr/keys'
import { FetcherError } from '@/lib/swr/fetcher'

// =============================================================================
// TYPES
// =============================================================================

export interface UseFinanceOverviewOptions {
  /** Initial data from server-side rendering */
  fallbackData?: FinanceOverview | null
  /** Disable automatic revalidation */
  revalidateOnFocus?: boolean
  /** Keep previous data while revalidating */
  keepPreviousData?: boolean
}

export interface UseFinanceOverviewReturn {
  data: FinanceOverview | null
  isLoading: boolean
  isValidating: boolean
  error: Error | null
  mutate: () => Promise<FinanceOverview | null | undefined>
}

// =============================================================================
// FETCHER
// =============================================================================

async function fetchFinanceOverview(key: string): Promise<FinanceOverview | null> {
  const [, params] = JSON.parse(key) as [string, FinanceOverviewParams]

  const result = await getFinanceOverview({
    startDate: params.startDate,
    endDate: params.endDate,
    compare: params.compare,
    compareStartDate: params.compareStartDate,
    compareEndDate: params.compareEndDate,
  })

  if (result.error) {
    throw new FetcherError(result.error, 400)
  }

  return result.data ?? null
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook for fetching finance overview data with SWR.
 *
 * Features:
 * - Automatic deduplication (5s window)
 * - Caching with stable keys
 * - Fallback data support for SSR
 * - keepPreviousData for smooth transitions
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useFinanceOverview({
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31',
 *   compare: true,
 * })
 * ```
 */
export function useFinanceOverview(
  params: FinanceOverviewParams,
  options: UseFinanceOverviewOptions = {}
): UseFinanceOverviewReturn {
  const {
    fallbackData,
    revalidateOnFocus = false,
    keepPreviousData = true,
  } = options

  // Generate stable cache key
  const swrKey = financeKeys.overview(params)

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<FinanceOverview | null>(
    swrKey,
    fetchFinanceOverview,
    {
      fallbackData: fallbackData ?? undefined,
      revalidateOnFocus,
      keepPreviousData,
      dedupingInterval: 5000,
      // Don't retry on permission errors
      shouldRetryOnError: (error) => {
        if (error instanceof FetcherError) {
          return error.status >= 500
        }
        return true
      },
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
// PREFETCH UTILITY
// =============================================================================

/**
 * Prefetch finance overview data.
 * Useful for warming the cache before navigation.
 *
 * @example
 * ```ts
 * // In a layout or parent component
 * await prefetchFinanceOverview({ startDate: '2024-01-01', endDate: '2024-01-31' })
 * ```
 */
export async function prefetchFinanceOverview(
  params: FinanceOverviewParams
): Promise<FinanceOverview | null> {
  const result = await getFinanceOverview({
    startDate: params.startDate,
    endDate: params.endDate,
    compare: params.compare,
    compareStartDate: params.compareStartDate,
    compareEndDate: params.compareEndDate,
  })

  return result.data ?? null
}
