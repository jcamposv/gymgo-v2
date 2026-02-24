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
    .is('program_id', null) // Exclude program day records (children) - only show parent programs and standalone routines
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

  // Fetch exercise media URLs if the routine has exercises
  const exercises = (data.exercises as ExerciseItem[]) || []
  if (exercises.length > 0) {
    const exerciseIds = exercises.map(ex => ex.exercise_id).filter(Boolean)

    if (exerciseIds.length > 0) {
      const { data: exerciseDetails } = await supabase
        .from('exercises')
        .select('id, thumbnail_url, gif_url, video_url')
        .in('id', exerciseIds)

      if (exerciseDetails) {
        const mediaMap = new Map<string, { thumbnail_url?: string | null; gif_url?: string | null; video_url?: string | null }>()
        for (const ex of exerciseDetails) {
          mediaMap.set(ex.id, {
            thumbnail_url: ex.thumbnail_url,
            gif_url: ex.gif_url,
            video_url: ex.video_url,
          })
        }

        // Merge media URLs into exercises
        const exercisesWithMedia = exercises.map(ex => ({
          ...ex,
          ...mediaMap.get(ex.exercise_id),
        }))

        // Update the data object with exercises including media
        data.exercises = exercisesWithMedia as unknown as Json
      }
    }
  }

  return { data: data as WorkoutWithMember, error: null }
}

// =============================================================================
// GET PROGRAM DAYS (for staff)
// =============================================================================

export type ExerciseItemWithMedia = ExerciseItem & {
  thumbnail_url?: string | null
  gif_url?: string | null
  video_url?: string | null
}

export type ProgramDayWithExercises = {
  id: string
  day_number: number | null
  name: string
  description: string | null
  exercises: ExerciseItemWithMedia[]
}

/**
 * Get all days for a program (staff view).
 * This is different from the member version - uses staff auth.
 * Includes exercise media URLs (thumbnail, gif, video).
 */
export async function getProgramDaysForStaff(programId: string): Promise<{
  data: ProgramDayWithExercises[] | null
  error: string | null
}> {
  const { authorized, user, error } = await requireAnyPermission(['view_any_member_routines', 'manage_any_member_routines'])

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()

  const { data: days, error: daysError } = await supabase
    .from('workouts')
    .select('id, day_number, name, description, exercises')
    .eq('program_id', programId)
    .eq('organization_id', user.organizationId)
    .order('day_number', { ascending: true })

  if (daysError) {
    return { data: null, error: daysError.message }
  }

  // Collect all unique exercise IDs from all days
  const allExerciseIds = new Set<string>()
  for (const day of days || []) {
    const exercises = (day.exercises as ExerciseItem[]) || []
    for (const ex of exercises) {
      if (ex.exercise_id) {
        allExerciseIds.add(ex.exercise_id)
      }
    }
  }

  // Fetch exercise media from exercises table
  const exerciseMediaMap = new Map<string, { thumbnail_url?: string | null; gif_url?: string | null; video_url?: string | null }>()

  if (allExerciseIds.size > 0) {
    const { data: exerciseDetails } = await supabase
      .from('exercises')
      .select('id, thumbnail_url, gif_url, video_url')
      .in('id', Array.from(allExerciseIds))

    if (exerciseDetails) {
      for (const ex of exerciseDetails) {
        exerciseMediaMap.set(ex.id, {
          thumbnail_url: ex.thumbnail_url,
          gif_url: ex.gif_url,
          video_url: ex.video_url,
        })
      }
    }
  }

  const programDays: ProgramDayWithExercises[] = (days || []).map(day => ({
    id: day.id,
    day_number: day.day_number,
    name: day.name,
    description: day.description,
    exercises: ((day.exercises as ExerciseItem[]) || []).map(ex => ({
      ...ex,
      ...exerciseMediaMap.get(ex.exercise_id),
    })),
  }))

  return { data: programDays, error: null }
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

  // Check if this is a program (has days_per_week or workout_type is 'program')
  const isProgram = routineData.workout_type === 'program' || routineData.days_per_week

  // Create assigned copy of the parent routine/program
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
    // Program-specific fields
    duration_weeks: routineData.duration_weeks,
    days_per_week: routineData.days_per_week,
    program_start_date: isProgram ? new Date().toISOString().split('T')[0] : null,
  }

  const { data: assignedRoutine, error: dbError } = await supabase
    .from('workouts')
    .insert(insertData as never)
    .select()
    .single()

  if (dbError) {
    return errorResult(dbError.message)
  }

  const newProgramId = (assignedRoutine as Tables<'workouts'>).id

  // If this is a program, also copy all the program days
  if (isProgram) {
    const { data: programDays, error: daysError } = await supabase
      .from('workouts')
      .select('*')
      .eq('program_id', routineId)
      .order('day_number', { ascending: true })

    if (daysError) {
      // Rollback: delete the program
      await supabase.from('workouts').delete().eq('id', newProgramId)
      return errorResult('Error al obtener los días del programa')
    }

    // Copy each day and link to the new program
    for (const day of (programDays || [])) {
      const dayData = day as Tables<'workouts'>
      const dayInsert: TablesInsert<'workouts'> = {
        organization_id: user!.organizationId,
        program_id: newProgramId, // Link to the NEW program
        day_number: dayData.day_number,
        name: dayData.name,
        description: dayData.description,
        workout_type: dayData.workout_type,
        exercises: dayData.exercises,
        assigned_to_member_id: memberId,
        assigned_by_id: user!.id,
        is_template: false,
        is_active: true,
      }

      const { error: dayError } = await supabase
        .from('workouts')
        .insert(dayInsert as never)

      if (dayError) {
        // Rollback: delete the program and any days already created
        await supabase.from('workouts').delete().eq('program_id', newProgramId)
        await supabase.from('workouts').delete().eq('id', newProgramId)
        return errorResult(`Error al copiar el día ${dayData.day_number}`)
      }
    }
  }

  revalidatePath('/dashboard/routines')
  return successResult(
    isProgram ? 'Programa asignado exitosamente' : 'Rutina asignada exitosamente',
    assignedRoutine
  )
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
// GET MEMBER ROUTINES (for staff viewing member's routines)
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

