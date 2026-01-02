'use client'

import { MoreHorizontal, Plus, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { DataTableActionsProps } from '../types'

/**
 * Primary action + secondary actions dropdown
 * Follows Figma design: Settings icon + "Add Client" button
 */
export function DataTableActions({
  primaryAction,
  secondaryActions = [],
}: DataTableActionsProps) {
  const hasSecondary = secondaryActions.length > 0

  return (
    <div className="flex items-center gap-2">
      {/* Settings/More actions button */}
      {hasSecondary && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Settings2 className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {secondaryActions.map((action, index) => (
              <div key={action.id}>
                {index > 0 && action.variant === 'destructive' && (
                  <DropdownMenuSeparator />
                )}
                <DropdownMenuItem
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={action.variant === 'destructive' ? 'text-destructive' : ''}
                >
                  {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                  {action.label}
                </DropdownMenuItem>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Primary action button */}
      {primaryAction && (
        <Button
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
          variant={primaryAction.variant || 'default'}
          size="sm"
          className="h-9 gap-1.5"
        >
          {primaryAction.icon ? (
            <primaryAction.icon className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {primaryAction.label}
        </Button>
      )}
    </div>
  )
}

/**
 * Row-level actions menu (three dots)
 */
export function DataTableRowActions<TData>({
  row,
  actions,
}: {
  row: TData
  actions: {
    id: string
    label: string
    icon?: React.ComponentType<{ className?: string }>
    onClick: (row: TData) => void
    variant?: 'default' | 'destructive'
    disabled?: boolean | ((row: TData) => boolean)
    hidden?: boolean | ((row: TData) => boolean)
  }[]
}) {
  const visibleActions = actions.filter((action) => {
    if (typeof action.hidden === 'function') return !action.hidden(row)
    return !action.hidden
  })

  if (visibleActions.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {visibleActions.map((action, index) => {
          const isDisabled =
            typeof action.disabled === 'function'
              ? action.disabled(row)
              : action.disabled

          return (
            <div key={action.id}>
              {index > 0 && action.variant === 'destructive' && (
                <DropdownMenuSeparator />
              )}
              <DropdownMenuItem
                onClick={() => action.onClick(row)}
                disabled={isDisabled}
                className={action.variant === 'destructive' ? 'text-destructive' : ''}
              >
                {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                {action.label}
              </DropdownMenuItem>
            </div>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
