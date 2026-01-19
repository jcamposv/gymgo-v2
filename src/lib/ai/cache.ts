/**
 * AI Alternatives Cache Utilities
 * Manages caching of AI-generated exercise alternatives
 */

import { createHash } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CacheKey, ExerciseAlternative } from '@/types/ai.types'

// =============================================================================
// Equipment Hash Calculation
// =============================================================================

/**
 * Calculates a hash of the equipment array for cache key
 * Sorts the array first for consistent hashing
 */
export function calculateEquipmentHash(equipment: string[]): string {
  const sorted = [...equipment].sort()
  return createHash('md5')
    .update(sorted.join(','))
    .digest('hex')
    .substring(0, 16)
}

// =============================================================================
// Cache Operations
// =============================================================================

/**
 * Checks if alternatives are cached for the given key
 * Returns cached alternatives if found and not expired
 */
export async function checkCache(
  supabase: SupabaseClient,
  key: CacheKey
): Promise<ExerciseAlternative[] | null> {
  const { data, error } = await supabase
    .from('ai_alternatives_cache')
    .select('alternatives, id, hit_count')
    .eq('exercise_id', key.exerciseId)
    .eq('equipment_hash', key.equipmentHash)
    .is('difficulty_filter', key.difficultyFilter)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !data) {
    return null
  }

  // Update hit count asynchronously (don't wait for it)
  supabase
    .from('ai_alternatives_cache')
    .update({
      hit_count: (data.hit_count || 0) + 1,
      last_hit_at: new Date().toISOString(),
    })
    .eq('id', data.id)
    .then(() => {
      // Silent update
    })

  return data.alternatives as ExerciseAlternative[]
}

/**
 * Saves alternatives to cache with 7-day expiry
 */
export async function saveToCache(
  supabase: SupabaseClient,
  key: CacheKey,
  alternatives: ExerciseAlternative[]
): Promise<void> {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

  await supabase.from('ai_alternatives_cache').upsert(
    {
      exercise_id: key.exerciseId,
      equipment_hash: key.equipmentHash,
      difficulty_filter: key.difficultyFilter,
      alternatives,
      expires_at: expiresAt.toISOString(),
      hit_count: 0,
      created_at: new Date().toISOString(),
    },
    {
      onConflict: 'exercise_id,equipment_hash,difficulty_filter',
    }
  )
}
