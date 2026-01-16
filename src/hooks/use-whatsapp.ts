'use client'

import useSWR from 'swr'
import {
  getWhatsAppSettings,
  getWhatsAppTemplates,
  getDeliveryLogs,
} from '@/actions/whatsapp.actions'
import { whatsappKeys, type WhatsAppDeliveryLogParams } from '@/lib/swr/keys'
import { FetcherError } from '@/lib/swr/fetcher'
import type {
  GymWhatsAppSettings,
  WhatsAppTemplate,
  NotificationDeliveryLog,
  DeliveryLogFilters,
} from '@/types/whatsapp.types'

// =============================================================================
// TYPES
// =============================================================================

export interface UseWhatsAppSettingsOptions {
  fallbackData?: GymWhatsAppSettings | null
  revalidateOnFocus?: boolean
}

export interface UseWhatsAppSettingsReturn {
  data: GymWhatsAppSettings | null
  isLoading: boolean
  isValidating: boolean
  error: Error | null
  mutate: () => Promise<GymWhatsAppSettings | null | undefined>
}

export interface UseWhatsAppTemplatesOptions {
  fallbackData?: WhatsAppTemplate[]
  revalidateOnFocus?: boolean
}

export interface UseWhatsAppTemplatesReturn {
  data: WhatsAppTemplate[]
  isLoading: boolean
  isValidating: boolean
  error: Error | null
  mutate: () => Promise<WhatsAppTemplate[] | undefined>
}

export interface UseDeliveryLogsOptions {
  fallbackData?: NotificationDeliveryLog[]
  revalidateOnFocus?: boolean
  keepPreviousData?: boolean
}

export interface UseDeliveryLogsReturn {
  data: NotificationDeliveryLog[]
  total: number
  isLoading: boolean
  isValidating: boolean
  error: Error | null
  mutate: () => Promise<{ logs: NotificationDeliveryLog[]; total: number } | undefined>
}

// =============================================================================
// FETCHERS
// =============================================================================

async function fetchWhatsAppSettings(): Promise<GymWhatsAppSettings | null> {
  const result = await getWhatsAppSettings()

  if (result.error) {
    throw new FetcherError(result.error, 400)
  }

  return result.data ?? null
}

async function fetchWhatsAppTemplates(): Promise<WhatsAppTemplate[]> {
  const result = await getWhatsAppTemplates()

  if (result.error) {
    throw new FetcherError(result.error, 400)
  }

  return result.data ?? []
}

async function fetchDeliveryLogs(
  key: string
): Promise<{ logs: NotificationDeliveryLog[]; total: number }> {
  const [, params] = JSON.parse(key) as [string, WhatsAppDeliveryLogParams]

  const result = await getDeliveryLogs({
    channel: params.channel as DeliveryLogFilters['channel'],
    status: params.status as DeliveryLogFilters['status'],
    notification_type: params.notification_type,
    member_id: params.member_id,
    from_date: params.from_date,
    to_date: params.to_date,
    page: params.page,
    limit: params.limit,
  })

  if (result.error) {
    throw new FetcherError(result.error, 400)
  }

  return {
    logs: result.data ?? [],
    total: result.total ?? 0,
  }
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook for fetching WhatsApp settings with SWR.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useWhatsAppSettings()
 * ```
 */
export function useWhatsAppSettings(
  options: UseWhatsAppSettingsOptions = {}
): UseWhatsAppSettingsReturn {
  const { fallbackData, revalidateOnFocus = false } = options

  const swrKey = whatsappKeys.settings()

  const { data, error, isLoading, isValidating, mutate } =
    useSWR<GymWhatsAppSettings | null>(swrKey, fetchWhatsAppSettings, {
      fallbackData: fallbackData ?? undefined,
      revalidateOnFocus,
      dedupingInterval: 5000,
      shouldRetryOnError: (error) => {
        if (error instanceof FetcherError) {
          return error.status >= 500
        }
        return true
      },
    })

  return {
    data: data ?? null,
    isLoading,
    isValidating,
    error: error ?? null,
    mutate,
  }
}

/**
 * Hook for fetching WhatsApp templates with SWR.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useWhatsAppTemplates()
 * ```
 */
export function useWhatsAppTemplates(
  options: UseWhatsAppTemplatesOptions = {}
): UseWhatsAppTemplatesReturn {
  const { fallbackData, revalidateOnFocus = false } = options

  const swrKey = whatsappKeys.templates()

  const { data, error, isLoading, isValidating, mutate } = useSWR<
    WhatsAppTemplate[]
  >(swrKey, fetchWhatsAppTemplates, {
    fallbackData: fallbackData ?? undefined,
    revalidateOnFocus,
    dedupingInterval: 5000,
    shouldRetryOnError: (error) => {
      if (error instanceof FetcherError) {
        return error.status >= 500
      }
      return true
    },
  })

  return {
    data: data ?? [],
    isLoading,
    isValidating,
    error: error ?? null,
    mutate,
  }
}

/**
 * Hook for fetching delivery logs with SWR.
 *
 * @example
 * ```tsx
 * const { data, total, isLoading, error } = useDeliveryLogs({
 *   channel: 'whatsapp',
 *   status: 'delivered',
 *   page: 1,
 *   limit: 20,
 * })
 * ```
 */
export function useDeliveryLogs(
  params: WhatsAppDeliveryLogParams = {},
  options: UseDeliveryLogsOptions = {}
): UseDeliveryLogsReturn {
  const {
    fallbackData,
    revalidateOnFocus = false,
    keepPreviousData = true,
  } = options

  const swrKey = whatsappKeys.deliveryLogs(params)

  const { data, error, isLoading, isValidating, mutate } = useSWR<{
    logs: NotificationDeliveryLog[]
    total: number
  }>(swrKey, fetchDeliveryLogs, {
    fallbackData: fallbackData ? { logs: fallbackData, total: 0 } : undefined,
    revalidateOnFocus,
    keepPreviousData,
    dedupingInterval: 5000,
    shouldRetryOnError: (error) => {
      if (error instanceof FetcherError) {
        return error.status >= 500
      }
      return true
    },
  })

  return {
    data: data?.logs ?? [],
    total: data?.total ?? 0,
    isLoading,
    isValidating,
    error: error ?? null,
    mutate,
  }
}
