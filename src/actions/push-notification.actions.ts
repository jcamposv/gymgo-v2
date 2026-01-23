'use server'

/**
 * Push Notification Server Actions
 *
 * Handles push notification sending with plan-based limits.
 * Note: Actual push notification infrastructure (FCM, Web Push, etc.)
 * should be implemented separately. These actions handle the limit enforcement.
 */

import { requirePermission } from '@/lib/auth/server-auth'
import {
  checkPushNotificationLimit,
  consumePushNotification,
  PLAN_LIMIT_ERROR_CODE,
} from '@/lib/plan-limits'

// =============================================================================
// TYPES
// =============================================================================

interface ActionResult {
  success: boolean
  message: string
  errors?: Record<string, string[]>
  data?: unknown
}

interface PushNotificationUsage {
  current: number
  limit: number
  remaining: number
  resetDate?: string
  isUnlimited: boolean
}

// =============================================================================
// CHECK PUSH NOTIFICATION LIMIT
// =============================================================================

export async function checkOrgPushNotificationLimit(): Promise<{
  allowed: boolean
  current: number
  limit: number
  remaining: number
  resetDate?: string
  message?: string
}> {
  const { authorized, user } = await requirePermission('manage_members')

  if (!authorized || !user) {
    return { allowed: false, current: 0, limit: 0, remaining: 0, message: 'No autorizado' }
  }

  const result = await checkPushNotificationLimit(user.organizationId)

  const remaining = result.limit === -1 ? -1 : Math.max(0, result.limit - result.current)

  return {
    allowed: result.allowed,
    current: result.current,
    limit: result.limit,
    remaining,
    resetDate: result.resetDate,
    message: result.message,
  }
}

// =============================================================================
// GET PUSH NOTIFICATION USAGE
// =============================================================================

export async function getPushNotificationUsage(): Promise<PushNotificationUsage> {
  const { authorized, user } = await requirePermission('manage_members')

  if (!authorized || !user) {
    return { current: 0, limit: 0, remaining: 0, isUnlimited: false }
  }

  const result = await checkPushNotificationLimit(user.organizationId)

  return {
    current: result.current,
    limit: result.limit,
    remaining: result.limit === -1 ? -1 : Math.max(0, result.limit - result.current),
    resetDate: result.resetDate,
    isUnlimited: result.limit === -1,
  }
}

// =============================================================================
// CONSUME PUSH NOTIFICATION
// Call this after successfully sending a push notification
// =============================================================================

export async function trackPushNotificationSent(
  count: number = 1
): Promise<ActionResult> {
  const { authorized, user } = await requirePermission('manage_members')

  if (!authorized || !user) {
    return { success: false, message: 'No autorizado' }
  }

  // First check if we have remaining quota
  const limitCheck = await checkPushNotificationLimit(user.organizationId)
  if (!limitCheck.allowed) {
    return {
      success: false,
      message: limitCheck.message || 'Límite de notificaciones push alcanzado',
      errors: {
        [PLAN_LIMIT_ERROR_CODE]: [limitCheck.message || 'Límite de notificaciones push alcanzado'],
      },
    }
  }

  // Consume the notification quota
  const result = await consumePushNotification(user.organizationId, count)

  if (!result.success) {
    return {
      success: false,
      message: 'Error al registrar notificación',
    }
  }

  return {
    success: true,
    message: 'Notificación enviada',
    data: { remaining: result.remaining },
  }
}

// =============================================================================
// VALIDATE BEFORE SENDING (Pre-check)
// Use this before attempting to send push notifications
// =============================================================================

export async function canSendPushNotification(
  count: number = 1
): Promise<{
  allowed: boolean
  remaining: number
  message?: string
}> {
  const { authorized, user } = await requirePermission('manage_members')

  if (!authorized || !user) {
    return { allowed: false, remaining: 0, message: 'No autorizado' }
  }

  const limitCheck = await checkPushNotificationLimit(user.organizationId)

  if (!limitCheck.allowed) {
    return {
      allowed: false,
      remaining: 0,
      message: limitCheck.message,
    }
  }

  const remaining = limitCheck.limit === -1 ? -1 : Math.max(0, limitCheck.limit - limitCheck.current)

  // Check if we have enough quota for the requested count
  if (remaining !== -1 && remaining < count) {
    return {
      allowed: false,
      remaining,
      message: `Solo quedan ${remaining} notificaciones disponibles este mes`,
    }
  }

  return {
    allowed: true,
    remaining,
  }
}
