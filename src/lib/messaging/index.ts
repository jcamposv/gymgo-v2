/**
 * Unified Messaging Service
 *
 * Abstraction layer for WhatsApp messaging that supports multiple providers:
 * - Respond.io (preferred)
 * - Twilio (fallback)
 *
 * Usage:
 *   import { messagingService, isMessagingConfigured } from '@/lib/messaging'
 *
 *   if (isMessagingConfigured()) {
 *     await messagingService.sendWhatsAppMessage({ to, body })
 *   }
 */

import { respondIoService, isRespondIoConfigured } from '@/lib/respond-io'
import { messagingService as twilioMessaging, isTwilioConfigured } from '@/lib/twilio'

// =============================================================================
// TYPES
// =============================================================================

export interface SendWhatsAppParams {
  to: string
  body: string
  firstName?: string
  lastName?: string
}

export interface SendWhatsAppTemplateParams {
  to: string
  templateName: string
  templateVariables: string[]
  firstName?: string
  lastName?: string
}

export interface SendWhatsAppResult {
  success: boolean
  messageId?: string
  provider: 'respond.io' | 'twilio' | 'none'
  error?: string
}

export interface IMessagingService {
  sendWhatsAppMessage(params: SendWhatsAppParams): Promise<SendWhatsAppResult>
  sendWhatsAppTemplate(params: SendWhatsAppTemplateParams): Promise<SendWhatsAppResult>
  getProvider(): 'respond.io' | 'twilio' | 'none'
  isConfigured(): boolean
}

// =============================================================================
// PROVIDER DETECTION
// =============================================================================

type Provider = 'respond.io' | 'twilio' | 'none'

function detectProvider(): Provider {
  // Prefer Respond.io if configured
  if (isRespondIoConfigured()) {
    return 'respond.io'
  }

  // Fall back to Twilio
  if (isTwilioConfigured()) {
    return 'twilio'
  }

  return 'none'
}

// =============================================================================
// UNIFIED MESSAGING SERVICE
// =============================================================================

export const messagingService: IMessagingService = {
  getProvider(): Provider {
    return detectProvider()
  },

  isConfigured(): boolean {
    return detectProvider() !== 'none'
  },

  async sendWhatsAppMessage(params: SendWhatsAppParams): Promise<SendWhatsAppResult> {
    const provider = detectProvider()

    if (provider === 'none') {
      return {
        success: false,
        provider: 'none',
        error: 'No messaging provider configured. Set RESPOND_IO_API_KEY or TWILIO_ACCOUNT_SID.',
      }
    }

    // Use Respond.io
    if (provider === 'respond.io') {
      const result = await respondIoService.sendWhatsAppMessage({
        to: params.to,
        body: params.body,
        firstName: params.firstName,
        lastName: params.lastName,
      })

      return {
        success: result.success,
        messageId: result.messageId,
        provider: 'respond.io',
        error: result.error,
      }
    }

    // Use Twilio
    if (provider === 'twilio') {
      const result = await twilioMessaging.sendWhatsAppMessage({
        to: params.to,
        from: process.env.TWILIO_WHATSAPP_FROM || '',
        body: params.body,
      })

      return {
        success: result.success,
        messageId: result.messageSid,
        provider: 'twilio',
        error: result.error,
      }
    }

    return {
      success: false,
      provider: 'none',
      error: 'Unknown provider',
    }
  },

  async sendWhatsAppTemplate(params: SendWhatsAppTemplateParams): Promise<SendWhatsAppResult> {
    const provider = detectProvider()

    if (provider === 'none') {
      return {
        success: false,
        provider: 'none',
        error: 'No messaging provider configured.',
      }
    }

    // Use Respond.io (preferred for templates)
    if (provider === 'respond.io') {
      const result = await respondIoService.sendWhatsAppTemplate({
        to: params.to,
        templateName: params.templateName,
        templateVariables: params.templateVariables,
        firstName: params.firstName,
        lastName: params.lastName,
      })

      return {
        success: result.success,
        messageId: result.messageId,
        provider: 'respond.io',
        error: result.error,
      }
    }

    // Twilio fallback - use sendWhatsAppTemplate if available
    if (provider === 'twilio') {
      // Twilio requires content SID for templates, fall back to regular message
      // This is a simplified fallback - in production you'd use Twilio Content API
      return {
        success: false,
        provider: 'twilio',
        error: 'Twilio template messages require Content API setup. Use respond.io instead.',
      }
    }

    return {
      success: false,
      provider: 'none',
      error: 'Unknown provider',
    }
  },
}

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

export function isMessagingConfigured(): boolean {
  return messagingService.isConfigured()
}

export function getMessagingProvider(): Provider {
  return messagingService.getProvider()
}
