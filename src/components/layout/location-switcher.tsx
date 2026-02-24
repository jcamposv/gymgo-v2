'use client'

import { useState } from 'react'
import { ChevronsUpDown, MapPin, Plus, Check, Settings, Building2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

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
import { Badge } from '@/components/ui/badge'
import type { Location } from '@/schemas/location.schema'

interface LocationSwitcherProps {
  collapsed?: boolean
  className?: string
}

export function LocationSwitcher({ collapsed, className }: LocationSwitcherProps) {
  const router = useRouter()
  const {
    locations,
    activeLocation,
    activeLocationName,
    isAllLocationsMode,
    loading,
    switchLocation,
    switchToAllLocations,
    hasMultipleLocations,
    limits,
    canSwitchLocation,
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
  if (locations.length === 0) {
    return null
  }

  // Non-admin users: always show read-only view (no switching allowed)
  // Single location with max 1: also show read-only
  const showReadOnly = !canSwitchLocation || (!hasMultipleLocations && limits.max === 1)

  if (showReadOnly) {
    const displayLocation = activeLocation || locations[0]
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
            <p className="font-medium">{displayLocation?.name}</p>
            {displayLocation?.city && (
              <p className="text-xs text-muted-foreground">{displayLocation.city}</p>
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
          <p className="text-sm font-medium truncate">{displayLocation?.name}</p>
          {displayLocation?.city && (
            <p className="text-xs text-muted-foreground truncate">{displayLocation.city}</p>
          )}
        </div>
      </div>
    )
  }

  // Admin with multiple locations - show dropdown
  const handleSelectLocation = (location: Location) => {
    switchLocation(location)
    setOpen(false)
  }

  const handleSelectAllLocations = () => {
    switchToAllLocations()
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
                <div className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-md',
                  isAllLocationsMode ? 'bg-blue-500/10' : 'bg-primary/10'
                )}>
                  {isAllLocationsMode ? (
                    <Building2 className="h-5 w-5 text-blue-500" />
                  ) : (
                    <MapPin className="h-5 w-5 text-primary" />
                  )}
                </div>
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-medium">{activeLocationName}</p>
            {isAllLocationsMode && (
              <p className="text-xs text-muted-foreground">Solo lectura</p>
            )}
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent side="right" align="start" className="w-64">
          <LocationDropdownContent
            locations={locations}
            activeLocation={activeLocation}
            isAllLocationsMode={isAllLocationsMode}
            limits={limits}
            onSelectLocation={handleSelectLocation}
            onSelectAllLocations={handleSelectAllLocations}
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
          <div className={cn(
            'flex h-9 w-9 items-center justify-center rounded-md shrink-0',
            isAllLocationsMode ? 'bg-blue-500/10' : 'bg-primary/10'
          )}>
            {isAllLocationsMode ? (
              <Building2 className="h-5 w-5 text-blue-500" />
            ) : (
              <MapPin className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">{activeLocationName}</p>
              {isAllLocationsMode && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  Solo lectura
                </Badge>
              )}
            </div>
            {!isAllLocationsMode && activeLocation?.city && (
              <p className="text-xs text-muted-foreground truncate">{activeLocation.city}</p>
            )}
            {isAllLocationsMode && (
              <p className="text-xs text-muted-foreground truncate">Vista global</p>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" className="w-64">
        <LocationDropdownContent
          locations={locations}
          activeLocation={activeLocation}
          isAllLocationsMode={isAllLocationsMode}
          limits={limits}
          onSelectLocation={handleSelectLocation}
          onSelectAllLocations={handleSelectAllLocations}
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
  activeLocation: Location | null
  isAllLocationsMode: boolean
  limits: { current: number; max: number; canAddMore: boolean }
  onSelectLocation: (location: Location) => void
  onSelectAllLocations: () => void
  onAdd: () => void
  onManage: () => void
}

function LocationDropdownContent({
  locations,
  activeLocation,
  isAllLocationsMode,
  limits,
  onSelectLocation,
  onSelectAllLocations,
  onAdd,
  onManage,
}: LocationDropdownContentProps) {
  return (
    <>
      <DropdownMenuLabel className="flex items-center justify-between">
        <span>Contexto del Dashboard</span>
        <span className="text-xs font-normal text-muted-foreground">
          {limits.current}/{limits.max === -1 ? '\u221e' : limits.max}
        </span>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />

      {/* "All Locations" option - read-only mode */}
      {locations.length > 1 && (
        <>
          <DropdownMenuItem
            onClick={onSelectAllLocations}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-500/10 shrink-0">
              <Building2 className="h-4 w-4 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">Todas las sucursales</p>
              <p className="text-xs text-muted-foreground truncate">Solo lectura</p>
            </div>
            {isAllLocationsMode && (
              <Check className="h-4 w-4 text-primary shrink-0" />
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </>
      )}

      {/* Location list */}
      <div className="max-h-[200px] overflow-y-auto">
        {locations.map((location, index) => (
          <DropdownMenuItem
            key={location.id}
            onClick={() => onSelectLocation(location)}
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
            {!isAllLocationsMode && activeLocation?.id === location.id && (
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
