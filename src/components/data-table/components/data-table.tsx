'use client'

import { flexRender } from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useDataTable } from '../hooks/use-data-table'
import { DataTableToolbar } from './data-table-toolbar'
import { DataTablePagination } from './data-table-pagination'
import { DataTableEmpty, DataTableLoading } from './data-table-states'
import type { DataTableProps } from '../types'

/**
 * Main DataTable component
 * Wraps TanStack Table with toolbar, pagination, and states
 */
export function DataTable<TData>({
  // Required
  columns,
  data,
  // Pagination
  mode = 'client',
  totalItems,
  defaultPageSize = 10,
  pageSizeOptions,
  // Server callbacks
  onQueryChange,
  // Search
  searchable = false,
  searchPlaceholder = 'Search...',
  searchColumns,
  // Filters
  filters = [],
  // Sorting
  sortable = true,
  defaultSort,
  // Actions
  primaryAction,
  secondaryActions = [],
  // States
  loading = false,
  emptyTitle,
  emptyDescription,
  // Layout
  toolbar,
  showPagination = true,
  stickyHeader = false,
  // Styling
  className,
  striped = false,
  // Row
  onRowClick,
  getRowId,
}: DataTableProps<TData>) {
  const {
    table,
    query,
    pagination,
    setPage,
    setPageSize,
    setSearch,
    setFilter,
    resetFilters,
  } = useDataTable({
    data,
    columns,
    mode,
    totalItems,
    defaultPageSize,
    defaultSort,
    searchColumns,
    onQueryChange,
  })

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
        <Table>
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
        </Table>
      </div>

      {showPagination && (
        <DataTablePagination
          pageIndex={pagination.page}
          pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          totalPages={pagination.totalPages}
          pageSizeOptions={pageSizeOptions}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  )
}
