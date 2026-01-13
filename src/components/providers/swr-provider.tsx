'use client'

import { SWRConfig } from 'swr'
import { toast } from 'sonner'
import { isPermissionError } from '@/lib/swr/fetcher'

/**
 * Default fetcher for API routes (not used for server actions).
 * Server actions have their own fetchers defined in hooks.
 */
async function defaultFetcher(url: string) {
  const res = await fetch(url)

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'An error occurred' }))
    throw new Error(error.message)
  }

  return res.json()
}

/**
 * SWR Provider with optimized configuration for GymGo.
 *
 * Configuration strategy:
 * - dedupingInterval: 5000ms - Prevents duplicate requests within 5 seconds
 * - revalidateOnFocus: false - Dashboards don't need aggressive revalidation
 * - revalidateIfStale: true - Stale data is revalidated in background
 * - shouldRetryOnError: Custom logic to avoid retrying permission errors
 * - errorRetryCount: 2 - Limit retries for server errors
 * - errorRetryInterval: 3000ms - Wait 3s between retries
 * - keepPreviousData: true - Smoother UX when params change
 * - onError: Centralized error handling with toast notifications
 */
export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: defaultFetcher,

        // =================================================================
        // DEDUPLICATION & CACHING
        // =================================================================

        // Prevent duplicate requests within 5 seconds
        dedupingInterval: 5000,

        // Keep previous data while fetching new data (smoother UX)
        keepPreviousData: true,

        // =================================================================
        // REVALIDATION STRATEGY
        // =================================================================

        // Don't revalidate when window regains focus (dashboards)
        revalidateOnFocus: false,

        // Don't revalidate when browser regains connection
        revalidateOnReconnect: false,

        // Do revalidate stale data in background
        revalidateIfStale: true,

        // Don't revalidate on mount if data exists
        revalidateOnMount: undefined, // Let each hook decide

        // =================================================================
        // ERROR HANDLING
        // =================================================================

        // Custom retry logic - don't retry permission errors
        shouldRetryOnError: (error) => {
          // Don't retry 4xx errors (client errors, permissions)
          if (isPermissionError(error)) {
            return false
          }

          // Only retry server errors (5xx)
          if (error instanceof Error) {
            const message = error.message.toLowerCase()
            if (
              message.includes('not found') ||
              message.includes('validation') ||
              message.includes('invalid')
            ) {
              return false
            }
          }

          return true
        },

        // Limit retry attempts
        errorRetryCount: 2,

        // Wait 3 seconds between retries
        errorRetryInterval: 3000,

        // Global error handler
        onError: (error, key) => {
          // Don't show toast for permission errors (handled by components)
          if (isPermissionError(error)) {
            console.warn(`[SWR] Permission error for key: ${key}`)
            return
          }

          // Show toast for other errors
          const message = error instanceof Error
            ? error.message
            : 'Ha ocurrido un error'

          toast.error(message)

          // Log for debugging
          console.error(`[SWR] Error for key: ${key}`, error)
        },

        // =================================================================
        // LOADING STATE
        // =================================================================

        // Loading timeout before showing loading UI (optional)
        loadingTimeout: 3000,

        // Callback when loading takes too long
        onLoadingSlow: (key) => {
          console.warn(`[SWR] Slow loading for key: ${key}`)
        },
      }}
    >
      {children}
    </SWRConfig>
  )
}
