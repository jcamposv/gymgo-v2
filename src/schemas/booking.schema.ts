import { z } from 'zod'

// =============================================================================
// Booking Schemas
// =============================================================================

export const bookingSchema = z.object({
  class_id: z
    .string()
    .uuid('Invalid class ID'),
  member_id: z
    .string()
    .uuid('Invalid member ID'),
})

export const bookingUpdateSchema = z.object({
  status: z
    .enum(['confirmed', 'cancelled', 'attended', 'no_show', 'waitlist'])
    .optional(),
  checked_in_at: z
    .string()
    .optional()
    .nullable(),
  cancellation_reason: z
    .string()
    .max(500, 'Maximum 500 characters')
    .optional()
    .nullable(),
  workout_result: z
    .object({
      score: z.string().optional(),
      rx: z.boolean().optional(),
      scaled: z.boolean().optional(),
      notes: z.string().optional(),
      rounds: z.number().optional(),
      reps: z.number().optional(),
      time: z.string().optional(),
      weight: z.string().optional(),
    })
    .optional()
    .nullable(),
})

export const bookingCancelSchema = z.object({
  cancellation_reason: z.string().max(500).optional(),
})

export const bookingCheckInSchema = z.object({
  booking_id: z.string().uuid(),
  check_in_method: z.enum(['qr', 'pin', 'manual', 'biometric']).default('manual'),
  location: z.string().max(100).optional(),
})

export const bookingSearchSchema = z.object({
  class_id: z.string().uuid().optional(),
  member_id: z.string().uuid().optional(),
  status: z.enum(['confirmed', 'cancelled', 'attended', 'no_show', 'waitlist']).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  per_page: z.coerce.number().min(1).max(100).default(50),
})

export type BookingFormData = z.infer<typeof bookingSchema>
export type BookingUpdateData = z.infer<typeof bookingUpdateSchema>
export type BookingCancelData = z.infer<typeof bookingCancelSchema>
export type BookingCheckInData = z.infer<typeof bookingCheckInSchema>
export type BookingSearchParams = z.infer<typeof bookingSearchSchema>
