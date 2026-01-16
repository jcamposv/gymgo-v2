/**
 * Twilio WhatsApp Webhook Handler
 *
 * Handles:
 * - Message status callbacks (queued → sent → delivered → read → failed)
 * - Inbound messages for opt-out handling (STOP, CANCELAR, etc.)
 */

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { NotificationDeliveryStatus } from '@/types/whatsapp.types'

// Twilio signature validation
import Twilio from 'twilio'

// Note: The database types haven't been regenerated yet to include the new WhatsApp tables.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any

// =============================================================================
// TYPES
// =============================================================================

interface TwilioStatusPayload {
  MessageSid: string
  MessageStatus: string
  To: string
  From: string
  AccountSid: string
  ErrorCode?: string
  ErrorMessage?: string
}

interface TwilioInboundPayload {
  MessageSid: string
  Body: string
  From: string
  To: string
  AccountSid: string
}

// Opt-out keywords (Spanish and English)
const OPT_OUT_KEYWORDS = [
  'stop',
  'unsubscribe',
  'cancel',
  'cancelar',
  'detener',
  'parar',
  'baja',
  'no mas',
  'no más',
  'salir',
]

// =============================================================================
// HELPERS
// =============================================================================

function getSupabaseAdmin(): AnyClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function mapTwilioStatus(status: string): NotificationDeliveryStatus {
  const statusMap: Record<string, NotificationDeliveryStatus> = {
    queued: 'queued',
    sending: 'queued',
    sent: 'sent',
    delivered: 'delivered',
    read: 'read',
    failed: 'failed',
    undelivered: 'undelivered',
  }
  return statusMap[status] || 'pending'
}

function isOptOutMessage(body: string): boolean {
  const normalized = body.toLowerCase().trim()
  return OPT_OUT_KEYWORDS.some((keyword) => normalized === keyword)
}

function extractPhoneNumber(twilioNumber: string): string {
  // Remove "whatsapp:" prefix if present
  return twilioNumber.replace(/^whatsapp:/, '')
}

async function validateTwilioSignature(
  request: NextRequest,
  body: string
): Promise<boolean> {
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!authToken) {
    console.error('TWILIO_AUTH_TOKEN not configured')
    return false
  }

  const signature = request.headers.get('x-twilio-signature')

  if (!signature) {
    console.error('Missing Twilio signature header')
    return false
  }

  // Get the full URL for validation
  const url = request.url

  // Parse body as form data
  const params: Record<string, string> = {}
  const searchParams = new URLSearchParams(body)
  searchParams.forEach((value, key) => {
    params[key] = value
  })

  return Twilio.validateRequest(authToken, signature, url, params)
}

// =============================================================================
// STATUS UPDATE HANDLER
// =============================================================================

async function handleStatusUpdate(payload: TwilioStatusPayload): Promise<void> {
  const supabase = getSupabaseAdmin()

  const newStatus = mapTwilioStatus(payload.MessageStatus)
  const now = new Date().toISOString()

  // Build update object based on status
  const updateData: Record<string, unknown> = {
    provider_status: payload.MessageStatus,
    status: newStatus,
    updated_at: now,
  }

  // Set timestamp based on status
  switch (newStatus) {
    case 'sent':
      updateData.sent_at = now
      break
    case 'delivered':
      updateData.delivered_at = now
      break
    case 'read':
      updateData.read_at = now
      break
    case 'failed':
    case 'undelivered':
      updateData.failed_at = now
      updateData.error_code = payload.ErrorCode || null
      updateData.error_message = payload.ErrorMessage || null
      break
  }

  // Update delivery log
  const { error } = await supabase
    .from('notification_delivery_log')
    .update(updateData)
    .eq('provider_message_id', payload.MessageSid)

  if (error) {
    console.error('Error updating delivery log:', error)
    throw error
  }

  console.log(`Updated message ${payload.MessageSid} to status: ${newStatus}`)
}

// =============================================================================
// OPT-OUT HANDLER
// =============================================================================

async function handleOptOut(payload: TwilioInboundPayload): Promise<void> {
  const supabase = getSupabaseAdmin()

  const phoneNumber = extractPhoneNumber(payload.From)

  // Find member by phone number and update opt-in status
  const { error } = await supabase
    .from('member_notification_preferences')
    .update({
      whatsapp_opted_in: false,
      whatsapp_opted_out_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('whatsapp_phone', phoneNumber)

  if (error) {
    console.error('Error updating opt-out status:', error)
    throw error
  }

  console.log(`Processed opt-out for phone: ${phoneNumber}`)
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Read body as text for signature validation
    const body = await request.text()

    // Validate Twilio signature in production
    if (process.env.NODE_ENV === 'production') {
      const isValid = await validateTwilioSignature(request, body)
      if (!isValid) {
        console.error('Invalid Twilio signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
      }
    }

    // Parse form data
    const params = new URLSearchParams(body)
    const payload = Object.fromEntries(params.entries())

    // Determine if this is a status update or inbound message
    const messageStatus = payload.MessageStatus
    const messageBody = payload.Body

    if (messageStatus) {
      // Status callback
      await handleStatusUpdate(payload as unknown as TwilioStatusPayload)
    } else if (messageBody && isOptOutMessage(messageBody)) {
      // Inbound opt-out message
      await handleOptOut(payload as unknown as TwilioInboundPayload)
    }

    // Twilio expects 200 OK response
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    // Still return 200 to prevent Twilio retries for our errors
    return NextResponse.json({ success: false, error: 'Internal error' })
  }
}

// Handle GET for webhook verification (if needed)
export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'twilio-whatsapp-webhook' })
}
