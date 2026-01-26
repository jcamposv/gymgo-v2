import { z } from 'zod'

// =============================================================================
// PAYMENT PERIOD TYPES
// =============================================================================

export const PAYMENT_PERIOD_OPTIONS = [
  { value: 'monthly', label: 'Mensual', months: 1 },
  { value: 'bimonthly', label: 'Bimestral', months: 2 },
  { value: 'quarterly', label: 'Trimestral', months: 3 },
  { value: 'semiannual', label: 'Semestral', months: 6 },
  { value: 'annual', label: 'Anual', months: 12 },
  { value: 'custom', label: 'Personalizado', months: 0 },
] as const

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'sinpe', label: 'SINPE' },
  { value: 'other', label: 'Otro' },
] as const

export type PaymentPeriodType = typeof PAYMENT_PERIOD_OPTIONS[number]['value']
export type PaymentMethodType = typeof PAYMENT_METHOD_OPTIONS[number]['value']

// =============================================================================
// MEMBERSHIP PAYMENT FORM SCHEMA
// =============================================================================

export const membershipPaymentSchema = z.object({
  member_id: z.string().uuid('Selecciona un miembro'),
  plan_id: z.string().uuid('Selecciona un plan').optional().nullable(),
  amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  currency: z.string().min(3).max(3).default('MXN'),
  payment_method: z.enum(['cash', 'card', 'transfer', 'sinpe', 'other']).default('cash'),
  reference_number: z.string().max(100).optional().nullable(),
  period_type: z.enum(['monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual', 'custom']),
  period_months: z.coerce.number().int().min(1).max(36).optional(),
  start_date: z.string().optional(),
  notes: z.string().max(500).optional().nullable(),
  location_id: z.string().uuid().optional().nullable(),
})

export type MembershipPaymentFormData = z.infer<typeof membershipPaymentSchema>

// =============================================================================
// MEMBERSHIP STATUS LABELS
// =============================================================================

export const MEMBERSHIP_STATUS_CONFIG = {
  active: {
    label: 'Activa',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: 'CheckCircle',
  },
  expiring_soon: {
    label: 'Por vencer',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: 'Clock',
  },
  expired: {
    label: 'Vencida',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: 'XCircle',
  },
  no_membership: {
    label: 'Sin membresía',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: 'MinusCircle',
  },
} as const

export type MembershipStatusType = keyof typeof MEMBERSHIP_STATUS_CONFIG

// =============================================================================
// HELPER: Get period months from type
// =============================================================================

export function getPeriodMonths(periodType: PaymentPeriodType, customMonths?: number): number {
  const option = PAYMENT_PERIOD_OPTIONS.find(o => o.value === periodType)
  if (!option) return 1
  if (periodType === 'custom' && customMonths) return customMonths
  return option.months || 1
}

// =============================================================================
// HELPER: Format currency
// =============================================================================

export function formatCurrency(amount: number, currency = 'MXN'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
  }).format(amount)
}

// =============================================================================
// HELPER: Format date for display
// =============================================================================

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
