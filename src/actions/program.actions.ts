'use server'

/**
 * Program Server Actions
 *
 * Server actions for training programs with multi-day workouts,
 * completion tracking, and progress calculation.
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  requirePermission,
  type ActionResult,
  successResult,
  errorResult,
  forbiddenResult,
  unauthorizedResult,
} from '@/lib/auth/server-auth'
import { completeWorkoutSchema, type CompleteWorkoutFormData } from '@/schemas/program.schema'
import type { Tables, Json } from '@/types/database.types'
import type {
  TodaysWorkout,
  WeeklyProgress,
  ProgramProgress,
  ProgramDay,
  WorkoutCompletion,
} from '@/types/program.types'
import type { ExerciseItem } from '@/schemas/routine.schema'

// Workouts table now includes program fields from migration 027_training_programs.sql:
// program_id, day_number, duration_weeks, days_per_week, program_start_date

// Use the generated types directly
type WorkoutWithProgramFields = Tables<'workouts'>
type WorkoutCompletionRow = Tables<'workout_completions'>

// =============================================================================
// MEMBER HELPER: Get current member context
// =============================================================================

interface MemberContext {
  memberId: string
  organizationId: string
  profileEmail: string
}

async function getMemberContext(): Promise<{
  context: MemberContext | null
  error: string | null
}> {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { context: null, error: 'No autenticado' }
  }

  // Get user's profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id, email')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { context: null, error: 'Perfil no encontrado' }
  }

  const profileData = profile as { organization_id: string | null; email: string }
  if (!profileData.organization_id) {
    return { context: null, error: 'No perteneces a ninguna organizacion' }
  }

  // Get member record
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id')
    .eq('organization_id', profileData.organization_id)
    .eq('email', profileData.email)
    .single()

  if (memberError || !member) {
    return { context: null, error: null } // Not an error, just no member profile
  }

  return {
    context: {
      memberId: (member as { id: string }).id,
      organizationId: profileData.organization_id,
      profileEmail: profileData.email,
    },
    error: null,
  }
}

// =============================================================================
// GET TODAY'S WORKOUT
// =============================================================================

/**
 * Get today's workout for the current member.
 * Calculates which day to show based on program progress.
 */
export async function getTodaysWorkout(): Promise<{
  data: TodaysWorkout | null
  error: string | null
}> {
  const { context, error: contextError } = await getMemberContext()

  if (contextError) {
    return { data: null, error: contextError }
  }

  if (!context) {
    return {
      data: {
        workout: null,
        progress: null,
        program: null,
        nextDayNumber: 1,
        hasActiveProgram: false,
      },
      error: null,
    }
  }

  const supabase = await createClient()

  // Find active program (parent workout with days_per_week set)
  const { data: activePrograms, error: programError } = await supabase
    .from('workouts')
    .select('*')
    .eq('organization_id', context.organizationId)
    .eq('assigned_to_member_id', context.memberId)
    .eq('is_active', true)
    .not('days_per_week', 'is', null)
    .is('program_id', null) // Parent programs only
    .order('created_at', { ascending: false })
    .limit(1)

  if (programError) {
    return { data: null, error: programError.message }
  }

  const program = activePrograms?.[0] as WorkoutWithProgramFields | undefined

  if (!program) {
    // No active program - check for legacy single routines
    const { data: legacyRoutines } = await supabase
      .from('workouts')
      .select('*')
      .eq('organization_id', context.organizationId)
      .eq('assigned_to_member_id', context.memberId)
      .eq('is_active', true)
      .is('program_id', null)
      .is('days_per_week', null)
      .order('created_at', { ascending: false })
      .limit(1)

    const legacyWorkout = legacyRoutines?.[0] as Tables<'workouts'> | undefined

    return {
      data: {
        workout: legacyWorkout || null,
        progress: null,
        program: null,
        nextDayNumber: 1,
        hasActiveProgram: false,
      },
      error: null,
    }
  }

  // Get program days
  const { data: programDaysData } = await supabase
    .from('workouts')
    .select('id')
    .eq('program_id', program.id)

  const programDayIds = (programDaysData || []).map((w: { id: string }) => w.id)

  // Get total completions for this program
  const { data: completions, error: completionsError } = await supabase
    .from('workout_completions')
    .select('id')
    .eq('member_id', context.memberId)
    .in('workout_id', programDayIds)

  if (completionsError) {
    console.error('Error fetching completions:', completionsError)
  }

  const totalCompletions = completions?.length || 0
  const daysPerWeek = program.days_per_week || 3
  const totalWeeks = program.duration_weeks || 12

  // Calculate current week and next day
  const currentWeek = Math.floor(totalCompletions / daysPerWeek) + 1
  const daysThisWeek = totalCompletions % daysPerWeek
  const nextDayNumber = daysThisWeek + 1

  // Get the workout for the next day
  const { data: dayWorkouts, error: dayError } = await supabase
    .from('workouts')
    .select('*')
    .eq('program_id', program.id)
    .eq('day_number', nextDayNumber)
    .limit(1)

  if (dayError) {
    return { data: null, error: dayError.message }
  }

  const todaysWorkout = dayWorkouts?.[0] as WorkoutWithProgramFields | undefined

  // Get exercise details if we have a workout
  let exerciseDetails: Tables<'exercises'>[] = []
  if (todaysWorkout) {
    const exercises = (todaysWorkout.exercises as ExerciseItem[]) || []
    const exerciseIds = exercises.map(e => e.exercise_id)

    if (exerciseIds.length > 0) {
      const { data: exercisesData } = await supabase
        .from('exercises')
        .select('*')
        .in('id', exerciseIds)

      exerciseDetails = (exercisesData as Tables<'exercises'>[]) || []
    }
  }

  const progress: WeeklyProgress = {
    currentWeek,
    totalWeeks,
    daysCompletedThisWeek: daysThisWeek,
    daysPerWeek,
    weekPercentage: Math.round((daysThisWeek / daysPerWeek) * 100),
  }

  return {
    data: {
      workout: todaysWorkout || null,
      exerciseDetails,
      progress,
      program: {
        id: program.id,
        name: program.name,
        totalWeeks,
      },
      nextDayNumber,
      hasActiveProgram: true,
    },
    error: null,
  }
}

