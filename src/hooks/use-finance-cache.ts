'use client'

import { useSWRConfig } from 'swr'
import { financeKeyMatchers } from '@/lib/swr/keys'

// =============================================================================
// TYPES
// =============================================================================

export interface UseFinanceCacheReturn {
  /** Invalidate all finance-related cache entries */
  invalidateAll: () => void
  /** Invalidate only overview data */
  invalidateOverview: () => void
  /** Invalidate only payment data */
  invalidatePayments: () => void
  /** Invalidate only expense data */
  invalidateExpenses: () => void
  /** Invalidate only income data */
  invalidateIncome: () => void
  /** Invalidate overview and a specific data type */
  invalidateWithOverview: (type: 'payments' | 'expenses' | 'income') => void
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook for managing finance module cache invalidation.
 *
 * Use this hook when you need to manually invalidate cache entries,
 * for example after bulk operations or when receiving real-time updates.
 *
 * @example
 * ```tsx
 * const { invalidateAll, invalidateWithOverview } = useFinanceCache()
 *
 * // After a bulk import
 * invalidateAll()
 *
 * // After creating a payment
 * invalidateWithOverview('payments')
 * ```
 */
export function useFinanceCache(): UseFinanceCacheReturn {
  const { mutate } = useSWRConfig()

  const invalidateAll = () => {
    mutate(
      (key) => financeKeyMatchers.isFinanceKey(key),
      undefined,
      { revalidate: true }
    )
  }

  const invalidateOverview = () => {
    mutate(
      (key) => financeKeyMatchers.isOverviewKey(key),
      undefined,
      { revalidate: true }
    )
  }

  const invalidatePayments = () => {
    mutate(
      (key) => financeKeyMatchers.isPaymentKey(key),
      undefined,
      { revalidate: true }
    )
  }

  const invalidateExpenses = () => {
    mutate(
      (key) => financeKeyMatchers.isExpenseKey(key),
      undefined,
      { revalidate: true }
    )
  }

  const invalidateIncome = () => {
    mutate(
      (key) => financeKeyMatchers.isIncomeKey(key),
      undefined,
      { revalidate: true }
    )
  }

  const invalidateWithOverview = (type: 'payments' | 'expenses' | 'income') => {
    const matchers: Record<string, (key: unknown) => boolean> = {
      payments: financeKeyMatchers.isPaymentKey,
      expenses: financeKeyMatchers.isExpenseKey,
      income: financeKeyMatchers.isIncomeKey,
    }

    mutate(
      (key) =>
        financeKeyMatchers.isOverviewKey(key) || matchers[type](key),
      undefined,
      { revalidate: true }
    )
  }

  return {
    invalidateAll,
    invalidateOverview,
    invalidatePayments,
    invalidateExpenses,
    invalidateIncome,
    invalidateWithOverview,
  }
}

// =============================================================================
// UTILITY FUNCTIONS (for use outside React components)
// =============================================================================

/**
 * Clear all finance cache entries.
 * Can be called from anywhere (not just React components).
 *
 * @example
 * ```ts
 * // In a server action or utility function
 * import { clearFinanceCache } from '@/hooks/use-finance-cache'
 *
 * clearFinanceCache(mutate)
 * ```
 */
export function clearFinanceCache(
  mutate: (
    matcher: (key?: string) => boolean,
    data: undefined,
    opts: { revalidate: boolean }
  ) => void
) {
  mutate(
    (key) => financeKeyMatchers.isFinanceKey(key),
    undefined,
    { revalidate: false }
  )
}
