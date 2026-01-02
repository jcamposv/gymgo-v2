import { z } from 'zod'

// =============================================================================
// Exercise Item Schema (for exercises array in workout)
// =============================================================================

export const exerciseItemSchema = z.object({
  exercise_id: z.string().uuid(),
  exercise_name: z.string(), // Denormalized for display
  sets: z.number().min(1).max(100).optional(),
  reps: z.string().optional(), // Can be "8-12", "AMRAP", "Max", etc.
  weight: z.string().optional(), // Can be "50kg", "BW", "70%", etc.
  rest_seconds: z.number().min(0).max(600).optional(),
  tempo: z.string().optional(), // e.g., "3-1-2-0"
  notes: z.string().max(500).optional(),
  order: z.number(),
})

export type ExerciseItem = z.infer<typeof exerciseItemSchema>

// =============================================================================
// Routine Schema
// =============================================================================

export const routineSchema = z.object({
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
  workout_type: z
    .enum(['routine', 'wod', 'program']),
  wod_type: z
    .enum(['amrap', 'emom', 'for_time', 'tabata', 'rounds'])
    .optional()
    .nullable(),
  wod_time_cap: z
    .number()
    .min(1)
    .max(120)
    .optional()
    .nullable(),
  exercises: z
    .array(exerciseItemSchema)
    .min(1, 'Agrega al menos un ejercicio'),
  assigned_to_member_id: z
    .string()
    .uuid()
    .optional()
    .nullable(),
  scheduled_date: z
    .string()
    .optional()
    .nullable(),
  is_template: z
    .boolean(),
  is_active: z
    .boolean(),
})

export const routineUpdateSchema = routineSchema.partial()

export const routineSearchSchema = z.object({
  query: z.string().optional(),
  workout_type: z.enum(['routine', 'wod', 'program']).optional(),
  is_template: z.coerce.boolean().optional(),
  assigned_to_member_id: z.string().uuid().optional(),
  scheduled_date: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  per_page: z.coerce.number().min(1).max(100).default(20),
  sort_by: z.string().optional(),
  sort_dir: z.enum(['asc', 'desc']).optional(),
})

export type RoutineFormData = z.infer<typeof routineSchema>
export type RoutineUpdateData = z.infer<typeof routineUpdateSchema>
export type RoutineSearchParams = z.infer<typeof routineSearchSchema>

// Workout type labels
export const workoutTypeLabels: Record<string, string> = {
  routine: 'Rutina',
  wod: 'WOD',
  program: 'Programa',
}

// WOD type labels
export const wodTypeLabels: Record<string, string> = {
  amrap: 'AMRAP (As Many Rounds As Possible)',
  emom: 'EMOM (Every Minute On the Minute)',
  for_time: 'For Time',
  tabata: 'Tabata',
  rounds: 'Rounds for Quality',
}

// Arrays for select inputs
export const workoutTypes = Object.entries(workoutTypeLabels).map(([value, label]) => ({
  value,
  label,
}))

export const wodTypes = Object.entries(wodTypeLabels).map(([value, label]) => ({
  value,
  label,
}))
