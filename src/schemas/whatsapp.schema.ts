import { z } from 'zod'

// =============================================================================
// E.164 PHONE VALIDATION
// =============================================================================

export const e164PhoneSchema = z
  .string()
  .regex(
    /^\+[1-9]\d{6,14}$/,
    'El numero debe estar en formato E.164 (ej: +521234567890)'
  )

// =============================================================================
// TEMPLATE ENUMS
// =============================================================================

export const templateTypeEnum = z.enum([
  'payment_reminder',
  'payment_overdue',
  'payment_confirmation',
  'membership_expiring',
  'membership_expired',
  'welcome',
  'custom',
])

export const templateStatusEnum = z.enum([
  'draft',
  'pending_approval',
  'approved',
  'rejected',
  'disabled',
])

export const setupStatusEnum = z.enum([
  'pending',
  'phone_pending',
  'active',
  'suspended',
])

export const notificationChannelEnum = z.enum([
  'push',
  'whatsapp',
  'email',
  'sms',
])

export const deliveryStatusEnum = z.enum([
  'pending',
  'queued',
  'sent',
  'delivered',
  'read',
  'failed',
  'undelivered',
])

// =============================================================================
// TEMPLATE VARIABLE SCHEMA
// =============================================================================

export const templateVariableSchema = z.object({
  key: z.string().min(1, 'Clave requerida').max(50),
  type: z.enum(['text', 'date', 'currency', 'url']),
  example: z.string().max(100),
  description: z.string().max(200).optional(),
})

// =============================================================================
// CTA BUTTON SCHEMA
// =============================================================================

export const ctaButtonSchema = z.object({
  type: z.enum(['url', 'phone', 'quick_reply']),
  text: z.string().min(1, 'Texto requerido').max(25, 'Maximo 25 caracteres'),
  url: z.string().url('URL invalida').optional(),
  phone: e164PhoneSchema.optional(),
})

// =============================================================================
// WHATSAPP TEMPLATE SCHEMA
// =============================================================================

export const whatsappTemplateSchema = z.object({
  name: z.string().min(3, 'Nombre requerido (minimo 3 caracteres)').max(100),
  template_type: templateTypeEnum,
  language: z.string().length(2, 'Codigo de idioma de 2 caracteres').default('es'),
  header_text: z.string().max(60, 'Maximo 60 caracteres').optional().nullable(),
  body_text: z
    .string()
    .min(10, 'Mensaje requerido (minimo 10 caracteres)')
    .max(1024, 'Maximo 1024 caracteres'),
  footer_text: z.string().max(60, 'Maximo 60 caracteres').optional().nullable(),
  variables: z.array(templateVariableSchema).default([]),
  cta_buttons: z.array(ctaButtonSchema).max(3, 'Maximo 3 botones').default([]),
  is_default: z.boolean().default(false),
})

export const whatsappTemplateUpdateSchema = whatsappTemplateSchema.partial()

// =============================================================================
// WHATSAPP SETTINGS SCHEMA
// =============================================================================

export const whatsappSettingsSchema = z.object({
  is_enabled: z.boolean().default(false),
  reminder_days_before: z
    .array(z.number().int().min(0).max(30))
    .min(1, 'Al menos un dia de recordatorio')
    .max(5, 'Maximo 5 dias de recordatorio')
    .default([3, 1, 0]),
  reminder_hour: z
    .number()
    .int()
    .min(0, 'Hora minima: 0')
    .max(23, 'Hora maxima: 23')
    .default(9),
  auto_opt_in_new_members: z.boolean().default(false),
  send_payment_confirmation: z.boolean().default(true),
  send_membership_expiry_warning: z.boolean().default(true),
})

// =============================================================================
// NOTIFICATION PREFERENCES SCHEMA
// =============================================================================

export const notificationPreferencesSchema = z.object({
  whatsapp_phone: e164PhoneSchema.optional().nullable(),
  whatsapp_opted_in: z.boolean().optional(),
  receive_payment_reminders: z.boolean().optional(),
  receive_payment_confirmations: z.boolean().optional(),
  receive_membership_alerts: z.boolean().optional(),
  receive_class_reminders: z.boolean().optional(),
  receive_promotional: z.boolean().optional(),
  push_enabled: z.boolean().optional(),
  push_payment_reminders: z.boolean().optional(),
  push_class_reminders: z.boolean().optional(),
  quiet_hours_start: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Formato HH:MM')
    .optional()
    .nullable(),
  quiet_hours_end: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Formato HH:MM')
    .optional()
    .nullable(),
})

// =============================================================================
// TEST SEND SCHEMA
// =============================================================================

export const testSendSchema = z.object({
  template_id: z.string().uuid('Template ID invalido'),
  phone_number: e164PhoneSchema,
  variables: z.record(z.string(), z.string()).optional(),
})

// =============================================================================
// DELIVERY LOG FILTERS SCHEMA
// =============================================================================

export const deliveryLogFiltersSchema = z.object({
  channel: notificationChannelEnum.optional(),
  status: deliveryStatusEnum.optional(),
  notification_type: z.string().optional(),
  member_id: z.string().uuid().optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type WhatsAppTemplateFormData = z.infer<typeof whatsappTemplateSchema>
export type WhatsAppSettingsFormData = z.infer<typeof whatsappSettingsSchema>
export type NotificationPreferencesFormData = z.infer<typeof notificationPreferencesSchema>
export type TestSendFormData = z.infer<typeof testSendSchema>
export type DeliveryLogFiltersFormData = z.infer<typeof deliveryLogFiltersSchema>

// =============================================================================
// LABELS (for UI)
// =============================================================================

export const TEMPLATE_TYPE_LABELS: Record<z.infer<typeof templateTypeEnum>, string> = {
  payment_reminder: 'Recordatorio de pago',
  payment_overdue: 'Pago vencido',
  payment_confirmation: 'Confirmacion de pago',
  membership_expiring: 'Membresia por vencer',
  membership_expired: 'Membresia vencida',
  welcome: 'Bienvenida',
  custom: 'Personalizado',
}

export const TEMPLATE_STATUS_LABELS: Record<z.infer<typeof templateStatusEnum>, string> = {
  draft: 'Borrador',
  pending_approval: 'Pendiente de aprobacion',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  disabled: 'Deshabilitado',
}

export const SETUP_STATUS_LABELS: Record<z.infer<typeof setupStatusEnum>, string> = {
  pending: 'Pendiente',
  phone_pending: 'Esperando numero',
  active: 'Activo',
  suspended: 'Suspendido',
}

export const DELIVERY_STATUS_LABELS: Record<z.infer<typeof deliveryStatusEnum>, string> = {
  pending: 'Pendiente',
  queued: 'En cola',
  sent: 'Enviado',
  delivered: 'Entregado',
  read: 'Leido',
  failed: 'Fallido',
  undelivered: 'No entregado',
}

export const NOTIFICATION_CHANNEL_LABELS: Record<z.infer<typeof notificationChannelEnum>, string> = {
  push: 'Push',
  whatsapp: 'WhatsApp',
  email: 'Email',
  sms: 'SMS',
}
