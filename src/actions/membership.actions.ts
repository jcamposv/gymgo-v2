'use server'

/**
 * Membership Payment Actions
 *
 * Server actions for managing manual membership payments,
 * membership status, and expiration enforcement.
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  requirePermission,
  requireAnyPermission,
  type ActionResult,
  successResult,
  errorResult,
  forbiddenResult,
  unauthorizedResult,
} from '@/lib/auth/server-auth'
import { z } from 'zod'
import type { Tables } from '@/types/database.types'

// =============================================================================
// TYPES
// =============================================================================

export type PaymentPeriodType =
  | 'monthly'
  | 'bimonthly'
  | 'quarterly'
  | 'semiannual'
  | 'annual'
  | 'custom'

export interface MembershipPayment {
  id: string
  organization_id: string
  member_id: string
  plan_id: string | null
  amount: number
  currency: string
  payment_method: string
  reference_number: string | null
  period_type: PaymentPeriodType
  period_months: number
  period_start_date: string
  period_end_date: string
  notes: string | null
  created_by: string | null
  location_id: string | null
  created_at: string
  // Joined fields
  member?: {
    id: string
    full_name: string
    email: string
  }
  plan?: {
    id: string
    name: string
    price: number
  }
  created_by_profile?: {
    full_name: string
  }
  location?: {
    id: string
    name: string
  }
}

export interface MembershipStatus {
  status: 'active' | 'expiring_soon' | 'expired' | 'no_membership'
  days_remaining: number | null
  end_date: string | null
  plan_name: string | null
  is_expiring_soon: boolean
  last_payment_date: string | null
  last_payment_amount: number | null
}

export interface MembershipValidation {
  can_book: boolean
  error_code: string | null
  error_message: string | null
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const PERIOD_MONTHS: Record<PaymentPeriodType, number> = {
  monthly: 1,
  bimonthly: 2,
  quarterly: 3,
  semiannual: 6,
  annual: 12,
  custom: 1, // Will be overridden
}

const membershipPaymentSchema = z.object({
  member_id: z.string().uuid('ID de miembro inválido'),
  plan_id: z.string().uuid('ID de plan inválido').optional().nullable(),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  currency: z.string().min(3).max(3).default('MXN'),
  payment_method: z.enum(['cash', 'card', 'transfer', 'sinpe', 'other']).default('cash'),
  reference_number: z.string().max(100).optional().nullable(),
  period_type: z.enum(['monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual', 'custom']),
  period_months: z.number().int().min(1).max(36).optional(),
  start_date: z.string().optional(), // If not provided, uses current membership end or today
  notes: z.string().max(500).optional().nullable(),
  location_id: z.string().uuid().optional().nullable(),
})

export type MembershipPaymentFormData = z.infer<typeof membershipPaymentSchema>

// =============================================================================
// REGISTER MEMBERSHIP PAYMENT
// =============================================================================

/**
 * Register a manual membership payment and extend member's membership.
 * Can only be done by staff with finance permissions.
 */
