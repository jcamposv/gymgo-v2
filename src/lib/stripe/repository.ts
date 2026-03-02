import { createAdminClient } from '@/lib/supabase/admin'
import type {
  StripeCustomer,
  StripeSubscription,
  BillingRecord,
  UpsertSubscriptionData,
  CreateBillingRecordData,
} from './types'

const admin = () => createAdminClient()

// =============================================================================
// CUSTOMERS
// =============================================================================

export async function findCustomerByOrgId(orgId: string): Promise<StripeCustomer | null> {
  const { data } = await admin()
    .from('stripe_customers')
    .select('*')
    .eq('organization_id', orgId)
    .single()
  return data as StripeCustomer | null
}

export async function upsertCustomer(
  orgId: string,
  stripeCustomerId: string,
  email: string | null
): Promise<StripeCustomer> {
  const { data, error } = await admin()
    .from('stripe_customers')
    .upsert(
      {
        organization_id: orgId,
        stripe_customer_id: stripeCustomerId,
        stripe_email: email,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id' }
    )
    .select()
    .single()

  if (error) throw new Error(`Failed to upsert customer: ${error.message}`)
  return data as StripeCustomer
}

// =============================================================================
// SUBSCRIPTIONS
// =============================================================================

export async function findSubscriptionByOrgId(orgId: string): Promise<StripeSubscription | null> {
  const { data } = await admin()
    .from('stripe_subscriptions')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return data as StripeSubscription | null
}

export async function findSubscriptionByStripeId(stripeSubId: string): Promise<StripeSubscription | null> {
  const { data } = await admin()
    .from('stripe_subscriptions')
    .select('*')
    .eq('stripe_subscription_id', stripeSubId)
    .single()
  return data as StripeSubscription | null
}

export async function upsertSubscription(input: UpsertSubscriptionData): Promise<StripeSubscription> {
  const { data, error } = await admin()
    .from('stripe_subscriptions')
    .upsert(
      {
        ...input,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'stripe_subscription_id' }
    )
    .select()
    .single()

  if (error) throw new Error(`Failed to upsert subscription: ${error.message}`)
  return data as StripeSubscription
}

// =============================================================================
// BILLING HISTORY
// =============================================================================

export async function createBillingRecord(input: CreateBillingRecordData): Promise<BillingRecord> {
  const { data, error } = await admin()
    .from('billing_history')
    .insert(input)
    .select()
    .single()

  if (error) throw new Error(`Failed to create billing record: ${error.message}`)
  return data as BillingRecord
}

export async function getBillingHistory(
  orgId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ records: BillingRecord[]; total: number }> {
  const offset = (page - 1) * limit

  const { data, error, count } = await admin()
    .from('billing_history')
    .select('*', { count: 'exact' })
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw new Error(`Failed to get billing history: ${error.message}`)
  return { records: (data || []) as BillingRecord[], total: count || 0 }
}
