/**
 * SWR Fetcher Utilities
 *
 * Generic fetcher for server actions with proper error handling and typing.
 * This approach allows SWR to work with Next.js server actions while maintaining
 * type safety and consistent error handling.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface ActionResult<T> {
  data?: T | null
  error?: string | null
  success?: boolean
  message?: string
}

export class FetcherError extends Error {
  status: number
  info?: unknown

  constructor(message: string, status: number = 500, info?: unknown) {
    super(message)
    this.name = 'FetcherError'
    this.status = status
    this.info = info
  }
}

// =============================================================================
// GENERIC SERVER ACTION FETCHER
// =============================================================================

/**
 * Creates a fetcher function that wraps a server action for use with SWR.
 *
 * @example
 * ```ts
 * const fetcher = createServerActionFetcher(getFinanceOverview)
 * const { data } = useSWR(key, fetcher)
 * ```
 */
export function createServerActionFetcher<TParams, TResult>(
  serverAction: (params: TParams) => Promise<ActionResult<TResult>>
) {
  return async (key: string): Promise<TResult | null> => {
    const params = JSON.parse(key) as TParams
    const result = await serverAction(params)

    if (result.error) {
      throw new FetcherError(result.error, 400)
    }

    if (result.success === false) {
      throw new FetcherError(result.message || 'Operation failed', 400)
    }

    return result.data ?? null
  }
}

/**
 * Creates a fetcher that passes params directly without JSON parsing.
 * Useful when the key is already the params object.
 */
export function createDirectFetcher<TParams, TResult>(
  serverAction: (params: TParams) => Promise<ActionResult<TResult>>
) {
  return async (_key: string, { arg }: { arg: TParams }): Promise<TResult | null> => {
    const result = await serverAction(arg)

    if (result.error) {
      throw new FetcherError(result.error, 400)
    }

    if (result.success === false) {
      throw new FetcherError(result.message || 'Operation failed', 400)
    }

    return result.data ?? null
  }
}

// =============================================================================
// KEY SERIALIZATION
// =============================================================================

/**
 * Creates a stable, serialized key from params object.
 * Ensures consistent key generation for SWR caching.
 *
 * @example
 * ```ts
 * const key = serializeKey('finance-overview', { from: '2024-01', to: '2024-12' })
 * // Returns: '["finance-overview",{"from":"2024-01","to":"2024-12"}]'
 * ```
 */
export function serializeKey<T extends Record<string, unknown>>(
  prefix: string,
  params: T
): string {
  // Sort keys for consistent serialization
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      const value = params[key]
      // Only include defined, non-null values
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value
      }
      return acc
    }, {} as Record<string, unknown>)

  return JSON.stringify([prefix, sortedParams])
}

/**
 * Parses a serialized key back to params object.
 */
export function parseKey<T>(key: string): { prefix: string; params: T } {
  const [prefix, params] = JSON.parse(key)
  return { prefix, params }
}

// =============================================================================
// ERROR HANDLING UTILITIES
// =============================================================================

/**
 * Checks if an error is a permission error (401/403)
 */
export function isPermissionError(error: unknown): boolean {
  if (error instanceof FetcherError) {
    return error.status === 401 || error.status === 403
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return message.includes('permission') ||
           message.includes('unauthorized') ||
           message.includes('sin permisos')
  }
  return false
}

/**
 * Checks if an error should trigger a retry
 */
export function shouldRetry(error: unknown): boolean {
  // Don't retry permission errors
  if (isPermissionError(error)) {
    return false
  }

  // Don't retry client errors (4xx)
  if (error instanceof FetcherError && error.status >= 400 && error.status < 500) {
    return false
  }

  // Retry server errors (5xx) and network errors
  return true
}
