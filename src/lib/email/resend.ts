import { Resend } from 'resend'

// =============================================================================
// RESEND CLIENT
// =============================================================================

const resendApiKey = process.env.RESEND_API_KEY

if (!resendApiKey) {
  console.warn('RESEND_API_KEY is not set. Email functionality will not work.')
}

export const resend = new Resend(resendApiKey)

// =============================================================================
// EMAIL CONFIG
// =============================================================================

export const emailConfig = {
  from: process.env.EMAIL_FROM || 'GymGo <noreply@gymgo.app>',
  replyTo: process.env.EMAIL_REPLY_TO || 'soporte@gymgo.app',
}

// =============================================================================
// TYPES
// =============================================================================

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}
