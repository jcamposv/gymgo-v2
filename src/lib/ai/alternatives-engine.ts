/**
 * AI Alternatives Engine
 * Core algorithm for finding exercise alternatives
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Exercise,
  CandidateFilters,
  ScoredCandidate,
  AlternativesEngineOptions,
  AlternativesEngineResult,
  ExerciseAlternative,
  ExerciseAlternativeData,
} from '@/types/ai.types'
import { calculateEquipmentHash, checkCache, saveToCache } from './cache'
import { rankWithOpenAI } from './openai-ranker'

// =============================================================================
// Candidate Finding (Rule-Based Filtering)
// =============================================================================

/**
 * Finds candidate exercises based on rule-based filtering
 * Priority: movement_pattern > muscle_groups > equipment availability
 */
export async function findCandidates(
  supabase: SupabaseClient,
  filters: CandidateFilters
): Promise<Exercise[]> {
  let query = supabase
    .from('exercises')
    .select('*')
    .eq('is_active', true)
    .neq('id', filters.sourceExercise.id)

  // Filter by movement pattern (highest priority match)
  if (filters.sourceExercise.movement_pattern) {
    query = query.eq('movement_pattern', filters.sourceExercise.movement_pattern)
  }

  // Filter by difficulty if specified
  if (filters.difficultyFilter) {
    query = query.eq('difficulty', filters.difficultyFilter)
  }

  // Include global exercises + organization-specific
  query = query.or(
    `organization_id.is.null,organization_id.eq.${filters.organizationId}`
  )

  // Limit candidates for performance
  query = query.limit(50)

  const { data, error } = await query

  if (error) {
    console.error('Error finding candidates:', error)
    return []
  }

  // Cast to our Exercise type (includes movement_pattern)
  const exercises = (data || []) as Exercise[]

  // Post-filter by equipment availability
  return exercises.filter((exercise) => {
    const requiredEquipment = exercise.equipment || []

    // Accept exercises with no equipment requirement
    if (requiredEquipment.length === 0) return true

    // Accept if at least one required equipment is available or bodyweight
    return requiredEquipment.some(
      (eq: string) =>
        filters.availableEquipment.includes(eq) || eq === 'bodyweight'
    )
  })
}

// =============================================================================
// Scoring Algorithm
// =============================================================================

/**
 * Calculates a similarity score between source and candidate exercises
 * Max score: 100 points
 */
export function calculateScore(
  source: Exercise,
  candidate: Exercise,
  availableEquipment: string[]
): number {
  let score = 0

  // 1. Movement Pattern Match (40 points)
  if (
    source.movement_pattern &&
    source.movement_pattern === candidate.movement_pattern
  ) {
    score += 40
  }

  // 2. Muscle Group Overlap (30 points)
  const sourceMuscles = new Set(source.muscle_groups || [])
  const candidateMuscles = candidate.muscle_groups || []
  const overlap = candidateMuscles.filter((m) => sourceMuscles.has(m)).length
  const totalUnique = new Set([...sourceMuscles, ...candidateMuscles]).size

  if (totalUnique > 0) {
    score += Math.round((overlap / totalUnique) * 30)
  }

  // 3. Equipment Compatibility (15 points)
  const candidateEquipment = candidate.equipment || []
  if (
    candidateEquipment.length === 0 ||
    candidateEquipment.includes('bodyweight')
  ) {
    score += 15 // No equipment needed = max points
  } else {
    const availableCount = candidateEquipment.filter((eq) =>
      availableEquipment.includes(eq)
    ).length
    score += Math.round((availableCount / candidateEquipment.length) * 15)
  }

  // 4. Difficulty Match (10 points)
  if (source.difficulty === candidate.difficulty) {
    score += 10
  }

  // 5. Category Match (5 points)
  if (source.category && source.category === candidate.category) {
    score += 5
  }

  return score
}

// =============================================================================
// Reason Generation
// =============================================================================

const patternLabels: Record<string, string> = {
  horizontal_push: 'empuje horizontal',
  horizontal_pull: 'jalon horizontal',
  vertical_push: 'empuje vertical',
  vertical_pull: 'jalon vertical',
  squat: 'sentadilla',
  hinge: 'bisagra de cadera',
  lunge: 'zancada',
  carry: 'acarreo',
  rotation: 'rotacion',
  isolation: 'aislamiento',
  core: 'core',
}

const muscleLabels: Record<string, string> = {
  chest: 'pecho',
  back: 'espalda',
  shoulders: 'hombros',
  biceps: 'biceps',
  triceps: 'triceps',
  quadriceps: 'cuadriceps',
  hamstrings: 'isquiotibiales',
  glutes: 'gluteos',
  abs: 'abdominales',
  calves: 'pantorrillas',
}

const diffLabels: Record<string, string> = {
  beginner: 'principiante',
  intermediate: 'intermedio',
  advanced: 'avanzado',
}

/**
 * Generates a human-readable reason for why an exercise is a good alternative
 */