export async function registerMembershipPayment(
  data: MembershipPaymentFormData
): Promise<ActionResult<MembershipPayment>> {
  const { authorized, user, error } = await requirePermission('manage_gym_finances')

  if (!authorized) {
    return (user ? forbiddenResult() : unauthorizedResult(error || undefined)) as ActionResult<MembershipPayment>
  }

  // Validate input
  const validated = membershipPaymentSchema.safeParse(data)
  if (!validated.success) {
    return errorResult('Datos inválidos', validated.error.flatten().fieldErrors) as ActionResult<MembershipPayment>
  }

  const supabase = await createClient()

  // Get member's current membership info
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id, membership_start_date, membership_end_date, membership_status, current_plan_id')
    .eq('id', validated.data.member_id)
    .eq('organization_id', user!.organizationId)
    .single()

  if (memberError || !member) {
    return errorResult('Miembro no encontrado') as ActionResult<MembershipPayment>
  }

  // Calculate period months
  let periodMonths = validated.data.period_months
  if (validated.data.period_type !== 'custom') {
    periodMonths = PERIOD_MONTHS[validated.data.period_type]
  }
  if (!periodMonths || periodMonths < 1) {
    return errorResult('Período inválido') as ActionResult<MembershipPayment>
  }

  // Calculate start date
  // If member has active membership, start from end_date
  // Otherwise start from today or provided start_date
  const today = new Date().toISOString().split('T')[0]
  let startDate: string

  if (validated.data.start_date) {
    startDate = validated.data.start_date
  } else if (member.membership_end_date && member.membership_end_date >= today) {
    // Extend from current end date
    startDate = member.membership_end_date
  } else {
    // New membership or expired, start from today
    startDate = today
  }

  // Calculate end date using database function
  const { data: endDateResult, error: endDateError } = await supabase
    .rpc('calculate_membership_end_date', {
      p_start_date: startDate,
      p_period_months: periodMonths,
    })

  if (endDateError || !endDateResult) {
    console.error('Error calculating end date:', endDateError)
    return errorResult('Error al calcular fecha de fin') as ActionResult<MembershipPayment>
  }

  const endDate = endDateResult

  // Insert payment record
  const paymentData = {
    organization_id: user!.organizationId,
    member_id: validated.data.member_id,
    plan_id: validated.data.plan_id || member.current_plan_id,
    amount: validated.data.amount,
    currency: validated.data.currency,
    payment_method: validated.data.payment_method,
    reference_number: validated.data.reference_number,
    period_type: validated.data.period_type,
    period_months: periodMonths,
    period_start_date: startDate,
    period_end_date: endDate,
    notes: validated.data.notes,
    created_by: user!.id,
    location_id: validated.data.location_id,
  }

  const { data: payment, error: paymentError } = await supabase
    .from('membership_payments')
    .insert(paymentData)
    .select(`
      *,
      member:members(id, full_name, email),
      plan:membership_plans(id, name, price),
      created_by_profile:profiles!membership_payments_created_by_fkey(full_name),
      location:locations(id, name)
    `)
    .single()

  if (paymentError) {
    console.error('Error creating payment:', paymentError)
    return errorResult('Error al registrar el pago: ' + paymentError.message) as ActionResult<MembershipPayment>
  }

  // Update member's membership dates
  // Note: We update directly since RPC types don't support null properly
  const { error: updateError } = await supabase
    .from('members')
    .update({
      current_plan_id: validated.data.plan_id || member.current_plan_id,
      membership_start_date: member.membership_end_date && member.membership_end_date >= today
        ? member.membership_start_date // Keep existing start if extending
        : startDate, // New membership
      membership_end_date: endDate,
      membership_status: 'active',
    })
    .eq('id', validated.data.member_id)

  if (updateError) {
    console.error('Error updating member membership:', updateError)
    // Payment was created, but membership update failed
    // Log but don't fail the request
  }

  revalidatePath('/dashboard/finances')
  revalidatePath('/dashboard/members')
  revalidatePath(`/dashboard/members/${validated.data.member_id}`)

  return successResult('Pago registrado exitosamente', payment as MembershipPayment)
}

// =============================================================================
// GET MEMBERSHIP PAYMENTS
// =============================================================================

export interface GetMembershipPaymentsParams {
  member_id?: string
  page?: number
  per_page?: number
  from_date?: string
  to_date?: string
}

/**
 * Get membership payments with filtering and pagination.
 */
