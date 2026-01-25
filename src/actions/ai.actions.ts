'use server'

/**
 * AI Server Actions
 *
 * Server actions for AI features in the dashboard.
 * These are called from client components via Next.js server actions.
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
import {
  createAIContext,
  checkAILimit,
  consumeAITokens,
  type AIFeature,
} from '@/server/ai'
import {
  generateRoutine,
  type RoutineGenerationRequest,
  type FitnessGoal,
  type ExperienceLevel,
} from '@/server/ai/routine-generator'
import type { TablesInsert, Json } from '@/types/database.types'
import { z } from 'zod'

// =============================================================================
// Validation Schemas
// =============================================================================

const routineGenerationSchema = z.object({
  memberId: z.string().uuid().optional(),
  memberName: z.string().optional(),
  goal: z.enum(['muscle_gain', 'fat_loss', 'strength', 'general', 'endurance', 'flexibility']),
  daysPerWeek: z.number().int().min(1).max(7),
  sessionMinutes: z.number().int().min(15).max(180),
  equipment: z.array(z.string()),
  restrictions: z.array(z.string()).optional(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  preferences: z.string().max(500).optional(),
})

export type RoutineGenerationInput = z.infer<typeof routineGenerationSchema>

// =============================================================================
// AI Limit Check Action
// =============================================================================

export interface AILimitStatus {
  allowed: boolean
  feature: AIFeature
  generalUsed: number
  generalLimit: number
  featureUsed: number
  featureLimit: number
  error?: {
    code: 'AI_LIMIT_REACHED'
    message: string
    upgrade_required: boolean
  }
}

/**
 * Check if an AI feature is available based on plan limits
 */
export async function checkAIFeatureLimit(feature: AIFeature): Promise<ActionResult<AILimitStatus>> {
  const { authorized, user, error } = await requirePermission('manage_any_member_routines')

  if (!authorized) {
    return (user ? forbiddenResult() : unauthorizedResult(error || undefined)) as ActionResult<AILimitStatus>
  }

  try {
    const context = await createAIContext(user!.organizationId, user!.id)
    const limitCheck = await checkAILimit(context, feature)

    const status: AILimitStatus = {
      allowed: limitCheck.allowed,
      feature,
      generalUsed: limitCheck.generalUsed,
      generalLimit: limitCheck.generalLimit,
      featureUsed: limitCheck.featureUsed,
      featureLimit: limitCheck.featureLimit,
    }

    if (limitCheck.error) {
      status.error = {
        code: 'AI_LIMIT_REACHED',
        message: `Has alcanzado el límite de ${limitCheck.error.limit} ${getFeatureLabel(feature)}/mes de tu plan.`,
        upgrade_required: true,
      }
    }

    return successResult('Limite verificado', status)
  } catch (err) {
    console.error('Error checking AI limit:', err)
    return errorResult('Error al verificar límites de AI') as ActionResult<AILimitStatus>
  }
}

function getFeatureLabel(feature: AIFeature): string {
  switch (feature) {
    case 'routine_generation':
      return 'generaciones de rutina'
    case 'alternatives':
      return 'alternativas de ejercicio'
    default:
      return 'consultas AI'
  }
}

// =============================================================================
// Generate Routine Action
// =============================================================================

export interface GeneratedRoutineResult {
  routineId: string
  routineName: string
  tokensUsed: number
  model: string
  remainingGenerations: number
}

/**
 * Generate a workout routine using AI
 */
