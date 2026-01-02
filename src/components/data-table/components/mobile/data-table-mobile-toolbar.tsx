'use client'

import { useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { DataTableSearch } from '../data-table-search'
import { DataTableFilter } from '../data-table-filter'
import type { DataTableMobileToolbarProps } from '../../types'

/**
 * Mobile-optimized toolbar with collapsible filters
 * Shows search prominently, filters in a sheet
 */
export function DataTableMobileToolbar({
  // Search
  searchValue,
  onSearchChange,
  searchPlaceholder,
  // Filters
  filters = [],
  filterValues = {},
  onFilterChange,
  onResetFilters,
  // Actions
  primaryAction,
}: DataTableMobileToolbarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false)

  const hasSearch = onSearchChange !== undefined
  const hasFilters = filters.length > 0
  const hasPrimaryAction = !!primaryAction

  // Count active filters
  const activeFilterCount = Object.keys(filterValues).filter(
    (key) => filterValues[key] && filterValues[key].length > 0
  ).length

  if (!hasSearch && !hasFilters && !hasPrimaryAction) {
    return null
  }

  return (
    <div className="space-y-3 py-3">
      {/* Search + Filter button row */}
      <div className="flex items-center gap-2">
        {hasSearch && (
          <div className="flex-1">
            <DataTableSearch
              value={searchValue || ''}
              onChange={onSearchChange!}
              placeholder={searchPlaceholder}
              className="w-full"
            />
          </div>
        )}

        {hasFilters && (
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 relative">
                <SlidersHorizontal className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
                <span className="sr-only">Filtros</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto max-h-[80vh]">
              <SheetHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <SheetTitle>Filtros</SheetTitle>
                  {activeFilterCount > 0 && onResetFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onResetFilters()
                        setFiltersOpen(false)
                      }}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Limpiar
                    </Button>
                  )}
                </div>
              </SheetHeader>

              <div className="space-y-4 pb-4">
                {filters.map((filter) => (
                  <div key={filter.id} className="space-y-2">
                    <label className="text-sm font-medium">{filter.label}</label>
                    <DataTableFilter
                      config={filter}
                      value={filterValues[filter.id]}
                      onChange={(value) => onFilterChange?.(filter.id, value)}
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t">
                <Button
                  className="w-full"
                  onClick={() => setFiltersOpen(false)}
                >
                  Aplicar filtros
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Primary action (full width on mobile) */}
      {hasPrimaryAction && (
        <Button
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
          className="w-full"
        >
          {primaryAction.icon && (
            <primaryAction.icon className="mr-2 h-4 w-4" />
          )}
          {primaryAction.label}
        </Button>
      )}

      {/* Active filters badges */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const value = filterValues[filter.id]
            if (!value || (Array.isArray(value) && value.length === 0)) {
              return null
            }

            const displayValue = Array.isArray(value)
              ? value.join(', ')
              : filter.options?.find((o) => o.value === value)?.label || value

            return (
              <Badge
                key={filter.id}
                variant="secondary"
                className="gap-1 pr-1"
              >
                <span className="text-muted-foreground">{filter.label}:</span>
                <span className="truncate max-w-[100px]">{displayValue}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => onFilterChange?.(filter.id, null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
