'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  exerciseSchema,
  exerciseUpdateSchema,
  type ExerciseFormData,
  type ExerciseSearchParams,
} from '@/schemas/exercise.schema'
import type { Tables, TablesInsert } from '@/types/database.types'

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
// GET EXERCISES (includes global + organization exercises)
// =============================================================================

export async function getExercises(params?: ExerciseSearchParams): Promise<{
  data: Tables<'exercises'>[] | null
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
  const includeGlobal = params?.include_global ?? true

  const supabase = await createClient()

  // Handle sorting
  const sortBy = params?.sort_by || 'name'
  const sortDir = params?.sort_dir || 'asc'
  const ascending = sortDir === 'asc'

  let query = supabase
    .from('exercises')
    .select('*', { count: 'exact' })
    .order(sortBy, { ascending })
    .range(from, to)

  // Filter by organization OR global
  if (includeGlobal) {
    query = query.or(`organization_id.eq.${profile.organization_id},is_global.eq.true`)
  } else {
    query = query.eq('organization_id', profile.organization_id)
  }

  // Apply filters
  if (params?.query) {
    query = query.or(`name.ilike.%${params.query}%,name_es.ilike.%${params.query}%,name_en.ilike.%${params.query}%`)
  }

  if (params?.category) {
    query = query.eq('category', params.category)
  }

  if (params?.difficulty) {
    query = query.eq('difficulty', params.difficulty)
  }

  if (params?.muscle_group) {
    query = query.contains('muscle_groups', [params.muscle_group])
  }

  if (params?.equipment) {
    query = query.contains('equipment', [params.equipment])
  }

  if (params?.is_active !== undefined) {
    query = query.eq('is_active', params.is_active)
  }

  const { data, count, error } = await query

  if (error) {
    return { data: null, count: 0, error: error.message }
  }

  return { data, count: count ?? 0, error: null }
}

// =============================================================================
// GET SINGLE EXERCISE
// =============================================================================

export async function getExercise(id: string): Promise<{
  data: Tables<'exercises'> | null
  error: string | null
}> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { data: null, error: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', id)
    .or(`organization_id.eq.${profile.organization_id},is_global.eq.true`)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

// =============================================================================
// CREATE EXERCISE
// =============================================================================

export async function createExerciseData(data: ExerciseFormData): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const validated = exerciseSchema.safeParse(data)

  if (!validated.success) {
    return {
      success: false,
      message: 'Validacion fallida',
      errors: validated.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()

  // Clean up empty URL strings
  const cleanData = {
    ...validated.data,
    video_url: validated.data.video_url || null,
    gif_url: validated.data.gif_url || null,
    thumbnail_url: validated.data.thumbnail_url || null,
  }

  const insertData: TablesInsert<'exercises'> = {
    ...cleanData,
    organization_id: profile.organization_id,
    is_global: false, // Organization exercises are never global
  }

  const { data: exerciseResult, error } = await supabase
    .from('exercises')
    .insert(insertData as never)
    .select()
    .single()

  if (error) {
    return {
      success: false,
      message: error.message,
    }
  }

  revalidatePath('/dashboard/exercises')
  return {
    success: true,
    message: 'Ejercicio creado exitosamente',
    data: exerciseResult,
  }
}

// =============================================================================
// UPDATE EXERCISE
// =============================================================================

export async function updateExerciseData(
  id: string,
  data: Partial<ExerciseFormData>
): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  // First check if the exercise belongs to the organization
  const supabase = await createClient()

  const { data: existingExercise, error: fetchError } = await supabase
    .from('exercises')
    .select('organization_id, is_global')
    .eq('id', id)
    .single()

  if (fetchError || !existingExercise) {
    return { success: false, message: 'Ejercicio no encontrado' }
  }

  const exercise = existingExercise as { organization_id: string | null; is_global: boolean }

  // Can't edit global exercises
  if (exercise.is_global) {
    return { success: false, message: 'No se pueden editar ejercicios globales' }
  }

  // Must belong to the organization
  if (exercise.organization_id !== profile.organization_id) {
    return { success: false, message: 'No tienes permiso para editar este ejercicio' }
  }

  const validated = exerciseUpdateSchema.safeParse(data)

  if (!validated.success) {
    return {
      success: false,
      message: 'Validacion fallida',
      errors: validated.error.flatten().fieldErrors,
    }
  }

  // Clean up empty URL strings
  const cleanData = {
    ...validated.data,
    video_url: validated.data.video_url || null,
    gif_url: validated.data.gif_url || null,
    thumbnail_url: validated.data.thumbnail_url || null,
  }

  const { data: exerciseResult, error } = await supabase
    .from('exercises')
    .update(cleanData as never)
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

  revalidatePath('/dashboard/exercises')
  revalidatePath(`/dashboard/exercises/${id}`)
  return {
    success: true,
    message: 'Ejercicio actualizado exitosamente',
    data: exerciseResult,
  }
}

// =============================================================================
// DELETE EXERCISE
// =============================================================================

export async function deleteExercise(id: string): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  // First check if the exercise belongs to the organization
  const { data: existingExercise, error: fetchError } = await supabase
    .from('exercises')
    .select('organization_id, is_global')
    .eq('id', id)
    .single()

  if (fetchError || !existingExercise) {
    return { success: false, message: 'Ejercicio no encontrado' }
  }

  const exercise = existingExercise as { organization_id: string | null; is_global: boolean }

  // Can't delete global exercises
  if (exercise.is_global) {
    return { success: false, message: 'No se pueden eliminar ejercicios globales' }
  }

  // Must belong to the organization
  if (exercise.organization_id !== profile.organization_id) {
    return { success: false, message: 'No tienes permiso para eliminar este ejercicio' }
  }

  const { error } = await supabase
    .from('exercises')
    .delete()
    .eq('id', id)
    .eq('organization_id', profile.organization_id)

  if (error) {
    return {
      success: false,
      message: error.message,
    }
  }

  revalidatePath('/dashboard/exercises')
  return {
    success: true,
    message: 'Ejercicio eliminado exitosamente',
  }
}