export async function generateAIRoutine(
  input: RoutineGenerationInput
): Promise<ActionResult<GeneratedRoutineResult>> {
  // 1. Check permissions
  const { authorized, user, error } = await requirePermission('manage_any_member_routines')

  if (!authorized) {
    return (user ? forbiddenResult() : unauthorizedResult(error || undefined)) as ActionResult<GeneratedRoutineResult>
  }

  // 2. Validate input
  const validated = routineGenerationSchema.safeParse(input)
  if (!validated.success) {
    return errorResult('Datos de entrada inválidos', validated.error.flatten().fieldErrors) as ActionResult<GeneratedRoutineResult>
  }

  const supabase = await createClient()
  const startTime = Date.now()

  try {
    // 3. Create AI context and check limits
    const context = await createAIContext(user!.organizationId, user!.id)
    const limitCheck = await checkAILimit(context, 'routine_generation')

    if (!limitCheck.allowed) {
      return errorResult(
        `Has alcanzado el límite de ${limitCheck.featureLimit} generaciones de rutina/mes de tu plan.`,
        {
          ai_limit: [
            `AI_LIMIT_REACHED: feature=routine_generation, limit=${limitCheck.featureLimit}, used=${limitCheck.featureUsed}`
          ],
        }
      ) as ActionResult<GeneratedRoutineResult>
    }

    // 4. Generate routine with AI
    const request: RoutineGenerationRequest = {
      memberId: validated.data.memberId,
      memberName: validated.data.memberName,
      goal: validated.data.goal as FitnessGoal,
      daysPerWeek: validated.data.daysPerWeek,
      sessionMinutes: validated.data.sessionMinutes,
      equipment: validated.data.equipment,
      restrictions: validated.data.restrictions,
      experienceLevel: validated.data.experienceLevel as ExperienceLevel,
      preferences: validated.data.preferences,
    }

    const { routine, tokensUsed, model } = await generateRoutine(supabase, context, request)

    // 5. Save as a structured program with parent + child records
    const daysPerWeek = routine.week_plan.length
    const durationWeeks = 8 // Default to 8 weeks for AI-generated programs

    // Create parent program record
    // NOTE: Uses new columns from migration 027_training_programs.sql
    const programInsert = {
      organization_id: user!.organizationId,
      name: routine.name,
      description: routine.description,
      workout_type: 'program',
      exercises: [] as unknown as Json, // Parent has no exercises
      duration_weeks: durationWeeks,
      days_per_week: daysPerWeek,
      assigned_to_member_id: validated.data.memberId || null,
      assigned_by_id: user!.id,
      is_template: !validated.data.memberId,
      is_active: true,
      program_start_date: validated.data.memberId ? new Date().toISOString().split('T')[0] : null,
    }

    const { data: savedProgram, error: programError } = await supabase
      .from('workouts')
      .insert(programInsert)
      .select('id')
      .single()

    if (programError) {
      console.error('Error saving program:', programError)
      throw new Error(`Error al guardar el programa: ${programError.message}`)
    }

    const programId = savedProgram.id
    const savedRoutines: string[] = [programId]

    // Create child day records
    for (const day of routine.week_plan) {
      const dayInsert = {
        organization_id: user!.organizationId,
        program_id: programId,
        day_number: day.day_number,
        name: day.day_name,
        description: day.focus,
        workout_type: 'routine',
        exercises: day.exercises.map((ex, idx) => ({
          exercise_id: ex.exercise_id,
          exercise_name: ex.exercise_name,
          sets: ex.sets,
          reps: ex.reps,
          rest_seconds: ex.rest_seconds,
          notes: ex.notes || '',
          order: idx,
        })) as unknown as Json,
        assigned_to_member_id: validated.data.memberId || null,
        assigned_by_id: user!.id,
        is_template: false,
        is_active: true,
      }

      const { data: savedDay, error: dayError } = await supabase
        .from('workouts')
        .insert(dayInsert)
        .select('id')
        .single()

      if (dayError) {
        console.error('Error saving program day:', dayError)
        // Rollback: delete the program if day creation fails
        await supabase.from('workouts').delete().eq('id', programId)
        throw new Error(`Error al guardar el dia ${day.day_number}: ${dayError.message}`)
      }

      savedRoutines.push(savedDay.id)
    }

    // 6. Consume AI tokens after successful generation
    const responseTimeMs = Date.now() - startTime
    const consumeResult = await consumeAITokens(context, 'routine_generation', tokensUsed, {
      responseTimeMs,
    })

    // 7. Revalidate and return
    revalidatePath('/dashboard/routines')

    return successResult('Rutina generada exitosamente', {
      routineId: savedRoutines[0], // Return first routine ID for navigation
      routineName: routine.name,
      tokensUsed,
      model,
      remainingGenerations: consumeResult.remaining,
    })
  } catch (err) {
    console.error('Error generating routine:', err)

    if (err instanceof Error) {
      if (err.message.includes('OPENAI_API_KEY')) {
        return errorResult('El servicio de AI no está configurado') as ActionResult<GeneratedRoutineResult>
      }
      if (err.message.includes('No hay ejercicios')) {
        return errorResult(err.message) as ActionResult<GeneratedRoutineResult>
      }
    }

    return errorResult('Error al generar la rutina. Por favor intenta de nuevo.') as ActionResult<GeneratedRoutineResult>
  }
}

