import { getStripe } from './index'
import { getStripePriceId, type BillingPeriod } from './config'
import * as repo from './repository'
import type { PlanTier } from '@/lib/pricing.config'

// =============================================================================
// GET OR CREATE CUSTOMER
// =============================================================================

export async function getOrCreateCustomer(
  orgId: string,
  email: string,
  orgName: string
): Promise<string> {
  // Check if customer already exists
  const existing = await repo.findCustomerByOrgId(orgId)
  if (existing) return existing.stripe_customer_id

  // Create in Stripe
  const stripe = getStripe()
  const customer = await stripe.customers.create({
    email,
    name: orgName,
    metadata: { organization_id: orgId },
  })

  // Save to DB
  await repo.upsertCustomer(orgId, customer.id, email)

  return customer.id
}

// =============================================================================
// CHECKOUT SESSION
// =============================================================================

export async function createCheckoutSession(params: {
  orgId: string
  plan: PlanTier
  interval: BillingPeriod
  email: string
  orgName: string
  successUrl: string
  cancelUrl: string
}): Promise<string> {
  const { orgId, plan, interval, email, orgName, successUrl, cancelUrl } = params

  const priceId = getStripePriceId(plan, interval)
  if (!priceId) {
    throw new Error(`No Stripe price configured for ${plan}/${interval}`)
  }

  const customerId = await getOrCreateCustomer(orgId, email, orgName)

  const stripe = getStripe()
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: {
        organization_id: orgId,
        plan_tier: plan,
        billing_period: interval,
      },
      trial_period_days: 30,
    },
    metadata: {
      organization_id: orgId,
      plan_tier: plan,
      billing_period: interval,
    },
  })

  if (!session.url) throw new Error('Failed to create checkout session')
  return session.url
}

// =============================================================================
// CUSTOMER PORTAL
// =============================================================================

export async function createPortalSession(
  orgId: string,
  returnUrl: string
): Promise<string> {
  const customer = await repo.findCustomerByOrgId(orgId)
  if (!customer) throw new Error('No Stripe customer found for this organization')

  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: customer.stripe_customer_id,
    return_url: returnUrl,
  })

  return session.url
}

// =============================================================================
// CANCEL SUBSCRIPTION
// =============================================================================

export async function cancelSubscription(orgId: string): Promise<void> {
  const sub = await repo.findSubscriptionByOrgId(orgId)
  if (!sub) throw new Error('No active subscription found')

  const stripe = getStripe()
  await stripe.subscriptions.update(sub.stripe_subscription_id, {
    cancel_at_period_end: true,
  })
}

// =============================================================================
// RESUME SUBSCRIPTION (undo cancellation)
// =============================================================================

export async function resumeSubscription(orgId: string): Promise<void> {
  const sub = await repo.findSubscriptionByOrgId(orgId)
  if (!sub) throw new Error('No subscription found')

  const stripe = getStripe()
  await stripe.subscriptions.update(sub.stripe_subscription_id, {
    cancel_at_period_end: false,
  })
}

// =============================================================================
// CHANGE SUBSCRIPTION (upgrade/downgrade)
// =============================================================================

export async function changeSubscription(
  orgId: string,
  newPlan: PlanTier,
  newInterval: BillingPeriod
): Promise<void> {
  const sub = await repo.findSubscriptionByOrgId(orgId)
  if (!sub) throw new Error('No active subscription found')

  const newPriceId = getStripePriceId(newPlan, newInterval)
  if (!newPriceId) throw new Error(`No Stripe price configured for ${newPlan}/${newInterval}`)

  const stripe = getStripe()
  const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id)

  await stripe.subscriptions.update(sub.stripe_subscription_id, {
    items: [
      {
        id: stripeSub.items.data[0].id,
        price: newPriceId,
      },
    ],
    proration_behavior: 'create_prorations',
    metadata: {
      organization_id: orgId,
      plan_tier: newPlan,
      billing_period: newInterval,
    },
  })
}
