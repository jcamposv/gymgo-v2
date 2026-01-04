'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { MemberMeasurement, MeasurementFormData } from '@/types/member.types'
import {
  requireAnyPermission,
  requirePermission,
  type ActionResult,
  successResult,
  errorResult,
  forbiddenResult,
  unauthorizedResult,
} from '@/lib/auth/server-auth'

// Legacy type export for backward compatibility
export type ActionState = ActionResult

// =============================================================================
// GET MEMBER MEASUREMENTS
// =============================================================================

export async function getMemberMeasurements(
  memberId: string
): Promise<{ data: MemberMeasurement[] | null; error: string | null }> {
  // Trainers, nutritionists, and admins can view measurements
  const { authorized, user, error } = await requireAnyPermission(['view_members', 'manage_members'])

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()

  const { data, error: dbError } = await supabase
    .from('member_measurements')
    .select('*')
    .eq('member_id', memberId)
    .eq('organization_id', user.organizationId)
    .order('measured_at', { ascending: false })

  if (dbError) {
    return { data: null, error: dbError.message }
  }

  return { data: data as MemberMeasurement[], error: null }
}

// =============================================================================
// GET LATEST MEASUREMENT
// =============================================================================

export async function getLatestMeasurement(
  memberId: string
): Promise<{ data: MemberMeasurement | null; error: string | null }> {
  const { authorized, user, error } = await requireAnyPermission(['view_members', 'manage_members'])

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()

  const { data, error: dbError } = await supabase
    .from('member_measurements')
    .select('*')
    .eq('member_id', memberId)
    .eq('organization_id', user.organizationId)
    .order('measured_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (dbError) {
    return { data: null, error: dbError.message }
  }

  return { data: data as MemberMeasurement | null, error: null }
}

// =============================================================================
// CREATE MEASUREMENT
// =============================================================================

export async function createMeasurement(
  memberId: string,
  formData: MeasurementFormData
): Promise<ActionState> {
  // Trainers and nutritionists can record measurements
  const { authorized, user, error } = await requirePermission('manage_members')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  // Validate required field
  if (!formData.measured_at) {
    return errorResult('La fecha de medicion es requerida', { measured_at: ['La fecha es requerida'] })
  }

  const supabase = await createClient()

  // Verify member belongs to organization
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id')
    .eq('id', memberId)
    .eq('organization_id', user!.organizationId)
    .single()

  if (memberError || !member) {
    return errorResult('Miembro no encontrado o acceso denegado')
  }

  // Prepare insert data - mapping simplified form to database columns
  const insertData = {
    member_id: memberId,
    organization_id: user!.organizationId,
    measured_at: formData.measured_at,
    // Core body measurements (metric)
    body_height_cm: formData.height_cm ?? null,
    body_weight_kg: formData.weight_kg ?? null,
    // Body composition
    body_fat_percentage: formData.body_fat_percentage ?? null,
    muscle_mass_kg: formData.muscle_mass_kg ?? null,
    // Circumference measurements
    waist_cm: formData.waist_cm ?? null,
    hip_cm: formData.hip_cm ?? null,
    // Notes
    notes: formData.notes ?? null,
    recorded_by_id: user!.id,
  }

  const { data, error: dbError } = await supabase
    .from('member_measurements')
    .insert(insertData as never)
    .select()
    .single()

  if (dbError) {
    console.error('Error creating measurement:', dbError)
    return errorResult(dbError.message)
  }

  revalidatePath(`/dashboard/members/${memberId}`)
  return successResult('Medicion registrada exitosamente', data as MemberMeasurement)
}

// =============================================================================
// UPDATE MEASUREMENT
// =============================================================================

export async function updateMeasurement(
  measurementId: string,
  formData: Partial<MeasurementFormData>
): Promise<ActionState> {
  const { authorized, user, error } = await requirePermission('manage_members')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  const supabase = await createClient()

  // Build update object with only provided fields (simplified for fitness)
  const updateData: Record<string, unknown> = {}

  if (formData.measured_at !== undefined) updateData.measured_at = formData.measured_at
  if (formData.height_cm !== undefined) updateData.body_height_cm = formData.height_cm
  if (formData.weight_kg !== undefined) updateData.body_weight_kg = formData.weight_kg
  if (formData.body_fat_percentage !== undefined) updateData.body_fat_percentage = formData.body_fat_percentage
  if (formData.muscle_mass_kg !== undefined) updateData.muscle_mass_kg = formData.muscle_mass_kg
  if (formData.waist_cm !== undefined) updateData.waist_cm = formData.waist_cm
  if (formData.hip_cm !== undefined) updateData.hip_cm = formData.hip_cm
  if (formData.notes !== undefined) updateData.notes = formData.notes

  const { data, error: dbError } = await supabase
    .from('member_measurements')
    .update(updateData as never)
    .eq('id', measurementId)
    .eq('organization_id', user!.organizationId)
    .select()
    .single()

  if (dbError) {
    return errorResult(dbError.message)
  }

  const measurement = data as MemberMeasurement
  revalidatePath(`/dashboard/members/${measurement.member_id}`)
  return successResult('Medicion actualizada exitosamente', measurement)
}

// =============================================================================
// DELETE MEASUREMENT
// =============================================================================

export async function deleteMeasurement(measurementId: string): Promise<ActionState> {
  const { authorized, user, error } = await requirePermission('manage_members')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  const supabase = await createClient()

  // Get measurement to know member_id for revalidation
  const { data: measurementData } = await supabase
    .from('member_measurements')
    .select('member_id')
    .eq('id', measurementId)
    .eq('organization_id', user!.organizationId)
    .single()

  const measurement = measurementData as { member_id: string } | null

  const { error: dbError } = await supabase
    .from('member_measurements')
    .delete()
    .eq('id', measurementId)
    .eq('organization_id', user!.organizationId)

  if (dbError) {
    return errorResult(dbError.message)
  }

  if (measurement) {
    revalidatePath(`/dashboard/members/${measurement.member_id}`)
  }

  return successResult('Medicion eliminada exitosamente')
}
