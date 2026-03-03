'use server'

import { createClient } from '@/lib/supabase/server'
import * as StripeService from '@/lib/stripe/service'
import * as StripeRepo from '@/lib/stripe/repository'
import { checkoutSessionSchema, updateSubscriptionSchema, type CheckoutSessionInput, type UpdateSubscriptionInput } from '@/schemas/billing.schema'
import { isBillablePlan } from '@/lib/stripe/config'

interface ActionResult<T = unknown> {
  success: boolean
  message: string
  data?: T
}

// =============================================================================
// HELPERS
// =============================================================================

type OwnerContext = {
  user: { id: string; email?: string }
  orgId: string
  orgName: string
}

async function getOwnerContext(): Promise<{ ctx?: OwnerContext; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return { error: 'No se encontró la organización' }
  if (profile.role !== 'owner') return { error: 'Solo el propietario puede gestionar la facturación' }

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, subscription_plan')
    .eq('id', profile.organization_id)
    .single()

  if (!org) return { error: 'Organización no encontrada' }

  return { ctx: { user: { id: user.id, email: user.email }, orgId: org.id, orgName: org.name || 'GymGo Organization' } }
}

// =============================================================================
// CREATE CHECKOUT SESSION
// =============================================================================

export async function createCheckoutSession(
  input: CheckoutSessionInput
): Promise<ActionResult<{ checkoutUrl: string }>> {
  const parsed = checkoutSessionSchema.safeParse(input)
  if (!parsed.success) return { success: false, message: 'Datos inválidos' }

  const { ctx, error } = await getOwnerContext()
  if (!ctx) return { success: false, message: error || 'Error de autenticación' }

  const { plan, billingPeriod } = parsed.data

  if (!isBillablePlan(plan)) {
    return { success: false, message: 'Este plan no requiere pago' }
  }

  try {
    const checkoutUrl = await StripeService.createCheckoutSession({
      orgId: ctx.orgId,
      plan,
      interval: billingPeriod,
      email: ctx.user.email || '',
      orgName: ctx.orgName,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.gymgo.io'}/dashboard/billing/success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.gymgo.io'}/dashboard`,
    })

    return { success: true, message: 'Sesión de checkout creada', data: { checkoutUrl } }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
    console.error('Error creating checkout session:', errorMsg, err)
    return { success: false, message: `Error al crear la sesión de pago: ${errorMsg}` }
  }
}

// =============================================================================
// CANCEL SUBSCRIPTION
// =============================================================================

export async function cancelSubscription(): Promise<ActionResult> {
  const { ctx, error } = await getOwnerContext()
  if (!ctx) return { success: false, message: error || 'Error de autenticación' }

  try {
    await StripeService.cancelSubscription(ctx.orgId)
    return { success: true, message: 'Suscripción se cancelará al final del período' }
  } catch (err) {
    console.error('Error cancelling subscription:', err)
    return { success: false, message: 'Error al cancelar la suscripción' }
  }
}

// =============================================================================
// RESUME SUBSCRIPTION
// =============================================================================

export async function resumeSubscription(): Promise<ActionResult> {
  const { ctx, error } = await getOwnerContext()
  if (!ctx) return { success: false, message: error || 'Error de autenticación' }

  try {
    await StripeService.resumeSubscription(ctx.orgId)
    return { success: true, message: 'Suscripción reactivada exitosamente' }
  } catch (err) {
    console.error('Error resuming subscription:', err)
    return { success: false, message: 'Error al reactivar la suscripción' }
  }
}

// =============================================================================
// UPDATE SUBSCRIPTION (upgrade/downgrade)
// =============================================================================

export async function updateSubscription(
  input: UpdateSubscriptionInput
): Promise<ActionResult> {
  const parsed = updateSubscriptionSchema.safeParse(input)
  if (!parsed.success) return { success: false, message: 'Datos inválidos' }

  const { ctx, error } = await getOwnerContext()
  if (!ctx) return { success: false, message: error || 'Error de autenticación' }

  try {
    await StripeService.changeSubscription(ctx.orgId, parsed.data.plan, parsed.data.billingPeriod)
    return { success: true, message: 'Plan actualizado exitosamente' }
  } catch (err) {
    console.error('Error updating subscription:', err)
    return { success: false, message: 'Error al actualizar el plan' }
  }
}

// =============================================================================
// GET CUSTOMER PORTAL URL
// =============================================================================

export async function getCustomerPortalUrl(): Promise<ActionResult<{ portalUrl: string }>> {
  const { ctx, error } = await getOwnerContext()
  if (!ctx) return { success: false, message: error || 'Error de autenticación' }

  try {
    const portalUrl = await StripeService.createPortalSession(
      ctx.orgId,
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.gymgo.io'}/dashboard/billing`
    )
    return { success: true, message: 'URL del portal generada', data: { portalUrl } }
  } catch (err) {
    console.error('Error creating portal session:', err)
    return { success: false, message: 'Error al acceder al portal de facturación' }
  }
}

// =============================================================================
// GET BILLING INFO
// =============================================================================

export async function getBillingInfo(): Promise<ActionResult<{
  subscription: Awaited<ReturnType<typeof StripeRepo.findSubscriptionByOrgId>>
  billingHistory: Awaited<ReturnType<typeof StripeRepo.getBillingHistory>>
}>> {
  const { ctx, error } = await getOwnerContext()
  if (!ctx) return { success: false, message: error || 'Error de autenticación' }

  try {
    const [subscription, billingHistory] = await Promise.all([
      StripeRepo.findSubscriptionByOrgId(ctx.orgId),
      StripeRepo.getBillingHistory(ctx.orgId),
    ])

    return {
      success: true,
      message: 'Información de facturación obtenida',
      data: { subscription, billingHistory },
    }
  } catch (err) {
    console.error('Error getting billing info:', err)
    return { success: false, message: 'Error al obtener información de facturación' }
  }
}