// =============================================================================
// GET MY ROUTINES (for member viewing their own routines)
// =============================================================================

export async function getMyRoutines(): Promise<{
  data: Tables<'workouts'>[] | null
  memberId: string | null
  error: string | null
}> {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { data: null, memberId: null, error: 'No autenticado' }
  }

  // Get user's profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id, email')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { data: null, memberId: null, error: 'Perfil no encontrado' }
  }

  const profileData = profile as { organization_id: string | null; email: string }
  if (!profileData.organization_id) {
    return { data: null, memberId: null, error: 'No perteneces a ninguna organizacion' }
  }

  // Get member record by email and organization
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id')
    .eq('organization_id', profileData.organization_id)
    .eq('email', profileData.email)
    .single()

  if (memberError || !member) {
    return { data: null, memberId: null, error: null } // Not an error, just no member profile
  }

  const memberData = member as { id: string }

  // Get routines assigned to this member
  // Exclude program child records (they're accessed via their parent program)
  const { data: routines, error: dbError } = await supabase
    .from('workouts')
    .select('*')
    .eq('organization_id', profileData.organization_id)
    .eq('assigned_to_member_id', memberData.id)
    .eq('is_active', true)
    .is('program_id', null) // Only get parent programs and standalone routines
    .order('scheduled_date', { ascending: true, nullsFirst: false })

  if (dbError) {
    return { data: null, memberId: memberData.id, error: dbError.message }
  }

  return { data: routines, memberId: memberData.id, error: null }
}

// =============================================================================
// GET MY ROUTINE BY ID (for member viewing routine detail)
// =============================================================================

export type RoutineWithExercises = Tables<'workouts'> & {
  exerciseDetails?: Tables<'exercises'>[]
}

// =============================================================================
// GET MY ROUTINE HISTORY (inactive/completed routines)
// =============================================================================

export async function getMyRoutineHistory(): Promise<{
  data: Tables<'workouts'>[] | null
  memberId: string | null
  error: string | null
}> {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { data: null, memberId: null, error: 'No autenticado' }
  }

  // Get user's profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id, email')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { data: null, memberId: null, error: 'Perfil no encontrado' }
  }

  const profileData = profile as { organization_id: string | null; email: string }
  if (!profileData.organization_id) {
    return { data: null, memberId: null, error: 'No perteneces a ninguna organizacion' }
  }

  // Get member record by email and organization
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id')
    .eq('organization_id', profileData.organization_id)
    .eq('email', profileData.email)
    .single()

  if (memberError || !member) {
    return { data: null, memberId: null, error: null } // Not an error, just no member profile
  }

  const memberData = member as { id: string }

  // Get historical routines (inactive) assigned to this member
  const { data: routines, error: dbError } = await supabase
    .from('workouts')
    .select('*')
    .eq('organization_id', profileData.organization_id)
    .eq('assigned_to_member_id', memberData.id)
    .eq('is_active', false)
    .eq('is_template', false)
    .order('updated_at', { ascending: false })

  if (dbError) {
    return { data: null, memberId: memberData.id, error: dbError.message }
  }

  return { data: routines, memberId: memberData.id, error: null }
}

export async function getMyRoutineById(routineId: string): Promise<{
  data: RoutineWithExercises | null
  error: string | null
}> {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { data: null, error: 'No autenticado' }
  }

  // Get user's profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id, email')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { data: null, error: 'Perfil no encontrado' }
  }

  const profileData = profile as { organization_id: string | null; email: string }
  if (!profileData.organization_id) {
    return { data: null, error: 'No perteneces a ninguna organizacion' }
  }

  // Get member record by email and organization
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id')
    .eq('organization_id', profileData.organization_id)
    .eq('email', profileData.email)
    .single()

  if (memberError || !member) {
    return { data: null, error: 'No tienes un perfil de miembro' }
  }

  const memberData = member as { id: string }

  // Get the routine - verify it belongs to this member
  const { data: routine, error: routineError } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', routineId)
    .eq('organization_id', profileData.organization_id)
    .eq('assigned_to_member_id', memberData.id)
    .single()

  if (routineError || !routine) {
    return { data: null, error: 'Rutina no encontrada' }
  }

  const routineData = routine as Tables<'workouts'>

  // Get exercise details for each exercise in the routine
  const exercises = (routineData.exercises as ExerciseItem[]) || []
  const exerciseIds = exercises.map(e => e.exercise_id)

  let exerciseDetails: Tables<'exercises'>[] = []
  if (exerciseIds.length > 0) {
    const { data: exercisesData } = await supabase
      .from('exercises')
      .select('*')
      .in('id', exerciseIds)

    exerciseDetails = (exercisesData as Tables<'exercises'>[]) || []
  }

  return {
    data: {
      ...routineData,
      exerciseDetails,
    },
    error: null,
  }
}
