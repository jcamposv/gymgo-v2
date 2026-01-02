'use client'

import { flexRender, type Table, type ColumnDef } from '@tanstack/react-table'
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { DataTableToolbar } from './data-table-toolbar'
import { DataTablePagination } from './data-table-pagination'
import { DataTableEmpty, DataTableLoading } from './data-table-states'
import type {
  FilterConfig,
  ActionConfig,
  PaginationInfo,
  TableQuery,
} from '../types'

export interface DataTableDesktopProps<TData> {
  // TanStack Table instance
  table: Table<TData>
  columns: ColumnDef<TData, unknown>[]

  // Query state
  query: TableQuery
  pagination: PaginationInfo

  // Handlers
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  setSearch: (search: string) => void
  setFilter: (id: string, value: string | string[] | null) => void
  resetFilters: () => void

  // Configuration
  searchable?: boolean
  searchPlaceholder?: string
  filters?: FilterConfig[]
  primaryAction?: ActionConfig
  secondaryActions?: ActionConfig[]
  pageSizeOptions?: number[]

  // States
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string

  // Layout
  toolbar?: React.ReactNode | false
  showPagination?: boolean
  stickyHeader?: boolean

  // Styling
  className?: string
  striped?: boolean

  // Row customization
  onRowClick?: (row: TData) => void
  getRowId?: (row: TData) => string
}

/**
 * Desktop table view for DataTable
 * Traditional table layout with headers, rows, and cells
 */
export function DataTableDesktop<TData>({
  table,
  columns,
  query,
  pagination,
  setPage,
  setPageSize,
  setSearch,
  setFilter,
  resetFilters,
  searchable,
  searchPlaceholder,
  filters = [],
  primaryAction,
  secondaryActions = [],
  pageSizeOptions,
  loading,
  emptyTitle,
  emptyDescription,
  toolbar,
  showPagination = true,
  stickyHeader,
  className,
  striped,
  onRowClick,
  getRowId,
}: DataTableDesktopProps<TData>) {
  // Convert filters to values object
  const filterValues: Record<string, string | string[]> = {}
  for (const [key, value] of Object.entries(query.filters)) {
    filterValues[key] = value
  }

  // Check if any filters are active
  const hasActiveFilters =
    query.search !== '' || Object.keys(query.filters).length > 0

  // Render toolbar
  const renderToolbar = () => {
    if (toolbar === false) return null
    if (toolbar) return toolbar

    return (
      <DataTableToolbar
        searchValue={query.search}
        onSearchChange={searchable ? setSearch : undefined}
        searchPlaceholder={searchPlaceholder}
        filters={filters}
        filterValues={filterValues}
        onFilterChange={setFilter}
        primaryAction={primaryAction}
        secondaryActions={secondaryActions}
      />
    )
  }

  // Get displayed rows
  const rows = table.getRowModel().rows
  const hasRows = rows.length > 0

  return (
    <div className={cn('space-y-4', className)}>
      {renderToolbar()}

      <div className="rounded-md border">
        <UITable>
          <TableHeader className={cn(stickyHeader && 'sticky top-0 bg-background')}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-0">
                  <DataTableLoading rows={5} columns={columns.length} />
                </TableCell>
              </TableRow>
            ) : hasRows ? (
              rows.map((row, index) => (
                <TableRow
                  key={getRowId ? getRowId(row.original) : row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={cn(
                    onRowClick && 'cursor-pointer hover:bg-muted/50',
                    striped && index % 2 === 1 && 'bg-muted/30'
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48">
                  <DataTableEmpty
                    title={emptyTitle}
                    description={emptyDescription}
                    action={
                      hasActiveFilters ? (
                        <button
                          onClick={resetFilters}
                          className="text-sm text-primary hover:underline"
                        >
                          Clear all filters
                        </button>
                      ) : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </UITable>
      </div>

      {showPagination && (
        <DataTablePagination
          pageIndex={pagination.page - 1}
          pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          totalPages={pagination.totalPages}
          pageSizeOptions={pageSizeOptions}
          onPageChange={(page) => setPage(page + 1)}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  )
}
