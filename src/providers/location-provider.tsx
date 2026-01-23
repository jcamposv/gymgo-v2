'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { usePermissions } from '@/contexts/user-context'
import { toast } from 'sonner'
import type { Location } from '@/schemas/location.schema'

// =============================================================================
// Types
// =============================================================================

/**
 * Location Context - Single Source of Truth for Dashboard Scope
 *
 * The active location defines the ENTIRE dashboard context:
 * - All reads are filtered by activeLocationId
 * - All writes auto-assign activeLocationId
 * - "All Locations" mode is READ-ONLY (no creates allowed)
 */
interface LocationContextValue {
  /** All locations for the organization */
  locations: Location[]

  /** Currently active location (null = "All Locations" mode) */
  activeLocation: Location | null

  /** Active location ID (null = "All Locations" mode) */
  activeLocationId: string | null

  /** Active location name for display */
  activeLocationName: string

  /** Whether viewing all locations (read-only mode) */
  isAllLocationsMode: boolean

  /** Whether user can create/edit data (false in "All Locations" mode) */
  canCreate: boolean

  /** Loading state */
  loading: boolean

  /** Error message if any */
  error: string | null

  /** Switch to a specific location (admin-only) */
  switchLocation: (location: Location) => void

  /** Switch to "All Locations" mode (admin-only, read-only) */
  switchToAllLocations: () => void

  /** Refresh locations from server */
  refresh: () => Promise<void>

  /** Whether org has multiple locations */
  hasMultipleLocations: boolean

  /** Location limit info */
  limits: {
    current: number
    max: number
    canAddMore: boolean
  }

  /** Whether user can switch locations (admin-only) */
  canSwitchLocation: boolean
}

const STORAGE_KEY = 'gymgo-current-location-id'
const COOKIE_NAME = 'gymgo-location-id'
const ALL_LOCATIONS_VALUE = 'all'

