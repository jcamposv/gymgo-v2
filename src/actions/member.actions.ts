'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { memberSchema, memberUpdateSchema, type MemberFormData } from '@/schemas/member.schema'
import type { Tables, TablesInsert, Database } from '@/types/database.types'

type MemberStatus = Database['public']['Enums']['member_status']
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
// GET MEMBERS
// =============================================================================

export async function getMembers(params?: {
  query?: string
  status?: MemberStatus
  experience_level?: 'beginner' | 'intermediate' | 'advanced'
  page?: number
  per_page?: number
  sort_by?: string
  sort_dir?: 'asc' | 'desc'
}): Promise<{ data: Tables<'members'>[] | null; count: number; error: string | null }> {
  // Check permission: view_members or manage_members
  const { authorized, user, error } = await requireAnyPermission(['view_members', 'manage_members'])

  if (!authorized || !user) {
    return { data: null, count: 0, error: error || 'No autorizado' }
  }

  const page = params?.page ?? 1
  const perPage = params?.per_page ?? 20
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  // Handle sorting
  const sortBy = params?.sort_by || 'created_at'
  const sortDir = params?.sort_dir || 'desc'
  const ascending = sortDir === 'asc'

  const supabase = await createClient()

  let dbQuery = supabase
    .from('members')
    .select('*', { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .order(sortBy, { ascending })
    .range(from, to)

  if (params?.query) {
    dbQuery = dbQuery.or(`full_name.ilike.%${params.query}%,email.ilike.%${params.query}%`)
  }

  if (params?.status) {
    dbQuery = dbQuery.eq('status', params.status)
  }

  if (params?.experience_level) {
    dbQuery = dbQuery.eq('experience_level', params.experience_level)
  }

  const { data, count, error: dbError } = await dbQuery

  if (dbError) {
    return { data: null, count: 0, error: dbError.message }
  }

  return { data, count: count ?? 0, error: null }
}

// =============================================================================
// GET SINGLE MEMBER
// =============================================================================

export async function getMember(id: string): Promise<{ data: Tables<'members'> | null; error: string | null }> {
  const { authorized, user, error } = await requireAnyPermission(['view_members', 'manage_members'])

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()

  const { data, error: dbError } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .single()

  if (dbError) {
    return { data: null, error: dbError.message }
  }

  return { data, error: null }
}

// =============================================================================
// GET MEMBER WITH PLAN
// =============================================================================

export interface MemberWithPlan extends Tables<'members'> {
  current_plan: Tables<'membership_plans'> | null
  organization: { name: string } | null
}

export async function getMemberWithPlan(id: string): Promise<{ data: MemberWithPlan | null; error: string | null }> {
  const { authorized, user, error } = await requireAnyPermission(['view_members', 'manage_members'])

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()

  const { data, error: dbError } = await supabase
    .from('members')
    .select(`
      *,
      current_plan:membership_plans(*),
      organization:organizations(name)
    `)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .single()

  if (dbError) {
    return { data: null, error: dbError.message }
  }

  return { data: data as MemberWithPlan, error: null }
}

// =============================================================================
// CREATE MEMBER
// =============================================================================

export async function createMember(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { authorized, user, error } = await requirePermission('manage_members')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
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
    return errorResult('Datos invalidos', validated.error.flatten().fieldErrors)
  }

  const supabase = await createClient()

  const insertData: TablesInsert<'members'> = {
    ...validated.data,
    organization_id: user!.organizationId,
  }

  const { data, error: dbError } = await supabase
    .from('members')
    .insert(insertData as never)
    .select()
    .single()

  if (dbError) {
    if (dbError.code === '23505') {
      return errorResult('Ya existe un miembro con este email')
    }
    return errorResult(dbError.message)
  }

  revalidatePath('/dashboard/members')
  return successResult('Miembro creado exitosamente', data)
}

// =============================================================================
// UPDATE MEMBER
// =============================================================================

export async function updateMember(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { authorized, user, error } = await requirePermission('manage_members')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
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
    return errorResult('Datos invalidos', validated.error.flatten().fieldErrors)
  }

  const supabase = await createClient()

  const { data, error: dbError } = await supabase
    .from('members')
    .update(validated.data as never)
    .eq('id', id)
    .eq('organization_id', user!.organizationId)
    .select()
    .single()

  if (dbError) {
    return errorResult(dbError.message)
  }

  revalidatePath('/dashboard/members')
  revalidatePath(`/dashboard/members/${id}`)
  return successResult('Miembro actualizado exitosamente', data)
}

// =============================================================================
// DELETE MEMBER
// =============================================================================

export async function deleteMember(id: string): Promise<ActionState> {
  const { authorized, user, error } = await requirePermission('manage_members')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  const supabase = await createClient()

  const { error: dbError } = await supabase
    .from('members')
    .delete()
    .eq('id', id)
    .eq('organization_id', user!.organizationId)

  if (dbError) {
    return errorResult(dbError.message)
  }

  revalidatePath('/dashboard/members')
  return successResult('Miembro eliminado exitosamente')
}

