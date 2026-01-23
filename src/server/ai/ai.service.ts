/**
 * Centralized AI Service
 *
 * Server-only module that handles:
 * 1. Plan-based model selection
 * 2. Limit checking and consumption
 * 3. OpenAI API calls
 * 4. Standardized error responses
 */

import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { PLAN_LIMITS, type PlanTier } from '@/lib/pricing.config'

// =============================================================================
// Types
// =============================================================================

export type AIFeature = 'routine_generation' | 'alternatives' | 'general'

export interface AILimitError {
  code: 'AI_LIMIT_REACHED'
  feature: AIFeature
  plan: PlanTier
  period: string
  limit: number
  used: number
  upgrade_required: boolean
}

export interface AIServiceContext {
  organizationId: string
  userId: string
  plan: PlanTier
}

export interface AIUsageResult {
  success: boolean
  remaining: number
  limit: number
  error?: AILimitError
}

export interface CheckLimitResult {
  allowed: boolean
  generalUsed: number
  generalLimit: number
  featureUsed: number
  featureLimit: number
  error?: AILimitError
}

// =============================================================================
// OpenAI Client
// =============================================================================

let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured')
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiClient
}

// =============================================================================
// Admin Supabase Client
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
// Model Selection
// =============================================================================

/**
 * Get the AI model to use based on plan tier
 * Free/Starter/Growth => gpt-3.5-turbo
 * Pro/Enterprise => gpt-4-turbo
 */
export function getModelForPlan(plan: PlanTier): string {
  const planLimits = PLAN_LIMITS[plan]
  return planLimits.aiModel
}

// =============================================================================
// Limit Checking
// =============================================================================

/**
 * Check if an AI request is allowed based on plan limits
 */
export async function checkAILimit(
  context: AIServiceContext,
  feature: AIFeature
): Promise<CheckLimitResult> {
  const adminClient = getAdminClient()
  const planLimits = PLAN_LIMITS[context.plan]

  // Get current period (YYYY-MM)
  const now = new Date()
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Check unlimited plans
  if (planLimits.aiRequestsPerMonth === -1) {
    return {
      allowed: true,
      generalUsed: 0,
      generalLimit: -1,
      featureUsed: 0,
      featureLimit: -1,
    }
  }

  // Get usage from database
  const { data, error } = await adminClient.rpc('check_ai_feature_limit', {
    org_id: context.organizationId,
    user_uuid: context.userId,
    feature_name: feature,
  })

  if (error) {
    console.error('Error checking AI limit:', error)
    // On error, allow the request but log it
    return {
      allowed: true,
      generalUsed: 0,
      generalLimit: planLimits.aiRequestsPerMonth,
      featureUsed: 0,
      featureLimit: getFeatureLimit(planLimits, feature),
    }
  }

  const usage = data as {
    allowed: boolean
    feature: string
    feature_used: number
    general_used: number
    general_limit: number
    period_end: string
  }

  // Check general limit
  if (usage.general_used >= planLimits.aiRequestsPerMonth) {
    return {
      allowed: false,
      generalUsed: usage.general_used,
      generalLimit: planLimits.aiRequestsPerMonth,
      featureUsed: usage.feature_used,
      featureLimit: getFeatureLimit(planLimits, feature),
      error: {
        code: 'AI_LIMIT_REACHED',
        feature: 'general',
        plan: context.plan,
        period,
        limit: planLimits.aiRequestsPerMonth,
        used: usage.general_used,
        upgrade_required: true,
      },
    }
  }

  // Check feature-specific limit
  const featureLimit = getFeatureLimit(planLimits, feature)
  if (featureLimit !== -1 && usage.feature_used >= featureLimit) {
    return {
      allowed: false,
      generalUsed: usage.general_used,
      generalLimit: planLimits.aiRequestsPerMonth,
      featureUsed: usage.feature_used,
      featureLimit,
      error: {
        code: 'AI_LIMIT_REACHED',
        feature,
        plan: context.plan,
        period,
        limit: featureLimit,
        used: usage.feature_used,
        upgrade_required: true,
      },
    }
  }

  // AI disabled check
  if (!usage.allowed) {
    return {
      allowed: false,
      generalUsed: usage.general_used,
      generalLimit: planLimits.aiRequestsPerMonth,
      featureUsed: usage.feature_used,
      featureLimit,
      error: {
        code: 'AI_LIMIT_REACHED',
        feature,
        plan: context.plan,
        period,
        limit: 0,
        used: 0,
        upgrade_required: true,
      },
    }
  }

  return {
    allowed: true,
    generalUsed: usage.general_used,
    generalLimit: planLimits.aiRequestsPerMonth,
    featureUsed: usage.feature_used,
    featureLimit,
  }
}

/**
 * Get the limit for a specific feature based on plan
 */
function getFeatureLimit(planLimits: typeof PLAN_LIMITS[PlanTier], feature: AIFeature): number {
  switch (feature) {
    case 'routine_generation':
      return planLimits.routineGenerationsPerMonth
    case 'alternatives':
      return planLimits.exerciseAlternativesPerMonth
    default:
      return planLimits.aiRequestsPerMonth
  }
}

