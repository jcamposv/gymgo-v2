'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { MemberMeasurement, MeasurementFormData } from '@/types/member.types'

// =============================================================================
// TYPES
// =============================================================================

export type ActionState = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
  data?: unknown
}

interface UserProfile {
  organization_id: string
  role: string
  userId: string
}

// =============================================================================
// HELPER: Get User Profile
// =============================================================================

async function getUserProfile(): Promise<{ profile: UserProfile | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { profile: null, error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (error || !data) {
    return { profile: null, error: 'No organization found' }
  }

  const profileData = data as { organization_id: string | null; role: string }
  if (!profileData.organization_id) {
    return { profile: null, error: 'No organization found' }
  }

  return {
    profile: {
      organization_id: profileData.organization_id,
      role: profileData.role,
      userId: user.id
    },
    error: null
  }
}

// =============================================================================
// GET MEMBER MEASUREMENTS
// =============================================================================

export async function getMemberMeasurements(
  memberId: string
): Promise<{ data: MemberMeasurement[] | null; error: string | null }> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { data: null, error: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('member_measurements')
    .select('*')
    .eq('member_id', memberId)
    .eq('organization_id', profile.organization_id)
    .order('measured_at', { ascending: false })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as MemberMeasurement[], error: null }
}

// =============================================================================
// GET LATEST MEASUREMENT
// =============================================================================

export async function getLatestMeasurement(
  memberId: string
): Promise<{ data: MemberMeasurement | null; error: string | null }> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { data: null, error: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('member_measurements')
    .select('*')
    .eq('member_id', memberId)
    .eq('organization_id', profile.organization_id)
    .order('measured_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return { data: null, error: error.message }
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
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  // Validate required field
  if (!formData.measured_at) {
    return {
      success: false,
      message: 'Measurement date is required',
      errors: { measured_at: ['Date is required'] }
    }
  }

  const supabase = await createClient()

  // Verify member belongs to organization
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id')
    .eq('id', memberId)
    .eq('organization_id', profile.organization_id)
    .single()

  if (memberError || !member) {
    return {
      success: false,
      message: 'Member not found or access denied'
    }
  }

  // Prepare insert data - mapping simplified form to database columns
  const insertData = {
    member_id: memberId,
    organization_id: profile.organization_id,
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
    recorded_by_id: profile.userId,
  }

  const { data, error } = await supabase
    .from('member_measurements')
    .insert(insertData as never)
    .select()
    .single()

  if (error) {
    console.error('Error creating measurement:', error)
    return {
      success: false,
      message: error.message
    }
  }

  revalidatePath(`/dashboard/members/${memberId}`)

  return {
    success: true,
    message: 'Measurement recorded successfully',
    data: data as MemberMeasurement
  }
}

// =============================================================================
// UPDATE MEASUREMENT
// =============================================================================

export async function updateMeasurement(
  measurementId: string,
  formData: Partial<MeasurementFormData>
): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
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

  const { data, error } = await supabase
    .from('member_measurements')
    .update(updateData as never)
    .eq('id', measurementId)
    .eq('organization_id', profile.organization_id)
    .select()
    .single()

  if (error) {
    return {
      success: false,
      message: error.message
    }
  }

  const measurement = data as MemberMeasurement
  revalidatePath(`/dashboard/members/${measurement.member_id}`)

  return {
    success: true,
    message: 'Measurement updated successfully',
    data: measurement
  }
}

// =============================================================================
// DELETE MEASUREMENT
// =============================================================================

export async function deleteMeasurement(measurementId: string): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  // Get measurement to know member_id for revalidation
  const { data: measurementData } = await supabase
    .from('member_measurements')
    .select('member_id')
    .eq('id', measurementId)
    .eq('organization_id', profile.organization_id)
    .single()

  const measurement = measurementData as { member_id: string } | null

  const { error } = await supabase
    .from('member_measurements')
    .delete()
    .eq('id', measurementId)
    .eq('organization_id', profile.organization_id)

  if (error) {
    return {
      success: false,
      message: error.message
    }
  }

  if (measurement) {
    revalidatePath(`/dashboard/members/${measurement.member_id}`)
  }

  return {
    success: true,
    message: 'Measurement deleted successfully'
  }
}