export async function getMembershipPayments(
  params?: GetMembershipPaymentsParams
): Promise<{
  data: MembershipPayment[] | null
  count: number
  error: string | null
}> {
  const { authorized, user, error } = await requireAnyPermission(['view_gym_finances', 'manage_gym_finances'])

  if (!authorized || !user) {
    return { data: null, count: 0, error: error || 'No autorizado' }
  }

  const page = params?.page ?? 1
  const perPage = params?.per_page ?? 20
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const supabase = await createClient()

  let query = supabase
    .from('membership_payments')
    .select(`
      *,
      member:members(id, full_name, email),
      plan:membership_plans(id, name, price),
      created_by_profile:profiles!membership_payments_created_by_fkey(full_name),
      location:locations(id, name)
    `, { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (params?.member_id) {
    query = query.eq('member_id', params.member_id)
  }

  if (params?.from_date) {
    query = query.gte('period_start_date', params.from_date)
  }

  if (params?.to_date) {
    query = query.lte('period_start_date', params.to_date)
  }

  const { data, count, error: dbError } = await query

  if (dbError) {
    return { data: null, count: 0, error: dbError.message }
  }

  return { data: data as MembershipPayment[], count: count ?? 0, error: null }
}

// =============================================================================
// GET MEMBER MEMBERSHIP STATUS
// =============================================================================

/**
 * Get detailed membership status for a member.
 */
export async function getMemberMembershipStatus(
  memberId: string
): Promise<ActionResult<MembershipStatus>> {
  const { authorized, user, error } = await requireAnyPermission(['view_members', 'manage_members', 'view_gym_finances'])

  if (!authorized || !user) {
    return errorResult(error || 'No autorizado') as ActionResult<MembershipStatus>
  }

  const supabase = await createClient()

  // Verify member belongs to organization
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id')
    .eq('id', memberId)
    .eq('organization_id', user.organizationId)
    .single()

  if (memberError || !member) {
    return errorResult('Miembro no encontrado') as ActionResult<MembershipStatus>
  }

  // Use database function to get status
  const { data, error: statusError } = await supabase
    .rpc('get_membership_status', { p_member_id: memberId })
    .single()

  if (statusError) {
    console.error('Error getting membership status:', statusError)
    return errorResult('Error al obtener estado de membresía') as ActionResult<MembershipStatus>
  }

  return successResult('Estado obtenido', data as MembershipStatus)
}

// =============================================================================
// VALIDATE MEMBER FOR BOOKING
// =============================================================================

/**
 * Validate if a member can book a class (membership check).
 * Used by booking actions to enforce membership rules.
 */
export async function validateMemberForBooking(
  memberId: string,
  classStartTime?: string
): Promise<MembershipValidation> {
  const supabase = await createClient()

  // Get user's organization
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { can_book: false, error_code: 'NOT_AUTHENTICATED', error_message: 'No autenticado' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return { can_book: false, error_code: 'NO_ORGANIZATION', error_message: 'Sin organización' }
  }

  // Use database function for validation
  const { data, error } = await supabase
    .rpc('validate_member_for_booking', {
      p_member_id: memberId,
      p_organization_id: profile.organization_id,
      p_class_start_time: classStartTime ?? undefined,
    })
    .single()

  if (error) {
    console.error('Error validating member for booking:', error)
    return { can_book: false, error_code: 'VALIDATION_ERROR', error_message: 'Error de validación' }
  }

  return data as MembershipValidation
}

// =============================================================================
// GET MY MEMBERSHIP STATUS (for members)
// =============================================================================

/**
 * Get the current user's membership status (member view).
 */
export async function getMyMembershipStatus(): Promise<ActionResult<MembershipStatus & { member_id: string }>> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return errorResult('No autenticado') as ActionResult<MembershipStatus & { member_id: string }>
  }

  // Get profile and organization
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id, email')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.organization_id) {
    return errorResult('Perfil no encontrado') as ActionResult<MembershipStatus & { member_id: string }>
  }

  // Get member record
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .eq('email', profile.email)
    .single()

  if (memberError || !member) {
    return errorResult('No tienes un perfil de miembro') as ActionResult<MembershipStatus & { member_id: string }>
  }

  // Get membership status
  const { data, error: statusError } = await supabase
    .rpc('get_membership_status', { p_member_id: member.id })
    .single()

  if (statusError) {
    return errorResult('Error al obtener estado') as ActionResult<MembershipStatus & { member_id: string }>
  }

  return successResult('Estado obtenido', { ...data, member_id: member.id } as MembershipStatus & { member_id: string })
}

// =============================================================================
// GET MY PAYMENT HISTORY (for members)
// =============================================================================

/**
 * Get the current user's payment history (member view).
 */
export async function getMyPaymentHistory(
  limit = 10
): Promise<{
  data: MembershipPayment[] | null
  error: string | null
}> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { data: null, error: 'No autenticado' }
  }

  // Get profile and organization
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id, email')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.organization_id) {
    return { data: null, error: 'Perfil no encontrado' }
  }

  // Get member record
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .eq('email', profile.email)
    .single()

  if (memberError || !member) {
    return { data: null, error: null } // Not an error, just no member
  }

  // Get payments
  const { data: payments, error: paymentsError } = await supabase
    .from('membership_payments')
    .select(`
      *,
      plan:membership_plans(id, name, price)
    `)
    .eq('member_id', member.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (paymentsError) {
    return { data: null, error: paymentsError.message }
  }

  return { data: payments as MembershipPayment[], error: null }
}

// =============================================================================
// DELETE MEMBERSHIP PAYMENT
// =============================================================================

/**
 * Delete a membership payment (admin only).
 * Note: This doesn't automatically adjust membership dates.
 */
export async function deleteMembershipPayment(
  paymentId: string
): Promise<ActionResult> {
  const { authorized, user, error } = await requirePermission('manage_gym_finances')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  const supabase = await createClient()

  const { error: deleteError } = await supabase
    .from('membership_payments')
    .delete()
    .eq('id', paymentId)
    .eq('organization_id', user!.organizationId)

  if (deleteError) {
    return errorResult('Error al eliminar el pago: ' + deleteError.message)
  }

  revalidatePath('/dashboard/finances')
  return successResult('Pago eliminado exitosamente')
}

// =============================================================================
// GET EXPIRING MEMBERSHIPS
// =============================================================================

/**
 * Get members with memberships expiring soon (for notifications/dashboard).
 */
