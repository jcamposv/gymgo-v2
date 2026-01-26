/**
 * Twilio Service Layer
 *
 * Provides functionality for:
 * - Subaccount management (multi-tenant)
 * - Content API (WhatsApp templates)
 * - Messaging API (sending WhatsApp messages)
 */

import Twilio from 'twilio'
import type {
  TwilioConfig,
  SubaccountCreateParams,
  SubaccountResult,
  ContentTemplateParams,
  ContentTemplateResult,
  ContentApprovalStatus,
  SendMessageParams,
  SendMessageResult,
  MessageStatusResult,
  SendWhatsAppMessageParams,
  SendWhatsAppMessageResult,
  ITwilioSubaccountService,
  ITwilioContentService,
  ITwilioMessagingService,
} from './types'

// =============================================================================
// ENVIRONMENT VALIDATION
// =============================================================================

function getMasterCredentials(): { accountSid: string; authToken: string } {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    throw new Error(
      'Twilio master credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.'
    )
  }

  return { accountSid, authToken }
}

/**
 * Check if Twilio is properly configured
 */
export function isTwilioConfigured(): boolean {
  try {
    getMasterCredentials()
    return true
  } catch {
    return false
  }
}

// =============================================================================
// MASTER ACCOUNT CLIENT
// =============================================================================

function getMasterClient(): Twilio.Twilio {
  const { accountSid, authToken } = getMasterCredentials()
  return Twilio(accountSid, authToken)
}

/**
 * Get a Twilio client for a specific subaccount
 */
function getSubaccountClient(config: TwilioConfig): Twilio.Twilio {
  return Twilio(config.accountSid, config.authToken)
}

// =============================================================================
// SUBACCOUNT SERVICE
// =============================================================================

export const subaccountService: ITwilioSubaccountService = {
  async createSubaccount(params: SubaccountCreateParams): Promise<SubaccountResult> {
    const client = getMasterClient()

    try {
      const account = await client.api.accounts.create({
        friendlyName: params.friendlyName,
      })

      return {
        accountSid: account.sid,
        authToken: account.authToken,
        friendlyName: account.friendlyName,
        status: account.status,
      }
    } catch (error: unknown) {
      const twilioError = error as { message?: string; code?: number }
      throw new Error(
        `Error creating Twilio subaccount: ${twilioError.message || 'Unknown error'}`
      )
    }
  },

  async getSubaccount(accountSid: string): Promise<SubaccountResult | null> {
    const client = getMasterClient()

    try {
      const account = await client.api.accounts(accountSid).fetch()

      return {
        accountSid: account.sid,
        authToken: account.authToken,
        friendlyName: account.friendlyName,
        status: account.status,
      }
    } catch (error: unknown) {
      const twilioError = error as { code?: number }
      // Account not found
      if (twilioError.code === 20404) {
        return null
      }
      throw error
    }
  },

  async suspendSubaccount(accountSid: string): Promise<void> {
    const client = getMasterClient()
    await client.api.accounts(accountSid).update({ status: 'suspended' })
  },

  async activateSubaccount(accountSid: string): Promise<void> {
    const client = getMasterClient()
    await client.api.accounts(accountSid).update({ status: 'active' })
  },
}

// =============================================================================
// CONTENT API SERVICE (Templates)
// =============================================================================

export const contentService: ITwilioContentService = {
  async createTemplate(
    config: TwilioConfig,
    params: ContentTemplateParams
  ): Promise<ContentTemplateResult> {
    const client = getSubaccountClient(config)

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const content = await client.content.v1.contents.create({
        friendlyName: params.friendlyName,
        language: params.language,
        variables: params.variables,
        types: params.types as any,
      })

      return {
        sid: content.sid,
        friendlyName: content.friendlyName,
        language: content.language,
        approvalStatus: 'pending',
      }
    } catch (error: unknown) {
      const twilioError = error as { message?: string }
      throw new Error(
        `Error creating WhatsApp template: ${twilioError.message || 'Unknown error'}`
      )
    }
  },

  async deleteTemplate(config: TwilioConfig, contentSid: string): Promise<void> {
    const client = getSubaccountClient(config)

    try {
      await client.content.v1.contents(contentSid).remove()
    } catch (error: unknown) {
      const twilioError = error as { message?: string; code?: number }
      // Ignore if already deleted
      if (twilioError.code !== 20404) {
        throw new Error(
          `Error deleting template: ${twilioError.message || 'Unknown error'}`
        )
      }
    }
  },

  async getTemplate(
    config: TwilioConfig,
    contentSid: string
  ): Promise<ContentTemplateResult | null> {
    const client = getSubaccountClient(config)

    try {
      const content = await client.content.v1.contents(contentSid).fetch()

      // Get approval status
      let approvalStatus = 'pending'
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const contentContext = client.content.v1.contents(contentSid) as any
        const approvals = await contentContext.approvalRequests.list({ limit: 1 })

        if (approvals.length > 0) {
          approvalStatus = approvals[0].status
        }
      } catch {
        // Approval request may not exist yet
      }

      return {
        sid: content.sid,
        friendlyName: content.friendlyName,
        language: content.language,
        approvalStatus,
      }
    } catch (error: unknown) {
      const twilioError = error as { code?: number }
      if (twilioError.code === 20404) {
        return null
      }
      throw error
    }
  },

  async listTemplates(config: TwilioConfig): Promise<ContentTemplateResult[]> {
    const client = getSubaccountClient(config)

    try {
      const contents = await client.content.v1.contents.list()

      return contents.map((c) => ({
        sid: c.sid,
        friendlyName: c.friendlyName,
        language: c.language,
        approvalStatus: 'unknown',
      }))
    } catch (error: unknown) {
      const twilioError = error as { message?: string }
      throw new Error(
        `Error listing templates: ${twilioError.message || 'Unknown error'}`
      )
    }
  },

  async getApprovalStatus(
    config: TwilioConfig,
    contentSid: string
  ): Promise<ContentApprovalStatus> {
    const client = getSubaccountClient(config)

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contentContext = client.content.v1.contents(contentSid) as any
      const approvals = await contentContext.approvalRequests.list({ limit: 1 })

      if (!approvals.length) {
        return { status: 'pending' }
      }

      const approval = approvals[0]
      const status = approval.status as 'pending' | 'approved' | 'rejected'

      return {
        status,
        rejectionReason: approval.rejectionReason || undefined,
      }
    } catch (error: unknown) {
      const twilioError = error as { message?: string }
      throw new Error(
        `Error getting approval status: ${twilioError.message || 'Unknown error'}`
      )
    }
  },
}

