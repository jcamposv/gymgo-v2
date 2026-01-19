import { z } from 'zod'

// =============================================================================
// Movement Patterns
// =============================================================================

export const movementPatterns = [
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

export type MovementPattern = (typeof movementPatterns)[number]

// =============================================================================
// AI Alternatives Request Schema
// =============================================================================

export const aiAlternativesRequestSchema = z.object({
  exercise_id: z.string().uuid('ID de ejercicio invalido'),
  difficulty_filter: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .optional()
    .nullable(),
  limit: z
    .number()
    .int()
    .min(1, 'Minimo 1 alternativa')
    .max(20, 'Maximo 20 alternativas')
    .default(5),
})

export type AiAlternativesRequest = z.infer<typeof aiAlternativesRequestSchema>

// =============================================================================
// AI Alternatives Response Schema
// =============================================================================

export const exerciseDataSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  name_es: z.string().nullable(),
  category: z.string().nullable(),
  muscle_groups: z.array(z.string()).nullable(),
  equipment: z.array(z.string()).nullable(),
  difficulty: z.string().nullable(),
  gif_url: z.string().nullable(),
  movement_pattern: z.string().nullable(),
})

export const exerciseAlternativeSchema = z.object({
  exercise: exerciseDataSchema,
  reason: z.string(),
  score: z.number().min(0).max(100),
})

export const aiAlternativesResponseSchema = z.object({
  alternatives: z.array(exerciseAlternativeSchema),
  was_cached: z.boolean(),
  tokens_used: z.number(),
  remaining_requests: z.number(),
})

export type ExerciseData = z.infer<typeof exerciseDataSchema>
export type ExerciseAlternativeSchema = z.infer<typeof exerciseAlternativeSchema>
export type AiAlternativesResponse = z.infer<typeof aiAlternativesResponseSchema>
