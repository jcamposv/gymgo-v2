import { z } from 'zod'

// =============================================================================
// Membership Plan Schemas
// =============================================================================

export const membershipPlanSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Maximum 100 characters'),
  description: z
    .string()
    .max(1000, 'Maximum 1000 characters')
    .optional()
    .nullable(),
  price: z
    .coerce
    .number()
    .min(0, 'Price must be positive')
    .max(1000000, 'Maximum 1,000,000'),
  currency: z
    .enum(['MXN', 'USD', 'COP', 'ARS', 'CLP', 'PEN', 'BRL'])
    .default('MXN'),
  billing_period: z
    .enum(['monthly', 'quarterly', 'yearly', 'one_time', 'weekly'])
    .default('monthly'),
  unlimited_access: z
    .boolean()
    .default(true),
  classes_per_period: z
    .coerce
    .number()
    .min(0)
    .max(1000)
    .optional()
    .nullable(),
  access_all_locations: z
    .boolean()
    .default(true),
  duration_days: z
    .coerce
    .number()
    .min(1, 'Minimum 1 day')
    .max(365, 'Maximum 365 days')
    .default(30),
  features: z
    .array(z.string())
    .default([]),
  is_active: z
    .boolean()
    .default(true),
  is_featured: z
    .boolean()
    .default(false),
  sort_order: z
    .coerce
    .number()
    .min(0)
    .default(0),
})

export const membershipPlanUpdateSchema = membershipPlanSchema.partial()

export type MembershipPlanFormData = z.infer<typeof membershipPlanSchema>
export type MembershipPlanUpdateData = z.infer<typeof membershipPlanUpdateSchema>
