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
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { data: null, count: 0, error: profileError ?? 'No profile found' }
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
    .eq('organization_id', profile.organization_id)
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

  const { data, count, error } = await dbQuery

  if (error) {
    return { data: null, count: 0, error: error.message }
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
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { data: null, error: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('workouts')
    .select(`
      *,
      member:members!assigned_to_member_id(id, full_name, email)
    `)
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as WorkoutWithMember, error: null }
}

// =============================================================================
// CREATE ROUTINE
// =============================================================================

export async function createRoutineData(data: RoutineFormData): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const validated = routineSchema.safeParse(data)

  if (!validated.success) {
    return {
      success: false,
      message: 'Validacion fallida',
      errors: validated.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()

  const insertData: TablesInsert<'workouts'> = {
    organization_id: profile.organization_id,
    name: validated.data.name,
    description: validated.data.description,
    workout_type: validated.data.workout_type,
    wod_type: validated.data.wod_type,
    wod_time_cap: validated.data.wod_time_cap,
    exercises: validated.data.exercises as unknown as Json,
    assigned_to_member_id: validated.data.assigned_to_member_id,
    assigned_by_id: profile.userId,
    scheduled_date: validated.data.scheduled_date,
    is_template: validated.data.is_template,
    is_active: validated.data.is_active,
  }

  const { data: routineResult, error } = await supabase
    .from('workouts')
    .insert(insertData as never)
    .select()
    .single()

  if (error) {
    return {
      success: false,
      message: error.message,
    }
  }

  revalidatePath('/dashboard/routines')
  return {
    success: true,
    message: 'Rutina creada exitosamente',
    data: routineResult,
  }
}

// =============================================================================
// UPDATE ROUTINE
// =============================================================================

export async function updateRoutineData(
  id: string,
  data: Partial<RoutineFormData>
): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const validated = routineUpdateSchema.safeParse(data)

  if (!validated.success) {
    return {
      success: false,
      message: 'Validacion fallida',
      errors: validated.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()

  const updateData: Record<string, unknown> = { ...validated.data }
  if (validated.data.exercises) {
    updateData.exercises = validated.data.exercises as unknown as Json
  }

  const { data: routineResult, error } = await supabase
    .from('workouts')
    .update(updateData as never)
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

  revalidatePath('/dashboard/routines')
  revalidatePath(`/dashboard/routines/${id}`)
  return {
    success: true,
    message: 'Rutina actualizada exitosamente',
    data: routineResult,
  }
}

// =============================================================================
// DELETE ROUTINE
// =============================================================================

export async function deleteRoutine(id: string): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('workouts')
    .delete()
    .eq('id', id)
    .eq('organization_id', profile.organization_id)

  if (error) {
    return {
      success: false,
      message: error.message,
    }
  }

  revalidatePath('/dashboard/routines')
  return {
    success: true,
    message: 'Rutina eliminada exitosamente',
  }
}

// =============================================================================
// TOGGLE ROUTINE STATUS
// =============================================================================

export async function toggleRoutineStatus(id: string): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  // Get current status
  const { data: routine, error: fetchError } = await supabase
    .from('workouts')
    .select('is_active')
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (fetchError || !routine) {
    return {
      success: false,
      message: 'Rutina no encontrada',
    }
  }

  const routineData = routine as { is_active: boolean }

  // Toggle status
  const { error } = await supabase
    .from('workouts')
    .update({ is_active: !routineData.is_active } as never)
    .eq('id', id)
    .eq('organization_id', profile.organization_id)

  if (error) {
    return {
      success: false,
      message: error.message,
    }
  }

  revalidatePath('/dashboard/routines')
  return {
    success: true,
    message: routineData.is_active ? 'Rutina desactivada' : 'Rutina activada',
  }
}

// =============================================================================
// DUPLICATE ROUTINE
// =============================================================================

export async function duplicateRoutine(id: string): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  // Get the routine to duplicate
  const { data: routine, error: fetchError } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (fetchError || !routine) {
    return { success: false, message: 'Rutina no encontrada' }
  }

  const routineData = routine as Tables<'workouts'>

  // Create a copy
  const insertData: TablesInsert<'workouts'> = {
    organization_id: profile.organization_id,
    name: `${routineData.name} (copia)`,
    description: routineData.description,
    workout_type: routineData.workout_type,
    wod_type: routineData.wod_type,
    wod_time_cap: routineData.wod_time_cap,
    exercises: routineData.exercises,
    assigned_to_member_id: null, // Don't copy assignment
    assigned_by_id: profile.userId,
    scheduled_date: null, // Don't copy date
    is_template: true, // Make it a template
    is_active: true,
  }

  const { data: newRoutine, error } = await supabase
    .from('workouts')
    .insert(insertData as never)
    .select()
    .single()

  if (error) {
    return {
      success: false,
      message: error.message,
    }
  }

  revalidatePath('/dashboard/routines')
  return {
    success: true,
    message: 'Rutina duplicada exitosamente',
    data: newRoutine,
  }
}

// =============================================================================
// ASSIGN ROUTINE TO MEMBER
// =============================================================================

export async function assignRoutineToMember(
  routineId: string,
  memberId: string,
  scheduledDate?: string
): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  // Get the template routine
  const { data: routine, error: fetchError } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', routineId)
    .eq('organization_id', profile.organization_id)
    .single()

  if (fetchError || !routine) {
    return { success: false, message: 'Rutina no encontrada' }
  }

  const routineData = routine as Tables<'workouts'>

  // Create assigned copy
  const insertData: TablesInsert<'workouts'> = {
    organization_id: profile.organization_id,
    name: routineData.name,
    description: routineData.description,
    workout_type: routineData.workout_type,
    wod_type: routineData.wod_type,
    wod_time_cap: routineData.wod_time_cap,
    exercises: routineData.exercises,
    assigned_to_member_id: memberId,
    assigned_by_id: profile.userId,
    scheduled_date: scheduledDate || null,
    is_template: false,
    is_active: true,
  }

  const { data: assignedRoutine, error } = await supabase
    .from('workouts')
    .insert(insertData as never)
    .select()
    .single()

  if (error) {
    return {
      success: false,
      message: error.message,
    }
  }

  revalidatePath('/dashboard/routines')
  return {
    success: true,
    message: 'Rutina asignada exitosamente',
    data: assignedRoutine,
  }
}

// =============================================================================
// GET ROUTINE TEMPLATES
// =============================================================================

export async function getRoutineTemplates(): Promise<{
  data: Tables<'workouts'>[] | null
  error: string | null
}> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { data: null, error: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .eq('is_template', true)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    return { data: null, error: error.message }
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
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { data: null, error: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .eq('assigned_to_member_id', memberId)
    .eq('is_active', true)
    .order('scheduled_date', { ascending: true, nullsFirst: false })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}
