import { z } from 'zod'

// =============================================================================
// Class Schemas
// =============================================================================

export const classSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Maximum 100 characters'),
  description: z
    .string()
    .max(1000, 'Maximum 1000 characters')
    .optional()
    .nullable(),
  class_type: z
    .string()
    .max(50, 'Maximum 50 characters')
    .optional()
    .nullable(),
  start_time: z
    .string()
    .min(1, 'Start time is required'),
  end_time: z
    .string()
    .min(1, 'End time is required'),
  max_capacity: z
    .number()
    .min(1, 'Minimum 1 person')
    .max(500, 'Maximum 500 people'),
  waitlist_enabled: z
    .boolean(),
  max_waitlist: z
    .number()
    .min(0)
    .max(100),
  instructor_id: z
    .string()
    .uuid()
    .optional()
    .nullable(),
  instructor_name: z
    .string()
    .max(100, 'Maximum 100 characters')
    .optional()
    .nullable(),
  location: z
    .string()
    .max(100, 'Maximum 100 characters')
    .optional()
    .nullable(),
  booking_opens_hours: z
    .number()
    .min(0)
    .max(720), // 30 days
  booking_closes_minutes: z
    .number()
    .min(0)
    .max(1440), // 24 hours
  cancellation_deadline_hours: z
    .number()
    .min(0)
    .max(72),
  is_recurring: z
    .boolean(),
  recurrence_rule: z
    .string()
    .optional()
    .nullable(),
  wod_details: z
    .object({
      type: z.enum(['amrap', 'emom', 'for_time', 'tabata', 'custom']).optional(),
      duration: z.number().optional(),
      rounds: z.number().optional(),
      movements: z.array(z.object({
        exercise_id: z.string().optional(),
        name: z.string(),
        reps: z.union([z.number(), z.string()]).optional(),
        weight: z.string().optional(),
        notes: z.string().optional(),
      })).optional(),
      notes: z.string().optional(),
    })
    .optional()
    .nullable(),
})

export const classUpdateSchema = classSchema.partial()

export const classSearchSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  class_type: z.string().optional(),
  instructor_id: z.string().uuid().optional(),
  page: z.coerce.number().min(1).default(1),
  per_page: z.coerce.number().min(1).max(100).default(50),
})

export const classCancelSchema = z.object({
  cancellation_reason: z.string().max(500).optional(),
})

export type ClassFormData = z.infer<typeof classSchema>
export type ClassUpdateData = z.infer<typeof classUpdateSchema>
export type ClassSearchParams = z.infer<typeof classSearchSchema>
export type ClassCancelData = z.infer<typeof classCancelSchema>
