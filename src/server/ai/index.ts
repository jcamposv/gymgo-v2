/**
 * Server AI Module
 *
 * Central exports for server-only AI functionality.
 * This module should ONLY be imported in server components,
 * route handlers, and server actions.
 */

// Core AI service
export {
  type AIFeature,
  type AILimitError,
  type AIServiceContext,
  type AIUsageResult,
  type CheckLimitResult,
  getModelForPlan,
  checkAILimit,
  consumeAITokens,
  chatCompletion,
  jsonCompletion,
  getOrganizationPlan,
  createAIContext,
  createAILimitErrorResponse,
} from './ai.service'

// Routine generator
export {
  type FitnessGoal,
  type ExperienceLevel,
  type RoutineGenerationRequest,
  type GeneratedExercise,
  type GeneratedDay,
  type GeneratedRoutine,
  generateRoutine,
  GOAL_CONFIG,
  EXPERIENCE_CONFIG,
} from './routine-generator'
