/**
 * AI Module Exports
 * Central export point for AI-related utilities
 */

// Cache utilities
export { calculateEquipmentHash, checkCache, saveToCache } from './cache'

// Alternatives engine
export {
  findCandidates,
  calculateScore,
  generateRuleBasedReason,
  getAlternatives,
} from './alternatives-engine'

// OpenAI ranker
export { rankWithOpenAI } from './openai-ranker'

// Re-export types for convenience
export type {
  Exercise,
  ExerciseAlternative,
  ExerciseAlternativeData,
  AlternativesEngineOptions,
  AlternativesEngineResult,
  CacheKey,
  CandidateFilters,
  ScoredCandidate,
  OpenAIRanking,
} from '@/types/ai.types'
