'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { type PlanTier, PLAN_LIMITS } from '@/lib/pricing.config'

// =============================================================================
// TYPES
// =============================================================================

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled' | 'disabled'

export interface SelectPlanInput {
  plan: PlanTier
  billingPeriod: 'monthly' | 'yearly'
}

export interface ActionResult {
  success: boolean
  message: string
  data?: unknown
}

export interface SubscriptionInfo {
  plan: PlanTier
  status: SubscriptionStatus
  billingPeriod: 'monthly' | 'yearly'
  trialEndsAt: string | null
  isActive: boolean
  daysLeftInTrial: number | null
}

// =============================================================================
// SELECT SUBSCRIPTION PLAN
// Called after onboarding to set the user's chosen plan
// =============================================================================

export async function selectSubscriptionPlan(input: SelectPlanInput): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: 'No autenticado' }
  }

  // Get user's organization
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return { success: false, message: 'No se encontró la organización' }
  }

  // Only owner can select plan
  if (profile.role !== 'owner') {
    return { success: false, message: 'Solo el propietario puede seleccionar el plan' }
  }

  // Get plan limits
  const planLimits = PLAN_LIMITS[input.plan]

  // Update organization with selected plan (using only original fields)
  const { error } = await supabase
    .from('organizations')
    .update({
      subscription_plan: input.plan,
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
    .eq('id', profile.organization_id)

  if (error) {
    console.error('Error updating subscription:', error)
    return { success: false, message: 'Error al actualizar el plan: ' + error.message }
  }

  // Note: trial_ends_at, subscription_status, billing_period will be added
  // once PostgREST schema cache updates

  revalidatePath('/', 'layout')

  return {
    success: true,
    message: 'Plan seleccionado exitosamente',
    data: { plan: input.plan }
  }
}

// =============================================================================
// GET SUBSCRIPTION INFO
// =============================================================================

export async function getSubscriptionInfo(): Promise<{
  data: SubscriptionInfo | null
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'No autenticado' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return { data: null, error: 'No se encontró la organización' }
  }

  const { data: org, error } = await supabase
    .from('organizations')
    .select('subscription_plan')
    .eq('id', profile.organization_id)
    .single()

  if (error || !org) {
    return { data: null, error: error?.message || 'Organización no encontrada' }
  }

  return {
    data: {
      plan: (org.subscription_plan || 'starter') as PlanTier,
      status: 'trial' as SubscriptionStatus, // Default to trial for now
      billingPeriod: 'monthly' as 'monthly' | 'yearly',
      trialEndsAt: null,
      isActive: true,
      daysLeftInTrial: 90, // Default 90 days
    },
    error: null
  }
}

// =============================================================================
// CHECK IF ORG IS ACTIVE
// Used by middleware to block access if disabled
// =============================================================================

export async function checkOrgActive(): Promise<{
  isActive: boolean
  status: SubscriptionStatus | null
  message: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { isActive: false, status: null, message: 'No autenticado' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    // No org yet = onboarding needed, not a blocking issue
    return { isActive: true, status: null, message: null }
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('subscription_plan')
    .eq('id', profile.organization_id)
    .single()

  if (!org) {
    return { isActive: false, status: null, message: 'Organización no encontrada' }
  }

  // For now, all orgs are active (until schema cache updates)
  return { isActive: true, status: 'trial', message: null }
}

// =============================================================================
// ADMIN: DISABLE ORGANIZATION
// =============================================================================

export async function disableOrganization(
  orgId: string,
  reason: string = 'No se realizó el pago después del período de prueba'
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: 'No autenticado' }
  }

  // For now, only allow service role or specific admin logic
  // In production, add proper admin role check

  const { error } = await supabase
    .from('organizations')
    .update({
      is_active: false,
      subscription_status: 'disabled',
      disabled_at: new Date().toISOString(),
      disabled_reason: reason,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', orgId)

  if (error) {
    return { success: false, message: 'Error al deshabilitar: ' + error.message }
  }

  // Log to history
  await supabase.from('subscription_history').insert({
    organization_id: orgId,
    event_type: 'disabled',
    notes: reason,
    created_by: user.id,
  } as never)

  return { success: true, message: 'Organización deshabilitada' }
}

// =============================================================================
// ADMIN: ENABLE ORGANIZATION (after payment)
// =============================================================================

export async function enableOrganization(
  orgId: string,
  paymentInfo?: {
    amountUsd: number
    paymentMethod: string
    paymentReference?: string
  }
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: 'No autenticado' }
  }

  const { error } = await supabase
    .from('organizations')
    .update({
      is_active: true,
      subscription_status: 'active',
      subscription_started_at: new Date().toISOString(),
      disabled_at: null,
      disabled_reason: null,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', orgId)

  if (error) {
    return { success: false, message: 'Error al habilitar: ' + error.message }
  }

  // Log payment if provided
  if (paymentInfo) {
    await supabase.from('subscription_history').insert({
      organization_id: orgId,
      event_type: 'payment_received',
      amount_usd: paymentInfo.amountUsd,
      payment_method: paymentInfo.paymentMethod,
      payment_reference: paymentInfo.paymentReference,
      notes: `Pago recibido: $${paymentInfo.amountUsd} USD`,
      created_by: user.id,
    } as never)
  }

  // Log enable event
  await supabase.from('subscription_history').insert({
    organization_id: orgId,
    event_type: 'enabled',
    notes: 'Organización habilitada después de pago',
    created_by: user.id,
  } as never)

  revalidatePath('/', 'layout')

  return { success: true, message: 'Organización habilitada exitosamente' }
}

// =============================================================================
// CHANGE PLAN
// =============================================================================

export async function changePlan(
  newPlan: PlanTier,
  newBillingPeriod?: 'monthly' | 'yearly'
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: 'No autenticado' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return { success: false, message: 'No se encontró la organización' }
  }

  if (profile.role !== 'owner') {
    return { success: false, message: 'Solo el propietario puede cambiar el plan' }
  }

  // Get current plan
  const { data: currentOrg } = await supabase
    .from('organizations')
    .select('subscription_plan, billing_period')
    .eq('id', profile.organization_id)
    .single()

  const planLimits = PLAN_LIMITS[newPlan]

  const updateData: Record<string, unknown> = {
    subscription_plan: newPlan,
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
  }

  if (newBillingPeriod) {
    updateData.billing_period = newBillingPeriod
  }

  const { error } = await supabase
    .from('organizations')
    .update(updateData as never)
    .eq('id', profile.organization_id)

  if (error) {
    return { success: false, message: 'Error al cambiar el plan: ' + error.message }
  }

  // Log to history
  await supabase.from('subscription_history').insert({
    organization_id: profile.organization_id,
    event_type: 'plan_changed',
    from_plan: currentOrg?.subscription_plan,
    to_plan: newPlan,
    billing_period: newBillingPeriod || currentOrg?.billing_period,
    notes: `Plan cambiado de ${currentOrg?.subscription_plan || 'ninguno'} a ${newPlan}`,
    created_by: user.id,
  } as never)

  revalidatePath('/', 'layout')

  return { success: true, message: 'Plan actualizado exitosamente' }
}