// =============================================================================
// MESSAGING SERVICE
// =============================================================================

export const messagingService: ITwilioMessagingService = {
  async sendWhatsAppTemplate(
    config: TwilioConfig,
    params: SendMessageParams
  ): Promise<SendMessageResult> {
    const client = getSubaccountClient(config)

    try {
      // Format the recipient as whatsapp:+number
      const toNumber = params.to.startsWith('+') ? params.to : `+${params.to}`

      const messageParams: Record<string, string | undefined> = {
        to: `whatsapp:${toNumber}`,
        contentSid: params.contentSid,
      }

      // Use either MessagingServiceSid or From number
      if (params.messagingServiceSid) {
        messageParams.messagingServiceSid = params.messagingServiceSid
      } else if (params.from) {
        const fromNumber = params.from.startsWith('+') ? params.from : `+${params.from}`
        messageParams.from = `whatsapp:${fromNumber}`
      }

      // Add content variables if provided
      if (params.contentVariables && Object.keys(params.contentVariables).length > 0) {
        messageParams.contentVariables = JSON.stringify(params.contentVariables)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = await client.messages.create(messageParams as any)

      return {
        messageSid: message.sid,
        status: message.status,
      }
    } catch (error: unknown) {
      const twilioError = error as { message?: string; code?: number }
      return {
        messageSid: '',
        status: 'failed',
        errorCode: twilioError.code?.toString(),
        errorMessage: twilioError.message || 'Unknown error',
      }
    }
  },

  async sendWhatsAppMessage(
    params: SendWhatsAppMessageParams
  ): Promise<SendWhatsAppMessageResult> {
    try {
      const { accountSid, authToken } = getMasterCredentials()
      const client = Twilio(accountSid, authToken)

      // Format phone numbers
      const toNumber = params.to.startsWith('+') ? params.to : `+${params.to}`
      const fromNumber = params.from || process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'
      const formattedFrom = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`

      const message = await client.messages.create({
        to: `whatsapp:${toNumber}`,
        from: formattedFrom,
        body: params.body,
      })

      return {
        success: true,
        messageSid: message.sid,
        status: message.status,
      }
    } catch (error: unknown) {
      const twilioError = error as { message?: string; code?: number }
      return {
        success: false,
        error: twilioError.message || 'Unknown error',
      }
    }
  },

  async getMessageStatus(
    config: TwilioConfig,
    messageSid: string
  ): Promise<MessageStatusResult> {
    const client = getSubaccountClient(config)

    try {
      const message = await client.messages(messageSid).fetch()

      return {
        status: message.status,
        errorCode: message.errorCode?.toString(),
        errorMessage: message.errorMessage || undefined,
      }
    } catch (error: unknown) {
      const twilioError = error as { message?: string }
      throw new Error(
        `Error getting message status: ${twilioError.message || 'Unknown error'}`
      )
    }
  },
}

// =============================================================================
// SANDBOX TESTING (Free-form messages)
// =============================================================================

/**
 * Send a free-form WhatsApp message (for sandbox testing only)
 * In production, you must use templates for business-initiated messages
 */
export async function sendSandboxMessage(params: {
  to: string
  body: string
  from?: string
}): Promise<SendMessageResult> {
  const { accountSid, authToken } = getMasterCredentials()
  const client = Twilio(accountSid, authToken)

  try {
    // Format phone numbers
    const toNumber = params.to.startsWith('+') ? params.to : `+${params.to}`
    const fromNumber = params.from || process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'
    const formattedFrom = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`

    const message = await client.messages.create({
      to: `whatsapp:${toNumber}`,
      from: formattedFrom,
      body: params.body,
    })

    return {
      messageSid: message.sid,
      status: message.status,
    }
  } catch (error: unknown) {
    const twilioError = error as { message?: string; code?: number }
    return {
      messageSid: '',
      status: 'failed',
      errorCode: twilioError.code?.toString(),
      errorMessage: twilioError.message || 'Unknown error',
    }
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Validate a phone number is in E.164 format
 */
export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone)
}

/**
 * Format a phone number to E.164 (basic formatting)
 * Note: For production, use a library like libphonenumber-js
 */
export function formatToE164(phone: string, defaultCountryCode = '52'): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '')

  // If starts with country code, add +
  if (digits.length >= 10) {
    if (!digits.startsWith(defaultCountryCode) && digits.length === 10) {
      digits = defaultCountryCode + digits
    }
    return `+${digits}`
  }

  throw new Error('Invalid phone number')
}

// =============================================================================
// RE-EXPORT TYPES
// =============================================================================

export * from './types'
