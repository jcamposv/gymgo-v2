import { z } from 'zod'

// =============================================================================
// Member Schemas
// =============================================================================

export const memberSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  full_name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Minimum 2 characters')
    .max(100, 'Maximum 100 characters'),
  phone: z
    .string()
    .max(20, 'Maximum 20 characters')
    .optional()
    .nullable(),
  date_of_birth: z
    .string()
    .optional()
    .nullable(),
  gender: z
    .enum(['male', 'female', 'other', 'prefer_not_to_say'])
    .optional()
    .nullable(),
  emergency_contact_name: z
    .string()
    .max(100, 'Maximum 100 characters')
    .optional()
    .nullable(),
  emergency_contact_phone: z
    .string()
    .max(20, 'Maximum 20 characters')
    .optional()
    .nullable(),
  medical_conditions: z
    .string()
    .max(1000, 'Maximum 1000 characters')
    .optional()
    .nullable(),
  injuries: z
    .string()
    .max(1000, 'Maximum 1000 characters')
    .optional()
    .nullable(),
  fitness_goals: z
    .array(z.string())
    .optional()
    .nullable(),
  experience_level: z
    .enum(['beginner', 'intermediate', 'advanced']),
  status: z
    .enum(['active', 'inactive', 'suspended', 'cancelled']),
  current_plan_id: z
    .string()
    .uuid()
    .optional()
    .nullable(),
  membership_start_date: z
    .string()
    .optional()
    .nullable(),
  membership_end_date: z
    .string()
    .optional()
    .nullable(),
  internal_notes: z
    .string()
    .max(2000, 'Maximum 2000 characters')
    .optional()
    .nullable(),
})

export const memberUpdateSchema = memberSchema.partial()

export const memberSearchSchema = z.object({
  query: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'cancelled']).optional(),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  plan_id: z.string().uuid().optional(),
  page: z.coerce.number().min(1).default(1),
  per_page: z.coerce.number().min(1).max(100).default(20),
  sort_by: z.string().optional(),
  sort_dir: z.enum(['asc', 'desc']).optional(),
})

export type MemberFormData = z.infer<typeof memberSchema>
export type MemberUpdateData = z.infer<typeof memberUpdateSchema>
export type MemberSearchParams = z.infer<typeof memberSearchSchema>

// Status labels
export const memberStatusLabels: Record<string, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  suspended: 'Suspendido',
  cancelled: 'Cancelado',
}

export const memberStatuses = Object.entries(memberStatusLabels).map(([value, label]) => ({
  value,
  label,
}))

// Experience level labels
export const experienceLevelLabels: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
}

export const experienceLevels = Object.entries(experienceLevelLabels).map(([value, label]) => ({
  value,
  label,
}))
