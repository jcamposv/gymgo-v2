'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface ActionResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string[]>
}

type ProfileWithOrg = { organization_id: string | null; role: string } | null

async function getProfileWithOrg(supabase: Awaited<ReturnType<typeof createClient>>): Promise<ProfileWithOrg> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  return data as ProfileWithOrg
}

/**
 * Obtiene la organizacion actual del usuario autenticado
 */
export async function getCurrentOrganization(): Promise<ActionResponse> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, message: 'Usuario no autenticado' }
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  const profile = profileData as { organization_id: string | null } | null

  if (!profile?.organization_id) {
    return { success: false, message: 'Sin organizacion asignada' }
  }

  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', profile.organization_id)
    .single()

  if (!organization) {
    return { success: false, message: 'Organizacion no encontrada' }
  }

  return { success: true, message: 'OK', data: organization }
}

/**
 * Actualiza la informacion basica de la organizacion
 */
export async function updateOrganizationInfo(
  data: {
    name?: string
    email?: string
    phone?: string
    website?: string
  }
): Promise<ActionResponse> {
  const supabase = await createClient()

  const profile = await getProfileWithOrg(supabase)
  const organizationId = profile?.organization_id
  if (!organizationId) {
    return { success: false, message: 'Sin organizacion asignada' }
  }

  if (!profile || !['owner', 'admin'].includes(profile.role)) {
    return { success: false, message: 'Sin permisos para editar' }
  }

  const { error } = await supabase
    .from('organizations')
    .update({
      name: data.name,
      email: data.email,
      phone: data.phone,
      website: data.website,
    } as never)
    .eq('id', organizationId)

  if (error) {
    console.error('Update organization error:', error)
    return { success: false, message: 'Error al actualizar organizacion' }
  }

  revalidatePath('/dashboard/settings')
  return { success: true, message: 'Informacion actualizada' }
}

/**
 * Actualiza el branding de la organizacion (logo, colores)
 */
export async function updateOrganizationBranding(
  data: {
    logo_url?: string | null
    primary_color?: string
    secondary_color?: string
  }
): Promise<ActionResponse> {
  const supabase = await createClient()

  const profile = await getProfileWithOrg(supabase)
  const organizationId = profile?.organization_id
  if (!organizationId) {
    return { success: false, message: 'Sin organizacion asignada' }
  }

  if (!profile || !['owner', 'admin'].includes(profile.role)) {
    return { success: false, message: 'Sin permisos para editar' }
  }

  const { error } = await supabase
    .from('organizations')
    .update({
      logo_url: data.logo_url,
      primary_color: data.primary_color,
      secondary_color: data.secondary_color,
    } as never)
    .eq('id', organizationId)

  if (error) {
    console.error('Update branding error:', error)
    return { success: false, message: 'Error al actualizar branding' }
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  return { success: true, message: 'Branding actualizado' }
}

/**
 * Actualiza la direccion de la organizacion
 */
export async function updateOrganizationAddress(
  data: {
    address_line1?: string
    address_line2?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
  }
): Promise<ActionResponse> {
  const supabase = await createClient()

  const profile = await getProfileWithOrg(supabase)
  const organizationId = profile?.organization_id
  if (!organizationId) {
    return { success: false, message: 'Sin organizacion asignada' }
  }

  if (!profile || !['owner', 'admin'].includes(profile.role)) {
    return { success: false, message: 'Sin permisos para editar' }
  }

  const { error } = await supabase
    .from('organizations')
    .update({
      address_line1: data.address_line1,
      address_line2: data.address_line2,
      city: data.city,
      state: data.state,
      postal_code: data.postal_code,
      country: data.country,
    } as never)
    .eq('id', organizationId)

  if (error) {
    console.error('Update address error:', error)
    return { success: false, message: 'Error al actualizar direccion' }
  }

  revalidatePath('/dashboard/settings')
  return { success: true, message: 'Direccion actualizada' }
}

/**
 * Actualiza la configuracion regional de la organizacion (pais, moneda, idioma, zona horaria)
 */
export async function updateOrganizationRegional(
  data: {
    country?: string
    currency?: string
    language?: string
    timezone?: string
  }
): Promise<ActionResponse> {
  const supabase = await createClient()

  const profile = await getProfileWithOrg(supabase)
  const organizationId = profile?.organization_id
  if (!organizationId) {
    return { success: false, message: 'Sin organizacion asignada' }
  }

  if (!profile || !['owner', 'admin'].includes(profile.role)) {
    return { success: false, message: 'Sin permisos para editar' }
  }

  const { error } = await supabase
    .from('organizations')
    .update({
      country: data.country,
      currency: data.currency,
      language: data.language,
      timezone: data.timezone,
    } as never)
    .eq('id', organizationId)

  if (error) {
    console.error('Update regional error:', error)
    return { success: false, message: 'Error al actualizar configuracion regional' }
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/finances')
  return { success: true, message: 'Configuracion regional actualizada' }
}
