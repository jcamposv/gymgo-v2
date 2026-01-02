'use client'

import { useIsMobile } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { useDataTable } from '../hooks/use-data-table'
import { DataTableDesktop } from './data-table-desktop'
import { DataTableMobileCards } from './mobile'
import type { DataTableProps, DataTableMobileProps } from '../types'

/**
 * Unified DataTable component
 * Automatically switches between desktop table and mobile cards based on viewport
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
  rowActions,
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
  // Mobile props
  enableMobileCards = true,
  mobileBreakpoint = 768,
  mobileCardConfig,
  renderMobileCard,
}: DataTableProps<TData> & DataTableMobileProps<TData>) {
  const isMobile = useIsMobile(mobileBreakpoint)

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

  // Render mobile cards view
  if (isMobile && enableMobileCards) {
    return (
      <DataTableMobileCards
        table={table}
        columns={columns}
        query={query}
        pagination={pagination}
        setPage={setPage}
        setSearch={setSearch}
        setFilter={setFilter}
        resetFilters={resetFilters}
        searchable={searchable}
        searchPlaceholder={searchPlaceholder}
        filters={filters}
        primaryAction={primaryAction}
        rowActions={rowActions}
        mobileCardConfig={mobileCardConfig}
        renderMobileCard={renderMobileCard}
        loading={loading}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        onRowClick={onRowClick}
        getRowId={getRowId}
        className={className}
      />
    )
  }

  // Render desktop table view
  return (
    <DataTableDesktop
      table={table}
      columns={columns}
      query={query}
      pagination={pagination}
      setPage={setPage}
      setPageSize={setPageSize}
      setSearch={setSearch}
      setFilter={setFilter}
      resetFilters={resetFilters}
      searchable={searchable}
      searchPlaceholder={searchPlaceholder}
      filters={filters}
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
      pageSizeOptions={pageSizeOptions}
      loading={loading}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      toolbar={toolbar}
      showPagination={showPagination}
      stickyHeader={stickyHeader}
      className={className}
      striped={striped}
      onRowClick={onRowClick}
      getRowId={getRowId}
    />
  )
}