// =============================================================================
// COMPLETE WORKOUT
// =============================================================================

/**
 * Mark a workout as completed for the current member.
 */
export async function completeWorkout(
  workoutId: string,
  data?: CompleteWorkoutFormData
): Promise<ActionResult<WorkoutCompletion>> {
  const { context, error: contextError } = await getMemberContext()

  if (contextError) {
    return errorResult(contextError) as ActionResult<WorkoutCompletion>
  }

  if (!context) {
    return errorResult('No tienes un perfil de miembro') as ActionResult<WorkoutCompletion>
  }

  // Validate input if provided
  if (data) {
    const validated = completeWorkoutSchema.safeParse(data)
    if (!validated.success) {
      return errorResult('Datos invalidos', validated.error.flatten().fieldErrors) as ActionResult<WorkoutCompletion>
    }
  }

  const supabase = await createClient()

  // Verify workout belongs to this member
  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .select('id, program_id, organization_id')
    .eq('id', workoutId)
    .single()

  if (workoutError || !workout) {
    return errorResult('Rutina no encontrada') as ActionResult<WorkoutCompletion>
  }

  const workoutData = workout as { id: string; program_id: string | null; organization_id: string }

  // Calculate program week if this is a program day
  let programWeek: number | null = null
  if (workoutData.program_id) {
    const { data: programDays } = await supabase
      .from('workouts')
      .select('id')
      .eq('program_id', workoutData.program_id)

    const dayIds = (programDays || []).map((w: { id: string }) => w.id)

    const { data: completions } = await supabase
      .from('workout_completions')
      .select('id')
      .eq('member_id', context.memberId)
      .in('workout_id', dayIds)

    const { data: program } = await supabase
      .from('workouts')
      .select('days_per_week')
      .eq('id', workoutData.program_id)
      .single()

    const daysPerWeek = (program as { days_per_week: number | null })?.days_per_week || 3
    const totalCompletions = completions?.length || 0
    programWeek = Math.floor(totalCompletions / daysPerWeek) + 1
  }

  // Create completion record
  const insertData = {
    organization_id: workoutData.organization_id,
    workout_id: workoutId,
    member_id: context.memberId,
    completed_date: new Date().toISOString().split('T')[0],
    program_week: programWeek,
    duration_minutes: data?.durationMinutes || null,
    notes: data?.notes || null,
  }

  const { data: completion, error: insertError } = await supabase
    .from('workout_completions')
    .insert(insertData)
    .select()
    .single()

  if (insertError) {
    if (insertError.code === '23505') { // Unique constraint violation
      return errorResult('Ya completaste este entrenamiento hoy') as ActionResult<WorkoutCompletion>
    }
    return errorResult(insertError.message) as ActionResult<WorkoutCompletion>
  }

  const completionData = completion as WorkoutCompletionRow

  revalidatePath('/member/workouts')

  return successResult('Entrenamiento completado', {
    id: completionData.id,
    workoutId: completionData.workout_id,
    memberId: completionData.member_id,
    completedAt: new Date(completionData.completed_at),
    completedDate: completionData.completed_date,
    programWeek: completionData.program_week,
    durationMinutes: completionData.duration_minutes,
    notes: completionData.notes,
  })
}

// =============================================================================
// GET WEEKLY PROGRESS
// =============================================================================

