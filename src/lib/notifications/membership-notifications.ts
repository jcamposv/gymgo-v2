/**
 * Membership Expiration Notification Service
 *
 * Handles sending Email and WhatsApp notifications for membership expirations.
 * Uses idempotency keys to prevent duplicate notifications.
 */

import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { resend, emailConfig } from '@/lib/email/resend'
import {
  getMembershipEmailSubject,
  getMembershipExpirationEmailHtml,
  getMembershipExpirationEmailText,
  type MembershipEmailData,
} from '@/lib/email/templates/membership'
import { messagingService, isMessagingConfigured } from '@/lib/messaging'
import { checkEmailLimit, consumeEmail } from '@/lib/plan-limits'

// =============================================================================
// TYPES
// =============================================================================

export type MembershipNotificationType =
  | 'expires_in_3_days'
  | 'expires_in_1_day'
  | 'expires_today'
  | 'expired'

export type NotificationChannel = 'email' | 'whatsapp' | 'push'

export interface QueuedNotification {
  id: string
  organization_id: string
  member_id: string
  notification_type: MembershipNotificationType
  channel: NotificationChannel
  recipient_email: string | null
  recipient_phone: string | null
  membership_end_date: string | null
  retry_count: number
}

export interface NotificationResult {
  success: boolean
  notificationId: string
  channel: NotificationChannel
  externalMessageId?: string
  error?: string
}