export async function getExpiringMemberships(
  daysAhead = 7
): Promise<{
  data: Array<{
    member_id: string
    full_name: string
    email: string
    end_date: string
    days_remaining: number
    plan_name: string | null
  }> | null
  error: string | null
}> {
  const { authorized, user, error } = await requireAnyPermission(['view_members', 'manage_members'])

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + daysAhead)
  const futureDateStr = futureDate.toISOString().split('T')[0]

  const { data, error: dbError } = await supabase
    .from('members')
    .select(`
      id,
      full_name,
      email,
      membership_end_date,
      membership_plans(name)
    `)
    .eq('organization_id', user.organizationId)
    .eq('membership_status', 'active')
    .gte('membership_end_date', today)
    .lte('membership_end_date', futureDateStr)
    .order('membership_end_date', { ascending: true })

  if (dbError) {
    return { data: null, error: dbError.message }
  }

  const result = (data || []).map((m) => {
    const endDate = new Date(m.membership_end_date!)
    const todayDate = new Date(today)
    const daysRemaining = Math.ceil((endDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24))

    return {
      member_id: m.id,
      full_name: m.full_name,
      email: m.email,
      end_date: m.membership_end_date!,
      days_remaining: daysRemaining,
      plan_name: (m.membership_plans as { name: string } | null)?.name || null,
    }
  })

  return { data: result, error: null }
}

// =============================================================================
// BATCH EXPIRE MEMBERSHIPS
// =============================================================================

/**
 * Batch expire memberships that have passed their end date.
 * Should be called by a cron job daily.
 */
export async function batchExpireMemberships(): Promise<ActionResult<{ expired_count: number }>> {
  // This should only be called by system/cron, not by users
  // For now, require admin permission
  const { authorized, user, error } = await requirePermission('manage_gym_settings')

  if (!authorized) {
    return (user ? forbiddenResult() : unauthorizedResult(error || undefined)) as ActionResult<{ expired_count: number }>
  }

  const supabase = await createClient()

  const { data, error: expireError } = await supabase.rpc('expire_memberships')

  if (expireError) {
    return errorResult('Error al expirar membresías: ' + expireError.message) as ActionResult<{ expired_count: number }>
  }

  revalidatePath('/dashboard/members')
  return successResult(`${data} membresías expiradas`, { expired_count: data })
}

// =============================================================================
// BATCH EXPIRE WITH NOTIFICATIONS (Enhanced for cron)
// =============================================================================

export interface BatchExpireResult {
  expired_count: number
  notifications_queued: number
  notifications_sent: number
  notifications_failed: number
  errors: string[]
}

/**
 * Batch expire memberships AND send notifications.
 * This is the main cron job function.
 *
 * Can be called:
 * 1. Via cron API route with CRON_SECRET
 * 2. Manually by admin with proper permissions
 */
export async function batchExpireMembershipsWithNotifications(
  options?: { cronSecret?: string }
): Promise<ActionResult<BatchExpireResult>> {
  // Allow cron job to bypass auth check with secret
  const cronSecret = options?.cronSecret
  const expectedSecret = process.env.CRON_SECRET

  if (cronSecret && cronSecret === expectedSecret) {
    // Called from cron - proceed without auth check
    console.log('[batchExpireMembershipsWithNotifications] Called from cron job')
  } else {
    // Called from user - require permission
    const { authorized, user, error } = await requirePermission('manage_gym_settings')
    if (!authorized) {
      return (user ? forbiddenResult() : unauthorizedResult(error || undefined)) as ActionResult<BatchExpireResult>
    }
  }

  try {
    // Import dynamically to avoid circular dependencies
    const { processMembershipExpirations } = await import('@/lib/notifications/membership-notifications')

    const result = await processMembershipExpirations()

    revalidatePath('/dashboard/members')

    return successResult(
      `Procesado: ${result.expiredCount} expiradas, ${result.notificationsSent} notificaciones enviadas`,
      {
        expired_count: result.expiredCount,
        notifications_queued: result.notificationsQueued,
        notifications_sent: result.notificationsSent,
        notifications_failed: result.notificationsFailed,
        errors: result.errors,
      }
    )
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
    return errorResult(`Error en batch expire: ${errorMessage}`) as ActionResult<BatchExpireResult>
  }
}

// =============================================================================
// GET NOTIFICATION STATS (for dashboard)
// =============================================================================

/**
 * Get notification statistics for the current organization.
 */
export async function getMembershipNotificationStats(): Promise<{
  data: {
    sent: number
    failed: number
    queued: number
    byChannel: { email: number; whatsapp: number }
    byType: Record<string, number>
  } | null
  error: string | null
}> {
  const { authorized, user, error } = await requireAnyPermission(['view_members', 'manage_members'])

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  try {
    const { getNotificationStats } = await import('@/lib/notifications/membership-notifications')
    const stats = await getNotificationStats(user.organizationId)
    return { data: stats, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Error' }
  }
}
