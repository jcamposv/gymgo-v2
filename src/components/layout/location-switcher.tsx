'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronsUpDown, MapPin, Plus, Check, Settings } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useLocationContext } from '@/providers'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import type { Location } from '@/schemas/location.schema'

interface LocationSwitcherProps {
  collapsed?: boolean
  className?: string
}

export function LocationSwitcher({ collapsed, className }: LocationSwitcherProps) {
  const router = useRouter()
  const {
    locations,
    currentLocation,
    loading,
    setCurrentLocation,
    hasMultipleLocations,
    limits,
  } = useLocationContext()

  const [open, setOpen] = useState(false)

  // Loading state
  if (loading) {
    return (
      <div className={cn('flex items-center gap-2 p-2', className)}>
        <Skeleton className="h-9 w-9 rounded-md" />
        {!collapsed && <Skeleton className="h-5 flex-1" />}
      </div>
    )
  }

  // No locations (shouldn't happen but handle gracefully)
  if (!currentLocation) {
    return null
  }

  // Single location - just show it without dropdown
  if (!hasMultipleLocations && limits.max === 1) {
    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('flex items-center justify-center p-2', className)}>
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-medium">{currentLocation.name}</p>
            {currentLocation.city && (
              <p className="text-xs text-muted-foreground">{currentLocation.city}</p>
            )}
          </TooltipContent>
        </Tooltip>
      )
    }

    return (
      <div className={cn('flex items-center gap-3 p-2', className)}>
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 shrink-0">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{currentLocation.name}</p>
          {currentLocation.city && (
            <p className="text-xs text-muted-foreground truncate">{currentLocation.city}</p>
          )}
        </div>
      </div>
    )
  }

  // Multiple locations or can add more - show dropdown
  const handleSelectLocation = (location: Location) => {
    setCurrentLocation(location)
    setOpen(false)
  }

  const handleAddLocation = () => {
    setOpen(false)
    router.push('/dashboard/settings/locations')
  }

  const handleManageLocations = () => {
    setOpen(false)
    router.push('/dashboard/settings/locations')
  }

  // Collapsed mode - icon with dropdown
  if (collapsed) {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'flex items-center justify-center p-2 w-full hover:bg-accent rounded-md transition-colors',
                  className
                )}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-medium">{currentLocation.name}</p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent side="right" align="start" className="w-64">
          <LocationDropdownContent
            locations={locations}
            currentLocation={currentLocation}
            limits={limits}
            onSelect={handleSelectLocation}
            onAdd={handleAddLocation}
            onManage={handleManageLocations}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Expanded mode
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex w-full items-center gap-3 p-2 hover:bg-accent rounded-md transition-colors',
            className
          )}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 shrink-0">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium truncate">{currentLocation.name}</p>
            {currentLocation.city && (
              <p className="text-xs text-muted-foreground truncate">{currentLocation.city}</p>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" className="w-64">
        <LocationDropdownContent
          locations={locations}
          currentLocation={currentLocation}
          limits={limits}
          onSelect={handleSelectLocation}
          onAdd={handleAddLocation}
          onManage={handleManageLocations}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// =============================================================================
// Dropdown Content (shared between collapsed and expanded)
// =============================================================================

interface LocationDropdownContentProps {
  locations: Location[]
  currentLocation: Location
  limits: { current: number; max: number; canAddMore: boolean }
  onSelect: (location: Location) => void
  onAdd: () => void
  onManage: () => void
}

function LocationDropdownContent({
  locations,
  currentLocation,
  limits,
  onSelect,
  onAdd,
  onManage,
}: LocationDropdownContentProps) {
  return (
    <>
      <DropdownMenuLabel className="flex items-center justify-between">
        <span>Sucursales</span>
        <span className="text-xs font-normal text-muted-foreground">
          {limits.current}/{limits.max === -1 ? '∞' : limits.max}
        </span>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />

      {/* Location list */}
      <div className="max-h-[200px] overflow-y-auto">
        {locations.map((location, index) => (
          <DropdownMenuItem
            key={location.id}
            onClick={() => onSelect(location)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded bg-muted text-xs font-medium shrink-0">
              {location.is_primary ? (
                <MapPin className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{location.name}</p>
              {location.city && (
                <p className="text-xs text-muted-foreground truncate">{location.city}</p>
              )}
            </div>
            {currentLocation.id === location.id && (
              <Check className="h-4 w-4 text-primary shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </div>

      <DropdownMenuSeparator />

      {/* Actions */}
      {limits.canAddMore && (
        <DropdownMenuItem onClick={onAdd} className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          Agregar sucursal
        </DropdownMenuItem>
      )}
      <DropdownMenuItem onClick={onManage} className="cursor-pointer">
        <Settings className="mr-2 h-4 w-4" />
        Administrar sucursales
      </DropdownMenuItem>
    </>
  )
}
