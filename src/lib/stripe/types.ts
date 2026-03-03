import type { PlanTier } from '@/lib/pricing.config'
import type { BillingPeriod } from './config'

export interface StripeCustomer {
  id: string
  organization_id: string
  stripe_customer_id: string
  stripe_email: string | null
  created_at: string
  updated_at: string
}

export type StripeSubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'paused'

export interface StripeSubscription {
  id: string
  organization_id: string
  stripe_subscription_id: string
  stripe_price_id: string
  plan_tier: PlanTier
  billing_period: BillingPeriod
  status: StripeSubscriptionStatus
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  cancelled_at: string | null
  ended_at: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface StripePrice {
  id: string
  stripe_price_id: string
  stripe_product_id: string
  plan_tier: PlanTier
  billing_period: BillingPeriod
  amount_cents: number
  currency: string
  is_active: boolean
  created_at: string
}

export type BillingRecordStatus = 'paid' | 'failed' | 'pending' | 'refunded'

export interface BillingRecord {
  id: string
  organization_id: string
  stripe_invoice_id: string | null
  amount_cents: number
  currency: string
  status: BillingRecordStatus
  description: string | null
  invoice_url: string | null
  invoice_pdf: string | null
  period_start: string | null
  period_end: string | null
  paid_at: string | null
  created_at: string
}

export interface UpsertSubscriptionData {
  organization_id: string
  stripe_subscription_id: string
  stripe_price_id: string
  plan_tier: PlanTier
  billing_period: BillingPeriod
  status: StripeSubscriptionStatus
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  cancelled_at?: string | null
  ended_at?: string | null
  metadata?: Record<string, unknown> | null
}

export interface CreateBillingRecordData {
  organization_id: string
  stripe_invoice_id?: string | null
  amount_cents: number
  currency: string
  status: BillingRecordStatus
  description?: string | null
  invoice_url?: string | null
  invoice_pdf?: string | null
  period_start?: string | null
  period_end?: string | null
  paid_at?: string | null
}
