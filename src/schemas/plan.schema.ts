import { z } from 'zod'

// =============================================================================
// Membership Plan Schemas
// =============================================================================

export const planSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(2, 'Minimo 2 caracteres')
    .max(100, 'Maximo 100 caracteres'),
  description: z
    .string()
    .max(500, 'Maximo 500 caracteres')
    .optional()
    .nullable(),
  price: z
    .number()
    .min(0, 'El precio debe ser mayor o igual a 0'),
  currency: z
    .string()
    .length(3, 'La moneda debe tener 3 caracteres'),
  billing_period: z
    .enum(['monthly', 'quarterly', 'yearly', 'one_time']),
  unlimited_access: z
    .boolean(),
  classes_per_period: z
    .number()
    .min(0, 'El numero de clases debe ser mayor o igual a 0')
    .optional()
    .nullable(),
  access_all_locations: z
    .boolean(),
  duration_days: z
    .number()
    .min(1, 'La duracion debe ser al menos 1 dia'),
  features: z
    .array(z.string()),
  is_active: z
    .boolean(),
  is_featured: z
    .boolean(),
  sort_order: z
    .number()
    .min(0),
})

export const planUpdateSchema = planSchema.partial()

export const planSearchSchema = z.object({
  query: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
  billing_period: z.enum(['monthly', 'quarterly', 'yearly', 'one_time']).optional(),
  page: z.coerce.number().min(1).default(1),
  per_page: z.coerce.number().min(1).max(100).default(20),
  sort_by: z.string().optional(),
  sort_dir: z.enum(['asc', 'desc']).optional(),
})

export type PlanFormData = z.infer<typeof planSchema>
export type PlanUpdateData = z.infer<typeof planUpdateSchema>
export type PlanSearchParams = z.infer<typeof planSearchSchema>

// Billing period labels
export const billingPeriodLabels: Record<string, string> = {
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  yearly: 'Anual',
  one_time: 'Pago unico',
}

export const billingPeriods = Object.entries(billingPeriodLabels).map(([value, label]) => ({
  value,
  label,
}))
