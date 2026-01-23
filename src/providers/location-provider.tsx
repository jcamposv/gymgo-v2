'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Location } from '@/schemas/location.schema'

// =============================================================================
// Types
// =============================================================================

interface LocationContextValue {
  /** All locations for the organization */
  locations: Location[]
  /** Currently selected location */
  currentLocation: Location | null
  /** Loading state */
  loading: boolean
  /** Error message if any */
  error: string | null
  /** Select a different location */
  setCurrentLocation: (location: Location) => void
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
}

const STORAGE_KEY = 'gymgo-current-location-id'

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
  const [locations, setLocations] = useState<Location[]>(initialLocations ?? [])
  const [currentLocation, setCurrentLocationState] = useState<Location | null>(null)
  const [loading, setLoading] = useState(!initialLocations)
  const [error, setError] = useState<string | null>(null)

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

  // Set initial current location from localStorage or primary
  useEffect(() => {
    if (locations.length === 0) return

    // Try to restore from localStorage
    const savedId = localStorage.getItem(STORAGE_KEY)
    if (savedId) {
      const saved = locations.find((l) => l.id === savedId)
      if (saved) {
        setCurrentLocationState(saved)
        return
      }
    }

    // Fall back to primary location
    const primary = locations.find((l) => l.is_primary)
    if (primary) {
      setCurrentLocationState(primary)
    } else {
      // Just use first one
      setCurrentLocationState(locations[0])
    }
  }, [locations])

  // Select a location
  const setCurrentLocation = useCallback((location: Location) => {
    setCurrentLocationState(location)
    localStorage.setItem(STORAGE_KEY, location.id)
  }, [])

  // Derived values
  const hasMultipleLocations = locations.length > 1
  const limits = useMemo(() => ({
    current: locations.length,
    max: maxLocations,
    canAddMore: maxLocations === -1 || locations.length < maxLocations,
  }), [locations.length, maxLocations])

  const value = useMemo<LocationContextValue>(
    () => ({
      locations,
      currentLocation,
      loading,
      error,
      setCurrentLocation,
      refresh: fetchLocations,
      hasMultipleLocations,
      limits,
    }),
    [locations, currentLocation, loading, error, setCurrentLocation, fetchLocations, hasMultipleLocations, limits]
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
 * Get just the current location
 */
export function useCurrentLocation() {
  const { currentLocation, loading } = useLocationContext()
  return { location: currentLocation, loading }
}

/**
 * Get all locations
 */
export function useLocations() {
  const { locations, loading, refresh, limits } = useLocationContext()
  return { locations, loading, refresh, limits }
}
