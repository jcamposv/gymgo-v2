'use client'

import { ChevronDown, Filter, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { DataTableFilterProps, FilterOption } from '../types'

/**
 * Individual filter dropdown (pill style)
 */
export function DataTableFilter({ config, value, onChange }: DataTableFilterProps) {
  const { label, options = [], type } = config

  // Get display label
  const getDisplayLabel = () => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return label
    }

    if (type === 'multi-select' && Array.isArray(value)) {
      if (value.length === 1) {
        const opt = options.find((o) => o.value === value[0])
        return opt?.label || value[0]
      }
      return `${label} (${value.length})`
    }

    const opt = options.find((o) => o.value === value)
    return opt?.label || value
  }

  const isActive = value && (Array.isArray(value) ? value.length > 0 : value !== '')

  const handleSelect = (optionValue: string) => {
    if (type === 'multi-select') {
      const currentValues = Array.isArray(value) ? value : []
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter((v) => v !== optionValue)
        : [...currentValues, optionValue]
      onChange(newValues.length > 0 ? newValues : null)
    } else {
      onChange(value === optionValue ? null : optionValue)
    }
  }

  const isSelected = (optionValue: string) => {
    if (Array.isArray(value)) {
      return value.includes(optionValue)
    }
    return value === optionValue
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-9 rounded-full border-dashed gap-1.5',
            isActive && 'border-primary bg-primary/5'
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          <span className="max-w-[150px] truncate">{getDisplayLabel()}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        {options.map((option: FilterOption) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className="gap-2"
          >
            <div
              className={cn(
                'flex h-4 w-4 items-center justify-center rounded-sm border',
                isSelected(option.value)
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'opacity-50'
              )}
            >
              {isSelected(option.value) && <Check className="h-3 w-3" />}
            </div>
            {option.icon && <option.icon className="h-4 w-4 text-muted-foreground" />}
            <span className="flex-1">{option.label}</span>
          </DropdownMenuItem>
        ))}
        {isActive && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onChange(null)} className="justify-center">
              Clear filter
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Container for multiple filters
 */
export function DataTableFilters({
  filters,
  values,
  onChange,
}: {
  filters: DataTableFilterProps['config'][]
  values: Record<string, string | string[]>
  onChange: (id: string, value: string | string[] | null) => void
}) {
  if (filters.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      {filters.map((config) => (
        <DataTableFilter
          key={config.id}
          config={config}
          value={values[config.id]}
          onChange={(val) => onChange(config.id, val)}
        />
      ))}
    </div>
  )
}
