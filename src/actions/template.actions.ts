'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  classTemplateSchema,
  classTemplateUpdateSchema,
  generateClassesSchema,
  type ClassTemplateFormData,
  type GenerateClassesParams,
} from '@/schemas/template.schema'
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

interface Organization {
  id: string
  timezone: string
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

async function getOrganization(orgId: string): Promise<Organization | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('organizations')
    .select('id, timezone')
    .eq('id', orgId)
    .single()

  return data as Organization | null
}

// =============================================================================
// GET CLASS TEMPLATES
// =============================================================================

export async function getClassTemplates(params?: {
  query?: string
  is_active?: boolean
  day_of_week?: number
  class_type?: string
  page?: number
  per_page?: number
  sort_by?: string
  sort_dir?: 'asc' | 'desc'
}): Promise<{ data: Tables<'class_templates'>[] | null; count: number; error: string | null }> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { data: null, count: 0, error: profileError ?? 'No profile found' }
  }

  const page = params?.page ?? 1
  const perPage = params?.per_page ?? 50
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  // Handle sorting
  const sortBy = params?.sort_by || 'day_of_week'
  const sortDir = params?.sort_dir || 'asc'
  const ascending = sortDir === 'asc'

  const supabase = await createClient()

  let dbQuery = supabase
    .from('class_templates')
    .select('*', { count: 'exact' })
    .eq('organization_id', profile.organization_id)
    .order(sortBy, { ascending })
    .order('start_time', { ascending: true })
    .range(from, to)

  // Search by name
  if (params?.query) {
    dbQuery = dbQuery.ilike('name', `%${params.query}%`)
  }

  if (params?.is_active !== undefined) {
    dbQuery = dbQuery.eq('is_active', params.is_active)
  }

  if (params?.day_of_week !== undefined) {
    dbQuery = dbQuery.eq('day_of_week', params.day_of_week)
  }

  if (params?.class_type) {
    dbQuery = dbQuery.eq('class_type', params.class_type)
  }

  const { data, count, error } = await dbQuery

  if (error) {
    return { data: null, count: 0, error: error.message }
  }

  return { data, count: count ?? 0, error: null }
}

// =============================================================================
// GET SINGLE CLASS TEMPLATE
// =============================================================================

export async function getClassTemplate(id: string): Promise<{ data: Tables<'class_templates'> | null; error: string | null }> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { data: null, error: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('class_templates')
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
// CREATE CLASS TEMPLATE (Data-based - for react-hook-form)
// =============================================================================

export async function createClassTemplateData(data: ClassTemplateFormData): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const validated = classTemplateSchema.safeParse(data)

  if (!validated.success) {
    return {
      success: false,
      message: 'Validacion fallida',
      errors: validated.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()

  const insertData: TablesInsert<'class_templates'> = {
    ...validated.data,
    organization_id: profile.organization_id,
  }

  const { data: templateResult, error } = await supabase
    .from('class_templates')
    .insert(insertData as never)
    .select()
    .single()

  if (error) {
    return {
      success: false,
      message: error.message,
    }
  }

  revalidatePath('/dashboard/templates')
  return {
    success: true,
    message: 'Plantilla creada exitosamente',
    data: templateResult,
  }
}

// =============================================================================
// UPDATE CLASS TEMPLATE (Data-based - for react-hook-form)
// =============================================================================

export async function updateClassTemplateData(
  id: string,
  data: Partial<ClassTemplateFormData>
): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const validated = classTemplateUpdateSchema.safeParse(data)

  if (!validated.success) {
    return {
      success: false,
      message: 'Validacion fallida',
      errors: validated.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()

  const { data: templateResult, error } = await supabase
    .from('class_templates')
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

  revalidatePath('/dashboard/templates')
  revalidatePath(`/dashboard/templates/${id}`)
  return {
    success: true,
    message: 'Plantilla actualizada exitosamente',
    data: templateResult,
  }
}

// =============================================================================
// DELETE CLASS TEMPLATE
// =============================================================================

export async function deleteClassTemplate(id: string): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('class_templates')
    .delete()
    .eq('id', id)
    .eq('organization_id', profile.organization_id)

  if (error) {
    return {
      success: false,
      message: error.message,
    }
  }

  revalidatePath('/dashboard/templates')
  return {
    success: true,
    message: 'Plantilla eliminada exitosamente',
  }
}

// =============================================================================
// TOGGLE TEMPLATE STATUS
// =============================================================================

export async function toggleTemplateStatus(id: string): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  // Get current status
  const { data: template, error: fetchError } = await supabase
    .from('class_templates')
    .select('is_active')
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (fetchError || !template) {
    return {
      success: false,
      message: 'Plantilla no encontrada',
    }
  }

  const templateData = template as { is_active: boolean }

  // Toggle status
  const { error } = await supabase
    .from('class_templates')
    .update({ is_active: !templateData.is_active } as never)
    .eq('id', id)
    .eq('organization_id', profile.organization_id)

  if (error) {
    return {
      success: false,
      message: error.message,
    }
  }

  revalidatePath('/dashboard/templates')
  return {
    success: true,
    message: templateData.is_active ? 'Plantilla desactivada' : 'Plantilla activada',
  }
}

// =============================================================================
// HELPER: Get dates for a day of week in a date range
// =============================================================================

function getDatesForDayOfWeek(
  dayOfWeek: number,
  startDate: Date,
  endDate: Date
): Date[] {
  const dates: Date[] = []
  const current = new Date(startDate)

  // Move to first occurrence of dayOfWeek
  while (current.getDay() !== dayOfWeek) {
    current.setDate(current.getDate() + 1)
  }

  // Collect all occurrences within range
  while (current <= endDate) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 7)
  }

  return dates
}

