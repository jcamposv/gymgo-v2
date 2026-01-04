'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { planSchema, planUpdateSchema, type PlanFormData } from '@/schemas/plan.schema'
import {
  getCurrentUser,
  requirePermission,
  requireAnyPermission,
  type ActionResult,
  successResult,
  errorResult,
  forbiddenResult,
  unauthorizedResult,
} from '@/lib/auth/server-auth'

// =============================================================================
// TYPES
// =============================================================================

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
  // Check permission: view_plans or manage_plans
  const { authorized, user, error } = await requireAnyPermission(['view_plans', 'manage_plans'])

  if (!authorized || !user) {
    return { data: null, count: 0, error: error || 'No autorizado' }
  }

  const page = params?.page ?? 1
  const perPage = params?.per_page ?? 20
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const sortBy = params?.sort_by || 'sort_order'
  const sortDir = params?.sort_dir || 'asc'
  const ascending = sortDir === 'asc'

  const supabase = await createClient()

  let dbQuery = supabase
    .from('membership_plans')
    .select('*', { count: 'exact' })
    .eq('organization_id', user.organizationId)
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

  const { data, count, error: dbError } = await dbQuery

  if (dbError) {
    return { data: null, count: 0, error: dbError.message }
  }

  return { data: data as MembershipPlan[], count: count ?? 0, error: null }
}

// =============================================================================
// GET SINGLE PLAN
// =============================================================================

export async function getPlan(id: string): Promise<{ data: MembershipPlan | null; error: string | null }> {
  const { authorized, user, error } = await requireAnyPermission(['view_plans', 'manage_plans'])

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()

  const { data, error: dbError } = await supabase
    .from('membership_plans')
    .select('*')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .single()

  if (dbError) {
    return { data: null, error: dbError.message }
  }

  return { data: data as MembershipPlan, error: null }
}

// =============================================================================
// GET ACTIVE PLANS (for dropdowns) - Accessible to more roles
// =============================================================================

export async function getActivePlans(): Promise<{ data: MembershipPlan[] | null; error: string | null }> {
  // Any staff can view active plans (for assigning to members)
  const { user, error } = await getCurrentUser()

  if (!user) {
    return { data: null, error: error || 'No autenticado' }
  }

  const supabase = await createClient()

  const { data, error: dbError } = await supabase
    .from('membership_plans')
    .select('*')
    .eq('organization_id', user.organizationId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (dbError) {
    return { data: null, error: dbError.message }
  }

  return { data: data as MembershipPlan[], error: null }
}

// =============================================================================
// CREATE PLAN
// =============================================================================

export async function createPlanData(data: PlanFormData): Promise<ActionResult> {
  // Only users with manage_plans permission can create plans
  const { authorized, user, error } = await requirePermission('manage_plans')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  const validated = planSchema.safeParse(data)

  if (!validated.success) {
    return errorResult('Datos invalidos', validated.error.flatten().fieldErrors)
  }

  const supabase = await createClient()

  const insertData = {
    ...validated.data,
    organization_id: user!.organizationId,
  }

  const { data: plan, error: dbError } = await supabase
    .from('membership_plans')
    .insert(insertData as never)
    .select()
    .single()

  if (dbError) {
    return errorResult(dbError.message)
  }

  revalidatePath('/dashboard/plans')
  return successResult('Plan creado exitosamente', plan)
}

// =============================================================================
// UPDATE PLAN
// =============================================================================

export async function updatePlanData(
  id: string,
  data: Partial<PlanFormData>
): Promise<ActionResult> {
  // Only users with manage_plans permission can update plans
  const { authorized, user, error } = await requirePermission('manage_plans')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  const validated = planUpdateSchema.safeParse(data)

  if (!validated.success) {
    return errorResult('Datos invalidos', validated.error.flatten().fieldErrors)
  }

  const supabase = await createClient()

  const { data: plan, error: dbError } = await supabase
    .from('membership_plans')
    .update(validated.data as never)
    .eq('id', id)
    .eq('organization_id', user!.organizationId)
    .select()
    .single()

  if (dbError) {
    return errorResult(dbError.message)
  }

  revalidatePath('/dashboard/plans')
  revalidatePath(`/dashboard/plans/${id}`)
  return successResult('Plan actualizado exitosamente', plan)
}

// =============================================================================
// DELETE PLAN
// =============================================================================

export async function deletePlan(id: string): Promise<ActionResult> {
  // Only users with manage_plans permission can delete plans
  const { authorized, user, error } = await requirePermission('manage_plans')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  const supabase = await createClient()

  // Check if there are members using this plan
  const { count } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', user!.organizationId)
    .eq('current_plan_id', id)

  if (count && count > 0) {
    return errorResult(`No se puede eliminar el plan porque hay ${count} miembro(s) usando este plan`)
  }

  const { error: dbError } = await supabase
    .from('membership_plans')
    .delete()
    .eq('id', id)
    .eq('organization_id', user!.organizationId)

  if (dbError) {
    return errorResult(dbError.message)
  }

  revalidatePath('/dashboard/plans')
  return successResult('Plan eliminado exitosamente')
}

// =============================================================================
// TOGGLE PLAN STATUS
// =============================================================================

export async function togglePlanStatus(id: string): Promise<ActionResult> {
  // Only users with manage_plans permission can toggle status
  const { authorized, user, error } = await requirePermission('manage_plans')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  const supabase = await createClient()

  // Get current status
  const { data: currentPlan, error: fetchError } = await supabase
    .from('membership_plans')
    .select('is_active')
    .eq('id', id)
    .eq('organization_id', user!.organizationId)
    .single()

  if (fetchError || !currentPlan) {
    return errorResult('Plan no encontrado')
  }

  const plan = currentPlan as { is_active: boolean }

  const { error: dbError } = await supabase
    .from('membership_plans')
    .update({ is_active: !plan.is_active } as never)
    .eq('id', id)
    .eq('organization_id', user!.organizationId)

  if (dbError) {
    return errorResult(dbError.message)
  }

  revalidatePath('/dashboard/plans')
  return successResult(plan.is_active ? 'Plan desactivado' : 'Plan activado')
}

// =============================================================================
// LEGACY TYPE EXPORT (for backward compatibility)
// =============================================================================

export type ActionState = ActionResult
