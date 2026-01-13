'use client'

import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import { useSWRConfig } from 'swr'
import {
  getIncome,
  createIncome,
  deleteIncome,
  type Income,
} from '@/actions/finance.actions'
import { financeKeys, financeKeyMatchers, type FinanceListParams } from '@/lib/swr/keys'
import { FetcherError } from '@/lib/swr/fetcher'
import type { IncomeFormData } from '@/schemas/finance.schema'

// =============================================================================
// TYPES
// =============================================================================

export interface UseIncomeOptions {
  /** Initial data from server-side rendering */
  fallbackData?: { income: Income[]; count: number }
  /** Enable/disable the hook */
  enabled?: boolean
}

export interface UseIncomeReturn {
  income: Income[]
  count: number
  isLoading: boolean
  isValidating: boolean
  error: Error | null
  mutate: () => Promise<{ income: Income[]; count: number } | undefined>
}

export interface UseCreateIncomeReturn {
  trigger: (data: IncomeFormData) => Promise<Income | null>
  isMutating: boolean
  error: Error | null
}

export interface UseDeleteIncomeReturn {
  trigger: (id: string) => Promise<boolean>
  isMutating: boolean
  error: Error | null
}

// =============================================================================
// FETCHER
// =============================================================================

interface IncomeResult {
  income: Income[]
  count: number
}

async function fetchIncome(key: string): Promise<IncomeResult> {
  const [, params] = JSON.parse(key) as [string, FinanceListParams]

  const result = await getIncome({
    query: params.search,
    category: params.category,
    startDate: params.startDate,
    endDate: params.endDate,
    page: params.page,
    per_page: params.pageSize,
  })

  if (result.error) {
    throw new FetcherError(result.error, 400)
  }

  return {
    income: result.data ?? [],
    count: result.count ?? 0,
  }
}

// =============================================================================
// LIST HOOK
// =============================================================================

/**
 * Hook for fetching income list with SWR.
 *
 * @example
 * ```tsx
 * const { income, count, isLoading } = useIncome({
 *   page: 1,
 *   pageSize: 20,
 *   category: 'services',
 * })
 * ```
 */
export function useIncome(
  params: FinanceListParams = {},
  options: UseIncomeOptions = {}
): UseIncomeReturn {
  const { fallbackData, enabled = true } = options

  const swrKey = enabled ? financeKeys.income(params) : null

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<IncomeResult>(
    swrKey,
    fetchIncome,
    {
      fallbackData,
      revalidateOnFocus: false,
      keepPreviousData: true,
      dedupingInterval: 5000,
    }
  )

  return {
    income: data?.income ?? [],
    count: data?.count ?? 0,
    isLoading,
    isValidating,
    error: error ?? null,
    mutate,
  }
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

/**
 * Hook for creating a new income entry with automatic cache invalidation.
 *
 * @example
 * ```tsx
 * const { trigger, isMutating } = useCreateIncome()
 *
 * const handleSubmit = async (data: IncomeFormData) => {
 *   const income = await trigger(data)
 *   if (income) {
 *     toast.success('Ingreso registrado')
 *   }
 * }
 * ```
 */
export function useCreateIncome(): UseCreateIncomeReturn {
  const { mutate } = useSWRConfig()

  const { trigger, isMutating, error } = useSWRMutation(
    'create-income',
    async (_key: string, { arg }: { arg: IncomeFormData }) => {
      const result = await createIncome(arg)

      if (!result.success) {
        throw new FetcherError(result.message ?? 'Error al crear ingreso', 400)
      }

      return result.data as Income
    },
    {
      onSuccess: () => {
        // Invalidate all income and overview keys
        mutate(
          (key) =>
            financeKeyMatchers.isIncomeKey(key) ||
            financeKeyMatchers.isOverviewKey(key),
          undefined,
          { revalidate: true }
        )
      },
    }
  )

  return {
    trigger,
    isMutating,
    error: error ?? null,
  }
}

/**
 * Hook for deleting an income entry with automatic cache invalidation.
 *
 * @example
 * ```tsx
 * const { trigger, isMutating } = useDeleteIncome()
 *
 * const handleDelete = async (id: string) => {
 *   const success = await trigger(id)
 *   if (success) {
 *     toast.success('Ingreso eliminado')
 *   }
 * }
 * ```
 */
export function useDeleteIncome(): UseDeleteIncomeReturn {
  const { mutate } = useSWRConfig()

  const { trigger, isMutating, error } = useSWRMutation(
    'delete-income',
    async (_key: string, { arg }: { arg: string }) => {
      const result = await deleteIncome(arg)

      if (!result.success) {
        throw new FetcherError(result.message ?? 'Error al eliminar ingreso', 400)
      }

      return true
    },
    {
      onSuccess: () => {
        // Invalidate all income and overview keys
        mutate(
          (key) =>
            financeKeyMatchers.isIncomeKey(key) ||
            financeKeyMatchers.isOverviewKey(key),
          undefined,
          { revalidate: true }
        )
      },
    }
  )

  return {
    trigger,
    isMutating,
    error: error ?? null,
  }
}

// =============================================================================
// INVALIDATION UTILITIES
// =============================================================================

/**
 * Invalidate all income-related cache entries.
 * Useful after bulk operations or external changes.
 */
export function useInvalidateIncome() {
  const { mutate } = useSWRConfig()

  return () => {
    mutate(
      (key) => financeKeyMatchers.isIncomeKey(key),
      undefined,
      { revalidate: true }
    )
  }
}
