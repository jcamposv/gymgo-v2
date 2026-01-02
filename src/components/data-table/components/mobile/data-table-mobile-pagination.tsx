'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DataTableMobilePaginationProps } from '../../types'

/**
 * Touch-friendly pagination for mobile
 * Shows "Showing X of Y" with large Previous/Next buttons
 */
export function DataTableMobilePagination({
  pageIndex,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
}: DataTableMobilePaginationProps) {
  const startItem = totalItems > 0 ? pageIndex * pageSize + 1 : 0
  const endItem = Math.min((pageIndex + 1) * pageSize, totalItems)
  const canGoPrevious = pageIndex > 0
  const canGoNext = pageIndex < totalPages - 1

  if (totalItems === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-3 py-4">
      {/* Info text */}
      <div className="text-center text-sm text-muted-foreground">
        Mostrando{' '}
        <span className="font-medium text-foreground">{startItem}</span>
        {' - '}
        <span className="font-medium text-foreground">{endItem}</span>
        {' de '}
        <span className="font-medium text-foreground">{totalItems}</span>
      </div>

      {/* Navigation buttons */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="flex-1 h-11"
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={!canGoPrevious}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Anterior
          </Button>

          <div className="px-3 text-sm font-medium shrink-0">
            {pageIndex + 1} / {totalPages}
          </div>

          <Button
            variant="outline"
            className="flex-1 h-11"
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={!canGoNext}
          >
            Siguiente
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
