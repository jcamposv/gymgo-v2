'use client'

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { DataTablePaginationProps } from '../types'

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100]

/**
 * Pagination controls for DataTable
 * Shows rows info, page size selector, and navigation buttons
 */
export function DataTablePagination({
  pageIndex,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
}: DataTablePaginationProps) {
  const startItem = pageIndex * pageSize + 1
  const endItem = Math.min((pageIndex + 1) * pageSize, totalItems)
  const canGoPrevious = pageIndex > 0
  const canGoNext = pageIndex < totalPages - 1

  return (
    <div className="flex items-center justify-between px-2 py-4">
      {/* Row count info */}
      <div className="flex-1 text-sm text-muted-foreground">
        {totalItems > 0 ? (
          <>
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{totalItems}</span> results
          </>
        ) : (
          'No results'
        )}
      </div>

      <div className="flex items-center space-x-6 lg:space-x-8">
        {/* Page size selector */}
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page indicator */}
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {pageIndex + 1} of {totalPages || 1}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(0)}
            disabled={!canGoPrevious}
          >
            <ChevronsLeft className="h-4 w-4" />
            <span className="sr-only">First page</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={!canGoPrevious}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={!canGoNext}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(totalPages - 1)}
            disabled={!canGoNext}
          >
            <ChevronsRight className="h-4 w-4" />
            <span className="sr-only">Last page</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Simplified pagination for smaller tables
 */
export function DataTableSimplePagination({
  pageIndex,
  totalPages,
  onPageChange,
}: Pick<DataTablePaginationProps, 'pageIndex' | 'totalPages' | 'onPageChange'>) {
  const canGoPrevious = pageIndex > 0
  const canGoNext = pageIndex < totalPages - 1

  return (
    <div className="flex items-center justify-end space-x-2 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(pageIndex - 1)}
        disabled={!canGoPrevious}
      >
        Previous
      </Button>
      <div className="text-sm text-muted-foreground">
        {pageIndex + 1} / {totalPages || 1}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(pageIndex + 1)}
        disabled={!canGoNext}
      >
        Next
      </Button>
    </div>
  )
}
