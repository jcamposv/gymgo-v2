'use client'

import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import { useSWRConfig } from 'swr'
import {
  getPayments,
  createPayment,
  deletePayment,
  type Payment,
} from '@/actions/finance.actions'
import { financeKeys, financeKeyMatchers, type FinanceListParams } from '@/lib/swr/keys'
import { FetcherError } from '@/lib/swr/fetcher'
import type { PaymentFormData } from '@/schemas/finance.schema'

// =============================================================================
// TYPES
// =============================================================================

export interface UsePaymentsOptions {
  /** Initial data from server-side rendering */
  fallbackData?: { payments: Payment[]; count: number }
  /** Enable/disable the hook */
  enabled?: boolean
}

export interface UsePaymentsReturn {
  payments: Payment[]
  count: number
  isLoading: boolean
  isValidating: boolean
  error: Error | null
  mutate: () => Promise<{ payments: Payment[]; count: number } | undefined>
}

export interface UseCreatePaymentReturn {
  trigger: (data: PaymentFormData) => Promise<Payment | null>
  isMutating: boolean
  error: Error | null
}

export interface UseDeletePaymentReturn {
  trigger: (id: string) => Promise<boolean>
  isMutating: boolean
  error: Error | null
}

// =============================================================================
// FETCHER
// =============================================================================

interface PaymentsResult {
  payments: Payment[]
  count: number
}

async function fetchPayments(key: string): Promise<PaymentsResult> {
  const [, params] = JSON.parse(key) as [string, FinanceListParams]

  const result = await getPayments({
    query: params.search,
    status: params.status as 'pending' | 'paid' | 'failed' | 'refunded' | undefined,
    startDate: params.startDate,
    endDate: params.endDate,
    page: params.page,
    per_page: params.pageSize,
  })

  if (result.error) {
    throw new FetcherError(result.error, 400)
  }

  return {
    payments: result.data ?? [],
    count: result.count ?? 0,
  }
}

// =============================================================================
// LIST HOOK
// =============================================================================

/**
 * Hook for fetching payments list with SWR.
 *
 * @example
 * ```tsx
 * const { payments, count, isLoading } = usePayments({
 *   page: 1,
 *   pageSize: 20,
 *   status: 'paid',
 * })
 * ```
 */
export function usePayments(
  params: FinanceListParams = {},
  options: UsePaymentsOptions = {}
): UsePaymentsReturn {
  const { fallbackData, enabled = true } = options

  const swrKey = enabled ? financeKeys.payments(params) : null

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<PaymentsResult>(
    swrKey,
    fetchPayments,
    {
      fallbackData,
      revalidateOnFocus: false,
      keepPreviousData: true,
      dedupingInterval: 5000,
    }
  )

  return {
    payments: data?.payments ?? [],
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
 * Hook for creating a new payment with automatic cache invalidation.
 *
 * @example
 * ```tsx
 * const { trigger, isMutating } = useCreatePayment()
 *
 * const handleSubmit = async (data: PaymentFormData) => {
 *   const payment = await trigger(data)
 *   if (payment) {
 *     toast.success('Pago registrado')
 *   }
 * }
 * ```
 */
export function useCreatePayment(): UseCreatePaymentReturn {
  const { mutate } = useSWRConfig()

  const { trigger, isMutating, error } = useSWRMutation(
    'create-payment',
    async (_key: string, { arg }: { arg: PaymentFormData }) => {
      const result = await createPayment(arg)

      if (!result.success) {
        throw new FetcherError(result.message ?? 'Error al crear pago', 400)
      }

      return result.data as Payment
    },
    {
      onSuccess: () => {
        // Invalidate all payment and overview keys
        mutate(
          (key) =>
            financeKeyMatchers.isPaymentKey(key) ||
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
 * Hook for deleting a payment with automatic cache invalidation.
 *
 * @example
 * ```tsx
 * const { trigger, isMutating } = useDeletePayment()
 *
 * const handleDelete = async (id: string) => {
 *   const success = await trigger(id)
 *   if (success) {
 *     toast.success('Pago eliminado')
 *   }
 * }
 * ```
 */
export function useDeletePayment(): UseDeletePaymentReturn {
  const { mutate } = useSWRConfig()

  const { trigger, isMutating, error } = useSWRMutation(
    'delete-payment',
    async (_key: string, { arg }: { arg: string }) => {
      const result = await deletePayment(arg)

      if (!result.success) {
        throw new FetcherError(result.message ?? 'Error al eliminar pago', 400)
      }

      return true
    },
    {
      onSuccess: () => {
        // Invalidate all payment and overview keys
        mutate(
          (key) =>
            financeKeyMatchers.isPaymentKey(key) ||
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
 * Invalidate all payment-related cache entries.
 * Useful after bulk operations or external changes.
 */
export function useInvalidatePayments() {
  const { mutate } = useSWRConfig()

  return () => {
    mutate(
      (key) => financeKeyMatchers.isPaymentKey(key),
      undefined,
      { revalidate: true }
    )
  }
}
