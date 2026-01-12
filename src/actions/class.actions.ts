'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { classSchema, classUpdateSchema, classCancelSchema, type ClassFormData } from '@/schemas/class.schema'
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
// GET CLASSES
// =============================================================================

// Extended class type with template info
export type ClassWithTemplate = Tables<'classes'> & {
  template_info?: {
    template_id: string
    template_name: string
  } | null
}

export async function getClasses(params?: {
  query?: string
  start_date?: string
  end_date?: string
  class_type?: string
  instructor_id?: string
  status?: 'active' | 'cancelled' | 'finished'
  page?: number
  per_page?: number
  sort_by?: string
  sort_dir?: 'asc' | 'desc'
  include_template?: boolean
}): Promise<{ data: ClassWithTemplate[] | null; count: number; error: string | null }> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { data: null, count: 0, error: profileError ?? 'No profile found' }
  }
  const page = params?.page ?? 1
  const perPage = params?.per_page ?? 50
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  // Handle sorting
  const sortBy = params?.sort_by || 'start_time'
  const sortDir = params?.sort_dir || 'asc'
  const ascending = sortDir === 'asc'

  const supabase = await createClient()

  let dbQuery = supabase
    .from('classes')
    .select('*', { count: 'exact' })
    .eq('organization_id', profile.organization_id)
    .order(sortBy, { ascending })
    .range(from, to)

  // Search by name
  if (params?.query) {
    dbQuery = dbQuery.ilike('name', `%${params.query}%`)
  }

  if (params?.start_date) {
    dbQuery = dbQuery.gte('start_time', params.start_date)
  }

  if (params?.end_date) {
    dbQuery = dbQuery.lte('start_time', params.end_date)
  }

  if (params?.class_type) {
    dbQuery = dbQuery.eq('class_type', params.class_type)
  }

  if (params?.instructor_id) {
    dbQuery = dbQuery.eq('instructor_id', params.instructor_id)
  }

  // Filter by status
  if (params?.status) {
    const now = new Date().toISOString()
    if (params.status === 'cancelled') {
      dbQuery = dbQuery.eq('is_cancelled', true)
    } else if (params.status === 'finished') {
      // A class is finished when end_time has passed
      dbQuery = dbQuery.eq('is_cancelled', false).lt('end_time', now)
    } else if (params.status === 'active') {
      // A class is active if it hasn't ended yet
      dbQuery = dbQuery.eq('is_cancelled', false).gte('end_time', now)
    }
  }

  const { data, count, error } = await dbQuery

  if (error) {
    return { data: null, count: 0, error: error.message }
  }

  // If include_template is true, fetch template info for each class
  if (params?.include_template && data && data.length > 0) {
    const classIds = data.map((c) => (c as Tables<'classes'>).id)

    const { data: generationLogs } = await supabase
      .from('class_generation_log')
      .select(`
        generated_class_id,
        template_id,
        class_templates!inner (
          name
        )
      `)
      .in('generated_class_id', classIds)

    // Create a map of class_id -> template info
    const templateMap = new Map<string, { template_id: string; template_name: string }>()
    if (generationLogs) {
      for (const log of generationLogs) {
        const logData = log as {
          generated_class_id: string
          template_id: string
          class_templates: { name: string }
        }
        templateMap.set(logData.generated_class_id, {
          template_id: logData.template_id,
          template_name: logData.class_templates.name,
        })
      }
    }

    // Add template info to classes
    const classesWithTemplates = data.map((classItem) => {
      const c = classItem as Tables<'classes'>
      return {
        ...c,
        template_info: templateMap.get(c.id) || null,
      }
    })

    return { data: classesWithTemplates, count: count ?? 0, error: null }
  }

  return { data: data as ClassWithTemplate[], count: count ?? 0, error: null }
}

// =============================================================================
// GET CLASSES BY WEEK (for calendar view)
// =============================================================================

export async function getClassesByWeek(params: {
  week_start: string  // YYYY-MM-DD format (Monday)
  week_end: string    // YYYY-MM-DD format (Sunday)
}): Promise<{ data: ClassWithTemplate[] | null; error: string | null }> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { data: null, error: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  // Get classes within the week range
  const { data: classes, error } = await supabase
    .from('classes')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .gte('start_time', `${params.week_start}T00:00:00`)
    .lte('start_time', `${params.week_end}T23:59:59`)
    .order('start_time', { ascending: true })

  if (error) {
    return { data: null, error: error.message }
  }

  if (!classes || classes.length === 0) {
    return { data: [], error: null }
  }

  // Get template info for these classes
  const classIds = classes.map((c) => (c as Tables<'classes'>).id)

  const { data: generationLogs } = await supabase
    .from('class_generation_log')
    .select(`
      generated_class_id,
      template_id,
      class_templates!inner (
        name
      )
    `)
    .in('generated_class_id', classIds)

  // Create a map of class_id -> template info
  const templateMap = new Map<string, { template_id: string; template_name: string }>()
  if (generationLogs) {
    for (const log of generationLogs) {
      const logData = log as {
        generated_class_id: string
        template_id: string
        class_templates: { name: string }
      }
      templateMap.set(logData.generated_class_id, {
        template_id: logData.template_id,
        template_name: logData.class_templates.name,
      })
    }
  }

  // Add template info to classes
  const classesWithTemplates = classes.map((classItem) => {
    const c = classItem as Tables<'classes'>
    return {
      ...c,
      template_info: templateMap.get(c.id) || null,
    }
  })

  return { data: classesWithTemplates, error: null }
}

// =============================================================================
// GET SINGLE CLASS
// =============================================================================

