import { z } from 'zod'

// =============================================================================
// Booking Limits Schema
// =============================================================================

export const bookingLimitsSchema = z.object({
  max_classes_per_day: z
    .number()
    .int('Debe ser un número entero')
    .min(1, 'El mínimo es 1 clase por día')
    .max(10, 'El máximo es 10 clases por día')
    .nullable(),
})

export type BookingLimitsFormData = z.infer<typeof bookingLimitsSchema>

// =============================================================================
// Daily Limit Error Response Schema
// =============================================================================

export const dailyLimitErrorSchema = z.object({
  code: z.literal('DAILY_CLASS_LIMIT_REACHED'),
  limit: z.number(),
  currentCount: z.number(),
  targetDate: z.string(),
  timezone: z.string(),
  existingBookings: z.array(
    z.object({
      id: z.string(),
      className: z.string(),
      startTime: z.string(),
      status: z.string(),
    })
  ),
})

export type DailyLimitErrorData = z.infer<typeof dailyLimitErrorSchema>

// =============================================================================
// Helper to check if an error is a daily limit error
// =============================================================================

export function isDailyLimitError(data: unknown): data is DailyLimitErrorData {
  if (!data || typeof data !== 'object') return false
  return (data as Record<string, unknown>).code === 'DAILY_CLASS_LIMIT_REACHED'
}