// =============================================================================
// TOGGLE EXERCISE STATUS
// =============================================================================

export async function toggleExerciseStatus(id: string): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  // Get current status and verify ownership
  const { data: exercise, error: fetchError } = await supabase
    .from('exercises')
    .select('is_active, organization_id, is_global')
    .eq('id', id)
    .single()

  if (fetchError || !exercise) {
    return {
      success: false,
      message: 'Ejercicio no encontrado',
    }
  }

  const exerciseData = exercise as { is_active: boolean; organization_id: string | null; is_global: boolean }

  // Can't toggle global exercises
  if (exerciseData.is_global) {
    return { success: false, message: 'No se pueden modificar ejercicios globales' }
  }

  // Must belong to the organization
  if (exerciseData.organization_id !== profile.organization_id) {
    return { success: false, message: 'No tienes permiso para modificar este ejercicio' }
  }

  // Toggle status
  const { error } = await supabase
    .from('exercises')
    .update({ is_active: !exerciseData.is_active } as never)
    .eq('id', id)
    .eq('organization_id', profile.organization_id)

  if (error) {
    return {
      success: false,
      message: error.message,
    }
  }

  revalidatePath('/dashboard/exercises')
  return {
    success: true,
    message: exerciseData.is_active ? 'Ejercicio desactivado' : 'Ejercicio activado',
  }
}

// =============================================================================
// GET EXERCISES COUNT
// =============================================================================

export async function getExercisesCount(): Promise<{ count: number; error: string | null }> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { count: 0, error: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  const { count, error } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true })
    .or(`organization_id.eq.${profile.organization_id},is_global.eq.true`)
    .eq('is_active', true)

  if (error) {
    return { count: 0, error: error.message }
  }

  return { count: count ?? 0, error: null }
}

// =============================================================================
// DUPLICATE GLOBAL EXERCISE (create org copy)
// =============================================================================

export async function duplicateExercise(id: string): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  // Get the exercise to duplicate
  const { data: exercise, error: fetchError } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !exercise) {
    return { success: false, message: 'Ejercicio no encontrado' }
  }

  const exerciseData = exercise as Tables<'exercises'>

  // Create a copy for the organization
  const insertData: TablesInsert<'exercises'> = {
    name: `${exerciseData.name} (copia)`,
    name_es: exerciseData.name_es,
    name_en: exerciseData.name_en,
    description: exerciseData.description,
    category: exerciseData.category,
    muscle_groups: exerciseData.muscle_groups,
    equipment: exerciseData.equipment,
    difficulty: exerciseData.difficulty,
    video_url: exerciseData.video_url,
    gif_url: exerciseData.gif_url,
    thumbnail_url: exerciseData.thumbnail_url,
    instructions: exerciseData.instructions,
    tips: exerciseData.tips,
    common_mistakes: exerciseData.common_mistakes,
    organization_id: profile.organization_id,
    is_global: false,
    is_active: true,
  }

  const { data: newExercise, error } = await supabase
    .from('exercises')
    .insert(insertData as never)
    .select()
    .single()

  if (error) {
    return {
      success: false,
      message: error.message,
    }
  }

  revalidatePath('/dashboard/exercises')
  return {
    success: true,
    message: 'Ejercicio duplicado exitosamente',
    data: newExercise,
  }
}
