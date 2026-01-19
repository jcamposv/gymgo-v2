'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  ExerciseBenchmark,
  BenchmarkFormData,
  CurrentPR,
  BenchmarkUnit,
} from '@/types/benchmark.types'
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

// Note: The 'exercise_benchmarks' table is created via migration 019_exercise_benchmarks.sql
// TypeScript errors for this table will resolve after running the migration and regenerating types

// Helper to get supabase client with any type to bypass strict typing
// This is needed until the database types are regenerated
async function getSupabaseAny() {
  const client = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return client as any
}

// =============================================================================
// GET MEMBER BENCHMARK ENTRIES (Paginated)
// =============================================================================

export async function getMemberBenchmarkEntries(
  memberId: string,
  params?: {
    exerciseId?: string
    dateFrom?: string
    dateTo?: string
    page?: number
    pageSize?: number
    sortBy?: string
    sortDir?: 'asc' | 'desc'
  }
): Promise<{
  data: ExerciseBenchmark[] | null
  total: number
  error: string | null
}> {
  const { authorized, user, error } = await requireAnyPermission(['view_members', 'manage_members'])

  if (!authorized || !user) {
    return { data: null, total: 0, error: error || 'No autorizado' }
  }

  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 10
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const sortBy = params?.sortBy || 'achieved_at'
  const sortDir = params?.sortDir || 'desc'
  const ascending = sortDir === 'asc'

  const supabase = await getSupabaseAny()

  // Build query with exercise join
  let dbQuery = supabase
    .from('exercise_benchmarks')
    .select(
      `
      *,
      exercise:exercises(id, name, category, muscle_groups)
    `,
      { count: 'exact' }
    )
    .eq('member_id', memberId)
    .eq('organization_id', user.organizationId)
    .order(sortBy, { ascending })
    .range(from, to)

  // Apply filters
  if (params?.exerciseId) {
    dbQuery = dbQuery.eq('exercise_id', params.exerciseId)
  }

  if (params?.dateFrom) {
    dbQuery = dbQuery.gte('achieved_at', params.dateFrom)
  }

  if (params?.dateTo) {
    dbQuery = dbQuery.lte('achieved_at', params.dateTo)
  }

  const { data, count, error: dbError } = await dbQuery

  if (dbError) {
    return { data: null, total: 0, error: dbError.message }
  }

  return {
    data: (data ?? []) as ExerciseBenchmark[],
    total: count ?? 0,
    error: null,
  }
}

// =============================================================================
// GET MEMBER CURRENT PRs
// =============================================================================

/**
 * Get the current personal records for a member across all exercises.
 * Returns the best value per exercise (MAX for weight/reps, MIN for time).
 */
export async function getMemberCurrentPRs(
  memberId: string
): Promise<{ data: CurrentPR[] | null; error: string | null }> {
  const { authorized, user, error } = await requireAnyPermission(['view_members', 'manage_members'])

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await getSupabaseAny()

  // Get all PRs (is_pr = true) for the member
  const { data, error: dbError } = await supabase
    .from('exercise_benchmarks')
    .select(
      `
      id,
      exercise_id,
      value,
      unit,
      reps,
      achieved_at,
      exercise:exercises(name, category)
    `
    )
    .eq('member_id', memberId)
    .eq('organization_id', user.organizationId)
    .eq('is_pr', true)
    .order('achieved_at', { ascending: false })

  if (dbError) {
    return { data: null, error: dbError.message }
  }

  // Transform to CurrentPR format, keeping only the latest PR per exercise
  const prMap = new Map<string, CurrentPR>()
  const records = (data ?? []) as Array<{
    id: string
    exercise_id: string
    value: number
    unit: string
    reps: number | null
    achieved_at: string
    exercise: { name: string; category: string | null } | null
  }>

  for (const record of records) {
    const exerciseId = record.exercise_id
    // Only keep the first (most recent) PR per exercise
    if (!prMap.has(exerciseId)) {
      prMap.set(exerciseId, {
        exercise_id: exerciseId,
        exercise_name: record.exercise?.name || 'Unknown Exercise',
        exercise_category: record.exercise?.category || null,
        value: record.value,
        unit: record.unit as BenchmarkUnit,
        reps: record.reps,
        achieved_at: record.achieved_at,
        benchmark_id: record.id,
      })
    }
  }

  return {
    data: Array.from(prMap.values()),
    error: null,
  }
}

// =============================================================================
// GET BENCHMARK HISTORY FOR CHART
// =============================================================================

/**
 * Get benchmark history for a specific exercise to display in a progress chart.
 */
export async function getMemberBenchmarkHistory(
  memberId: string,
  exerciseId: string,
  params?: {
    dateFrom?: string
    dateTo?: string
    limit?: number
  }
): Promise<{
  data: { date: string; value: number; is_pr: boolean }[] | null
  error: string | null
}> {
  const { authorized, user, error } = await requireAnyPermission(['view_members', 'manage_members'])

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await getSupabaseAny()

  let dbQuery = supabase
    .from('exercise_benchmarks')
    .select('achieved_at, value, is_pr')
    .eq('member_id', memberId)
    .eq('organization_id', user.organizationId)
    .eq('exercise_id', exerciseId)
    .order('achieved_at', { ascending: true })

  if (params?.dateFrom) {
    dbQuery = dbQuery.gte('achieved_at', params.dateFrom)
  }

  if (params?.dateTo) {
    dbQuery = dbQuery.lte('achieved_at', params.dateTo)
  }

  if (params?.limit) {
    dbQuery = dbQuery.limit(params.limit)
  }

  const { data, error: dbError } = await dbQuery

  if (dbError) {
    return { data: null, error: dbError.message }
  }

  const records = (data ?? []) as Array<{
    achieved_at: string
    value: number
    is_pr: boolean
  }>

  return {
    data: records.map((record) => ({
      date: record.achieved_at,
      value: record.value,
      is_pr: record.is_pr ?? false,
    })),
    error: null,
  }
}

