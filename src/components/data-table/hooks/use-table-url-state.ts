'use client'

import { useCallback, useMemo } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import type { TableQuery, UseTableUrlStateOptions, UseTableUrlStateReturn } from '../types'

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 12

/**
 * Hook to sync table state with URL query parameters
 * Used for server-side pagination mode
 */
export function useTableUrlState(
  options: UseTableUrlStateOptions = {}
): UseTableUrlStateReturn {
  const { enabled = true, defaultPageSize = DEFAULT_PAGE_SIZE } = options

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Parse current query from URL
  const query = useMemo<TableQuery>(() => {
    if (!enabled) {
      return {
        page: DEFAULT_PAGE,
        pageSize: defaultPageSize,
        search: '',
        sortBy: null,
        sortDir: null,
        filters: {},
      }
    }

    const page = parseInt(searchParams.get('page') || String(DEFAULT_PAGE), 10)
    const pageSize = parseInt(searchParams.get('pageSize') || String(defaultPageSize), 10)
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || null
    const sortDir = (searchParams.get('sortDir') as 'asc' | 'desc') || null

    // Parse filters (format: filter_columnId=value)
    const filters: Record<string, string | string[]> = {}
    searchParams.forEach((value, key) => {
      if (key.startsWith('filter_')) {
        const filterId = key.replace('filter_', '')
        // Handle multi-value filters (comma-separated)
        if (value.includes(',')) {
          filters[filterId] = value.split(',')
        } else {
          filters[filterId] = value
        }
      }
    })

    return {
      page: isNaN(page) || page < 1 ? DEFAULT_PAGE : page,
      pageSize: isNaN(pageSize) || pageSize < 1 ? defaultPageSize : pageSize,
      search,
      sortBy,
      sortDir,
      filters,
    }
  }, [searchParams, enabled, defaultPageSize])

  // Update URL with new query params
  const setQuery = useCallback(
    (updates: Partial<TableQuery>) => {
      if (!enabled) return

      const params = new URLSearchParams(searchParams.toString())

      // Update pagination
      if (updates.page !== undefined) {
        if (updates.page === DEFAULT_PAGE) {
          params.delete('page')
        } else {
          params.set('page', String(updates.page))
        }
      }

      if (updates.pageSize !== undefined) {
        if (updates.pageSize === defaultPageSize) {
          params.delete('pageSize')
        } else {
          params.set('pageSize', String(updates.pageSize))
        }
      }

      // Update search
      if (updates.search !== undefined) {
        if (updates.search === '') {
          params.delete('search')
        } else {
          params.set('search', updates.search)
        }
        // Reset page when search changes
        params.delete('page')
      }

      // Update sorting
      if (updates.sortBy !== undefined) {
        if (updates.sortBy === null) {
          params.delete('sortBy')
          params.delete('sortDir')
        } else {
          params.set('sortBy', updates.sortBy)
          params.set('sortDir', updates.sortDir || 'asc')
        }
      }

      // Update filters
      if (updates.filters !== undefined) {
        // Remove all existing filter params
        const keysToDelete: string[] = []
        params.forEach((_, key) => {
          if (key.startsWith('filter_')) {
            keysToDelete.push(key)
          }
        })
        keysToDelete.forEach(key => params.delete(key))

        // Add new filter params
        Object.entries(updates.filters).forEach(([key, value]) => {
          if (value && (Array.isArray(value) ? value.length > 0 : value !== '')) {
            const filterValue = Array.isArray(value) ? value.join(',') : value
            params.set(`filter_${key}`, filterValue)
          }
        })
        // Reset page when filters change
        params.delete('page')
      }

      const queryString = params.toString()
      const url = queryString ? `${pathname}?${queryString}` : pathname

      router.push(url, { scroll: false })
    },
    [enabled, searchParams, pathname, router, defaultPageSize]
  )

  // Reset all query params
  const resetQuery = useCallback(() => {
    if (!enabled) return
    router.push(pathname, { scroll: false })
  }, [enabled, pathname, router])

  return {
    query,
    setQuery,
    resetQuery,
  }
}
