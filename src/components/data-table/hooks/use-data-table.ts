'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
} from '@tanstack/react-table'
import { useTableUrlState } from './use-table-url-state'
import type {
  UseDataTableOptions,
  UseDataTableReturn,
  TableQuery,
  PaginationInfo,
} from '../types'

/**
 * Main hook for DataTable - handles both client and server-side modes
 */
export function useDataTable<TData>(
  options: UseDataTableOptions<TData>
): UseDataTableReturn<TData> {
  const {
    data,
    columns,
    mode = 'client',
    totalItems,
    defaultPageSize = 12,
    defaultSort = [],
    searchColumns = [],
    onQueryChange,
  } = options

  const isServerMode = mode === 'server'

  // URL state for server mode
  const { query: urlQuery, setQuery: setUrlQuery } = useTableUrlState({
    enabled: isServerMode,
    defaultPageSize,
  })

  // Local state for client mode
  const [clientPagination, setClientPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  })
  const [clientSearch, setClientSearch] = useState('')
  const [clientSorting, setClientSorting] = useState<SortingState>(defaultSort)
  const [clientFilters, setClientFilters] = useState<ColumnFiltersState>([])

  // Unified query state
  const query = useMemo<TableQuery>(() => {
    if (isServerMode) {
      return urlQuery
    }

    return {
      page: clientPagination.pageIndex + 1,
      pageSize: clientPagination.pageSize,
      search: clientSearch,
      sortBy: clientSorting[0]?.id || null,
      sortDir: clientSorting[0]?.desc ? 'desc' : clientSorting[0] ? 'asc' : null,
      filters: clientFilters.reduce((acc, filter) => {
        acc[filter.id] = filter.value as string | string[]
        return acc
      }, {} as Record<string, string | string[]>),
    }
  }, [isServerMode, urlQuery, clientPagination, clientSearch, clientSorting, clientFilters])

  // Notify parent of query changes (server mode)
  useEffect(() => {
    if (isServerMode && onQueryChange) {
      onQueryChange(query)
    }
  }, [isServerMode, query, onQueryChange])

  // Apply global search filter for client mode
  const globalFilter = useMemo(() => {
    if (isServerMode || !clientSearch) return undefined
    return clientSearch
  }, [isServerMode, clientSearch])

  // Custom global filter function for client mode
  const globalFilterFn = useCallback(
    (row: { getValue: (columnId: string) => unknown }, _columnId: string, filterValue: string) => {
      if (!filterValue || searchColumns.length === 0) return true

      const search = filterValue.toLowerCase()
      return searchColumns.some((col) => {
        const value = row.getValue(col as string)
        if (value == null) return false
        return String(value).toLowerCase().includes(search)
      })
    },
    [searchColumns]
  )

  // Create table instance
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),

    // Pagination
    ...(isServerMode
      ? {
          manualPagination: true,
          pageCount: totalItems ? Math.ceil(totalItems / query.pageSize) : -1,
          state: {
            pagination: {
              pageIndex: query.page - 1,
              pageSize: query.pageSize,
            },
          },
        }
      : {
          getPaginationRowModel: getPaginationRowModel(),
          state: {
            pagination: clientPagination,
          },
          onPaginationChange: setClientPagination,
        }),

    // Sorting
    ...(isServerMode
      ? {
          manualSorting: true,
          state: {
            sorting: query.sortBy
              ? [{ id: query.sortBy, desc: query.sortDir === 'desc' }]
              : [],
          },
        }
      : {
          getSortedRowModel: getSortedRowModel(),
          state: {
            sorting: clientSorting,
          },
          onSortingChange: setClientSorting,
        }),

    // Filtering
    ...(isServerMode
      ? {
          manualFiltering: true,
        }
      : {
          getFilteredRowModel: getFilteredRowModel(),
          state: {
            columnFilters: clientFilters,
            globalFilter,
          },
          onColumnFiltersChange: setClientFilters,
          globalFilterFn,
        }),
  })

  // Pagination info
  const pagination = useMemo<PaginationInfo>(() => {
    const total = isServerMode ? (totalItems || 0) : table.getFilteredRowModel().rows.length
    const pages = Math.ceil(total / query.pageSize) || 1

    return {
      page: query.page,
      pageSize: query.pageSize,
      totalItems: total,
      totalPages: pages,
    }
  }, [isServerMode, totalItems, table, query.page, query.pageSize])

  // Action handlers
  const setPage = useCallback(
    (page: number) => {
      if (isServerMode) {
        setUrlQuery({ page })
      } else {
        setClientPagination((prev) => ({ ...prev, pageIndex: page - 1 }))
      }
    },
    [isServerMode, setUrlQuery]
  )

  const setPageSize = useCallback(
    (size: number) => {
      if (isServerMode) {
        setUrlQuery({ pageSize: size, page: 1 })
      } else {
        setClientPagination({ pageIndex: 0, pageSize: size })
      }
    },
    [isServerMode, setUrlQuery]
  )

  const setSearch = useCallback(
    (search: string) => {
      if (isServerMode) {
        setUrlQuery({ search })
      } else {
        setClientSearch(search)
        setClientPagination((prev) => ({ ...prev, pageIndex: 0 }))
      }
    },
    [isServerMode, setUrlQuery]
  )

  const setSorting = useCallback(
    (sorting: SortingState) => {
      if (isServerMode) {
        const sort = sorting[0]
        setUrlQuery({
          sortBy: sort?.id || null,
          sortDir: sort?.desc ? 'desc' : sort ? 'asc' : null,
        })
      } else {
        setClientSorting(sorting)
      }
    },
    [isServerMode, setUrlQuery]
  )

  const setFilters = useCallback(
    (filters: ColumnFiltersState) => {
      if (isServerMode) {
        const filterObj = filters.reduce((acc, f) => {
          acc[f.id] = f.value as string | string[]
          return acc
        }, {} as Record<string, string | string[]>)
        setUrlQuery({ filters: filterObj })
      } else {
        setClientFilters(filters)
        setClientPagination((prev) => ({ ...prev, pageIndex: 0 }))
      }
    },
    [isServerMode, setUrlQuery]
  )

  const setFilter = useCallback(
    (id: string, value: string | string[] | null) => {
      if (isServerMode) {
        const newFilters = { ...query.filters }
        if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
          delete newFilters[id]
        } else {
          newFilters[id] = value
        }
        setUrlQuery({ filters: newFilters })
      } else {
        setClientFilters((prev) => {
          const existing = prev.filter((f) => f.id !== id)
          if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
            return existing
          }
          return [...existing, { id, value }]
        })
        setClientPagination((prev) => ({ ...prev, pageIndex: 0 }))
      }
    },
    [isServerMode, query.filters, setUrlQuery]
  )

  const resetFilters = useCallback(() => {
    if (isServerMode) {
      setUrlQuery({ filters: {}, search: '' })
    } else {
      setClientFilters([])
      setClientSearch('')
      setClientPagination((prev) => ({ ...prev, pageIndex: 0 }))
    }
  }, [isServerMode, setUrlQuery])

  return {
    table,
    query,
    pagination,
    setPage,
    setPageSize,
    setSearch,
    setSorting,
    setFilters,
    setFilter,
    resetFilters,
  }
}
