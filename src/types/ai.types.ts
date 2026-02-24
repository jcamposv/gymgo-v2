/**
 * AI Module Types
 * Types for the AI Alternatives Engine
 *
 * Note: These types are defined locally because the database types
 * haven't been regenerated to include the new AI tables yet.
 * Run `npm run db:types` after applying migration 015_ai_module.sql
 * to regenerate types, then these can be updated to use Database types.
 */

// =============================================================================
// Exercise Type (with movement_pattern)
// =============================================================================

/**
 * Exercise type that includes movement_pattern
 * This extends the base exercise type from the database
 */
export interface Exercise {
  id: string
  organization_id: string | null
  name: string
  name_es: string | null
  name_en: string | null
  description: string | null
  category: string | null
  muscle_groups: string[] | null
  equipment: string[] | null
  difficulty: string | null
  video_url: string | null
  gif_url: string | null
  thumbnail_url: string | null
  instructions: string[] | null
  tips: string[] | null
  common_mistakes: string[] | null
  is_global: boolean | null
  is_active: boolean | null
  movement_pattern: string | null
  created_at: string | null
  updated_at: string | null
}

// =============================================================================
// Movement Patterns
// =============================================================================

export const MOVEMENT_PATTERNS = [
  'horizontal_push',
  'horizontal_pull',
  'vertical_push',
  'vertical_pull',
  'squat',
  'hinge',
  'lunge',
  'carry',
  'rotation',
  'isolation',
  'core',
] as const

export type MovementPattern = (typeof MOVEMENT_PATTERNS)[number]

// =============================================================================
// AI Alternatives Types
// =============================================================================

export interface ExerciseAlternativeData {
  id: string
  name: string
  name_es: string | null
  category: string | null
  muscle_groups: string[] | null
  equipment: string[] | null
  difficulty: string | null
  gif_url: string | null
  movement_pattern: string | null
}

export interface ExerciseAlternative {
  exercise: ExerciseAlternativeData
  reason: string
  score: number
}

export interface AlternativesRequest {
  exercise_id: string
  difficulty_filter?: string | null
  limit?: number
}

export interface AlternativesResponse {
  alternatives: ExerciseAlternative[]
  was_cached: boolean
  tokens_used: number
  remaining_requests: number
}

// =============================================================================
// Engine Types
// =============================================================================

export interface CandidateFilters {
  sourceExercise: Exercise
  availableEquipment: string[]
  difficultyFilter?: string | null
  organizationId: string
}

export interface ScoredCandidate {
  exercise: Exercise
  score: number
  reason: string
}

export interface AlternativesEngineOptions {
  exerciseId: string
  organizationId: string
  availableEquipment: string[]
  difficultyFilter?: string | null
  limit: number
  aiEnabled: boolean
  model?: string // AI model to use (default: gpt-3.5-turbo, Pro/Enterprise: gpt-4-turbo)
}

export interface AlternativesEngineResult {
  alternatives: ExerciseAlternative[]
  wasCached: boolean
  tokensUsed: number
}

// =============================================================================
// Cache Types
// =============================================================================

export interface CacheKey {
  exerciseId: string
  equipmentHash: string
  difficultyFilter: string | null
}

// =============================================================================
// OpenAI Types
// =============================================================================

export interface OpenAIRanking {
  id: string
  score: number
  reason: string
}

export interface OpenAIRankingResponse {
  rankings: OpenAIRanking[]
}

// =============================================================================
// AI Usage Types (for new tables)
// =============================================================================

export interface OrganizationAiUsage {
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

export interface OrganizationEquipment {
  id: string
  organization_id: string
  available_equipment: string[]
  unavailable_equipment: string[]
  created_at: string
  updated_at: string
}

export interface AiAlternativesCache {
  id: string
  exercise_id: string
  equipment_hash: string
  difficulty_filter: string | null
  alternatives: ExerciseAlternative[]
  created_at: string
  expires_at: string
  hit_count: number
  last_hit_at: string | null
}