// =============================================================================
// Consumption
// =============================================================================

/**
 * Consume AI tokens after a successful request
 * Call this ONLY after the OpenAI call succeeds
 */
export async function consumeAITokens(
  context: AIServiceContext,
  feature: AIFeature,
  tokensUsed: number,
  metadata?: {
    exerciseId?: string
    wasCached?: boolean
    responseTimeMs?: number
    alternativesCount?: number
  }
): Promise<AIUsageResult> {
  const adminClient = getAdminClient()

  const { data, error } = await adminClient.rpc('consume_ai_tokens', {
    org_id: context.organizationId,
    tokens_to_consume: tokensUsed,
    feature_name: feature,
    user_uuid: context.userId,
    exercise_uuid: metadata?.exerciseId || null,
    was_cache_hit: metadata?.wasCached || false,
    response_ms: metadata?.responseTimeMs || 0,
    alt_count: metadata?.alternativesCount || 0,
  })

  if (error) {
    console.error('Error consuming AI tokens:', error)
    return {
      success: false,
      remaining: 0,
      limit: 0,
    }
  }

  const result = data as {
    success: boolean
    user_remaining: number
    user_limit: number
    org_remaining: number
    org_limit: number
  }

  return {
    success: result.success,
    remaining: result.user_remaining,
    limit: result.user_limit,
  }
}

// =============================================================================
// OpenAI Calls
// =============================================================================

export interface ChatCompletionOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
}

/**
 * Execute a chat completion with the plan-appropriate model
 */
export async function chatCompletion(
  context: AIServiceContext,
  userPrompt: string,
  options: ChatCompletionOptions = {}
): Promise<{
  content: string
  tokensUsed: number
  model: string
}> {
  const openai = getOpenAIClient()
  const model = options.model || getModelForPlan(context.plan)

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = []

  if (options.systemPrompt) {
    messages.push({
      role: 'system',
      content: options.systemPrompt,
    })
  }

  messages.push({
    role: 'user',
    content: userPrompt,
  })

  const response = await openai.chat.completions.create({
    model,
    messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 2000,
  })

  const content = response.choices[0]?.message?.content?.trim() || ''
  const tokensUsed = response.usage?.total_tokens || 0

  return {
    content,
    tokensUsed,
    model,
  }
}

/**
 * Execute a JSON-mode chat completion
 */
export async function jsonCompletion<T>(
  context: AIServiceContext,
  userPrompt: string,
  options: ChatCompletionOptions = {}
): Promise<{
  data: T
  tokensUsed: number
  model: string
}> {
  const openai = getOpenAIClient()
  const model = options.model || getModelForPlan(context.plan)

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = []

  if (options.systemPrompt) {
    messages.push({
      role: 'system',
      content: options.systemPrompt + '\n\nResponde SOLO con JSON valido.',
    })
  } else {
    messages.push({
      role: 'system',
      content: 'Responde SOLO con JSON valido.',
    })
  }

  messages.push({
    role: 'user',
    content: userPrompt,
  })

  const response = await openai.chat.completions.create({
    model,
    messages,
    temperature: options.temperature ?? 0.1,
    max_tokens: options.maxTokens ?? 2000,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content?.trim() || '{}'
  const tokensUsed = response.usage?.total_tokens || 0

  // Parse JSON
  const data = JSON.parse(content) as T

  return {
    data,
    tokensUsed,
    model,
  }
}

// =============================================================================
// Get Organization Plan
// =============================================================================

/**
 * Get the plan tier for an organization
 */
export async function getOrganizationPlan(organizationId: string): Promise<PlanTier> {
  const adminClient = getAdminClient()

  const { data, error } = await adminClient
    .from('organizations')
    .select('subscription_plan')
    .eq('id', organizationId)
    .single()

  if (error || !data) {
    console.error('Error fetching organization plan:', error)
    return 'free' // Default to free on error
  }

  return (data.subscription_plan as PlanTier) || 'free'
}

// =============================================================================
// Create AI Context
// =============================================================================

/**
 * Create an AI service context from organization and user IDs
 */
export async function createAIContext(
  organizationId: string,
  userId: string
): Promise<AIServiceContext> {
  const plan = await getOrganizationPlan(organizationId)

  return {
    organizationId,
    userId,
    plan,
  }
}

// =============================================================================
// Error Response Helper
// =============================================================================

/**
 * Create a standardized AI limit error response for API routes
 */
export function createAILimitErrorResponse(error: AILimitError): Response {
  return new Response(
    JSON.stringify({
      error: error.code,
      message: `Has alcanzado el límite de ${error.limit} ${getFeatureName(error.feature)}/mes de tu plan ${error.plan}.`,
      details: error,
    }),
    {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

function getFeatureName(feature: AIFeature): string {
  switch (feature) {
    case 'routine_generation':
      return 'generaciones de rutina'
    case 'alternatives':
      return 'alternativas de ejercicio'
    default:
      return 'consultas AI'
  }
}