export function generateRuleBasedReason(
  source: Exercise,
  candidate: Exercise
): string {
  const reasons: string[] = []

  // Movement pattern
  if (
    source.movement_pattern &&
    source.movement_pattern === candidate.movement_pattern
  ) {
    const label = patternLabels[source.movement_pattern] || source.movement_pattern
    reasons.push(`mismo patron de ${label}`)
  }

  // Muscle groups
  const sourceMuscles = new Set(source.muscle_groups || [])
  const candidateMuscles = candidate.muscle_groups || []
  const overlap = candidateMuscles.filter((m) => sourceMuscles.has(m))

  if (overlap.length > 0) {
    const translatedMuscles = overlap
      .slice(0, 2)
      .map((m) => muscleLabels[m] || m)
    reasons.push(`trabaja ${translatedMuscles.join(' y ')}`)
  }

  // Equipment
  const candidateEquipment = candidate.equipment || []
  if (candidateEquipment.includes('bodyweight')) {
    reasons.push('sin equipo necesario')
  }

  // Difficulty
  if (source.difficulty && source.difficulty === candidate.difficulty) {
    reasons.push(`nivel ${diffLabels[source.difficulty] || source.difficulty}`)
  }

  return reasons.length > 0
    ? reasons.slice(0, 2).join(', ')
    : 'ejercicio similar'
}

// =============================================================================
// Exercise Data Transformation
// =============================================================================

/**
 * Transforms a full Exercise to the minimal data needed for response
 */
function toAlternativeData(exercise: Exercise): ExerciseAlternativeData {
  return {
    id: exercise.id,
    name: exercise.name,
    name_es: exercise.name_es,
    category: exercise.category,
    muscle_groups: exercise.muscle_groups,
    equipment: exercise.equipment,
    difficulty: exercise.difficulty,
    gif_url: exercise.gif_url,
    movement_pattern: exercise.movement_pattern,
  }
}

// =============================================================================
// Main Engine Function
// =============================================================================

/**
 * Main function to get exercise alternatives
 * Handles caching, rule-based filtering, and optional AI ranking
 */
export async function getAlternatives(
  supabase: SupabaseClient,
  options: AlternativesEngineOptions
): Promise<AlternativesEngineResult> {
  const {
    exerciseId,
    organizationId,
    availableEquipment,
    difficultyFilter,
    limit,
    aiEnabled,
    model,
  } = options

  // Calculate cache key
  const equipmentHash = calculateEquipmentHash(availableEquipment)
  const cacheKey = {
    exerciseId,
    equipmentHash,
    difficultyFilter: difficultyFilter || null,
  }

  // Check cache first
  const cached = await checkCache(supabase, cacheKey)
  if (cached) {
    return {
      alternatives: cached.slice(0, limit),
      wasCached: true,
      tokensUsed: 0,
    }
  }

  // Fetch source exercise
  const { data: sourceData, error: sourceError } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', exerciseId)
    .single()

  if (sourceError || !sourceData) {
    throw new Error('Exercise not found')
  }

  // Cast to our Exercise type
  const sourceExercise = sourceData as Exercise

  // Find candidates using rule-based filtering
  const candidates = await findCandidates(supabase, {
    sourceExercise,
    availableEquipment,
    difficultyFilter,
    organizationId,
  })

  if (candidates.length === 0) {
    return {
      alternatives: [],
      wasCached: false,
      tokensUsed: 0,
    }
  }

  let scoredCandidates: ScoredCandidate[]
  let tokensUsed = 0

  // Try AI ranking if enabled, otherwise use rule-based scoring
  if (aiEnabled && candidates.length > 0) {
    try {
      const aiRankings = await rankWithOpenAI(
        sourceExercise,
        candidates,
        availableEquipment,
        { model }
      )

      // Estimate tokens used (rough estimate: ~150 tokens per request)
      tokensUsed = 150 + candidates.length * 10

      // Map AI rankings to candidates
      const rankingMap = new Map(aiRankings.map((r) => [r.id, r]))

      scoredCandidates = candidates
        .map((candidate) => {
          const ranking = rankingMap.get(candidate.id)
          return {
            exercise: candidate,
            score:
              ranking?.score ??
              calculateScore(sourceExercise, candidate, availableEquipment),
            reason:
              ranking?.reason ??
              generateRuleBasedReason(sourceExercise, candidate),
          }
        })
        .sort((a, b) => b.score - a.score)
    } catch (error) {
      console.error('AI ranking failed, falling back to rule-based:', error)
      // Fallback to rule-based scoring
      scoredCandidates = candidates
        .map((candidate) => ({
          exercise: candidate,
          score: calculateScore(sourceExercise, candidate, availableEquipment),
          reason: generateRuleBasedReason(sourceExercise, candidate),
        }))
        .sort((a, b) => b.score - a.score)
    }
  } else {
    // Rule-based scoring only
    scoredCandidates = candidates
      .map((candidate) => ({
        exercise: candidate,
        score: calculateScore(sourceExercise, candidate, availableEquipment),
        reason: generateRuleBasedReason(sourceExercise, candidate),
      }))
      .sort((a, b) => b.score - a.score)
  }

  // Transform to response format
  const alternatives: ExerciseAlternative[] = scoredCandidates
    .slice(0, limit)
    .map((sc) => ({
      exercise: toAlternativeData(sc.exercise),
      reason: sc.reason,
      score: sc.score,
    }))

  // Save to cache (save more than requested for future requests)
  const toCache = scoredCandidates.slice(0, 20).map((sc) => ({
    exercise: toAlternativeData(sc.exercise),
    reason: sc.reason,
    score: sc.score,
  }))

  await saveToCache(supabase, cacheKey, toCache)

  return {
    alternatives,
    wasCached: false,
    tokensUsed,
  }
}
