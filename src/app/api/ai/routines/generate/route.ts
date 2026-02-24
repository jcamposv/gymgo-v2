/**
 * AI Routine Generation API Endpoint
 * POST /api/ai/routines/generate
 *
 * Generates workout routines using AI based on member profile,
 * goals, and available equipment.
 */

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import {
  createAIContext,
  checkAILimit,
  consumeAITokens,
  createAILimitErrorResponse,
} from '@/server/ai'
import { generateRoutine, type FitnessGoal, type ExperienceLevel } from '@/server/ai/routine-generator'
import type { TablesInsert, Json } from '@/types/database.types'

// =============================================================================
// Request Schema
// =============================================================================

const requestSchema = z.object({
  memberId: z.string().uuid().optional(),
  memberName: z.string().optional(),
  goal: z.enum(['muscle_gain', 'fat_loss', 'strength', 'general', 'endurance', 'flexibility']),
  daysPerWeek: z.number().int().min(1).max(7),
  sessionMinutes: z.number().int().min(15).max(180),
  equipment: z.array(z.string()),
  restrictions: z.array(z.string()).optional(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  preferences: z.string().max(500).optional(),
  saveToDatabase: z.boolean().optional().default(true),
})

// =============================================================================
// Admin Client
// =============================================================================

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

// =============================================================================
// Auth Helpers
// =============================================================================

async function validateAuth(request: NextRequest): Promise<{
  valid: boolean
  userId?: string
  organizationId?: string
  error?: string
}> {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing authorization header' }
  }

  const token = authHeader.replace('Bearer ', '')

  // Validate token with Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return { valid: false, error: error?.message || 'Invalid token' }
  }

  // Get organization from profile
  const adminClient = getAdminClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return { valid: false, error: 'User not associated with an organization' }
  }

  return {
    valid: true,
    userId: user.id,
    organizationId: profile.organization_id,
  }
}

// =============================================================================
// API Handler
// =============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Authenticate request
    const auth = await validateAuth(request)
    if (!auth.valid) {
      return NextResponse.json(
        { error: 'Unauthorized', message: auth.error },
        { status: 401 }
      )
    }

    // 2. Parse and validate body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const parseResult = requestSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const input = parseResult.data
    const adminClient = getAdminClient()

    // 3. Check AI limits
    const context = await createAIContext(auth.organizationId!, auth.userId!)
    const limitCheck = await checkAILimit(context, 'routine_generation')

    if (!limitCheck.allowed && limitCheck.error) {
      return createAILimitErrorResponse(limitCheck.error)
    }

    // 4. Generate routine
    const { routine, tokensUsed, model } = await generateRoutine(
      adminClient,
      context,
      {
        memberId: input.memberId,
        memberName: input.memberName,
        goal: input.goal as FitnessGoal,
        daysPerWeek: input.daysPerWeek,
        sessionMinutes: input.sessionMinutes,
        equipment: input.equipment,
        restrictions: input.restrictions,
        experienceLevel: input.experienceLevel as ExperienceLevel,
        preferences: input.preferences,
      }
    )

    // 5. Save to database if requested
    let savedRoutineIds: string[] = []

    if (input.saveToDatabase) {
      for (const day of routine.week_plan) {
        const insertData: TablesInsert<'workouts'> = {
          organization_id: auth.organizationId!,
          name: `${routine.name} - ${day.day_name}`,
          description: `${routine.description}\n\nEnfoque: ${day.focus}`,
          workout_type: routine.workout_type,
          exercises: day.exercises.map((ex, idx) => ({
            exercise_id: ex.exercise_id,
            exercise_name: ex.exercise_name,
            sets: ex.sets,
            reps: ex.reps,
            rest_seconds: ex.rest_seconds,
            notes: ex.notes || '',
            order: idx,
          })) as unknown as Json,
          assigned_to_member_id: input.memberId || null,
          assigned_by_id: auth.userId!,
          scheduled_date: null,
          is_template: !input.memberId,
          is_active: true,
        }

        const { data: saved, error: saveError } = await adminClient
          .from('workouts')
          .insert(insertData as never)
          .select('id')
          .single()

        if (saveError) {
          console.error('Error saving routine:', saveError)
        } else {
          savedRoutineIds.push(saved.id)
        }
      }
    }

    // 6. Consume tokens after success
    const responseTimeMs = Date.now() - startTime
    const consumeResult = await consumeAITokens(context, 'routine_generation', tokensUsed, {
      responseTimeMs,
    })

    // 7. Return response
    return NextResponse.json({
      success: true,
      data: {
        routine,
        saved_routine_ids: savedRoutineIds,
        tokens_used: tokensUsed,
        model,
        remaining_generations: consumeResult.remaining,
      },
    })
  } catch (error) {
    console.error('Routine generation error:', error)

    if (error instanceof Error) {
      if (error.message.includes('OPENAI_API_KEY')) {
        return NextResponse.json(
          { error: 'AI service not configured' },
          { status: 503 }
        )
      }
      if (error.message.includes('No hay ejercicios')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
