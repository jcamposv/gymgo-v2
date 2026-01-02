'use client'

import { flexRender } from '@tanstack/react-table'
import { MoreHorizontal } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { DataTableMobileCardProps, MobileCardField } from '../../types'

/**
 * Individual card component for mobile view
 * Renders a row as a card with configurable primary/secondary fields
 */
export function DataTableMobileCard<TData>({
  row,
  config,
  columns,
  onRowClick,
  actions = [],
}: DataTableMobileCardProps<TData>) {
  const data = row.original

  // Get column header label by accessor key
  const getColumnLabel = (key: string): string => {
    const column = columns.find((col) => {
      const def = col as { accessorKey?: string; id?: string }
      return def.accessorKey === key || def.id === key
    })
    if (!column) return key
    // Try to get header as string
    const header = column.header
    if (typeof header === 'string') return header
    return key
  }

  // Get value from row
  const getValue = (key: string): unknown => {
    return (data as Record<string, unknown>)[key]
  }

  // Render a field value
  const renderField = (
    field: string | MobileCardField<TData>,
    showLabel = true
  ) => {
    const fieldConfig = typeof field === 'string' ? { id: field } : field
    const key = String(fieldConfig.id)
    const value = getValue(key)
    const label = fieldConfig.label || getColumnLabel(key)

    // Use custom render if provided
    if (fieldConfig.render) {
      return (
        <div key={key} className="flex flex-col gap-0.5">
          {showLabel && (
            <span className="text-xs text-muted-foreground">{label}</span>
          )}
          <span className="text-sm">{fieldConfig.render(value, data)}</span>
        </div>
      )
    }

    // Try to use column cell renderer
    const cell = row.getAllCells().find((c) => c.column.id === key)
    if (cell) {
      return (
        <div key={key} className="flex flex-col gap-0.5">
          {showLabel && (
            <span className="text-xs text-muted-foreground">{label}</span>
          )}
          <span className="text-sm">
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </span>
        </div>
      )
    }

    // Fallback to raw value
    return (
      <div key={key} className="flex flex-col gap-0.5">
        {showLabel && (
          <span className="text-xs text-muted-foreground">{label}</span>
        )}
        <span className="text-sm">{String(value ?? '-')}</span>
      </div>
    )
  }

  // Filter visible actions
  const visibleActions = actions.filter((action) => {
    if (typeof action.hidden === 'function') return !action.hidden(data)
    return !action.hidden
  })

  // Default config if none provided - use first few visible columns
  const effectiveConfig = config || {
    titleField: columns[0] && 'accessorKey' in columns[0]
      ? (columns[0] as { accessorKey: string }).accessorKey
      : undefined,
    primaryFields: columns.slice(1, 4).map((col) => {
      if ('accessorKey' in col) return (col as { accessorKey: string }).accessorKey
      return ''
    }).filter(Boolean),
  }

  return (
    <Card
      className={cn(
        'w-full',
        onRowClick && 'cursor-pointer hover:bg-accent/50 transition-colors'
      )}
      onClick={() => onRowClick?.(data)}
    >
      <CardContent className="p-4">
        {/* Header: Avatar + Title + Actions */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          {effectiveConfig.renderAvatar && (
            <div className="shrink-0">
              {effectiveConfig.renderAvatar(data)}
            </div>
          )}

          {/* Title & Subtitle */}
          <div className="flex-1 min-w-0">
            {effectiveConfig.titleField && (
              <div className="font-medium truncate">
                {renderField(effectiveConfig.titleField as string, false)}
              </div>
            )}
            {effectiveConfig.subtitleField && (
              <div className="text-sm text-muted-foreground truncate">
                {renderField(effectiveConfig.subtitleField as string, false)}
              </div>
            )}
          </div>

          {/* Actions dropdown */}
          {effectiveConfig.showActions !== false && visibleActions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Acciones</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {visibleActions.map((action) => {
                  const Icon = action.icon
                  const isDisabled = typeof action.disabled === 'function'
                    ? action.disabled(data)
                    : action.disabled
                  return (
                    <DropdownMenuItem
                      key={action.id}
                      disabled={isDisabled}
                      className={cn(
                        action.variant === 'destructive' && 'text-destructive'
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        action.onClick(data)
                      }}
                    >
                      {Icon && <Icon className="mr-2 h-4 w-4" />}
                      {action.label}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Primary Fields */}
        {effectiveConfig.primaryFields && effectiveConfig.primaryFields.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {effectiveConfig.primaryFields.map((field) =>
              renderField(field as string | MobileCardField<TData>)
            )}
          </div>
        )}

        {/* Secondary Fields */}
        {effectiveConfig.secondaryFields && effectiveConfig.secondaryFields.length > 0 && (
          <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-3">
            {effectiveConfig.secondaryFields.map((field) =>
              renderField(field as string | MobileCardField<TData>)
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
