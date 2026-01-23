import { z } from 'zod'

// =============================================================================
// PAYMENT SCHEMAS
// =============================================================================

export const paymentMethodEnum = z.enum([
  'cash',
  'card',
  'transfer',
  'other',
])

export const paymentStatusEnum = z.enum([
  'paid',
  'pending',
  'failed',
  'refunded',
])

export const paymentSchema = z.object({
  member_id: z.string().uuid('Miembro requerido'),
  plan_id: z.string().uuid('Plan requerido').optional().nullable(),
  amount: z.coerce.number().min(0.01, 'El monto debe ser mayor a 0'),
  payment_method: paymentMethodEnum.default('cash'),
  payment_date: z.coerce.date().default(() => new Date()),
  notes: z.string().max(500).optional().nullable(),
  reference_number: z.string().max(100).optional().nullable(),
})

export const paymentUpdateSchema = paymentSchema.partial()

// =============================================================================
// EXPENSE SCHEMAS
// =============================================================================

export const expenseCategoryEnum = z.enum([
  'rent',
  'utilities',
  'salaries',
  'equipment',
  'maintenance',
  'marketing',
  'supplies',
  'insurance',
  'taxes',
  'other',
])

export const expenseSchema = z.object({
  description: z.string().min(3, 'Descripcion requerida').max(255),
  amount: z.coerce.number().min(0.01, 'El monto debe ser mayor a 0'),
  category: expenseCategoryEnum.default('other'),
  expense_date: z.coerce.date().default(() => new Date()),
  vendor: z.string().max(100).optional().nullable(),
  receipt_url: z.string().url().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  is_recurring: z.boolean().default(false),
  // Location attribution (optional - NULL means org-wide expense)
  location_id: z.string().uuid().optional().nullable(),
})

export const expenseUpdateSchema = expenseSchema.partial()

// =============================================================================
// INCOME SCHEMAS (for non-membership income)
// =============================================================================

export const incomeCategoryEnum = z.enum([
  'product_sale',
  'service',
  'rental',
  'event',
  'donation',
  'other',
])

export const incomeSchema = z.object({
  description: z.string().min(3, 'Descripcion requerida').max(255),
  amount: z.coerce.number().min(0.01, 'El monto debe ser mayor a 0'),
  category: incomeCategoryEnum.default('other'),
  income_date: z.coerce.date().default(() => new Date()),
  notes: z.string().max(500).optional().nullable(),
  // Location attribution (optional - NULL means org-wide income)
  location_id: z.string().uuid().optional().nullable(),
})

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type PaymentFormData = z.infer<typeof paymentSchema>
export type PaymentMethod = z.infer<typeof paymentMethodEnum>
export type PaymentStatus = z.infer<typeof paymentStatusEnum>

export type ExpenseFormData = z.infer<typeof expenseSchema>
export type ExpenseCategory = z.infer<typeof expenseCategoryEnum>

export type IncomeFormData = z.infer<typeof incomeSchema>
export type IncomeCategory = z.infer<typeof incomeCategoryEnum>

// =============================================================================
// LABELS (for UI)
// =============================================================================

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  other: 'Otro',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: 'Pagado',
  pending: 'Pendiente',
  failed: 'Fallido',
  refunded: 'Reembolsado',
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  rent: 'Renta',
  utilities: 'Servicios',
  salaries: 'Salarios',
  equipment: 'Equipo',
  maintenance: 'Mantenimiento',
  marketing: 'Marketing',
  supplies: 'Insumos',
  insurance: 'Seguros',
  taxes: 'Impuestos',
  other: 'Otro',
}

export const INCOME_CATEGORY_LABELS: Record<IncomeCategory, string> = {
  product_sale: 'Venta de producto',
  service: 'Servicio',
  rental: 'Alquiler',
  event: 'Evento',
  donation: 'Donacion',
  other: 'Otro',
}
