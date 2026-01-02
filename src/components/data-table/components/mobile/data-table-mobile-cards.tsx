'use client'

import type { ColumnDef, Table, Row } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { DataTableMobileCard } from './data-table-mobile-card'
import { DataTableMobileToolbar } from './data-table-mobile-toolbar'
import { DataTableMobilePagination } from './data-table-mobile-pagination'
import { DataTableEmpty, DataTableSpinner } from '../data-table-states'
import type {
  MobileCardConfig,
  MobileCardRenderProps,
  FilterConfig,
  ActionConfig,
  RowAction,
  PaginationInfo,
  TableQuery,
} from '../../types'

export interface DataTableMobileCardsProps<TData> {
  // TanStack Table instance
  table: Table<TData>
  columns: ColumnDef<TData, unknown>[]

  // Query state
  query: TableQuery
  pagination: PaginationInfo

  // Handlers
  setPage: (page: number) => void
  setSearch: (search: string) => void
  setFilter: (id: string, value: string | string[] | null) => void
  resetFilters: () => void

  // Configuration
  searchable?: boolean
  searchPlaceholder?: string
  filters?: FilterConfig[]
  primaryAction?: ActionConfig
  rowActions?: RowAction<TData>[]

  // Mobile card configuration
  mobileCardConfig?: MobileCardConfig<TData>
  renderMobileCard?: (props: MobileCardRenderProps<TData>) => React.ReactNode

  // States
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string

  // Row customization
  onRowClick?: (row: TData) => void
  getRowId?: (row: TData) => string

  // Styling
  className?: string
}

/**
 * Mobile cards view for DataTable
 * Renders rows as touch-friendly cards with toolbar and pagination
 */
export function DataTableMobileCards<TData>({
  table,
  columns,
  query,
  pagination,
  setPage,
  setSearch,
  setFilter,
  resetFilters,
  searchable,
  searchPlaceholder,
  filters = [],
  primaryAction,
  rowActions = [],
  mobileCardConfig,
  renderMobileCard,
  loading,
  emptyTitle,
  emptyDescription,
  onRowClick,
  getRowId,
  className,
}: DataTableMobileCardsProps<TData>) {
  const rows = table.getRowModel().rows
  const hasRows = rows.length > 0

  // Convert filters to values object
  const filterValues: Record<string, string | string[]> = {}
  for (const [key, value] of Object.entries(query.filters)) {
    filterValues[key] = value
  }

  // Check if any filters are active
  const hasActiveFilters =
    query.search !== '' || Object.keys(query.filters).length > 0

  // Render a single card
  const renderCard = (row: Row<TData>) => {
    // Custom render function takes priority
    if (renderMobileCard) {
      return renderMobileCard({
        row,
        table,
        onRowClick,
      })
    }

    // Default card rendering
    return (
      <DataTableMobileCard
        row={row}
        config={mobileCardConfig}
        columns={columns}
        onRowClick={onRowClick}
        actions={rowActions}
      />
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Toolbar */}
      <DataTableMobileToolbar
        searchValue={query.search}
        onSearchChange={searchable ? setSearch : undefined}
        searchPlaceholder={searchPlaceholder}
        filters={filters}
        filterValues={filterValues}
        onFilterChange={setFilter}
        onResetFilters={resetFilters}
        primaryAction={primaryAction}
      />

      {/* Cards list */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <DataTableSpinner />
          </div>
        ) : hasRows ? (
          rows.map((row) => (
            <div key={getRowId ? getRowId(row.original) : row.id}>
              {renderCard(row)}
            </div>
          ))
        ) : (
          <div className="py-12">
            <DataTableEmpty
              title={emptyTitle}
              description={emptyDescription}
              action={
                hasActiveFilters ? (
                  <button
                    onClick={resetFilters}
                    className="text-sm text-primary hover:underline"
                  >
                    Limpiar filtros
                  </button>
                ) : undefined
              }
            />
          </div>
        )}
      </div>

      {/* Pagination */}
      <DataTableMobilePagination
        pageIndex={pagination.page - 1}
        pageSize={pagination.pageSize}
        totalItems={pagination.totalItems}
        totalPages={pagination.totalPages}
        onPageChange={(page) => setPage(page + 1)}
      />
    </div>
  )
}