// =============================================================================
// CREATE BENCHMARK
// =============================================================================

export async function createBenchmark(
  memberId: string,
  formData: BenchmarkFormData
): Promise<ActionState> {
  const { authorized, user, error } = await requirePermission('manage_members')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  // Validate required fields
  if (!formData.exercise_id) {
    return errorResult('El ejercicio es requerido', { exercise_id: ['El ejercicio es requerido'] })
  }

  if (formData.value === undefined || formData.value === null) {
    return errorResult('El valor es requerido', { value: ['El valor es requerido'] })
  }

  if (!formData.unit) {
    return errorResult('La unidad es requerida', { unit: ['La unidad es requerida'] })
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

  // Verify exercise exists
  const { data: exercise, error: exerciseError } = await supabase
    .from('exercises')
    .select('id')
    .eq('id', formData.exercise_id)
    .or(`organization_id.eq.${user!.organizationId},is_global.eq.true`)
    .single()

  if (exerciseError || !exercise) {
    return errorResult('Ejercicio no encontrado o acceso denegado')
  }

  const insertData = {
    member_id: memberId,
    organization_id: user!.organizationId,
    exercise_id: formData.exercise_id,
    value: formData.value,
    unit: formData.unit,
    reps: formData.reps ?? null,
    sets: formData.sets ?? null,
    rpe: formData.rpe ?? null,
    achieved_at: formData.achieved_at || new Date().toISOString(),
    notes: formData.notes ?? null,
    recorded_by_id: user!.id,
  }

  const supabaseAny = await getSupabaseAny()
  const { data, error: dbError } = await supabaseAny
    .from('exercise_benchmarks')
    .insert(insertData)
    .select(
      `
      *,
      exercise:exercises(id, name, category)
    `
    )
    .single()

  if (dbError) {
    console.error('Error creating benchmark:', dbError)
    return errorResult(dbError.message)
  }

  revalidatePath(`/dashboard/members/${memberId}`)
  return successResult('PR registrado exitosamente', data as ExerciseBenchmark)
}

// =============================================================================
// UPDATE BENCHMARK
// =============================================================================

export async function updateBenchmark(
  benchmarkId: string,
  formData: Partial<BenchmarkFormData>
): Promise<ActionState> {
  const { authorized, user, error } = await requirePermission('manage_members')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  const supabase = await getSupabaseAny()

  const updateData: Record<string, unknown> = {}

  if (formData.exercise_id !== undefined) updateData.exercise_id = formData.exercise_id
  if (formData.value !== undefined) updateData.value = formData.value
  if (formData.unit !== undefined) updateData.unit = formData.unit
  if (formData.reps !== undefined) updateData.reps = formData.reps
  if (formData.sets !== undefined) updateData.sets = formData.sets
  if (formData.rpe !== undefined) updateData.rpe = formData.rpe
  if (formData.achieved_at !== undefined) updateData.achieved_at = formData.achieved_at
  if (formData.notes !== undefined) updateData.notes = formData.notes

  const { data, error: dbError } = await supabase
    .from('exercise_benchmarks')
    .update(updateData)
    .eq('id', benchmarkId)
    .eq('organization_id', user!.organizationId)
    .select(
      `
      *,
      exercise:exercises(id, name, category)
    `
    )
    .single()

  if (dbError) {
    return errorResult(dbError.message)
  }

  const benchmark = data as ExerciseBenchmark
  revalidatePath(`/dashboard/members/${benchmark.member_id}`)
  return successResult('PR actualizado exitosamente', benchmark)
}

// =============================================================================
// DELETE BENCHMARK
// =============================================================================

export async function deleteBenchmark(benchmarkId: string): Promise<ActionState> {
  const { authorized, user, error } = await requirePermission('manage_members')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  const supabase = await getSupabaseAny()

  // Get benchmark to know member_id for revalidation
  const { data: benchmarkData } = await supabase
    .from('exercise_benchmarks')
    .select('member_id')
    .eq('id', benchmarkId)
    .eq('organization_id', user!.organizationId)
    .single()

  const benchmark = benchmarkData as { member_id: string } | null

  const { error: dbError } = await supabase
    .from('exercise_benchmarks')
    .delete()
    .eq('id', benchmarkId)
    .eq('organization_id', user!.organizationId)

  if (dbError) {
    return errorResult(dbError.message)
  }

  if (benchmark) {
    revalidatePath(`/dashboard/members/${benchmark.member_id}`)
  }

  return successResult('PR eliminado exitosamente')
}

// =============================================================================
// GET EXERCISES FOR BENCHMARK FORM (Dropdown)
// =============================================================================

export async function getExercisesForBenchmark(): Promise<{
  data: { id: string; name: string; category: string | null }[] | null
  error: string | null
}> {
  const { authorized, user, error } = await requireAnyPermission(['view_members', 'manage_members'])

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()

  const { data, error: dbError } = await supabase
    .from('exercises')
    .select('id, name, category')
    .or(`organization_id.eq.${user.organizationId},is_global.eq.true`)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (dbError) {
    return { data: null, error: dbError.message }
  }

  return { data, error: null }
}
