import type Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import * as repo from '@/lib/stripe/repository'
import { PLAN_LIMITS, type PlanTier } from '@/lib/pricing.config'
import type { BillingPeriod } from '@/lib/stripe/config'
import type { StripeSubscriptionStatus } from '@/lib/stripe/types'

// =============================================================================
// HELPERS
// =============================================================================

function updateOrgPlan(orgId: string, plan: PlanTier, status: string) {
  const admin = createAdminClient()
  const planLimits = PLAN_LIMITS[plan]

  return admin
    .from('organizations')
    .update({
      subscription_plan: plan === 'free' ? 'starter' : plan,
      subscription_status: status,
      max_members: planLimits.maxMembers === -1 ? 999999 : planLimits.maxMembers,
      max_locations: planLimits.maxLocations === -1 ? 999 : planLimits.maxLocations,
      max_admin_users: planLimits.maxUsers === -1 ? 999 : planLimits.maxUsers,
      features: {
        ai_coach: planLimits.aiRequestsPerMonth > 0,
        advanced_reports: planLimits.advancedReports,
        whatsapp_bot: planLimits.whatsappMessagesPerMonth > 0,
        api_access: planLimits.apiAccess,
        multi_location: planLimits.multiLocation,
        custom_branding: planLimits.customBranding,
        white_label: planLimits.whiteLabel,
        export_data: planLimits.exportData,
      },
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', orgId)
}

function logSubscriptionHistory(orgId: string, eventType: string, data: Record<string, unknown> = {}) {
  const admin = createAdminClient()
  return admin.from('subscription_history').insert({
    organization_id: orgId,
    event_type: eventType,
    ...data,
  } as never)
}

// =============================================================================
// CHECKOUT COMPLETED
// =============================================================================

export async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orgId = session.metadata?.organization_id
  const plan = session.metadata?.plan_tier as PlanTier | undefined
  const billingPeriod = session.metadata?.billing_period as BillingPeriod | undefined

  if (!orgId || !plan) {
    console.error('Missing metadata in checkout session:', session.id)
    return
  }

  // Upsert customer
  if (session.customer && typeof session.customer === 'string') {
    await repo.upsertCustomer(orgId, session.customer, session.customer_email || null)
  }

  // Upsert subscription if available
  if (session.subscription && typeof session.subscription === 'string') {
    const { getStripe } = await import('@/lib/stripe')
    const stripe = getStripe()
    const sub = await stripe.subscriptions.retrieve(session.subscription)

    await repo.upsertSubscription({
      organization_id: orgId,
      stripe_subscription_id: sub.id,
      stripe_price_id: sub.items.data[0]?.price.id || '',
      plan_tier: plan,
      billing_period: billingPeriod || 'monthly',
      status: sub.status as StripeSubscriptionStatus,
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end,
    })
  }

  // Update org
  await updateOrgPlan(orgId, plan, 'active')

  // Log history
  await logSubscriptionHistory(orgId, 'plan_selected', {
    to_plan: plan,
    billing_period: billingPeriod,
    notes: `Plan ${plan} activado via Stripe Checkout`,
  })
}

// =============================================================================
// SUBSCRIPTION UPDATED
// =============================================================================

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const orgId = subscription.metadata?.organization_id
  if (!orgId) {
    console.error('Missing organization_id in subscription metadata:', subscription.id)
    return
  }

  const plan = (subscription.metadata?.plan_tier || 'starter') as PlanTier
  const billingPeriod = (subscription.metadata?.billing_period || 'monthly') as BillingPeriod

  await repo.upsertSubscription({
    organization_id: orgId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: subscription.items.data[0]?.price.id || '',
    plan_tier: plan,
    billing_period: billingPeriod,
    status: subscription.status as StripeSubscriptionStatus,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    cancelled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
  })

  // Update org status based on subscription status
  const statusMap: Record<string, string> = {
    active: 'active',
    trialing: 'trial',
    past_due: 'past_due',
    canceled: 'cancelled',
    unpaid: 'past_due',
  }

  const orgStatus = statusMap[subscription.status] || 'active'
  await updateOrgPlan(orgId, plan, orgStatus)
}

// =============================================================================
// SUBSCRIPTION DELETED
// =============================================================================

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const orgId = subscription.metadata?.organization_id
  if (!orgId) return

  await repo.upsertSubscription({
    organization_id: orgId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: subscription.items.data[0]?.price.id || '',
    plan_tier: (subscription.metadata?.plan_tier || 'starter') as PlanTier,
    billing_period: (subscription.metadata?.billing_period || 'monthly') as BillingPeriod,
    status: 'canceled',
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: false,
    ended_at: new Date().toISOString(),
  })

  // Update org
  const admin = createAdminClient()
  await admin
    .from('organizations')
    .update({
      subscription_status: 'cancelled',
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', orgId)

  await logSubscriptionHistory(orgId, 'plan_changed', {
    notes: 'Suscripción cancelada/expirada',
  })
}

// =============================================================================
// INVOICE PAID
// =============================================================================

export async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
  if (!customerId) return

  // Find org by customer ID
  const admin = createAdminClient()
  const { data: customer } = await admin
    .from('stripe_customers')
    .select('organization_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!customer) return

  await repo.createBillingRecord({
    organization_id: customer.organization_id,
    stripe_invoice_id: invoice.id,
    amount_cents: invoice.amount_paid || 0,
    currency: invoice.currency || 'usd',
    status: 'paid',
    description: invoice.lines?.data?.[0]?.description || 'Pago de suscripción',
    invoice_url: invoice.hosted_invoice_url || null,
    invoice_pdf: invoice.invoice_pdf || null,
    period_start: invoice.lines?.data?.[0]?.period?.start
      ? new Date(invoice.lines.data[0].period.start * 1000).toISOString()
      : null,
    period_end: invoice.lines?.data?.[0]?.period?.end
      ? new Date(invoice.lines.data[0].period.end * 1000).toISOString()
      : null,
    paid_at: invoice.status_transitions?.paid_at
      ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
      : new Date().toISOString(),
  })

  // If org was past_due, mark as active
  await admin
    .from('organizations')
    .update({
      subscription_status: 'active',
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', customer.organization_id)
    .eq('subscription_status', 'past_due')
}

// =============================================================================
// PAYMENT FAILED
// =============================================================================

export async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
  if (!customerId) return

  const admin = createAdminClient()
  const { data: customer } = await admin
    .from('stripe_customers')
    .select('organization_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!customer) return

  await repo.createBillingRecord({
    organization_id: customer.organization_id,
    stripe_invoice_id: invoice.id,
    amount_cents: invoice.amount_due || 0,
    currency: invoice.currency || 'usd',
    status: 'failed',
    description: 'Pago fallido',
    invoice_url: invoice.hosted_invoice_url || null,
    invoice_pdf: invoice.invoice_pdf || null,
  })

  // Mark org as past_due
  await admin
    .from('organizations')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', customer.organization_id)

  await logSubscriptionHistory(customer.organization_id, 'payment_received', {
    notes: 'Pago fallido',
    payment_method: 'stripe',
  })
}