/**
 * Get weekly progress for a specific program.
 */
export async function getWeeklyProgress(programId: string): Promise<{
  data: WeeklyProgress | null
  error: string | null
}> {
  const { context, error: contextError } = await getMemberContext()

  if (contextError || !context) {
    return { data: null, error: contextError || 'No autenticado' }
  }

  const supabase = await createClient()

  // Get program details
  const { data: program, error: programError } = await supabase
    .from('workouts')
    .select('days_per_week, duration_weeks')
    .eq('id', programId)
    .single()

  if (programError || !program) {
    return { data: null, error: 'Programa no encontrado' }
  }

  // Get all completions for this program's days
  const { data: programDays } = await supabase
    .from('workouts')
    .select('id')
    .eq('program_id', programId)

  const dayIds = (programDays || []).map((d) => d.id)

  const { data: completions } = await supabase
    .from('workout_completions')
    .select('id')
    .eq('member_id', context.memberId)
    .in('workout_id', dayIds)

  const totalCompletions = completions?.length || 0
  const daysPerWeek = program.days_per_week || 3
  const totalWeeks = program.duration_weeks || 12

  const currentWeek = Math.floor(totalCompletions / daysPerWeek) + 1
  const daysThisWeek = totalCompletions % daysPerWeek

  return {
    data: {
      currentWeek,
      totalWeeks,
      daysCompletedThisWeek: daysThisWeek,
      daysPerWeek,
      weekPercentage: Math.round((daysThisWeek / daysPerWeek) * 100),
    },
    error: null,
  }
}

// =============================================================================
// GET PROGRAM PROGRESS
// =============================================================================

/**
 * Get overall progress for a specific program.
 */
export async function getProgramProgress(programId: string): Promise<{
  data: ProgramProgress | null
  error: string | null
}> {
  const { context, error: contextError } = await getMemberContext()

  if (contextError || !context) {
    return { data: null, error: contextError || 'No autenticado' }
  }

  const supabase = await createClient()

  // Get program details
  const { data: program, error: programError } = await supabase
    .from('workouts')
    .select('days_per_week, duration_weeks')
    .eq('id', programId)
    .single()

  if (programError || !program) {
    return { data: null, error: 'Programa no encontrado' }
  }

  const daysPerWeek = program.days_per_week || 3
  const totalWeeks = program.duration_weeks || 12
  const totalDaysInProgram = daysPerWeek * totalWeeks

  // Get all completions for this program's days
  const { data: programDays } = await supabase
    .from('workouts')
    .select('id')
    .eq('program_id', programId)

  const dayIds = (programDays || []).map((d) => d.id)

  const { data: completions } = await supabase
    .from('workout_completions')
    .select('id')
    .eq('member_id', context.memberId)
    .in('workout_id', dayIds)

  const totalDaysCompleted = completions?.length || 0
  const currentWeek = Math.floor(totalDaysCompleted / daysPerWeek) + 1
  const percentageComplete = Math.round((totalDaysCompleted / totalDaysInProgram) * 100)
  const daysRemaining = totalDaysInProgram - totalDaysCompleted
  const isCompleted = totalDaysCompleted >= totalDaysInProgram

  return {
    data: {
      totalDaysCompleted,
      totalDaysInProgram,
      currentWeek,
      totalWeeks,
      percentageComplete,
      daysRemaining,
      isCompleted,
    },
    error: null,
  }
}

// =============================================================================
// GET PROGRAM DAYS
// =============================================================================

/**
 * Get all days for a program.
 */
export async function getProgramDays(programId: string): Promise<{
  data: ProgramDay[] | null
  error: string | null
}> {
  const { context, error: contextError } = await getMemberContext()

  if (contextError || !context) {
    return { data: null, error: contextError || 'No autenticado' }
  }

  const supabase = await createClient()

  const { data: days, error: daysError } = await supabase
    .from('workouts')
    .select('id, day_number, name, description, exercises')
    .eq('program_id', programId)
    .order('day_number', { ascending: true })

  if (daysError) {
    return { data: null, error: daysError.message }
  }

  interface DayRecord {
    id: string
    day_number: number | null
    name: string
    description: string | null
    exercises: ExerciseItem[] | null
  }

  const programDays: ProgramDay[] = ((days || []) as DayRecord[]).map(day => {
    const exercises = day.exercises || []
    return {
      id: day.id,
      dayNumber: day.day_number || 1,
      name: day.name,
      description: day.description,
      exerciseCount: exercises.length,
    }
  })

  return { data: programDays, error: null }
}

// =============================================================================
// GET MY ACTIVE PROGRAM (for member)
// =============================================================================

/**
 * Get the member's active program with all days.
 */