export async function getClass(id: string): Promise<{ data: Tables<'classes'> | null; error: string | null }> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { data: null, error: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('classes')
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
// CREATE CLASS
// =============================================================================

export async function createClass(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const rawData = {
    name: formData.get('name'),
    description: formData.get('description') || null,
    class_type: formData.get('class_type') || null,
    start_time: formData.get('start_time'),
    end_time: formData.get('end_time'),
    max_capacity: Number(formData.get('max_capacity')) || 20,
    waitlist_enabled: formData.get('waitlist_enabled') === 'true',
    max_waitlist: Number(formData.get('max_waitlist')) || 5,
    instructor_id: formData.get('instructor_id') || null,
    instructor_name: formData.get('instructor_name') || null,
    location: formData.get('location') || null,
    booking_opens_hours: Number(formData.get('booking_opens_hours')) || 168,
    booking_closes_minutes: Number(formData.get('booking_closes_minutes')) || 60,
    cancellation_deadline_hours: Number(formData.get('cancellation_deadline_hours')) || 2,
    is_recurring: formData.get('is_recurring') === 'true',
    recurrence_rule: formData.get('recurrence_rule') || null,
  }

  const validated = classSchema.safeParse(rawData)

  if (!validated.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: validated.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()

  const insertData = {
    ...validated.data,
    organization_id: profile.organization_id,
  }

  const { data, error } = await supabase
    .from('classes')
    .insert(insertData as never)
    .select()
    .single()

  if (error) {
    return {
      success: false,
      message: error.message,
    }
  }

  revalidatePath('/dashboard/classes')
  return {
    success: true,
    message: 'Class created successfully',
    data,
  }
}

// =============================================================================
// UPDATE CLASS
// =============================================================================

export async function updateClass(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const rawData = {
    name: formData.get('name'),
    description: formData.get('description') || null,
    class_type: formData.get('class_type') || null,
    start_time: formData.get('start_time'),
    end_time: formData.get('end_time'),
    max_capacity: Number(formData.get('max_capacity')) || 20,
    waitlist_enabled: formData.get('waitlist_enabled') === 'true',
    max_waitlist: Number(formData.get('max_waitlist')) || 5,
    instructor_id: formData.get('instructor_id') || null,
    instructor_name: formData.get('instructor_name') || null,
    location: formData.get('location') || null,
    booking_opens_hours: Number(formData.get('booking_opens_hours')) || 168,
    booking_closes_minutes: Number(formData.get('booking_closes_minutes')) || 60,
    cancellation_deadline_hours: Number(formData.get('cancellation_deadline_hours')) || 2,
    is_recurring: formData.get('is_recurring') === 'true',
    recurrence_rule: formData.get('recurrence_rule') || null,
  }

  const validated = classUpdateSchema.safeParse(rawData)

  if (!validated.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: validated.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('classes')
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

  revalidatePath('/dashboard/classes')
  revalidatePath(`/dashboard/classes/${id}`)
  return {
    success: true,
    message: 'Class updated successfully',
    data,
  }
}

// =============================================================================
// DELETE CLASS
// =============================================================================

export async function deleteClass(id: string): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', id)
    .eq('organization_id', profile.organization_id)

  if (error) {
    return {
      success: false,
      message: error.message,
    }
  }

  revalidatePath('/dashboard/classes')
  return {
    success: true,
    message: 'Class deleted successfully',
  }
}

// =============================================================================
// CREATE CLASS (Data-based - for react-hook-form)
// =============================================================================

export async function createClassData(data: ClassFormData): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const validated = classSchema.safeParse(data)

  if (!validated.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: validated.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()

  const insertData = {
    ...validated.data,
    organization_id: profile.organization_id,
  }

  const { data: classResult, error } = await supabase
    .from('classes')
    .insert(insertData as never)
    .select()
    .single()

  if (error) {
    return {
      success: false,
      message: error.message,
    }
  }

  revalidatePath('/dashboard/classes')
  return {
    success: true,
    message: 'Clase creada exitosamente',
    data: classResult,
  }
}

// =============================================================================
// UPDATE CLASS (Data-based - for react-hook-form)
// =============================================================================

export async function updateClassData(
  id: string,
  data: Partial<ClassFormData>
): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const validated = classUpdateSchema.safeParse(data)

  if (!validated.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: validated.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()

  const { data: classResult, error } = await supabase
    .from('classes')
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

  revalidatePath('/dashboard/classes')
  revalidatePath(`/dashboard/classes/${id}`)
  return {
    success: true,
    message: 'Clase actualizada exitosamente',
    data: classResult,
  }
}

// =============================================================================
// CANCEL CLASS
// =============================================================================

export async function cancelClass(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const rawData = {
    cancellation_reason: formData.get('cancellation_reason') || undefined,
  }

  const validated = classCancelSchema.safeParse(rawData)

  if (!validated.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: validated.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('classes')
    .update({
      is_cancelled: true,
      cancellation_reason: validated.data.cancellation_reason,
    } as never)
    .eq('id', id)
    .eq('organization_id', profile.organization_id)

  if (error) {
    return {
      success: false,
      message: error.message,
    }
  }

  revalidatePath('/dashboard/classes')
  return {
    success: true,
    message: 'Class cancelled successfully',
  }
}

// =============================================================================
// GET CLASS WITH BOOKINGS
// =============================================================================

export async function getClassWithBookings(id: string): Promise<{
  data: (Tables<'classes'> & { bookings: Tables<'bookings'>[] }) | null
  error: string | null
}> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { data: null, error: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      bookings (*)
    `)
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as Tables<'classes'> & { bookings: Tables<'bookings'>[] }, error: null }
}
