'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  routineSchema,
  routineUpdateSchema,
  type RoutineFormData,
  type RoutineSearchParams,
  type ExerciseItem,
} from '@/schemas/routine.schema'
import type { Tables, TablesInsert, Json } from '@/types/database.types'
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
// Type for workout with member info
// =============================================================================

export type WorkoutWithMember = Tables<'workouts'> & {
  member?: {
    id: string
    full_name: string
    email: string
  } | null
}

// =============================================================================
// GET ROUTINES
// =============================================================================

export async function getRoutines(params?: RoutineSearchParams): Promise<{
  data: WorkoutWithMember[] | null
  count: number
  error: string | null
}> {
  const { authorized, user, error } = await requireAnyPermission(['view_any_member_routines', 'manage_any_member_routines'])

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
    .from('workouts')
    .select(`
      *,
      member:members!assigned_to_member_id(id, full_name, email)
    `, { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .order(sortBy, { ascending })
    .range(from, to)

  // Apply filters
  if (params?.query) {
    dbQuery = dbQuery.ilike('name', `%${params.query}%`)
  }

  if (params?.workout_type) {
    dbQuery = dbQuery.eq('workout_type', params.workout_type)
  }

  if (params?.is_template !== undefined) {
    dbQuery = dbQuery.eq('is_template', params.is_template)
  }

  if (params?.assigned_to_member_id) {
    dbQuery = dbQuery.eq('assigned_to_member_id', params.assigned_to_member_id)
  }

  if (params?.scheduled_date) {
    dbQuery = dbQuery.eq('scheduled_date', params.scheduled_date)
  }

  if (params?.is_active !== undefined) {
    dbQuery = dbQuery.eq('is_active', params.is_active)
  }

  const { data, count, error: dbError } = await dbQuery

  if (dbError) {
    return { data: null, count: 0, error: dbError.message }
  }

  return { data: data as WorkoutWithMember[], count: count ?? 0, error: null }
}

// =============================================================================
// GET SINGLE ROUTINE
// =============================================================================

export async function getRoutine(id: string): Promise<{
  data: WorkoutWithMember | null
  error: string | null
}> {
  const { authorized, user, error } = await requireAnyPermission(['view_any_member_routines', 'manage_any_member_routines'])

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()

  const { data, error: dbError } = await supabase
    .from('workouts')
    .select(`
      *,
      member:members!assigned_to_member_id(id, full_name, email)
    `)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .single()

  if (dbError) {
    return { data: null, error: dbError.message }
  }

  return { data: data as WorkoutWithMember, error: null }
}

// =============================================================================
// CREATE ROUTINE
// =============================================================================

export async function createRoutineData(data: RoutineFormData): Promise<ActionState> {
  const { authorized, user, error } = await requirePermission('manage_any_member_routines')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  const validated = routineSchema.safeParse(data)

  if (!validated.success) {
    return errorResult('Validacion fallida', validated.error.flatten().fieldErrors)
  }

  const supabase = await createClient()

  const insertData: TablesInsert<'workouts'> = {
    organization_id: user!.organizationId,
    name: validated.data.name,
    description: validated.data.description,
    workout_type: validated.data.workout_type,
    wod_type: validated.data.wod_type,
    wod_time_cap: validated.data.wod_time_cap,
    exercises: validated.data.exercises as unknown as Json,
    assigned_to_member_id: validated.data.assigned_to_member_id,
    assigned_by_id: user!.id,
    scheduled_date: validated.data.scheduled_date,
    is_template: validated.data.is_template,
    is_active: validated.data.is_active,
  }

  const { data: routineResult, error: dbError } = await supabase
    .from('workouts')
    .insert(insertData as never)
    .select()
    .single()

  if (dbError) {
    return errorResult(dbError.message)
  }

  revalidatePath('/dashboard/routines')
  return successResult('Rutina creada exitosamente', routineResult)
}

// =============================================================================
// UPDATE ROUTINE
// =============================================================================

export async function updateRoutineData(
  id: string,
  data: Partial<RoutineFormData>
): Promise<ActionState> {
  const { authorized, user, error } = await requirePermission('manage_any_member_routines')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  const validated = routineUpdateSchema.safeParse(data)

  if (!validated.success) {
    return errorResult('Validacion fallida', validated.error.flatten().fieldErrors)
  }

  const supabase = await createClient()

  const updateData: Record<string, unknown> = { ...validated.data }
  if (validated.data.exercises) {
    updateData.exercises = validated.data.exercises as unknown as Json
  }

  const { data: routineResult, error: dbError } = await supabase
    .from('workouts')
    .update(updateData as never)
    .eq('id', id)
    .eq('organization_id', user!.organizationId)
    .select()
    .single()

  if (dbError) {
    return errorResult(dbError.message)
  }

  revalidatePath('/dashboard/routines')
  revalidatePath(`/dashboard/routines/${id}`)
  return successResult('Rutina actualizada exitosamente', routineResult)
}

// =============================================================================
// DELETE ROUTINE
// =============================================================================

export async function deleteRoutine(id: string): Promise<ActionState> {
  const { authorized, user, error } = await requirePermission('manage_any_member_routines')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  const supabase = await createClient()

  const { error: dbError } = await supabase
    .from('workouts')
    .delete()
    .eq('id', id)
    .eq('organization_id', user!.organizationId)

  if (dbError) {
    return errorResult(dbError.message)
  }

  revalidatePath('/dashboard/routines')
  return successResult('Rutina eliminada exitosamente')
}

// =============================================================================
// TOGGLE ROUTINE STATUS
// =============================================================================

export async function toggleRoutineStatus(id: string): Promise<ActionState> {
  const { authorized, user, error } = await requirePermission('manage_any_member_routines')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  const supabase = await createClient()

  // Get current status
  const { data: routine, error: fetchError } = await supabase
    .from('workouts')
    .select('is_active')
    .eq('id', id)
    .eq('organization_id', user!.organizationId)
    .single()

  if (fetchError || !routine) {
    return errorResult('Rutina no encontrada')
  }

  const routineData = routine as { is_active: boolean }

  // Toggle status
  const { error: dbError } = await supabase
    .from('workouts')
    .update({ is_active: !routineData.is_active } as never)
    .eq('id', id)
    .eq('organization_id', user!.organizationId)

  if (dbError) {
    return errorResult(dbError.message)
  }

  revalidatePath('/dashboard/routines')
  return successResult(routineData.is_active ? 'Rutina desactivada' : 'Rutina activada')
}

// =============================================================================
// DUPLICATE ROUTINE
// =============================================================================

export async function duplicateRoutine(id: string): Promise<ActionState> {
  const { authorized, user, error } = await requirePermission('manage_any_member_routines')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  const supabase = await createClient()

  // Get the routine to duplicate
  const { data: routine, error: fetchError } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', id)
    .eq('organization_id', user!.organizationId)
    .single()

  if (fetchError || !routine) {
    return errorResult('Rutina no encontrada')
  }

  const routineData = routine as Tables<'workouts'>

  // Create a copy
  const insertData: TablesInsert<'workouts'> = {
    organization_id: user!.organizationId,
    name: `${routineData.name} (copia)`,
    description: routineData.description,
    workout_type: routineData.workout_type,
    wod_type: routineData.wod_type,
    wod_time_cap: routineData.wod_time_cap,
    exercises: routineData.exercises,
    assigned_to_member_id: null, // Don't copy assignment
    assigned_by_id: user!.id,
    scheduled_date: null, // Don't copy date
    is_template: true, // Make it a template
    is_active: true,
  }

  const { data: newRoutine, error: dbError } = await supabase
    .from('workouts')
    .insert(insertData as never)
    .select()
    .single()

  if (dbError) {
    return errorResult(dbError.message)
  }

  revalidatePath('/dashboard/routines')
  return successResult('Rutina duplicada exitosamente', newRoutine)
}

// =============================================================================
// ASSIGN ROUTINE TO MEMBER
// =============================================================================

export async function assignRoutineToMember(
  routineId: string,
  memberId: string,
  scheduledDate?: string
): Promise<ActionState> {
  const { authorized, user, error } = await requirePermission('manage_any_member_routines')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  const supabase = await createClient()

  // Get the template routine
  const { data: routine, error: fetchError } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', routineId)
    .eq('organization_id', user!.organizationId)
    .single()

  if (fetchError || !routine) {
    return errorResult('Rutina no encontrada')
  }

  const routineData = routine as Tables<'workouts'>

  // Create assigned copy
  const insertData: TablesInsert<'workouts'> = {
    organization_id: user!.organizationId,
    name: routineData.name,
    description: routineData.description,
    workout_type: routineData.workout_type,
    wod_type: routineData.wod_type,
    wod_time_cap: routineData.wod_time_cap,
    exercises: routineData.exercises,
    assigned_to_member_id: memberId,
    assigned_by_id: user!.id,
    scheduled_date: scheduledDate || null,
    is_template: false,
    is_active: true,
  }

  const { data: assignedRoutine, error: dbError } = await supabase
    .from('workouts')
    .insert(insertData as never)
    .select()
    .single()

  if (dbError) {
    return errorResult(dbError.message)
  }

  revalidatePath('/dashboard/routines')
  return successResult('Rutina asignada exitosamente', assignedRoutine)
}

// =============================================================================
// GET ROUTINE TEMPLATES
// =============================================================================

export async function getRoutineTemplates(): Promise<{
  data: Tables<'workouts'>[] | null
  error: string | null
}> {
  const { authorized, user, error } = await requireAnyPermission(['view_any_member_routines', 'manage_any_member_routines'])

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()

  const { data, error: dbError } = await supabase
    .from('workouts')
    .select('*')
    .eq('organization_id', user.organizationId)
    .eq('is_template', true)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (dbError) {
    return { data: null, error: dbError.message }
  }

  return { data, error: null }
}

// =============================================================================
// GET MEMBER ROUTINES
// =============================================================================

export async function getMemberRoutines(memberId: string): Promise<{
  data: Tables<'workouts'>[] | null
  error: string | null
}> {
  const { authorized, user, error } = await requireAnyPermission(['view_any_member_routines', 'manage_any_member_routines'])

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()

  const { data, error: dbError } = await supabase
    .from('workouts')
    .select('*')
    .eq('organization_id', user.organizationId)
    .eq('assigned_to_member_id', memberId)
    .eq('is_active', true)
    .order('scheduled_date', { ascending: true, nullsFirst: false })

  if (dbError) {
    return { data: null, error: dbError.message }
  }

  return { data, error: null }
}