// =============================================================================
// HELPER: Combine date and time string to create ISO timestamp
// =============================================================================

function combineDateTime(date: Date, timeStr: string, timezone: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const combined = new Date(date)
  combined.setHours(hours, minutes, 0, 0)

  // For now, we return ISO string. In production, you'd want proper timezone handling
  // using a library like date-fns-tz or luxon
  return combined.toISOString()
}

// =============================================================================
// PREVIEW CLASS GENERATION (without creating)
// =============================================================================

export async function previewClassGeneration(params: GenerateClassesParams): Promise<{
  data: {
    template: Tables<'class_templates'>
    dates: string[]
    alreadyGenerated: string[]
    toGenerate: string[]
  }[] | null
  totalToGenerate: number
  error: string | null
}> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { data: null, totalToGenerate: 0, error: profileError ?? 'No profile found' }
  }

  const validated = generateClassesSchema.safeParse(params)
  if (!validated.success) {
    return { data: null, totalToGenerate: 0, error: 'Parametros invalidos' }
  }

  const supabase = await createClient()

  // Calculate date range
  const startDate = params.start_date ? new Date(params.start_date) : new Date()
  startDate.setHours(0, 0, 0, 0)

  let daysToAdd: number
  switch (validated.data.period) {
    case 'week':
      daysToAdd = 7
      break
    case 'two_weeks':
      daysToAdd = 14
      break
    case 'month':
      daysToAdd = 30
      break
  }

  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + daysToAdd)

  // Get templates
  let templatesQuery = supabase
    .from('class_templates')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .eq('is_active', true)

  if (validated.data.template_ids && validated.data.template_ids.length > 0) {
    templatesQuery = templatesQuery.in('id', validated.data.template_ids)
  }

  const { data: templates, error: templatesError } = await templatesQuery

  if (templatesError || !templates) {
    return { data: null, totalToGenerate: 0, error: 'Error al obtener plantillas' }
  }

  const preview: {
    template: Tables<'class_templates'>
    dates: string[]
    alreadyGenerated: string[]
    toGenerate: string[]
  }[] = []

  let totalToGenerate = 0

  for (const template of templates) {
    const templateData = template as Tables<'class_templates'>

    // Get dates for this template's day of week
    const dates = getDatesForDayOfWeek(templateData.day_of_week, startDate, endDate)
    const dateStrings = dates.map(d => d.toISOString().split('T')[0])

    // Check which dates are already generated
    const { data: existingLogs } = await supabase
      .from('class_generation_log')
      .select('generated_date')
      .eq('template_id', templateData.id)
      .in('generated_date', dateStrings)

    const alreadyGenerated = (existingLogs || []).map(log => {
      const logData = log as { generated_date: string }
      return logData.generated_date
    })

    const toGenerate = dateStrings.filter(d => !alreadyGenerated.includes(d))

    preview.push({
      template: templateData,
      dates: dateStrings,
      alreadyGenerated,
      toGenerate,
    })

    totalToGenerate += toGenerate.length
  }

  return { data: preview, totalToGenerate, error: null }
}

// =============================================================================
// GENERATE CLASSES FROM TEMPLATES
// =============================================================================

