'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { memberSchema, memberUpdateSchema, type MemberFormData } from '@/schemas/member.schema'
import type { Tables, TablesInsert, MemberStatus } from '@/types/database.types'

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
// GET MEMBERS
// =============================================================================

export async function getMembers(params?: {
  query?: string
  status?: MemberStatus
  page?: number
  per_page?: number
}): Promise<{ data: Tables<'members'>[] | null; count: number; error: string | null }> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { data: null, count: 0, error: profileError ?? 'No profile found' }
  }

  const page = params?.page ?? 1
  const perPage = params?.per_page ?? 20
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const supabase = await createClient()

  let query = supabase
    .from('members')
    .select('*', { count: 'exact' })
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (params?.query) {
    query = query.or(`full_name.ilike.%${params.query}%,email.ilike.%${params.query}%`)
  }

  if (params?.status) {
    query = query.eq('status', params.status)
  }

  const { data, count, error } = await query

  if (error) {
    return { data: null, count: 0, error: error.message }
  }

  return { data, count: count ?? 0, error: null }
}

// =============================================================================
// GET SINGLE MEMBER
// =============================================================================

export async function getMember(id: string): Promise<{ data: Tables<'members'> | null; error: string | null }> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { data: null, error: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

// =============================================================================
// CREATE MEMBER
// =============================================================================

export async function createMember(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const rawData = {
    email: formData.get('email'),
    full_name: formData.get('full_name'),
    phone: formData.get('phone') || null,
    date_of_birth: formData.get('date_of_birth') || null,
    gender: formData.get('gender') || null,
    emergency_contact_name: formData.get('emergency_contact_name') || null,
    emergency_contact_phone: formData.get('emergency_contact_phone') || null,
    medical_conditions: formData.get('medical_conditions') || null,
    injuries: formData.get('injuries') || null,
    experience_level: formData.get('experience_level') || 'beginner',
    status: formData.get('status') || 'active',
    internal_notes: formData.get('internal_notes') || null,
  }

  const validated = memberSchema.safeParse(rawData)

  if (!validated.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: validated.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()

  const insertData: TablesInsert<'members'> = {
    ...validated.data,
    organization_id: profile.organization_id,
  }

  const { data, error } = await supabase
    .from('members')
    .insert(insertData as never)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return {
        success: false,
        message: 'A member with this email already exists',
      }
    }
    return {
      success: false,
      message: error.message,
    }
  }

  revalidatePath('/dashboard/members')
  return {
    success: true,
    message: 'Member created successfully',
    data,
  }
}

// =============================================================================
// UPDATE MEMBER
// =============================================================================

export async function updateMember(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const rawData = {
    email: formData.get('email'),
    full_name: formData.get('full_name'),
    phone: formData.get('phone') || null,
    date_of_birth: formData.get('date_of_birth') || null,
    gender: formData.get('gender') || null,
    emergency_contact_name: formData.get('emergency_contact_name') || null,
    emergency_contact_phone: formData.get('emergency_contact_phone') || null,
    medical_conditions: formData.get('medical_conditions') || null,
    injuries: formData.get('injuries') || null,
    experience_level: formData.get('experience_level') || 'beginner',
    status: formData.get('status') || 'active',
    internal_notes: formData.get('internal_notes') || null,
  }

  const validated = memberUpdateSchema.safeParse(rawData)

  if (!validated.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: validated.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('members')
    .update(validated.data as never)
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .select()
    .single()

  if (error) {
    return {
      success: false,
      message: error.message,
    }
  }

  revalidatePath('/dashboard/members')
  revalidatePath(`/dashboard/members/${id}`)
  return {
    success: true,
    message: 'Member updated successfully',
    data,
  }
}

// =============================================================================
// DELETE MEMBER
// =============================================================================

export async function deleteMember(id: string): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', id)
    .eq('organization_id', profile.organization_id)

  if (error) {
    return {
      success: false,
      message: error.message,
    }
  }

  revalidatePath('/dashboard/members')
  return {
    success: true,
    message: 'Member deleted successfully',
  }
}

// =============================================================================
// CREATE MEMBER (Data-based - for react-hook-form)
// =============================================================================

export async function createMemberData(data: MemberFormData): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const validated = memberSchema.safeParse(data)

  if (!validated.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: validated.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()

  const insertData: TablesInsert<'members'> = {
    ...validated.data,
    organization_id: profile.organization_id,
  }

  const { data: member, error } = await supabase
    .from('members')
    .insert(insertData as never)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return {
        success: false,
        message: 'Ya existe un miembro con este email',
      }
    }
    return {
      success: false,
      message: error.message,
    }
  }

  revalidatePath('/dashboard/members')
  return {
    success: true,
    message: 'Miembro creado exitosamente',
    data: member,
  }
}

// =============================================================================
// UPDATE MEMBER (Data-based - for react-hook-form)
// =============================================================================

export async function updateMemberData(
  id: string,
  data: Partial<MemberFormData>
): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const validated = memberUpdateSchema.safeParse(data)

  if (!validated.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: validated.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()

  const { data: member, error } = await supabase
    .from('members')
    .update(validated.data as never)
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .select()
    .single()

  if (error) {
    return {
      success: false,
      message: error.message,
    }
  }

  revalidatePath('/dashboard/members')
  revalidatePath(`/dashboard/members/${id}`)
  return {
    success: true,
    message: 'Miembro actualizado exitosamente',
    data: member,
  }
}

// =============================================================================
// UPDATE MEMBER STATUS
// =============================================================================

export async function updateMemberStatus(
  id: string,
  status: MemberStatus
): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('members')
    .update({ status } as never)
    .eq('id', id)
    .eq('organization_id', profile.organization_id)

  if (error) {
    return {
      success: false,
      message: error.message,
    }
  }

  revalidatePath('/dashboard/members')
  return {
    success: true,
    message: `Member status updated to ${status}`,
  }
}
