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
import type { Tables } from '@/types/database.types'

// =============================================================================
// Types
// =============================================================================

export interface OrganizationSettings {
  id: string
  name: string
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
}

interface OrganizationContextValue {
  /** Organization settings (branding, name, etc.) */
  settings: OrganizationSettings | null
  /** Full organization data */
  organization: Tables<'organizations'> | null
  /** Loading state */
  loading: boolean
  /** Error message if any */
  error: string | null
  /** Refresh organization data from server */
  refresh: () => Promise<void>
}

// =============================================================================
// Context
// =============================================================================

const OrganizationContext = createContext<OrganizationContextValue | null>(null)

// =============================================================================
// Provider
// =============================================================================

interface OrganizationProviderProps {
  children: React.ReactNode
  /** Initial organization data (from SSR) */
  initialOrganization?: Tables<'organizations'> | null
}

export function OrganizationProvider({
  children,
  initialOrganization,
}: OrganizationProviderProps) {
  const [organization, setOrganization] = useState<Tables<'organizations'> | null>(
    initialOrganization ?? null
  )
  const [loading, setLoading] = useState(!initialOrganization)
  const [error, setError] = useState<string | null>(null)

  // Fetch organization data
  const fetchOrganization = useCallback(async () => {
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

      // Get organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .single()

      if (orgError || !orgData) {
        setError('Organizacion no encontrada')
        setLoading(false)
        return
      }

      setOrganization(orgData as Tables<'organizations'>)
      setError(null)
    } catch {
      setError('Error al cargar organizacion')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch if no initial data
  useEffect(() => {
    if (!initialOrganization) {
      fetchOrganization()
    }
  }, [initialOrganization, fetchOrganization])

  // Derive settings from organization
  const settings = useMemo<OrganizationSettings | null>(() => {
    if (!organization) return null

    return {
      id: organization.id,
      name: organization.name,
      logoUrl: organization.logo_url,
      primaryColor: organization.primary_color,
      secondaryColor: organization.secondary_color,
    }
  }, [organization])

  const value = useMemo<OrganizationContextValue>(
    () => ({
      settings,
      organization,
      loading,
      error,
      refresh: fetchOrganization,
    }),
    [settings, organization, loading, error, fetchOrganization]
  )

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  )
}

// =============================================================================
// Hook
// =============================================================================

export function useOrganizationContext() {
  const context = useContext(OrganizationContext)
  if (!context) {
    throw new Error('useOrganizationContext must be used within OrganizationProvider')
  }
  return context
}

/**
 * Convenience hook to get just the settings
 */
export function useOrganizationSettings() {
  const { settings, loading, error, refresh } = useOrganizationContext()
  return { settings, loading, error, refresh }
}
