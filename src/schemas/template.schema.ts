import { z } from 'zod'

// =============================================================================
// Class Template Schemas
// =============================================================================

export const classTemplateSchema = z.object({
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
  class_type: z
    .string()
    .max(50, 'Maximo 50 caracteres')
    .optional()
    .nullable(),
  day_of_week: z
    .number()
    .min(0, 'Dia invalido')
    .max(6, 'Dia invalido'),
  start_time: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora invalido (HH:MM)'),
  end_time: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora invalido (HH:MM)'),
  max_capacity: z
    .number()
    .min(1, 'La capacidad debe ser al menos 1'),
  waitlist_enabled: z
    .boolean(),
  max_waitlist: z
    .number()
    .min(0, 'La lista de espera no puede ser negativa'),
  instructor_id: z
    .string()
    .uuid()
    .optional()
    .nullable(),
  instructor_name: z
    .string()
    .max(100, 'Maximo 100 caracteres')
    .optional()
    .nullable(),
  location: z
    .string()
    .max(100, 'Maximo 100 caracteres')
    .optional()
    .nullable(),
  booking_opens_hours: z
    .number()
    .min(0, 'Las horas de apertura no pueden ser negativas'),
  booking_closes_minutes: z
    .number()
    .min(0, 'Los minutos de cierre no pueden ser negativos'),
  cancellation_deadline_hours: z
    .number()
    .min(0, 'Las horas de cancelacion no pueden ser negativas'),
  is_active: z
    .boolean(),
})

export const classTemplateUpdateSchema = classTemplateSchema.partial()

export const classTemplateSearchSchema = z.object({
  query: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
  day_of_week: z.coerce.number().min(0).max(6).optional(),
  class_type: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  per_page: z.coerce.number().min(1).max(100).default(20),
  sort_by: z.string().optional(),
  sort_dir: z.enum(['asc', 'desc']).optional(),
})

export const generateClassesSchema = z.object({
  period: z.enum(['week', 'two_weeks', 'month']),
  start_date: z.string().optional(),
  template_ids: z.array(z.string().uuid()).optional(),
})

export type ClassTemplateFormData = z.infer<typeof classTemplateSchema>
export type ClassTemplateUpdateData = z.infer<typeof classTemplateUpdateSchema>
export type ClassTemplateSearchParams = z.infer<typeof classTemplateSearchSchema>
export type GenerateClassesParams = z.infer<typeof generateClassesSchema>

// Day of week labels (0 = Sunday)
export const dayOfWeekLabels: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miercoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sabado',
}

// Class type labels
export const classTypeLabels: Record<string, string> = {
  crossfit: 'CrossFit',
  yoga: 'Yoga',
  pilates: 'Pilates',
  spinning: 'Spinning',
  hiit: 'HIIT',
  strength: 'Fuerza',
  cardio: 'Cardio',
  functional: 'Funcional',
  boxing: 'Box',
  mma: 'MMA',
  stretching: 'Estiramiento',
  open_gym: 'Open Gym',
  personal: 'Personal',
  other: 'Otro',
}

// Class types array for select inputs
export const classTypes = Object.entries(classTypeLabels).map(([value, label]) => ({
  value,
  label,
}))

// Days of week array for select inputs
export const daysOfWeek = Object.entries(dayOfWeekLabels).map(([value, label]) => ({
  value: Number(value),
  label,
}))
