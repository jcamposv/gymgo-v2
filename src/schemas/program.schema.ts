/**
 * Program Schema
 *
 * Zod validation schemas for training programs with multi-day workouts.
 */

import { z } from 'zod'
import { exerciseItemSchema } from './routine.schema'

// =============================================================================
// Program Duration and Days Validation
// =============================================================================

export const programDurationSchema = z.union([
  z.literal(4),
  z.literal(6),
  z.literal(8),
  z.literal(12),
])

export const daysPerWeekSchema = z.union([
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
])

// =============================================================================
// Program Day Schema
// =============================================================================

export const programDaySchema = z.object({
  dayNumber: z.number().min(1).max(6),
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'Maximo 100 caracteres'),
  focus: z.string().max(100).optional(),
  exercises: z.array(exerciseItemSchema).min(1, 'Agrega al menos un ejercicio'),
})

export type ProgramDayFormData = z.infer<typeof programDaySchema>

// =============================================================================
// Full Program Schema
// =============================================================================

export const programSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(2, 'Minimo 2 caracteres')
    .max(100, 'Maximo 100 caracteres'),
  description: z
    .string()
    .max(1000, 'Maximo 1000 caracteres')
    .optional()
    .nullable(),
  durationWeeks: programDurationSchema,
  daysPerWeek: daysPerWeekSchema,
  days: z
    .array(programDaySchema)
    .min(1, 'Agrega al menos un dia de entrenamiento'),
  assignedToMemberId: z.string().uuid().optional().nullable(),
  isTemplate: z.boolean().default(false),
})

export const programUpdateSchema = programSchema.partial()

export type ProgramFormData = z.infer<typeof programSchema>
export type ProgramUpdateData = z.infer<typeof programUpdateSchema>

// =============================================================================
// Complete Workout Schema
// =============================================================================

export const completeWorkoutSchema = z.object({
  durationMinutes: z.number().min(1).max(480).optional(),
  notes: z.string().max(500).optional(),
})

export type CompleteWorkoutFormData = z.infer<typeof completeWorkoutSchema>

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Validate that days array matches daysPerWeek
 */
export function validateProgramDays(
  days: ProgramDayFormData[],
  daysPerWeek: number
): { valid: boolean; error?: string } {
  if (days.length !== daysPerWeek) {
    return {
      valid: false,
      error: `Debes crear ${daysPerWeek} dias de entrenamiento`,
    }
  }

  // Check day numbers are sequential and correct
  const dayNumbers = days.map((d) => d.dayNumber).sort((a, b) => a - b)
  for (let i = 0; i < dayNumbers.length; i++) {
    if (dayNumbers[i] !== i + 1) {
      return {
        valid: false,
        error: `Los dias deben ser numerados del 1 al ${daysPerWeek}`,
      }
    }
  }

  return { valid: true }
}
