'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { planSchema, planUpdateSchema, type PlanFormData } from '@/schemas/plan.schema'

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

interface MembershipPlan {
  id: string
  organization_id: string
  name: string
  description: string | null
  price: number
  currency: string
  billing_period: string
  unlimited_access: boolean
  classes_per_period: number | null
  access_all_locations: boolean
  duration_days: number
  features: string[]
  is_active: boolean
  is_featured: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

async function getUserProfile(): Promise<{ profile: UserProfile | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { profile: null, error: 'No autenticado' }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (error || !data) {
    return { profile: null, error: 'No se encontro la organizacion' }
  }

  const profileData = data as { organization_id: string | null; role: string }
  if (!profileData.organization_id) {
    return { profile: null, error: 'No se encontro la organizacion' }
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
// GET PLANS
// =============================================================================

export async function getPlans(params?: {
  query?: string
  is_active?: boolean
  billing_period?: string
  page?: number
  per_page?: number
  sort_by?: string
  sort_dir?: 'asc' | 'desc'
}): Promise<{ data: MembershipPlan[] | null; count: number; error: string | null }> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { data: null, count: 0, error: profileError ?? 'No profile found' }
  }

  const page = params?.page ?? 1
  const perPage = params?.per_page ?? 20
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  // Handle sorting
  const sortBy = params?.sort_by || 'sort_order'
  const sortDir = params?.sort_dir || 'asc'
  const ascending = sortDir === 'asc'

  const supabase = await createClient()

  let dbQuery = supabase
    .from('membership_plans')
    .select('*', { count: 'exact' })
    .eq('organization_id', profile.organization_id)
    .order(sortBy, { ascending })
    .range(from, to)

  if (params?.query) {
    dbQuery = dbQuery.or(`name.ilike.%${params.query}%,description.ilike.%${params.query}%`)
  }

  if (params?.is_active !== undefined) {
    dbQuery = dbQuery.eq('is_active', params.is_active)
  }

  if (params?.billing_period) {
    dbQuery = dbQuery.eq('billing_period', params.billing_period)
  }

  const { data, count, error } = await dbQuery

  if (error) {
    return { data: null, count: 0, error: error.message }
  }

  return { data: data as MembershipPlan[], count: count ?? 0, error: null }
}

// =============================================================================
// GET SINGLE PLAN
// =============================================================================

export async function getPlan(id: string): Promise<{ data: MembershipPlan | null; error: string | null }> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { data: null, error: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('membership_plans')
    .select('*')
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as MembershipPlan, error: null }
}

// =============================================================================
// GET ACTIVE PLANS (for dropdowns)
// =============================================================================

export async function getActivePlans(): Promise<{ data: MembershipPlan[] | null; error: string | null }> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { data: null, error: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('membership_plans')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as MembershipPlan[], error: null }
}

// =============================================================================
// CREATE PLAN (Data-based - for react-hook-form)
// =============================================================================

export async function createPlanData(data: PlanFormData): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const validated = planSchema.safeParse(data)

  if (!validated.success) {
    return {
      success: false,
      message: 'Datos invalidos',
      errors: validated.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()

  const insertData = {
    ...validated.data,
    organization_id: profile.organization_id,
  }

  const { data: plan, error } = await supabase
    .from('membership_plans')
    .insert(insertData as never)
    .select()
    .single()

  if (error) {
    return {
      success: false,
      message: error.message,
    }
  }

  revalidatePath('/dashboard/plans')
  return {
    success: true,
    message: 'Plan creado exitosamente',
    data: plan,
  }
}

// =============================================================================
// UPDATE PLAN (Data-based - for react-hook-form)
// =============================================================================

export async function updatePlanData(
  id: string,
  data: Partial<PlanFormData>
): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const validated = planUpdateSchema.safeParse(data)

  if (!validated.success) {
    return {
      success: false,
      message: 'Datos invalidos',
      errors: validated.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()

  const { data: plan, error } = await supabase
    .from('membership_plans')
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

  revalidatePath('/dashboard/plans')
  revalidatePath(`/dashboard/plans/${id}`)
  return {
    success: true,
    message: 'Plan actualizado exitosamente',
    data: plan,
  }
}

// =============================================================================
// DELETE PLAN
// =============================================================================

export async function deletePlan(id: string): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  // Check if there are members using this plan
  const { count } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', profile.organization_id)
    .eq('current_plan_id', id)

  if (count && count > 0) {
    return {
      success: false,
      message: `No se puede eliminar el plan porque hay ${count} miembro(s) usando este plan`,
    }
  }

  const { error } = await supabase
    .from('membership_plans')
    .delete()
    .eq('id', id)
    .eq('organization_id', profile.organization_id)

  if (error) {
    return {
      success: false,
      message: error.message,
    }
  }

  revalidatePath('/dashboard/plans')
  return {
    success: true,
    message: 'Plan eliminado exitosamente',
  }
}

// =============================================================================
// TOGGLE PLAN STATUS
// =============================================================================

export async function togglePlanStatus(id: string): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  // Get current status
  const { data: currentPlan, error: fetchError } = await supabase
    .from('membership_plans')
    .select('is_active')
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (fetchError || !currentPlan) {
    return { success: false, message: 'Plan no encontrado' }
  }

  const plan = currentPlan as { is_active: boolean }

  const { error } = await supabase
    .from('membership_plans')
    .update({ is_active: !plan.is_active } as never)
    .eq('id', id)
    .eq('organization_id', profile.organization_id)

  if (error) {
    return {
      success: false,
      message: error.message,
    }
  }

  revalidatePath('/dashboard/plans')
  return {
    success: true,
    message: plan.is_active ? 'Plan desactivado' : 'Plan activado',
  }
}
