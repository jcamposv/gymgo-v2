import type { PlanTier } from '@/lib/pricing.config'

export type BillingPeriod = 'monthly' | 'yearly'

/**
 * Map PlanTier + BillingPeriod → Stripe Price ID from env vars
 */
const PRICE_ENV_MAP: Record<string, string> = {
  'starter_monthly': 'STRIPE_PRICE_STARTER_MONTHLY',
  'starter_yearly': 'STRIPE_PRICE_STARTER_YEARLY',
  'growth_monthly': 'STRIPE_PRICE_GROWTH_MONTHLY',
  'growth_yearly': 'STRIPE_PRICE_GROWTH_YEARLY',
  'pro_monthly': 'STRIPE_PRICE_PRO_MONTHLY',
  'pro_yearly': 'STRIPE_PRICE_PRO_YEARLY',
}

export function getStripePriceId(plan: PlanTier, period: BillingPeriod): string | null {
  const key = `${plan}_${period}`
  const envVar = PRICE_ENV_MAP[key]
  if (!envVar) return null
  return process.env[envVar] || null
}

/** Plans that support Stripe checkout (not free, not enterprise) */
export const STRIPE_BILLABLE_PLANS: PlanTier[] = ['starter', 'growth', 'pro']

export function isBillablePlan(plan: PlanTier): boolean {
  return STRIPE_BILLABLE_PLANS.includes(plan)
}
