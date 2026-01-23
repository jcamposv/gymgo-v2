'use server'

/**
 * Location Server Actions
 *
 * CRUD operations for gym locations/branches.
 * Phase 1: No UI exposure yet - foundation only.
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  requirePermission,
  type ActionResult,
  successResult,
  errorResult,
  unauthorizedResult,
} from '@/lib/auth/server-auth'
import { checkLocationLimit, PLAN_LIMIT_ERROR_CODE } from '@/lib/plan-limits'
import {
  locationCreateSchema,
  locationUpdateSchema,
  type LocationCreateFormData,
  type LocationUpdateFormData,
  type Location,
  generateSlug,
} from '@/schemas/location.schema'


// =============================================================================
// GET LOCATIONS
// =============================================================================

export async function getLocations(): Promise<{
  data: Location[] | null
  error: string | null
}> {
  const { authorized, user, error } = await requirePermission('view_admin_dashboard')

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()

  const { data, error: dbError } = await supabase
    .from('locations')
    .select('*')
    .eq('organization_id', user.organizationId)
    .order('is_primary', { ascending: false })
    .order('name', { ascending: true })

  if (dbError) {
    // Table might not exist yet
    if (dbError.code === '42P01') {
      return { data: [], error: null }
    }
    console.error('Error fetching locations:', dbError)
    return { data: null, error: dbError.message }
  }

  return { data: data as Location[], error: null }
}

// =============================================================================
// GET SINGLE LOCATION
// =============================================================================

export async function getLocation(id: string): Promise<{
  data: Location | null
  error: string | null
}> {
  const { authorized, user, error } = await requirePermission('view_admin_dashboard')

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()

  const { data, error: dbError } = await supabase
    .from('locations')
    .select('*')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .single()

  if (dbError) {
    console.error('Error fetching location:', dbError)
    return { data: null, error: dbError.message }
  }

  return { data: data as Location, error: null }
}

// =============================================================================
// GET PRIMARY LOCATION
// =============================================================================

export async function getPrimaryLocation(): Promise<{
  data: Location | null
  error: string | null
}> {
  const { authorized, user, error } = await requirePermission('view_admin_dashboard')

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()

  const { data, error: dbError } = await supabase
    .from('locations')
    .select('*')
    .eq('organization_id', user.organizationId)
    .eq('is_primary', true)
    .single()

  if (dbError) {
    // Table might not exist yet
    if (dbError.code === '42P01' || dbError.code === 'PGRST116') {
      return { data: null, error: null }
    }
    console.error('Error fetching primary location:', dbError)
    return { data: null, error: dbError.message }
  }

  return { data: data as Location, error: null }
}

// =============================================================================
// CREATE LOCATION
// =============================================================================

export async function createLocation(
  formData: LocationCreateFormData
): Promise<ActionResult> {
  const { authorized, user, error } = await requirePermission('manage_gym_settings')

  if (!authorized || !user) {
    return unauthorizedResult(error || undefined)
  }

  // Validate input
  const validation = locationCreateSchema.safeParse(formData)
  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors
    const errors: Record<string, string[]> = {}
    for (const [key, value] of Object.entries(fieldErrors)) {
      if (value) errors[key] = value
    }
    return errorResult('Datos inválidos', errors)
  }

  // Check plan limit
  const limitCheck = await checkLocationLimit(user.organizationId)
  if (!limitCheck.allowed) {
    return {
      success: false,
      message: limitCheck.message || 'Has alcanzado el límite de ubicaciones de tu plan',
      errors: {
        [PLAN_LIMIT_ERROR_CODE]: [
          limitCheck.message || 'Has alcanzado el límite de ubicaciones de tu plan. Actualiza tu plan para agregar más.',
        ],
      },
    }
  }

  const supabase = await createClient()
  const data = validation.data

  // Generate slug if not provided or auto-generate
  const slug = data.slug || generateSlug(data.name)

  // Check if slug already exists
  const { data: existingSlug } = await supabase
    .from('locations')
    .select('id')
    .eq('organization_id', user.organizationId)
    .eq('slug', slug)
    .single()

  if (existingSlug) {
    return errorResult('Ya existe una ubicación con ese identificador', {
      slug: ['Este identificador ya está en uso'],
    })
  }

  // Create location (is_primary defaults to false)
  const { data: newLocation, error: dbError } = await supabase
    .from('locations')
    .insert({
      organization_id: user.organizationId,
      name: data.name,
      slug,
      description: data.description || null,
      address_line1: data.address_line1 || null,
      address_line2: data.address_line2 || null,
      city: data.city || null,
      state: data.state || null,
      postal_code: data.postal_code || null,
      country: data.country || 'MX',
      phone: data.phone || null,
      email: data.email || null,
      is_primary: false,
      is_active: true,
    })
    .select()
    .single()

  if (dbError) {
    console.error('Error creating location:', dbError)
    return errorResult('Error al crear la ubicación')
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/settings/locations')

  return successResult('Ubicación creada exitosamente', { data: newLocation })
}

// =============================================================================
// UPDATE LOCATION
// =============================================================================

export async function updateLocation(
  id: string,
  formData: LocationUpdateFormData
): Promise<ActionResult> {
  const { authorized, user, error } = await requirePermission('manage_gym_settings')

  if (!authorized || !user) {
    return unauthorizedResult(error || undefined)
  }

  // Validate input
  const validation = locationUpdateSchema.safeParse(formData)
  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors
    const errors: Record<string, string[]> = {}
    for (const [key, value] of Object.entries(fieldErrors)) {
      if (value) errors[key] = value
    }
    return errorResult('Datos inválidos', errors)
  }

  const supabase = await createClient()
  const data = validation.data

  // Verify location exists and belongs to org
  const { data: existingLocation, error: fetchError } = await supabase
    .from('locations')
    .select('*')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .single()

  if (fetchError || !existingLocation) {
    return errorResult('Ubicación no encontrada')
  }

  // If updating slug, check it doesn't conflict
  if (data.slug && data.slug !== existingLocation.slug) {
    const { data: slugConflict } = await supabase
      .from('locations')
      .select('id')
      .eq('organization_id', user.organizationId)
      .eq('slug', data.slug)
      .neq('id', id)
      .single()

    if (slugConflict) {
      return errorResult('Ya existe una ubicación con ese identificador', {
        slug: ['Este identificador ya está en uso'],
      })
    }
  }

  // Cannot deactivate primary location
  if (existingLocation.is_primary && data.is_active === false) {
    return errorResult('No puedes desactivar la ubicación principal')
  }

  // Build update object
  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.slug !== undefined) updateData.slug = data.slug
  if (data.description !== undefined) updateData.description = data.description || null
  if (data.address_line1 !== undefined) updateData.address_line1 = data.address_line1 || null
  if (data.address_line2 !== undefined) updateData.address_line2 = data.address_line2 || null
  if (data.city !== undefined) updateData.city = data.city || null
  if (data.state !== undefined) updateData.state = data.state || null
  if (data.postal_code !== undefined) updateData.postal_code = data.postal_code || null
  if (data.country !== undefined) updateData.country = data.country || 'MX'
  if (data.phone !== undefined) updateData.phone = data.phone || null
  if (data.email !== undefined) updateData.email = data.email || null
  if (data.is_active !== undefined) updateData.is_active = data.is_active

  const { error: dbError } = await supabase
    .from('locations')
    .update(updateData)
    .eq('id', id)
    .eq('organization_id', user.organizationId)

  if (dbError) {
    console.error('Error updating location:', dbError)
    return errorResult('Error al actualizar la ubicación')
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/settings/locations')

  return successResult('Ubicación actualizada exitosamente')
}

// =============================================================================
// DELETE LOCATION
// =============================================================================

export async function deleteLocation(id: string): Promise<ActionResult> {
  const { authorized, user, error } = await requirePermission('manage_gym_settings')

  if (!authorized || !user) {
    return unauthorizedResult(error || undefined)
  }

  const supabase = await createClient()

  // Verify location exists and belongs to org
  const { data: existingLocation, error: fetchError } = await supabase
    .from('locations')
    .select('*')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .single()

  if (fetchError || !existingLocation) {
    return errorResult('Ubicación no encontrada')
  }

  // Cannot delete primary location
  if (existingLocation.is_primary) {
    return errorResult('No puedes eliminar la ubicación principal')
  }

  // TODO: In Phase 2+, check if location has associated data (members, classes, etc.)
  // For now, allow deletion since no entities are scoped to locations yet

  const { error: dbError } = await supabase
    .from('locations')
    .delete()
    .eq('id', id)
    .eq('organization_id', user.organizationId)

  if (dbError) {
    console.error('Error deleting location:', dbError)
    return errorResult('Error al eliminar la ubicación')
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/settings/locations')

  return successResult('Ubicación eliminada exitosamente')
}

// =============================================================================
// SET PRIMARY LOCATION
// =============================================================================

export async function setPrimaryLocation(id: string): Promise<ActionResult> {
  const { authorized, user, error } = await requirePermission('manage_gym_settings')

  if (!authorized || !user) {
    return unauthorizedResult(error || undefined)
  }

  const supabase = await createClient()

  // Verify location exists, is active, and belongs to org
  const { data: newPrimary, error: fetchError } = await supabase
    .from('locations')
    .select('*')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .single()

  if (fetchError || !newPrimary) {
    return errorResult('Ubicación no encontrada')
  }

  if (!newPrimary.is_active) {
    return errorResult('No puedes establecer una ubicación inactiva como principal')
  }

  if (newPrimary.is_primary) {
    return successResult('Esta ubicación ya es la principal')
  }

  // Transaction: unset current primary, set new primary
  // First, unset all primaries (should only be one)
  const { error: unsetError } = await supabase
    .from('locations')
    .update({ is_primary: false })
    .eq('organization_id', user.organizationId)
    .eq('is_primary', true)

  if (unsetError) {
    console.error('Error unsetting primary:', unsetError)
    return errorResult('Error al cambiar la ubicación principal')
  }

  // Set new primary
  const { error: setError } = await supabase
    .from('locations')
    .update({ is_primary: true })
    .eq('id', id)
    .eq('organization_id', user.organizationId)

  if (setError) {
    console.error('Error setting primary:', setError)
    return errorResult('Error al cambiar la ubicación principal')
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/settings/locations')

  return successResult('Ubicación principal actualizada')
}

// =============================================================================
// GET LOCATION COUNT (for plan limit display)
// =============================================================================

export async function getLocationCount(): Promise<{
  current: number
  limit: number
  canAddMore: boolean
}> {
  const { authorized, user } = await requirePermission('view_admin_dashboard')

  if (!authorized || !user) {
    return { current: 0, limit: 1, canAddMore: false }
  }

  const limitCheck = await checkLocationLimit(user.organizationId)

  return {
    current: limitCheck.current,
    limit: limitCheck.limit,
    canAddMore: limitCheck.allowed,
  }
}