export interface BatchResult {
  expiredCount: number
  notificationsQueued: number
  notificationsSent: number
  notificationsFailed: number
  errors: string[]
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A'
  // Parse date parts directly to avoid timezone issues
  // Input format: YYYY-MM-DD
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

function getDaysRemaining(endDateStr: string | null): number {
  if (!endDateStr) return 0
  const endDate = new Date(endDateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  endDate.setHours(0, 0, 0, 0)
  return Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * WhatsApp template names for each notification type
 */
const WHATSAPP_TEMPLATES: Record<MembershipNotificationType, string> = {
  expires_in_3_days: 'notification_expire_memberships',
  expires_in_1_day: 'membership_expires_tomorrow',
  expires_today: 'membership_expires_today',
  expired: 'membership_expired',
}

/**
 * Get WhatsApp template variables based on notification type
 * Variables: {{1}} = memberName, {{2}} = gymName, {{3}} = expirationDate (when needed)
 */
function getWhatsAppTemplateVariables(
  type: MembershipNotificationType,
  memberName: string,
  gymName: string,
  expirationDate: string
): string[] {
  switch (type) {
    case 'expires_in_3_days':
      return [memberName, gymName, expirationDate]
    case 'expires_in_1_day':
      return [memberName, gymName, expirationDate]
    case 'expires_today':
      return [memberName, gymName]
    case 'expired':
      return [memberName, gymName, expirationDate]
    default:
      return [memberName, gymName]
  }
}

/**
 * Get WhatsApp message content based on notification type (fallback for non-template)
 */
function getWhatsAppMessage(
  type: MembershipNotificationType,
  memberName: string,
  gymName: string,
  expirationDate: string
): string {
  const messages = {
    expires_in_3_days: `Hola ${memberName}, tu membresía en ${gymName} vence el ${expirationDate} (en 3 días). Renueva para seguir reservando clases.`,
    expires_in_1_day: `⚠️ Hola ${memberName}, tu membresía en ${gymName} vence MAÑANA (${expirationDate}). Renueva hoy para evitar el bloqueo de reservas.`,
    expires_today: `🔴 Hola ${memberName}, tu membresía en ${gymName} vence HOY. Si no renuevas, no podrás reservar clases desde mañana.`,
    expired: `❌ Hola ${memberName}, tu membresía en ${gymName} ha vencido. Renueva para volver a reservar clases.`,
  }
  return messages[type]
}

// =============================================================================
// NOTIFICATION SENDER
// =============================================================================

/**
 * Send email notification for membership expiration
 */
async function sendEmailNotification(
  notification: QueuedNotification,
  gymData: { name: string; email?: string; phone?: string }
): Promise<NotificationResult> {
  const { id, organization_id, recipient_email, notification_type, membership_end_date } =
    notification

  if (!recipient_email) {
    return {
      success: false,
      notificationId: id,
      channel: 'email',
      error: 'No recipient email',
    }
  }

  try {
    // Check email limit
    const limitCheck = await checkEmailLimit(organization_id)
    if (!limitCheck.allowed) {
      return {
        success: false,
        notificationId: id,
        channel: 'email',
        error: limitCheck.message || 'Email limit reached',
      }
    }

    const emailData: MembershipEmailData = {
      memberName: 'Miembro', // Will be fetched in production
      gymName: gymData.name,
      expirationDate: formatDate(membership_end_date),
      daysRemaining: getDaysRemaining(membership_end_date),
      contactEmail: gymData.email,
      contactPhone: gymData.phone,
    }

    const subject = getMembershipEmailSubject(notification_type, gymData.name)
    const html = getMembershipExpirationEmailHtml(notification_type, emailData)
    const text = getMembershipExpirationEmailText(notification_type, emailData)

    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: recipient_email,
      replyTo: emailConfig.replyTo,
      subject,
      html,
      text,
    })

    if (error) {
      return {
        success: false,
        notificationId: id,
        channel: 'email',
        error: error.message,
      }
    }

    // Track email usage
    await consumeEmail(organization_id, 1)

    return {
      success: true,
      notificationId: id,
      channel: 'email',
      externalMessageId: data?.id,
    }
  } catch (err) {
    return {
      success: false,
      notificationId: id,
      channel: 'email',
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Send WhatsApp notification for membership expiration
 */
async function sendWhatsAppNotification(
  notification: QueuedNotification,
  gymData: { name: string; whatsapp_from?: string; member_name?: string }
): Promise<NotificationResult> {
  const { id, recipient_phone, notification_type, membership_end_date } = notification

  if (!recipient_phone) {
    return {
      success: false,
      notificationId: id,
      channel: 'whatsapp',
      error: 'No recipient phone',
    }
  }

  // Check if messaging is configured (Respond.io or Twilio)
  if (!isMessagingConfigured()) {
    return {
      success: false,
      notificationId: id,
      channel: 'whatsapp',
      error: 'WhatsApp messaging not configured',
    }
  }

  try {
    const memberName = gymData.member_name || 'Estimado miembro'
    const expirationDate = formatDate(membership_end_date)

    // Format phone to E.164 if needed
    let formattedPhone = recipient_phone
    if (!formattedPhone.startsWith('+')) {
      // Assume Mexico number if no country code
      formattedPhone = `+52${formattedPhone.replace(/\D/g, '')}`
    }

    // Get template name and variables
    const templateName = WHATSAPP_TEMPLATES[notification_type]
    const templateVariables = getWhatsAppTemplateVariables(
      notification_type,
      memberName,
      gymData.name,
      expirationDate
    )

    // Try to send using template first
    let result = await messagingService.sendWhatsAppTemplate({
      to: formattedPhone,
      templateName,
      templateVariables,
      firstName: memberName.split(' ')[0],
    })

    // If template fails, fallback to regular message (for testing/sandbox)
    if (!result.success && result.error?.includes('template')) {
      console.log(`[WhatsApp] Template failed, falling back to regular message: ${result.error}`)
      const message = getWhatsAppMessage(
        notification_type,
        memberName,
        gymData.name,
        expirationDate
      )
      result = await messagingService.sendWhatsAppMessage({
        to: formattedPhone,
        body: message,
        firstName: memberName.split(' ')[0],
      })
    }

    if (!result.success) {
      return {
        success: false,
        notificationId: id,
        channel: 'whatsapp',
        error: result.error || 'WhatsApp send failed',
      }
    }

    return {
      success: true,
      notificationId: id,
      channel: 'whatsapp',
      externalMessageId: result.messageId,
    }
  } catch (err) {
    return {
      success: false,
      notificationId: id,
      channel: 'whatsapp',
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

// =============================================================================
// MAIN BATCH PROCESSOR
// =============================================================================

/**
 * Process membership expirations and send notifications
 *
 * This function:
 * 1. Marks expired memberships
 * 2. Queues notifications for expiring members
 * 3. Processes queued notifications (email + WhatsApp)
 *
 * Should be called daily via cron job.
 */
export async function processMembershipExpirations(): Promise<BatchResult> {
  const result: BatchResult = {
    expiredCount: 0,
    notificationsQueued: 0,
    notificationsSent: 0,
    notificationsFailed: 0,
    errors: [],
  }

  try {
    // Use service role client for batch operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Step 1: Mark expired memberships and queue notifications
    console.log('[MembershipNotifications] Running expire_memberships_with_notifications...')
    const { data: batchData, error: batchError } = await supabase.rpc(
      'expire_memberships_with_notifications'
    )

    if (batchError) {
      throw new Error(`Batch expire failed: ${batchError.message}`)
    }

    if (batchData && batchData.length > 0) {
      result.expiredCount = batchData[0].expired_count || 0
      result.notificationsQueued = batchData[0].notifications_queued || 0
    }

    console.log(
      `[MembershipNotifications] Expired: ${result.expiredCount}, Queued: ${result.notificationsQueued}`
    )

    // Step 2: Get queued notifications for processing
    const { data: queuedNotifications, error: queueError } = await supabase.rpc(
      'get_queued_notifications',
      { p_limit: 100 }
    )

    if (queueError) {
      result.errors.push(`Failed to get queued notifications: ${queueError.message}`)
      return result
    }

    if (!queuedNotifications || queuedNotifications.length === 0) {
      console.log('[MembershipNotifications] No queued notifications to process')
      return result
    }

    console.log(`[MembershipNotifications] Processing ${queuedNotifications.length} notifications`)

    // Step 3: Get gym data for notifications (batch query)
    const orgIds = [...new Set(queuedNotifications.map((n: QueuedNotification) => n.organization_id))]

    // Query orgs one by one if in() fails (workaround for UUID array issue)
    let orgsData: { id: string; name: string; contact_email: string | null; contact_phone: string | null }[] = []

    if (orgIds.length === 1) {
      // Single org - use eq instead of in
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('id', orgIds[0])
      if (data) orgsData = data.map(o => ({ ...o, contact_email: null, contact_phone: null }))
      if (error) console.error('[MembershipNotifications] Org query error:', error.message)
    } else if (orgIds.length > 1) {
      // Multiple orgs
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', orgIds)
      if (data && data.length > 0) {
        orgsData = data.map(o => ({ ...o, contact_email: null, contact_phone: null }))
      }
      if (error) console.error('[MembershipNotifications] Org query error:', error.message)
    }

    const orgMap = new Map(orgsData?.map((o) => [o.id, o]) || [])

    // Step 4: Get member names for personalization
    const memberIds = [...new Set(queuedNotifications.map((n: QueuedNotification) => n.member_id))]

    const { data: membersData } = await supabase
      .from('members')
      .select('id, full_name')
      .in('id', memberIds)

    const memberMap = new Map(membersData?.map((m) => [m.id, m.full_name]) || [])

    // Step 5: Process each notification
    for (const notification of queuedNotifications as QueuedNotification[]) {
      const org = orgMap.get(notification.organization_id)
      const memberName = memberMap.get(notification.member_id)

      if (!org) {
        result.errors.push(`Org not found for notification ${notification.id}`)
        continue
      }

      let sendResult: NotificationResult

      if (notification.channel === 'email') {
        sendResult = await sendEmailNotification(notification, {
          name: org.name,
          email: org.contact_email,
          phone: org.contact_phone,
        })
      } else if (notification.channel === 'whatsapp') {
        sendResult = await sendWhatsAppNotification(notification, {
          name: org.name,
          member_name: memberName,
        })
      } else {
        // Skip push for now
        continue
      }

      // Update notification status in DB
      if (sendResult.success) {
        await supabase.rpc('mark_notification_sent', {
          p_notification_id: notification.id,
          p_external_message_id: sendResult.externalMessageId || null,
        })
        result.notificationsSent++
      } else {
        await supabase.rpc('mark_notification_failed', {
          p_notification_id: notification.id,
          p_error_message: sendResult.error || 'Unknown error',
        })
        result.notificationsFailed++
        result.errors.push(`${notification.channel} failed: ${sendResult.error}`)
      }
    }

    console.log(
      `[MembershipNotifications] Complete - Sent: ${result.notificationsSent}, Failed: ${result.notificationsFailed}`
    )

    return result
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    result.errors.push(errorMessage)
    console.error('[MembershipNotifications] Error:', errorMessage)
    return result
  }
}

/**
 * Get notification statistics for dashboard
 */
export async function getNotificationStats(organizationId: string) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('membership_notifications')
    .select('status, channel, notification_type')
    .eq('organization_id', organizationId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  if (error || !data) {
    return {
      sent: 0,
      failed: 0,
      queued: 0,
      byChannel: { email: 0, whatsapp: 0 },
      byType: {},
    }
  }

  const stats = {
    sent: data.filter((n) => n.status === 'sent').length,
    failed: data.filter((n) => n.status === 'failed').length,
    queued: data.filter((n) => n.status === 'queued').length,
    byChannel: {
      email: data.filter((n) => n.channel === 'email').length,
      whatsapp: data.filter((n) => n.channel === 'whatsapp').length,
    },
    byType: data.reduce(
      (acc, n) => {
        acc[n.notification_type] = (acc[n.notification_type] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    ),
  }

  return stats
}