// =============================================================================
// Get AI Usage Stats Action
// =============================================================================

export interface AIUsageStats {
  plan: string
  generalRequests: {
    used: number
    limit: number
    percentage: number
  }
  routineGenerations: {
    used: number
    limit: number
    percentage: number
  }
  exerciseAlternatives: {
    used: number
    limit: number
    percentage: number
  }
  periodEnd: string
}

/**
 * Get current AI usage statistics for the organization
 */
export async function getAIUsageStats(): Promise<ActionResult<AIUsageStats>> {
  const { authorized, user, error } = await requirePermission('manage_gym_settings')

  if (!authorized) {
    return (user ? forbiddenResult() : unauthorizedResult(error || undefined)) as ActionResult<AIUsageStats>
  }

  const supabase = await createClient()

  try {
    // Get organization plan
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('subscription_plan')
      .eq('id', user!.organizationId)
      .single()

    if (orgError || !org) {
      return errorResult('Organización no encontrada') as ActionResult<AIUsageStats>
    }

    const plan = (org.subscription_plan as string) || 'free'

    // Get AI usage from database
    const { data: usage } = await supabase
      .from('organization_ai_usage')
      .select('*')
      .eq('organization_id', user!.organizationId)
      .maybeSingle()

    // Import plan limits
    const { PLAN_LIMITS } = await import('@/lib/pricing.config')
    const planLimits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free

    // Calculate percentages
    const generalUsed = usage?.requests_this_period || 0
    const routineUsed = usage?.routine_generations_used || 0
    const alternativesUsed = usage?.exercise_alternatives_used || 0

    const calcPercentage = (used: number, limit: number) => {
      if (limit === -1) return 0
      if (limit === 0) return 100
      return Math.min(100, Math.round((used / limit) * 100))
    }

    // Calculate period end
    const periodEnd = usage?.period_end_date
      ? new Date(usage.period_end_date).toLocaleDateString('es-MX', {
          day: 'numeric',
          month: 'long',
        })
      : 'Próximo mes'

    const stats: AIUsageStats = {
      plan,
      generalRequests: {
        used: generalUsed,
        limit: planLimits.aiRequestsPerMonth,
        percentage: calcPercentage(generalUsed, planLimits.aiRequestsPerMonth),
      },
      routineGenerations: {
        used: routineUsed,
        limit: planLimits.routineGenerationsPerMonth,
        percentage: calcPercentage(routineUsed, planLimits.routineGenerationsPerMonth),
      },
      exerciseAlternatives: {
        used: alternativesUsed,
        limit: planLimits.exerciseAlternativesPerMonth,
        percentage: calcPercentage(alternativesUsed, planLimits.exerciseAlternativesPerMonth),
      },
      periodEnd,
    }

    return successResult('Estadísticas obtenidas', stats)
  } catch (err) {
    console.error('Error getting AI usage stats:', err)
    return errorResult('Error al obtener estadísticas de uso') as ActionResult<AIUsageStats>
  }
}
