'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { onboardingSchema, type OnboardingData } from '@/schemas/onboarding.schema'
import type { TablesInsert } from '@/types/database.types'

export type ActionState = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
  data?: unknown
}

// =============================================================================
// CHECK IF USER NEEDS ONBOARDING
// =============================================================================

export async function checkOnboardingStatus(): Promise<{
  needsOnboarding: boolean
  organizationId: string | null
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { needsOnboarding: false, organizationId: null, error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    return { needsOnboarding: true, organizationId: null, error: error.message }
  }

  const profile = data as { organization_id: string | null } | null

  if (!profile || !profile.organization_id) {
    return { needsOnboarding: true, organizationId: null, error: null }
  }

  return { needsOnboarding: false, organizationId: profile.organization_id, error: null }
}

// =============================================================================
// CHECK SLUG AVAILABILITY
// =============================================================================

export async function checkSlugAvailability(slug: string): Promise<{
  available: boolean
  error: string | null
}> {
  if (!slug || slug.length < 3) {
    return { available: false, error: 'El slug debe tener al menos 3 caracteres' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', slug.toLowerCase())
    .maybeSingle()

  if (error) {
    return { available: false, error: error.message }
  }

  return { available: !data, error: null }
}

// =============================================================================
// COMPLETE ONBOARDING
// =============================================================================

export async function completeOnboarding(data: OnboardingData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: 'No autenticado' }
  }

  // Validate data
  const validated = onboardingSchema.safeParse(data)

  if (!validated.success) {
    return {
      success: false,
      message: 'Datos invalidos',
      errors: validated.error.flatten().fieldErrors,
    }
  }

  // Check slug availability
  const { available, error: slugError } = await checkSlugAvailability(validated.data.slug)

  if (slugError) {
    return { success: false, message: slugError }
  }

  if (!available) {
    return {
      success: false,
      message: 'Este slug ya esta en uso',
      errors: { slug: ['Este slug ya esta en uso. Elige otro.'] },
    }
  }

  // Create organization
  // Note: subscription_started_at is left null - it's set when user selects a plan
  // post-login-redirect uses this field to detect when plan selection is needed
  const organizationData: TablesInsert<'organizations'> = {
    name: validated.data.name,
    slug: validated.data.slug.toLowerCase(),
    business_type: validated.data.business_type,
    country: validated.data.country,
    currency: validated.data.currency,
    timezone: validated.data.timezone,
    language: validated.data.language,
    primary_color: validated.data.primary_color,
    secondary_color: validated.data.secondary_color,
    // subscription_started_at left null - set during plan selection
    // Default limits for trial/free tier before plan selection
    max_members: 50,
    max_locations: 1,
    max_admin_users: 2,
    features: {
      reservations: true,
      check_in: true,
      basic_reports: true,
      ai_coach: false,
      churn_prediction: false,
      whatsapp_bot: false,
    },
  }

  const { data: orgData, error: orgError } = await supabase
    .from('organizations')
    .insert(organizationData as never)
    .select()
    .single()

  if (orgError) {
    console.error('Error creating organization:', orgError)
    return { success: false, message: 'Error al crear la organizacion: ' + orgError.message }
  }

  const organization = orgData as { id: string; [key: string]: unknown }

  // Update user profile with organization_id and role
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      organization_id: organization.id,
      role: 'owner',
    } as never)
    .eq('id', user.id)

  if (profileError) {
    // Rollback: delete the organization
    await supabase.from('organizations').delete().eq('id', organization.id)
    console.error('Error updating profile:', profileError)
    return { success: false, message: 'Error al actualizar perfil: ' + profileError.message }
  }

  revalidatePath('/', 'layout')

  return {
    success: true,
    message: 'Organizacion creada exitosamente',
    data: organization,
  }
}

// =============================================================================
// GET CURRENT ORGANIZATION
// =============================================================================

export interface Organization {
  id: string
  name: string
  slug: string
  business_type: string | null
  country: string | null
  currency: string | null
  timezone: string | null
  language: string | null
  primary_color: string | null
  secondary_color: string | null
  subscription_plan: string | null
  max_members: number | null
  max_locations: number | null
  max_admin_users: number | null
  features: Record<string, boolean> | null
  created_at: string
  updated_at: string
}

export async function getCurrentOrganization(): Promise<{
  data: Organization | null
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'Not authenticated' }
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  const profile = profileData as { organization_id: string | null } | null

  if (!profile?.organization_id) {
    return { data: null, error: 'No organization found' }
  }

  const { data: organization, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', profile.organization_id)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: organization as Organization, error: null }
}

// =============================================================================
// UPDATE ORGANIZATION
// =============================================================================

export async function updateOrganization(
  updates: Partial<OnboardingData>
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: 'No autenticado' }
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  const profile = profileData as { organization_id: string | null; role: string } | null

  if (!profile?.organization_id) {
    return { success: false, message: 'No se encontro la organizacion' }
  }

  if (profile.role !== 'owner' && profile.role !== 'admin') {
    return { success: false, message: 'No tienes permisos para editar la organizacion' }
  }

  // If slug is being updated, check availability
  if (updates.slug) {
    const { data: currentOrgData } = await supabase
      .from('organizations')
      .select('slug')
      .eq('id', profile.organization_id)
      .single()

    const currentOrg = currentOrgData as { slug: string } | null

    if (currentOrg?.slug !== updates.slug) {
      const { available, error } = await checkSlugAvailability(updates.slug)
      if (error || !available) {
        return {
          success: false,
          message: 'Este slug ya esta en uso',
          errors: { slug: ['Este slug ya esta en uso'] },
        }
      }
    }
  }

  const { error } = await supabase
    .from('organizations')
    .update(updates as never)
    .eq('id', profile.organization_id)

  if (error) {
    return { success: false, message: error.message }
  }

  revalidatePath('/settings')
  return { success: true, message: 'Organizacion actualizada' }
}
