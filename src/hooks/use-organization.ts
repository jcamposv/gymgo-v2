'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/types/database.types'

type Organization = Tables<'organizations'>
type Profile = Tables<'profiles'>

interface OrganizationState {
  organization: Organization | null
  profile: Profile | null
  loading: boolean
  error: string | null
}

export function useOrganization() {
  const [state, setState] = useState<OrganizationState>({
    organization: null,
    profile: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    const fetchOrganization = async () => {
      const supabase = createClient()

      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'Usuario no autenticado',
          }))
          return
        }

        // Get profile with organization_id
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        const profile = profileData as Profile | null

        if (profileError || !profile) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'Perfil no encontrado',
          }))
          return
        }

        const organizationId = profile.organization_id
        if (!organizationId) {
          setState(prev => ({
            ...prev,
            profile,
            loading: false,
            error: 'Sin organizacion asignada',
          }))
          return
        }

        // Get organization details
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', organizationId)
          .single()

        const organization = orgData as Organization | null

        if (orgError || !organization) {
          setState(prev => ({
            ...prev,
            profile,
            loading: false,
            error: 'Organizacion no encontrada',
          }))
          return
        }

        setState({
          organization,
          profile,
          loading: false,
          error: null,
        })
      } catch {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Error al cargar organizacion',
        }))
      }
    }

    fetchOrganization()
  }, [])

  return {
    organization: state.organization,
    organizationId: state.organization?.id ?? null,
    profile: state.profile,
    loading: state.loading,
    error: state.error,
  }
}