// Helper to set cookie (accessible by server)
function setLocationCookie(locationId: string | null) {
  const value = locationId ?? ALL_LOCATIONS_VALUE
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=31536000; SameSite=Lax`
}

// =============================================================================
// Context
// =============================================================================

const LocationContext = createContext<LocationContextValue | null>(null)

// =============================================================================
// Provider
// =============================================================================

interface LocationProviderProps {
  children: React.ReactNode
  /** Initial locations data (from SSR) */
  initialLocations?: Location[]
  /** Max locations allowed by plan */
  maxLocations?: number
}

export function LocationProvider({
  children,
  initialLocations,
  maxLocations = 1,
}: LocationProviderProps) {
  const router = useRouter()
  const [locations, setLocations] = useState<Location[]>(initialLocations ?? [])
  const [activeLocation, setActiveLocationState] = useState<Location | null>(null)
  const [isAllLocationsMode, setIsAllLocationsMode] = useState(false)
  const [loading, setLoading] = useState(!initialLocations)
  const [error, setError] = useState<string | null>(null)

  // Check if user is admin (only admins can switch locations)
  const { isAdmin, loading: permissionsLoading } = usePermissions()
  const canSwitchLocation = isAdmin()

  // Fetch locations from server
  const fetchLocations = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setError('Usuario no autenticado')
        setLoading(false)
        return
      }

      // Get profile with organization_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      const profile = profileData as { organization_id: string | null } | null

      if (profileError || !profile?.organization_id) {
        setError('Sin organizacion asignada')
        setLoading(false)
        return
      }

      // Get locations
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .order('is_primary', { ascending: false })
        .order('name', { ascending: true })

      if (locationsError) {
        setError('Error al cargar ubicaciones')
        setLoading(false)
        return
      }

      setLocations(locationsData as Location[])
      setError(null)
    } catch {
      setError('Error al cargar ubicaciones')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch if no initial data
  useEffect(() => {
    if (!initialLocations) {
      fetchLocations()
    }
  }, [initialLocations, fetchLocations])

  // Set initial active location from localStorage or primary
  useEffect(() => {
    if (locations.length === 0) return

    const savedId = localStorage.getItem(STORAGE_KEY)

    // Check if saved value is "all" (admin viewing all locations)
    if (savedId === ALL_LOCATIONS_VALUE && canSwitchLocation) {
      setIsAllLocationsMode(true)
      setActiveLocationState(null)
      setLocationCookie(null)
      return
    }

    let selectedLocation: Location | null = null

    // Try to restore from localStorage
    if (savedId && savedId !== ALL_LOCATIONS_VALUE) {
      const saved = locations.find((l) => l.id === savedId)
      if (saved) {
        selectedLocation = saved
      }
    }

    // Fall back to primary location
    if (!selectedLocation) {
      const primary = locations.find((l) => l.is_primary)
      selectedLocation = primary || locations[0]
    }

    if (selectedLocation) {
      setActiveLocationState(selectedLocation)
      setIsAllLocationsMode(false)
      setLocationCookie(selectedLocation.id)
    }
  }, [locations, canSwitchLocation])

  // Switch to a specific location (admin-only)
  const switchLocation = useCallback((location: Location) => {
    if (!canSwitchLocation) {
      console.warn('Location switching is restricted to admin users')
      return
    }

    setActiveLocationState(location)
    setIsAllLocationsMode(false)
    localStorage.setItem(STORAGE_KEY, location.id)
    setLocationCookie(location.id)

    // Show toast notification
    toast.success(`Ahora viendo: ${location.name}`, {
      description: 'El dashboard muestra datos de esta sucursal',
      duration: 3000,
    })

    // Refresh server components to fetch data for new location
    router.refresh()
  }, [canSwitchLocation, router])

  // Switch to "All Locations" mode (admin-only, read-only)
  const switchToAllLocations = useCallback(() => {
    if (!canSwitchLocation) {
      console.warn('Location switching is restricted to admin users')
      return
    }

    setActiveLocationState(null)
    setIsAllLocationsMode(true)
    localStorage.setItem(STORAGE_KEY, ALL_LOCATIONS_VALUE)
    setLocationCookie(null)

    // Show toast notification
    toast.info('Modo: Todas las sucursales', {
      description: 'Vista de solo lectura. Selecciona una sucursal para crear registros.',
      duration: 4000,
    })

    // Refresh server components
    router.refresh()
  }, [canSwitchLocation, router])

  // Derived values
  const hasMultipleLocations = locations.length > 1
  const limits = useMemo(() => ({
    current: locations.length,
    max: maxLocations,
    canAddMore: maxLocations === -1 || locations.length < maxLocations,
  }), [locations.length, maxLocations])

  // Active location ID (null = all locations)
  const activeLocationId = isAllLocationsMode ? null : activeLocation?.id ?? null

  // Active location name for display
  const activeLocationName = isAllLocationsMode
    ? 'Todas las sucursales'
    : activeLocation?.name ?? 'Cargando...'

  // Can create only when NOT in "All Locations" mode
  const canCreate = !isAllLocationsMode && activeLocation !== null

  const value = useMemo<LocationContextValue>(
    () => ({
      locations,
      activeLocation,
      activeLocationId,
      activeLocationName,
      isAllLocationsMode,
      canCreate,
      loading: loading || permissionsLoading,
      error,
      switchLocation,
      switchToAllLocations,
      refresh: fetchLocations,
      hasMultipleLocations,
      limits,
      canSwitchLocation,
    }),
    [
      locations,
      activeLocation,
      activeLocationId,
      activeLocationName,
      isAllLocationsMode,
      canCreate,
      loading,
      permissionsLoading,
      error,
      switchLocation,
      switchToAllLocations,
      fetchLocations,
      hasMultipleLocations,
      limits,
      canSwitchLocation
    ]
  )

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  )
}

// =============================================================================
// Hooks
// =============================================================================

export function useLocationContext() {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useLocationContext must be used within LocationProvider')
  }
  return context
}

/**
 * Get the active location context for the dashboard
 * This is the primary hook for location-aware components
 */
export function useActiveLocation() {
  const {
    activeLocation,
    activeLocationId,
    activeLocationName,
    isAllLocationsMode,
    canCreate,
    loading
  } = useLocationContext()

  return {
    location: activeLocation,
    locationId: activeLocationId,
    locationName: activeLocationName,
    isAllLocationsMode,
    canCreate,
    loading
  }
}

/**
 * Get just the current location (legacy support)
 * @deprecated Use useActiveLocation instead
 */
export function useCurrentLocation() {
  const { activeLocation, loading } = useLocationContext()
  return { location: activeLocation, loading }
}

/**
 * Get all locations
 */
export function useLocations() {
  const { locations, loading, refresh, limits } = useLocationContext()
  return { locations, loading, refresh, limits }
}

/**
 * Hook that returns the active location ID for use in queries
 * Returns null if in "All Locations" mode
 */
export function useActiveLocationId(): string | null {
  const { activeLocationId } = useLocationContext()
  return activeLocationId
}

/**
 * Hook that guards create actions
 * Returns true if creation is allowed, false if in "All Locations" mode
 */
export function useCanCreate(): boolean {
  const { canCreate } = useLocationContext()
  return canCreate
}
