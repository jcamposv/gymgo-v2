import { z } from 'zod'

// =============================================================================
// Member Form Schema - Validaciones completas en español
// =============================================================================

/**
 * Schema unificado para el formulario de miembros (create y edit)
 * Incluye campos de invitación y rol para modo create
 */
export const memberFormSchema = z.object({
  // Información básica
  email: z
    .string()
    .min(1, 'El correo electronico es obligatorio')
    .email('Ingresa un correo electronico valido'),
  full_name: z
    .string()
    .min(1, 'El nombre completo es obligatorio')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  phone: z
    .string()
    .max(20, 'El telefono no puede exceder 20 caracteres')
    .optional()
    .or(z.literal('')),
  date_of_birth: z
    .string()
    .optional()
    .or(z.literal('')),
  gender: z
    .enum(['male', 'female', 'other', 'prefer_not_to_say'])
    .optional()
    .nullable(),
  status: z
    .enum(['active', 'inactive', 'suspended', 'cancelled'])
    .default('active'),

  // Membresía - REQUERIDO
  current_plan_id: z
    .string()
    .min(1, 'La membresia es obligatoria')
    .uuid('Selecciona un plan de membresia valido'),
  membership_start_date: z
    .string()
    .min(1, 'La fecha de inicio es obligatoria'),
  membership_end_date: z
    .string()
    .optional()
    .or(z.literal('')),

  // Contacto de emergencia
  emergency_contact_name: z
    .string()
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .optional()
    .or(z.literal('')),
  emergency_contact_phone: z
    .string()
    .max(20, 'El telefono no puede exceder 20 caracteres')
    .optional()
    .or(z.literal('')),

  // Fitness y salud
  experience_level: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .default('beginner'),
  medical_conditions: z
    .string()
    .max(1000, 'Las condiciones medicas no pueden exceder 1000 caracteres')
    .optional()
    .or(z.literal('')),
  injuries: z
    .string()
    .max(1000, 'Las lesiones no pueden exceder 1000 caracteres')
    .optional()
    .or(z.literal('')),
  fitness_goals: z
    .array(z.string())
    .optional()
    .nullable(),
  internal_notes: z
    .string()
    .max(2000, 'Las notas internas no pueden exceder 2000 caracteres')
    .optional()
    .or(z.literal('')),

  // Campos de invitación (solo usados en create mode)
  send_invitation: z.boolean().default(true),
  role: z
    .enum(['admin', 'assistant', 'trainer', 'nutritionist', 'client'])
    .default('client'),
})

// Type for form values (includes invitation fields)
export type MemberFormValues = z.infer<typeof memberFormSchema>

/**
 * Schema legacy para compatibilidad con server actions
 * Transforma strings vacíos a null para la base de datos
 */
export const memberSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electronico es obligatorio')
    .email('Ingresa un correo electronico valido'),
  full_name: z
    .string()
    .min(1, 'El nombre completo es obligatorio')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  phone: z
    .string()
    .max(20, 'El telefono no puede exceder 20 caracteres')
    .optional()
    .nullable()
    .transform(val => val || null),
  date_of_birth: z
    .string()
    .optional()
    .nullable()
    .transform(val => val || null),
  gender: z
    .enum(['male', 'female', 'other', 'prefer_not_to_say'])
    .optional()
    .nullable(),
  status: z
    .enum(['active', 'inactive', 'suspended', 'cancelled'])
    .default('active'),
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
    .nullable()
    .transform(val => val || null),
  emergency_contact_name: z
    .string()
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .optional()
    .nullable()
    .transform(val => val || null),
  emergency_contact_phone: z
    .string()
    .max(20, 'El telefono no puede exceder 20 caracteres')
    .optional()
    .nullable()
    .transform(val => val || null),
  experience_level: z
    .enum(['beginner', 'intermediate', 'advanced']),
  medical_conditions: z
    .string()
    .max(1000, 'Las condiciones medicas no pueden exceder 1000 caracteres')
    .optional()
    .nullable()
    .transform(val => val || null),
  injuries: z
    .string()
    .max(1000, 'Las lesiones no pueden exceder 1000 caracteres')
    .optional()
    .nullable()
    .transform(val => val || null),
  fitness_goals: z
    .array(z.string())
    .optional()
    .nullable(),
  internal_notes: z
    .string()
    .max(2000, 'Las notas internas no pueden exceder 2000 caracteres')
    .optional()
    .nullable()
    .transform(val => val || null),
})

/**
 * Schema para actualizar un miembro
 */
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

// Types
export type MemberFormData = z.infer<typeof memberSchema>
export type MemberUpdateData = z.infer<typeof memberUpdateSchema>
export type MemberSearchParams = z.infer<typeof memberSearchSchema>

// =============================================================================
// Labels y constantes para UI
// =============================================================================

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

export const experienceLevelLabels: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
}

export const experienceLevels = Object.entries(experienceLevelLabels).map(([value, label]) => ({
  value,
  label,
}))

export const genderLabels: Record<string, string> = {
  male: 'Masculino',
  female: 'Femenino',
  other: 'Otro',
  prefer_not_to_say: 'Prefiero no decir',
}

// =============================================================================
// Helper para obtener errores por tab
// =============================================================================

type TabName = 'basic' | 'membership' | 'contact' | 'fitness'

const TAB_FIELDS: Record<TabName, string[]> = {
  basic: ['full_name', 'email', 'phone', 'date_of_birth', 'gender', 'status'],
  membership: ['current_plan_id', 'membership_start_date', 'membership_end_date'],
  contact: ['emergency_contact_name', 'emergency_contact_phone'],
  fitness: ['experience_level', 'medical_conditions', 'injuries', 'internal_notes'],
}

/**
 * Obtiene los tabs que tienen errores
 */
export function getTabsWithErrors(errors: Record<string, unknown>): TabName[] {
  const tabsWithErrors: TabName[] = []
  const errorFields = Object.keys(errors)

  for (const [tab, fields] of Object.entries(TAB_FIELDS)) {
    if (fields.some(field => errorFields.includes(field))) {
      tabsWithErrors.push(tab as TabName)
    }
  }

  return tabsWithErrors
}

/**
 * Obtiene el primer tab con errores
 */
export function getFirstTabWithError(errors: Record<string, unknown>): TabName | null {
  const tabs = getTabsWithErrors(errors)
  return tabs[0] || null
}