export async function generateClassesFromTemplates(params: GenerateClassesParams): Promise<{
  success: boolean
  message: string
  classesCreated: number
  errors?: string[]
}> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found', classesCreated: 0 }
  }

  const validated = generateClassesSchema.safeParse(params)
  if (!validated.success) {
    return { success: false, message: 'Parametros invalidos', classesCreated: 0 }
  }

  const supabase = await createClient()

  // Get organization timezone
  const organization = await getOrganization(profile.organization_id)
  const timezone = organization?.timezone || 'America/Mexico_City'

  // Calculate date range
  const startDate = params.start_date ? new Date(params.start_date) : new Date()
  startDate.setHours(0, 0, 0, 0)

  let daysToAdd: number
  switch (validated.data.period) {
    case 'week':
      daysToAdd = 7
      break
    case 'two_weeks':
      daysToAdd = 14
      break
    case 'month':
      daysToAdd = 30
      break
  }

  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + daysToAdd)

  // Get templates
  let templatesQuery = supabase
    .from('class_templates')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .eq('is_active', true)

  if (validated.data.template_ids && validated.data.template_ids.length > 0) {
    templatesQuery = templatesQuery.in('id', validated.data.template_ids)
  }

  const { data: templates, error: templatesError } = await templatesQuery

  if (templatesError || !templates) {
    return { success: false, message: 'Error al obtener plantillas', classesCreated: 0 }
  }

  let classesCreated = 0
  const errors: string[] = []

  for (const template of templates) {
    const templateData = template as Tables<'class_templates'>

    // Get dates for this template's day of week
    const dates = getDatesForDayOfWeek(templateData.day_of_week, startDate, endDate)

    for (const date of dates) {
      const dateString = date.toISOString().split('T')[0]

      // Check if already generated
      const { data: existingLog } = await supabase
        .from('class_generation_log')
        .select('id')
        .eq('template_id', templateData.id)
        .eq('generated_date', dateString)
        .single()

      if (existingLog) {
        continue // Skip - already generated
      }

      // Create the class
      const classData: TablesInsert<'classes'> = {
        organization_id: profile.organization_id,
        name: templateData.name,
        description: templateData.description ?? undefined,
        class_type: templateData.class_type ?? undefined,
        start_time: combineDateTime(date, templateData.start_time, timezone),
        end_time: combineDateTime(date, templateData.end_time, timezone),
        max_capacity: templateData.max_capacity ?? undefined,
        waitlist_enabled: templateData.waitlist_enabled ?? undefined,
        max_waitlist: templateData.max_waitlist ?? undefined,
        instructor_id: templateData.instructor_id ?? undefined,
        instructor_name: templateData.instructor_name ?? undefined,
        location: templateData.location ?? undefined,
        booking_opens_hours: templateData.booking_opens_hours ?? undefined,
        booking_closes_minutes: templateData.booking_closes_minutes ?? undefined,
        cancellation_deadline_hours: templateData.cancellation_deadline_hours ?? undefined,
      }

      const { data: newClass, error: classError } = await supabase
        .from('classes')
        .insert(classData as never)
        .select('id')
        .single()

      if (classError) {
        errors.push(`Error creando clase para ${templateData.name} el ${dateString}: ${classError.message}`)
        continue
      }

      const classResult = newClass as { id: string }

      // Log the generation
      const logData: TablesInsert<'class_generation_log'> = {
        organization_id: profile.organization_id,
        template_id: templateData.id,
        generated_class_id: classResult.id,
        generated_date: dateString,
      }

      const { error: logError } = await supabase
        .from('class_generation_log')
        .insert(logData as never)

      if (logError) {
        errors.push(`Error registrando generacion para ${templateData.name}: ${logError.message}`)
      }

      classesCreated++
    }
  }

  revalidatePath('/dashboard/classes')
  revalidatePath('/dashboard/templates')

  return {
    success: true,
    message: `Se generaron ${classesCreated} clases exitosamente`,
    classesCreated,
    errors: errors.length > 0 ? errors : undefined,
  }
}

// =============================================================================
// GET ACTIVE TEMPLATES COUNT
// =============================================================================

export async function getActiveTemplatesCount(): Promise<{ count: number; error: string | null }> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { count: 0, error: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  const { count, error } = await supabase
    .from('class_templates')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', profile.organization_id)
    .eq('is_active', true)

  if (error) {
    return { count: 0, error: error.message }
  }

  return { count: count ?? 0, error: null }
}