export async function getMyActiveProgram(): Promise<{
  data: {
    program: Tables<'workouts'>
    days: ProgramDay[]
    progress: ProgramProgress
  } | null
  error: string | null
}> {
  const { context, error: contextError } = await getMemberContext()

  if (contextError || !context) {
    return { data: null, error: contextError || 'No autenticado' }
  }

  const supabase = await createClient()

  // Find active program
  const { data: programs, error: programError } = await supabase
    .from('workouts')
    .select('*')
    .eq('organization_id', context.organizationId)
    .eq('assigned_to_member_id', context.memberId)
    .eq('is_active', true)
    .not('days_per_week', 'is', null)
    .is('program_id', null)
    .order('created_at', { ascending: false })
    .limit(1)

  if (programError) {
    return { data: null, error: programError.message }
  }

  const program = programs?.[0] as WorkoutWithProgramFields | undefined

  if (!program) {
    return { data: null, error: null }
  }

  // Get days
  const { data: daysResult, error: daysError } = await getProgramDays(program.id)

  if (daysError) {
    return { data: null, error: daysError }
  }

  // Get progress
  const { data: progressResult, error: progressError } = await getProgramProgress(program.id)

  if (progressError) {
    return { data: null, error: progressError }
  }

  return {
    data: {
      program,
      days: daysResult || [],
      progress: progressResult!,
    },
    error: null,
  }
}

// =============================================================================
// STAFF: CREATE PROGRAM
// =============================================================================

interface CreateProgramInput {
  name: string
  description?: string
  durationWeeks: number
  daysPerWeek: number
  assignedToMemberId?: string
  isTemplate?: boolean
  days: {
    dayNumber: number
    name: string
    focus?: string
    exercises: ExerciseItem[]
  }[]
}

/**
 * Create a new training program with days (staff action).
 */
export async function createProgram(input: CreateProgramInput): Promise<ActionResult<{ programId: string }>> {
  const { authorized, user, error } = await requirePermission('manage_any_member_routines')

  if (!authorized) {
    return (user ? forbiddenResult() : unauthorizedResult(error || undefined)) as ActionResult<{ programId: string }>
  }

  const supabase = await createClient()

  // Create parent program record
  const programInsert = {
    organization_id: user!.organizationId,
    name: input.name,
    description: input.description || null,
    workout_type: 'program',
    duration_weeks: input.durationWeeks,
    days_per_week: input.daysPerWeek,
    exercises: [] as unknown as Json,
    assigned_to_member_id: input.assignedToMemberId || null,
    assigned_by_id: user!.id,
    is_template: input.isTemplate ?? !input.assignedToMemberId,
    is_active: true,
    program_start_date: input.assignedToMemberId ? new Date().toISOString().split('T')[0] : null,
  }

  const { data: program, error: programError } = await supabase
    .from('workouts')
    .insert(programInsert)
    .select('id')
    .single()

  if (programError) {
    return errorResult(programError.message) as ActionResult<{ programId: string }>
  }

  const programId = program.id

  // Create day records
  for (const day of input.days) {
    const dayInsert = {
      organization_id: user!.organizationId,
      program_id: programId,
      day_number: day.dayNumber,
      name: day.name,
      description: day.focus || null,
      workout_type: 'routine',
      exercises: day.exercises as unknown as Json,
      assigned_to_member_id: input.assignedToMemberId || null,
      assigned_by_id: user!.id,
      is_template: false,
      is_active: true,
    }

    const { error: dayError } = await supabase
      .from('workouts')
      .insert(dayInsert)

    if (dayError) {
      // Rollback: delete the program if day creation fails
      await supabase.from('workouts').delete().eq('id', programId)
      return errorResult(`Error creando dia ${day.dayNumber}: ${dayError.message}`) as ActionResult<{ programId: string }>
    }
  }

  revalidatePath('/dashboard/routines')

  return successResult('Programa creado exitosamente', { programId })
}

// =============================================================================
// GET MEMBER'S COMPLETION HISTORY
// =============================================================================

/**
 * Get completion history for the current member.
 */
export async function getMyCompletionHistory(limit = 10): Promise<{
  data: {
    completion: WorkoutCompletionRow
    workout: Tables<'workouts'>
  }[] | null
  error: string | null
}> {
  const { context, error: contextError } = await getMemberContext()

  if (contextError || !context) {
    return { data: null, error: contextError || 'No autenticado' }
  }

  const supabase = await createClient()

  const { data: completions, error: completionsError } = await supabase
    .from('workout_completions')
    .select(`
      *,
      workout:workouts(*)
    `)
    .eq('member_id', context.memberId)
    .order('completed_at', { ascending: false })
    .limit(limit)

  if (completionsError) {
    return { data: null, error: completionsError.message }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (completions || []).map((c: any) => ({
    completion: c as WorkoutCompletionRow,
    workout: c.workout as Tables<'workouts'>,
  }))

  return { data: result, error: null }
}
