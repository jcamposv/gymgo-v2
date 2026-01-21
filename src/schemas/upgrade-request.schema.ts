import { z } from 'zod'

// =============================================================================
// UPGRADE REQUEST SCHEMA
// =============================================================================

const planTiers = ['free', 'starter', 'growth', 'pro', 'enterprise'] as const

export const upgradeRequestSchema = z.object({
  requestedPlan: z.enum(planTiers, {
    message: 'Selecciona un plan',
  }),
  seats: z.number().int().positive().optional().nullable(),
  message: z.string().max(1000, 'El mensaje no puede exceder 1000 caracteres').optional(),
  contactEmail: z.string().email('Email invalido'),
  contactName: z.string().min(1, 'El nombre es requerido').max(100),
})

export type UpgradeRequestFormValues = z.infer<typeof upgradeRequestSchema>

// Server-side schema with organization and user context
export const upgradeRequestServerSchema = upgradeRequestSchema.extend({
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
  currentPlan: z.string().optional(),
})

export type UpgradeRequestServerInput = z.infer<typeof upgradeRequestServerSchema>

// Status type
export type UpgradeRequestStatus = 'pending' | 'approved' | 'rejected'

// Full upgrade request type (from database)
export interface UpgradeRequest {
  id: string
  organization_id: string
  user_id: string
  requested_plan: string
  current_plan: string | null
  seats: number | null
  message: string | null
  contact_email: string
  contact_name: string | null
  status: UpgradeRequestStatus
  admin_notes: string | null
  processed_at: string | null
  processed_by: string | null
  created_at: string
  updated_at: string
}
