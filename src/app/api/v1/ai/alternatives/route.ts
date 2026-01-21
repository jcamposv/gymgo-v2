/**
 * AI Exercise Alternatives API Endpoint
 * POST /api/v1/ai/alternatives
 *
 * Returns exercise alternatives based on movement patterns, muscle groups,
 * and available equipment at the user's gym.
 */

import { type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  validateApiRequestWithLimits,
  createApiClient,
  extractToken,
} from '@/lib/api/auth'
import {
  invalidApiKeyError,
  unauthorizedError,
  notFoundError,
  forbiddenError,
  rateLimitError,
  planAccessDeniedError,
  internalError,
  validationError,
} from '@/lib/api/errors'
import { apiSuccess } from '@/lib/api/response'
import { aiAlternativesRequestSchema } from '@/schemas/ai.schema'
import { getAlternatives } from '@/lib/ai'

// =============================================================================
// Types for AI Tables (not yet in database.types.ts)
// =============================================================================

interface OrganizationAiUsage {
  id: string
  organization_id: string
  ai_plan: string
  monthly_token_limit: number
  monthly_request_limit: number
  tokens_used_this_period: number
  requests_this_period: number
  period_start_date: string
  period_end_date: string
  alert_threshold_percent: number
  alert_sent: boolean
  limit_reached_at: string | null
  ai_enabled: boolean
  max_requests_per_user_daily: number | null
  created_at: string
  updated_at: string
}

interface OrganizationEquipment {
  id: string
  organization_id: string
  available_equipment: string[]
  unavailable_equipment: string[]
  created_at: string
  updated_at: string
}

// =============================================================================
// Admin Client (untyped for new tables)
// =============================================================================

function createUntypedAdminClient() {
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
// API Handler
// =============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Validate API key, Bearer token, plan-based API access, and rate limits
    const authContext = await validateApiRequestWithLimits(request, {
      requireAuth: true,
      checkRateLimits: true,
      isWriteOperation: false,
    })

    if (!authContext.isValid) {
      if (authContext.error?.includes('API key')) {
        return invalidApiKeyError()
      }
      if (authContext.error?.includes('not available on your plan') || authContext.error?.includes('API access')) {
        return planAccessDeniedError(authContext.error)
      }
      if (authContext.error?.includes('Rate limit') || authContext.error?.includes('requests/día')) {
        return rateLimitError(authContext.error, authContext.rateLimitInfo ? {
          used: authContext.rateLimitInfo.used,
          limit: authContext.rateLimitInfo.dailyLimit,
        } : undefined)
      }
      return unauthorizedError(authContext.error)
    }

    // 2. Parse and validate request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return validationError({
        flatten: () => ({
          fieldErrors: { body: ['Invalid JSON body'] },
          formErrors: [],
        }),
      } as never)
    }

    const parseResult = aiAlternativesRequestSchema.safeParse(body)
    if (!parseResult.success) {
      return validationError(parseResult.error)
    }

    const { exercise_id, difficulty_filter, limit } = parseResult.data

    // 3. Get authenticated client (organization already validated in rate limit check)
    const token = extractToken(request)
    if (!token) {
      return unauthorizedError('Missing authorization token')
    }

    const supabase = createApiClient(token)

    // Organization ID is already available from the rate limit check
    const organizationId = authContext.organizationId
    if (!organizationId) {
      return notFoundError('User profile or organization not found')
    }

    // 4. Check AI tokens available (using untyped admin client for new AI tables)
    const adminClient = createUntypedAdminClient()

    const { data: aiUsageData, error: aiUsageError } = await adminClient
      .from('organization_ai_usage')
      .select('*')
      .eq('organization_id', organizationId)
      .single()

    let usage = aiUsageData as OrganizationAiUsage | null

    if (aiUsageError || !usage) {
      // Create default AI usage record if it doesn't exist
      const { data: newUsage } = await adminClient
        .from('organization_ai_usage')
        .insert({ organization_id: organizationId })
        .select()
        .single()

      usage = newUsage as OrganizationAiUsage | null

      if (!usage) {
        return internalError('Failed to initialize AI usage tracking')
      }
    }

    // Check if AI is enabled
    if (!usage.ai_enabled) {
      return forbiddenError('AI features are disabled for this organization')
    }

    // 4b. Check user's remaining requests (per-user limits)
    const { data: userRemainingData, error: userRemainingError } = await adminClient.rpc(
      'get_user_ai_remaining',
      {
        user_uuid: authContext.userId,
        org_id: organizationId,
      }
    )

    if (userRemainingError) {
      console.error('Error checking user AI remaining:', userRemainingError)
    }

    const userRemaining = userRemainingData as {
      success: boolean
      remaining: number
      limit: number
      used: number
      error?: string
    } | null

    // Check if user has exceeded their personal limit
    if (userRemaining?.success && userRemaining.remaining <= 0) {
      return rateLimitError()
    }

    // 5. Get organization equipment config
    const { data: equipmentData } = await adminClient
      .from('organization_equipment')
      .select('available_equipment, unavailable_equipment')
      .eq('organization_id', organizationId)
      .single()

    const equipmentConfig = equipmentData as OrganizationEquipment | null

    // Default equipment if no config exists
    const defaultEquipment = [
      'barbell',
      'dumbbell',
      'kettlebell',
      'cable',
      'machine',
      'bodyweight',
      'bench',
      'pull_up_bar',
    ]

    const availableEquipment = (
      equipmentConfig?.available_equipment || defaultEquipment
    ).filter(
      (eq: string) =>
        !(equipmentConfig?.unavailable_equipment || []).includes(eq)
    )

    // 6. Run alternatives engine
    const aiEnabled =
      usage.ai_enabled &&
      usage.tokens_used_this_period < usage.monthly_token_limit

    const result = await getAlternatives(adminClient, {
      exerciseId: exercise_id,
      organizationId,
      availableEquipment,
      difficultyFilter: difficulty_filter,
      limit,
      aiEnabled,
    })

    // 7. Log usage and consume tokens (now tracks per-user)
    const responseTimeMs = Date.now() - startTime

    const { data: consumeResult, error: consumeError } = await adminClient.rpc('consume_ai_tokens', {
      org_id: organizationId,
      tokens_to_consume: result.tokensUsed,
      feature_name: 'alternatives',
      user_uuid: authContext.userId,
      exercise_uuid: exercise_id,
      was_cache_hit: result.wasCached,
      response_ms: responseTimeMs,
      alt_count: result.alternatives.length,
    })

    // Debug logging
    if (consumeError) {
      console.error('consume_ai_tokens RPC error:', consumeError)
    }
    console.log('consume_ai_tokens result:', JSON.stringify(consumeResult))

    // Get user's remaining requests from the consume result
    const consumeData = consumeResult as {
      success: boolean
      user_remaining: number
      user_limit: number
      error?: string
    } | null

    const remainingRequests = consumeData?.user_remaining ?? 0
    console.log('Final remainingRequests:', remainingRequests)

    // 8. Return response
    return apiSuccess({
      alternatives: result.alternatives,
      was_cached: result.wasCached,
      tokens_used: result.tokensUsed,
      remaining_requests: remainingRequests,
    })
  } catch (error) {
    console.error('AI Alternatives endpoint error:', error)

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === 'Exercise not found') {
        return notFoundError('Exercise not found')
      }
      if (error.message.includes('OPENAI_API_KEY')) {
        return internalError('AI service is not configured')
      }
    }

    return internalError()
  }
}