// =============================================================================
// DELETE MEMBER AND AUTH USER
// =============================================================================

export async function deleteMemberAndAuthUser(id: string): Promise<ActionState> {
  const { authorized, user, error } = await requirePermission('manage_members')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  const supabase = await createClient()

  // First, get the member to check if they have a profile_id (linked auth user)
  const { data: member, error: fetchError } = await supabase
    .from('members')
    .select('id, profile_id')
    .eq('id', id)
    .eq('organization_id', user!.organizationId)
    .single()

  if (fetchError || !member) {
    return errorResult('No se pudo encontrar el miembro')
  }

  const profileId = (member as { id: string; profile_id: string | null }).profile_id

  // If the member has a profile_id, delete the auth user first
  if (profileId) {
    const adminClient = createAdminClient()

    const { error: authError } = await adminClient.auth.admin.deleteUser(
      profileId
    )

    if (authError) {
      // Log the error but don't fail - profile might be orphaned or already deleted
      console.error('Error deleting auth user:', authError.message)
      // Continue with member deletion even if auth user deletion fails
    }
  }

  // Delete the member record
  const { error: dbError } = await supabase
    .from('members')
    .delete()
    .eq('id', id)
    .eq('organization_id', user!.organizationId)

  if (dbError) {
    return errorResult(dbError.message)
  }

  revalidatePath('/dashboard/members')

  const message = profileId
    ? 'Miembro y cuenta de usuario eliminados exitosamente'
    : 'Miembro eliminado exitosamente'

  return successResult(message)
}

// =============================================================================
// CREATE MEMBER (Data-based - for react-hook-form)
// =============================================================================

export async function createMemberData(data: MemberFormData): Promise<ActionState> {
  const { authorized, user, error } = await requirePermission('manage_members')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  const validated = memberSchema.safeParse(data)

  if (!validated.success) {
    return errorResult('Datos invalidos', validated.error.flatten().fieldErrors)
  }

  const supabase = await createClient()

  const insertData: TablesInsert<'members'> = {
    ...validated.data,
    organization_id: user!.organizationId,
  }

  const { data: member, error: dbError } = await supabase
    .from('members')
    .insert(insertData as never)
    .select()
    .single()

  if (dbError) {
    if (dbError.code === '23505') {
      return errorResult('Ya existe un miembro con este email')
    }
    return errorResult(dbError.message)
  }

  revalidatePath('/dashboard/members')
  return successResult('Miembro creado exitosamente', member)
}

// =============================================================================
// UPDATE MEMBER (Data-based - for react-hook-form)
// =============================================================================

export async function updateMemberData(
  id: string,
  data: Partial<MemberFormData>
): Promise<ActionState> {
  const { authorized, user, error } = await requirePermission('manage_members')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  const validated = memberUpdateSchema.safeParse(data)

  if (!validated.success) {
    return errorResult('Datos invalidos', validated.error.flatten().fieldErrors)
  }

  const supabase = await createClient()

  const { data: member, error: dbError } = await supabase
    .from('members')
    .update(validated.data as never)
    .eq('id', id)
    .eq('organization_id', user!.organizationId)
    .select()
    .single()

  if (dbError) {
    return errorResult(dbError.message)
  }

  revalidatePath('/dashboard/members')
  revalidatePath(`/dashboard/members/${id}`)
  return successResult('Miembro actualizado exitosamente', member)
}

// =============================================================================
// UPDATE MEMBER STATUS
// =============================================================================

export async function updateMemberStatus(
  id: string,
  status: MemberStatus
): Promise<ActionState> {
  const { authorized, user, error } = await requirePermission('manage_members')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  const supabase = await createClient()

  const { error: dbError } = await supabase
    .from('members')
    .update({ status } as never)
    .eq('id', id)
    .eq('organization_id', user!.organizationId)

  if (dbError) {
    return errorResult(dbError.message)
  }

  revalidatePath('/dashboard/members')
  return successResult(`Estado del miembro actualizado a ${status}`)
}

// =============================================================================
// UPDATE MEMBER AVATAR
// =============================================================================

export async function updateMemberAvatar(
  memberId: string,
  avatarUrl: string | null
): Promise<ActionResult> {
  const { authorized, user, error } = await requirePermission('manage_members')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  const supabase = await createClient()

  const { data, error: dbError } = await supabase
    .from('members')
    .update({ avatar_url: avatarUrl } as never)
    .eq('id', memberId)
    .eq('organization_id', user!.organizationId)
    .select('avatar_url')
    .single()

  if (dbError) {
    return errorResult(dbError.message)
  }

  revalidatePath('/dashboard/members')
  revalidatePath(`/dashboard/members/${memberId}`)

  return successResult('Avatar actualizado exitosamente', data)
}
