'use client'

import { DataTableSearch } from './data-table-search'
import { DataTableFilters } from './data-table-filter'
import { DataTableActions } from './data-table-actions'
import type { DataTableToolbarProps } from '../types'

/**
 * Toolbar combining search, filters, and actions
 * Matches Figma design: [Search] [Filters...] [spacer] [Settings] [Primary Action]
 */
export function DataTableToolbar({
  // Search
  searchValue,
  onSearchChange,
  searchPlaceholder,
  // Filters
  filters = [],
  filterValues = {},
  onFilterChange,
  // Actions
  primaryAction,
  secondaryActions = [],
}: DataTableToolbarProps) {
  const hasSearch = onSearchChange !== undefined
  const hasFilters = filters.length > 0
  const hasActions = primaryAction || secondaryActions.length > 0

  if (!hasSearch && !hasFilters && !hasActions) {
    return null
  }

  return (
    <div className="flex items-center justify-between gap-4 py-4">
      {/* Left side: Search + Filters */}
      <div className="flex flex-1 items-center gap-4">
        {hasSearch && (
          <DataTableSearch
            value={searchValue || ''}
            onChange={onSearchChange!}
            placeholder={searchPlaceholder}
          />
        )}
        {hasFilters && (
          <DataTableFilters
            filters={filters}
            values={filterValues}
            onChange={onFilterChange!}
          />
        )}
      </div>

      {/* Right side: Actions */}
      {hasActions && (
        <DataTableActions
          primaryAction={primaryAction}
          secondaryActions={secondaryActions}
        />
      )}
    </div>
  )
}
