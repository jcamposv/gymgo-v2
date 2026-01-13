'use client'

import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import { useSWRConfig } from 'swr'
import {
  getExpenses,
  createExpense,
  deleteExpense,
  type Expense,
} from '@/actions/finance.actions'
import { financeKeys, financeKeyMatchers, type FinanceListParams } from '@/lib/swr/keys'
import { FetcherError } from '@/lib/swr/fetcher'
import type { ExpenseFormData } from '@/schemas/finance.schema'

// =============================================================================
// TYPES
// =============================================================================

export interface UseExpensesOptions {
  /** Initial data from server-side rendering */
  fallbackData?: { expenses: Expense[]; count: number }
  /** Enable/disable the hook */
  enabled?: boolean
}

export interface UseExpensesReturn {
  expenses: Expense[]
  count: number
  isLoading: boolean
  isValidating: boolean
  error: Error | null
  mutate: () => Promise<{ expenses: Expense[]; count: number } | undefined>
}

export interface UseCreateExpenseReturn {
  trigger: (data: ExpenseFormData) => Promise<Expense | null>
  isMutating: boolean
  error: Error | null
}

export interface UseDeleteExpenseReturn {
  trigger: (id: string) => Promise<boolean>
  isMutating: boolean
  error: Error | null
}

// =============================================================================
// FETCHER
// =============================================================================

interface ExpensesResult {
  expenses: Expense[]
  count: number
}

async function fetchExpenses(key: string): Promise<ExpensesResult> {
  const [, params] = JSON.parse(key) as [string, FinanceListParams]

  const result = await getExpenses({
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
    expenses: result.data ?? [],
    count: result.count ?? 0,
  }
}

// =============================================================================
// LIST HOOK
// =============================================================================

/**
 * Hook for fetching expenses list with SWR.
 *
 * @example
 * ```tsx
 * const { expenses, count, isLoading } = useExpenses({
 *   page: 1,
 *   pageSize: 20,
 *   category: 'utilities',
 * })
 * ```
 */
export function useExpenses(
  params: FinanceListParams = {},
  options: UseExpensesOptions = {}
): UseExpensesReturn {
  const { fallbackData, enabled = true } = options

  const swrKey = enabled ? financeKeys.expenses(params) : null

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<ExpensesResult>(
    swrKey,
    fetchExpenses,
    {
      fallbackData,
      revalidateOnFocus: false,
      keepPreviousData: true,
      dedupingInterval: 5000,
    }
  )

  return {
    expenses: data?.expenses ?? [],
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
 * Hook for creating a new expense with automatic cache invalidation.
 *
 * @example
 * ```tsx
 * const { trigger, isMutating } = useCreateExpense()
 *
 * const handleSubmit = async (data: ExpenseFormData) => {
 *   const expense = await trigger(data)
 *   if (expense) {
 *     toast.success('Gasto registrado')
 *   }
 * }
 * ```
 */
export function useCreateExpense(): UseCreateExpenseReturn {
  const { mutate } = useSWRConfig()

  const { trigger, isMutating, error } = useSWRMutation(
    'create-expense',
    async (_key: string, { arg }: { arg: ExpenseFormData }) => {
      const result = await createExpense(arg)

      if (!result.success) {
        throw new FetcherError(result.message ?? 'Error al crear gasto', 400)
      }

      return result.data as Expense
    },
    {
      onSuccess: () => {
        // Invalidate all expense and overview keys
        mutate(
          (key) =>
            financeKeyMatchers.isExpenseKey(key) ||
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
 * Hook for deleting an expense with automatic cache invalidation.
 *
 * @example
 * ```tsx
 * const { trigger, isMutating } = useDeleteExpense()
 *
 * const handleDelete = async (id: string) => {
 *   const success = await trigger(id)
 *   if (success) {
 *     toast.success('Gasto eliminado')
 *   }
 * }
 * ```
 */
export function useDeleteExpense(): UseDeleteExpenseReturn {
  const { mutate } = useSWRConfig()

  const { trigger, isMutating, error } = useSWRMutation(
    'delete-expense',
    async (_key: string, { arg }: { arg: string }) => {
      const result = await deleteExpense(arg)

      if (!result.success) {
        throw new FetcherError(result.message ?? 'Error al eliminar gasto', 400)
      }

      return true
    },
    {
      onSuccess: () => {
        // Invalidate all expense and overview keys
        mutate(
          (key) =>
            financeKeyMatchers.isExpenseKey(key) ||
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
 * Invalidate all expense-related cache entries.
 * Useful after bulk operations or external changes.
 */
export function useInvalidateExpenses() {
  const { mutate } = useSWRConfig()

  return () => {
    mutate(
      (key) => financeKeyMatchers.isExpenseKey(key),
      undefined,
      { revalidate: true }
    )
  }
}
