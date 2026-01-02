'use client'

import { useCallback, useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DataTableSearchProps } from '../types'

/**
 * Search input with debounce for DataTable
 */
export function DataTableSearch({
  value,
  onChange,
  placeholder = 'Search...',
  className,
}: DataTableSearchProps) {
  const [localValue, setLocalValue] = useState(value)

  // Sync with external value
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Debounced change handler
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [localValue, value, onChange])

  const handleClear = useCallback(() => {
    setLocalValue('')
    onChange('')
  }, [onChange])

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9 h-9 w-[200px] lg:w-[280px] bg-muted/50 border-0"
      />
      {localValue && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
          onClick={handleClear}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
