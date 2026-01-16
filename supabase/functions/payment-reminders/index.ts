/**
 * Payment Reminders Edge Function
 *
 * Scheduled via pg_cron to run every hour.
 * Checks for members with upcoming payment deadlines and sends WhatsApp reminders.
 *
 * Flow:
 * 1. Get gyms with WhatsApp enabled and active status
 * 2. For each gym, check if current hour matches reminder_hour
 * 3. Find members with membership_end_date matching reminder_days_before
 * 4. Filter opted-in members
 * 5. Check idempotency (no duplicate for same member/type/day)
 * 6. Send WhatsApp template via Twilio
 * 7. Log delivery in notification_delivery_log
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// =============================================================================
// TYPES
// =============================================================================

interface GymWhatsAppSettings {
  id: string
  organization_id: string
  twilio_account_sid: string
  twilio_auth_token: string
  whatsapp_phone_number: string | null
  whatsapp_sender_sid: string | null
  is_enabled: boolean
  reminder_days_before: number[]
  reminder_hour: number
}

interface WhatsAppTemplate {
  id: string
  organization_id: string
  template_type: string
  twilio_content_sid: string | null
  status: string
}

interface MemberWithPayment {
  member_id: string
  member_name: string
  whatsapp_phone: string
  plan_name: string
  amount: number
  currency: string
  membership_end_date: string
  days_until_due: number
}

interface TwilioMessageResponse {
  sid?: string
  status?: string
  error_code?: number
  error_message?: string
}

// =============================================================================
// ENVIRONMENT
// =============================================================================

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CRON_SECRET = Deno.env.get('CRON_SECRET')

// =============================================================================
// HELPERS
// =============================================================================

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency || 'MXN',
  }).format(amount)
}

function generateIdempotencyKey(
  orgId: string,
  memberId: string,
  notificationType: string,
  date: string
): string {
  return `${orgId}:${memberId}:${notificationType}:${date}`
}

async function sendTwilioMessage(
  accountSid: string,
  authToken: string,
  to: string,
  contentSid: string,
  contentVariables: Record<string, string>,
  messagingServiceSid?: string,
  fromNumber?: string
): Promise<TwilioMessageResponse> {
  const credentials = btoa(`${accountSid}:${authToken}`)
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

  const body = new URLSearchParams()
  body.append('To', `whatsapp:${to}`)
  body.append('ContentSid', contentSid)
  body.append('ContentVariables', JSON.stringify(contentVariables))

  if (messagingServiceSid) {
    body.append('MessagingServiceSid', messagingServiceSid)
  } else if (fromNumber) {
    body.append('From', `whatsapp:${fromNumber}`)
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        error_code: data.code,
        error_message: data.message,
      }
    }

    return {
      sid: data.sid,
      status: data.status,
    }
  } catch (error) {
    return {
      error_message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// =============================================================================
// MAIN LOGIC
// =============================================================================

async function processGym(
  supabase: ReturnType<typeof getSupabase>,
  settings: GymWhatsAppSettings,
  template: WhatsAppTemplate,
  today: string
): Promise<{ sent: number; failed: number; skipped: number }> {
  const stats = { sent: 0, failed: 0, skipped: 0 }

  // Get members with upcoming payments
  const membersToNotify: MemberWithPayment[] = []

  for (const daysBefore of settings.reminder_days_before) {
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + daysBefore)
    const targetDateStr = targetDate.toISOString().split('T')[0]

    // Query members with membership ending on target date who have opted in
    const { data: members, error } = await supabase
      .from('members')
      .select(
        `
        id,
        user:users!inner(full_name),
        membership_plan:membership_plans(name, price, currency),
        membership_end_date,
        member_notification_preferences!inner(
          whatsapp_phone,
          whatsapp_opted_in,
          receive_payment_reminders
        )
      `
      )
      .eq('organization_id', settings.organization_id)
      .eq('membership_end_date', targetDateStr)
      .eq('member_notification_preferences.whatsapp_opted_in', true)
      .eq('member_notification_preferences.receive_payment_reminders', true)
      .not('member_notification_preferences.whatsapp_phone', 'is', null)

    if (error) {
      console.error(`Error fetching members for gym ${settings.organization_id}:`, error)
      continue
    }

    if (!members || members.length === 0) {
      continue
    }

    for (const member of members) {
      const prefs = member.member_notification_preferences as unknown as {
        whatsapp_phone: string
      }
      const user = member.user as unknown as { full_name: string }
      const plan = member.membership_plan as unknown as {
        name: string
        price: number
        currency: string
      } | null

      membersToNotify.push({
        member_id: member.id,
        member_name: user?.full_name || 'Miembro',
        whatsapp_phone: prefs.whatsapp_phone,
        plan_name: plan?.name || 'Plan',
        amount: plan?.price || 0,
        currency: plan?.currency || 'MXN',
        membership_end_date: member.membership_end_date || targetDateStr,
        days_until_due: daysBefore,
      })
    }
  }

  // Process each member
  for (const member of membersToNotify) {
    const idempotencyKey = generateIdempotencyKey(
      settings.organization_id,
      member.member_id,
      'payment_reminder',
      today
    )

    // Check if already sent today
    const { data: existing } = await supabase
      .from('notification_delivery_log')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .single()

    if (existing) {
      stats.skipped++
      continue
    }

    // Prepare template variables
    const contentVariables: Record<string, string> = {
      '1': member.member_name,
      '2': member.days_until_due.toString(),
      '3': formatCurrency(member.amount, member.currency),
      '4': member.plan_name,
    }

    // Send message via Twilio
    const result = await sendTwilioMessage(
      settings.twilio_account_sid,
      settings.twilio_auth_token,
      member.whatsapp_phone,
      template.twilio_content_sid!,
      contentVariables,
      settings.whatsapp_sender_sid || undefined,
      settings.whatsapp_phone_number || undefined
    )

    // Log delivery
    const logEntry = {
      organization_id: settings.organization_id,
      member_id: member.member_id,
      channel: 'whatsapp' as const,
      notification_type: 'payment_reminder',
      template_id: template.id,
      body: `Recordatorio de pago para ${member.member_name}`,
      variables_used: contentVariables,
      recipient_phone: member.whatsapp_phone,
      provider: 'twilio',
      provider_message_id: result.sid || null,
      provider_status: result.status || 'failed',
      status: result.sid ? 'queued' : 'failed',
      sent_at: result.sid ? new Date().toISOString() : null,
      failed_at: result.sid ? null : new Date().toISOString(),
      error_code: result.error_code?.toString() || null,
      error_message: result.error_message || null,
      idempotency_key: idempotencyKey,
    }

    const { error: logError } = await supabase
      .from('notification_delivery_log')
      .insert(logEntry)

    if (logError) {
      console.error('Error logging delivery:', logError)
    }

    if (result.sid) {
      stats.sent++
    } else {
      stats.failed++
      console.error(
        `Failed to send to ${member.whatsapp_phone}: ${result.error_message}`
      )
    }
  }

  return stats
}

async function runPaymentReminders(): Promise<{
  gyms_processed: number
  total_sent: number
  total_failed: number
  total_skipped: number
}> {
  const supabase = getSupabase()
  const now = new Date()
  const currentHour = now.getUTCHours()
  const today = now.toISOString().split('T')[0]

  const results = {
    gyms_processed: 0,
    total_sent: 0,
    total_failed: 0,
    total_skipped: 0,
  }

  // Get all gyms with WhatsApp enabled
  const { data: gymSettings, error: settingsError } = await supabase
    .from('gym_whatsapp_settings')
    .select('*')
    .eq('is_enabled', true)
    .eq('setup_status', 'active')

  if (settingsError) {
    console.error('Error fetching gym settings:', settingsError)
    throw settingsError
  }

  if (!gymSettings || gymSettings.length === 0) {
    console.log('No gyms with active WhatsApp settings')
    return results
  }

  for (const settings of gymSettings) {
    // Check if current hour matches gym's reminder hour
    // TODO: Implement timezone-aware hour checking per gym
    if (currentHour !== settings.reminder_hour) {
      continue
    }

    // Get approved payment_reminder template for this gym
    const { data: templates, error: templateError } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('organization_id', settings.organization_id)
      .eq('template_type', 'payment_reminder')
      .eq('status', 'approved')
      .not('twilio_content_sid', 'is', null)
      .limit(1)

    if (templateError) {
      console.error(`Error fetching template for gym ${settings.organization_id}:`, templateError)
      continue
    }

    if (!templates || templates.length === 0) {
      console.log(`No approved payment_reminder template for gym ${settings.organization_id}`)
      continue
    }

    const template = templates[0]

    try {
      const stats = await processGym(supabase, settings, template, today)
      results.gyms_processed++
      results.total_sent += stats.sent
      results.total_failed += stats.failed
      results.total_skipped += stats.skipped

      console.log(
        `Gym ${settings.organization_id}: sent=${stats.sent}, failed=${stats.failed}, skipped=${stats.skipped}`
      )
    } catch (error) {
      console.error(`Error processing gym ${settings.organization_id}:`, error)
    }
  }

  return results
}

// =============================================================================
// HANDLER
// =============================================================================

Deno.serve(async (req) => {
  // Verify cron secret for security
  const authHeader = req.headers.get('Authorization')

  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    // Also check for internal Supabase invocation
    const isInternalCall = req.headers.get('x-supabase-function-version')
    if (!isInternalCall) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  // Only accept POST requests (from cron) or GET (for manual testing)
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    console.log('Starting payment reminders job...')
    const startTime = Date.now()

    const results = await runPaymentReminders()

    const duration = Date.now() - startTime
    console.log(`Job completed in ${duration}ms:`, results)

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
        duration_ms: duration,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Payment reminders job failed:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
