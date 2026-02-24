/**
 * Respond.io Service Layer
 *
 * Provides WhatsApp messaging via Respond.io API.
 * API Docs: https://developers.respond.io/
 */

import type {
  RespondIoConfig,
  SendWhatsAppMessageParams,
  SendWhatsAppTemplateParams,
  SendMessageParams,
  SendMessageResult,
  CreateContactParams,
  RespondIoContact,
  IRespondIoService,
  ContactResponse,
  MessageResponse,
} from './types'

// =============================================================================
// CONFIGURATION
// =============================================================================

const BASE_URL = 'https://api.respond.io/v2'

function getConfig(): RespondIoConfig | null {
  const apiKey = process.env.RESPOND_IO_API_KEY
  const whatsappChannelId = process.env.RESPOND_IO_WHATSAPP_CHANNEL_ID

  if (!apiKey || !whatsappChannelId) {
    return null
  }

  return {
    apiKey,
    whatsappChannelId,
    baseUrl: BASE_URL,
  }
}

/**
 * Check if Respond.io is properly configured
 */
export function isRespondIoConfigured(): boolean {
  return getConfig() !== null
}

// =============================================================================
// API CLIENT
// =============================================================================

async function apiRequest<T>(
  endpoint: string,
  options: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    body?: unknown
  }
): Promise<{ success: boolean; data?: T; error?: string }> {
  const config = getConfig()

  if (!config) {
    return { success: false, error: 'Respond.io not configured' }
  }

  try {
    const response = await fetch(`${config.baseUrl}${endpoint}`, {
      method: options.method,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error?.message || `HTTP ${response.status}`,
      }
    }

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// =============================================================================
// CONTACT MANAGEMENT
// =============================================================================

/**
 * Get phone identifier for API calls
 * Format: phone:+50670124238 (URL encoded as phone:%2B50670124238)
 */
function getPhoneIdentifier(phone: string): string {
  const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`
  return `phone:${encodeURIComponent(formattedPhone)}`
}

/**
 * Create or update a contact by phone number
 */
async function createOrUpdateContact(params: CreateContactParams): Promise<RespondIoContact | null> {
  const formattedPhone = params.phone.startsWith('+') ? params.phone : `+${params.phone}`
  const phoneIdentifier = getPhoneIdentifier(formattedPhone)

  const result = await apiRequest<{ contactId: number }>(`/contact/create_or_update/${phoneIdentifier}`, {
    method: 'POST',
    body: {
      firstName: params.firstName || 'Miembro',
      lastName: params.lastName || '',
      phone: formattedPhone,
    },
  })

  if (result.success && result.data?.contactId) {
    return {
      id: result.data.contactId.toString(),
      firstName: params.firstName,
      lastName: params.lastName,
      phone: formattedPhone,
    }
  }

  console.error('[RespondIO] Failed to create/update contact:', result.error)
  return null
}

// =============================================================================
// MESSAGING SERVICE
// =============================================================================

export const respondIoService: IRespondIoService = {
  isConfigured(): boolean {
    return isRespondIoConfigured()
  },

  async findOrCreateContact(params: CreateContactParams): Promise<RespondIoContact | null> {
    return createOrUpdateContact(params)
  },

  async sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
    const config = getConfig()
    if (!config) {
      return { success: false, error: 'Respond.io not configured' }
    }

    // Use phone identifier for API call
    const phoneIdentifier = getPhoneIdentifier(params.contactId)

    const result = await apiRequest<{ contactId: number; messageId: number }>(
      `/contact/${phoneIdentifier}/message`,
      {
        method: 'POST',
        body: {
          channelId: parseInt(params.channelId || config.whatsappChannelId, 10),
          message: params.message,
        },
      }
    )

    if (result.success && result.data) {
      return {
        success: true,
        messageId: result.data.messageId.toString(),
        contactId: result.data.contactId.toString(),
      }
    }

    return {
      success: false,
      error: result.error || 'Failed to send message',
    }
  },

  async sendWhatsAppMessage(params: SendWhatsAppMessageParams): Promise<SendMessageResult> {
    const config = getConfig()
    if (!config) {
      return { success: false, error: 'Respond.io not configured' }
    }

    try {
      // Format phone number to E.164
      let phone = params.to.replace(/\D/g, '')
      // Only add country code if it's a 10-digit number (likely Mexico)
      if (phone.length === 10) {
        phone = `52${phone}` // Default to Mexico
      }
      phone = `+${phone}`

      // Create or update contact first
      await createOrUpdateContact({
        channelId: config.whatsappChannelId,
        phone,
        firstName: params.firstName,
        lastName: params.lastName,
      })

      // Send message using phone identifier
      const result = await this.sendMessage({
        contactId: phone, // Pass phone, will be converted to identifier
        channelId: config.whatsappChannelId,
        message: {
          type: 'text',
          text: params.body,
        },
      })

      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },

  async sendWhatsAppTemplate(params: SendWhatsAppTemplateParams): Promise<SendMessageResult> {
    const config = getConfig()
    if (!config) {
      return { success: false, error: 'Respond.io not configured' }
    }

    try {
      // Format phone number to E.164
      let phone = params.to.replace(/\D/g, '')
      // Only add country code if it's a 10-digit number (likely Mexico)
      if (phone.length === 10) {
        phone = `52${phone}` // Default to Mexico
      }
      phone = `+${phone}`

      // Create or update contact first
      await createOrUpdateContact({
        channelId: config.whatsappChannelId,
        phone,
        firstName: params.firstName,
        lastName: params.lastName,
      })

      // Send template message using phone identifier
      const phoneIdentifier = getPhoneIdentifier(phone)

      const result = await apiRequest<{ contactId: number; messageId: number }>(
        `/contact/${phoneIdentifier}/message`,
        {
          method: 'POST',
          body: {
            channelId: parseInt(config.whatsappChannelId, 10),
            message: {
              type: 'whatsapp_template',
              template: {
                name: params.templateName,
                languageCode: 'es',
                components: params.templateVariables.length > 0
                  ? [
                      {
                        type: 'body',
                        parameters: params.templateVariables.map((value) => ({
                          type: 'text',
                          text: value,
                        })),
                      },
                    ]
                  : [],
              },
            },
          },
        }
      )

      if (result.success && result.data) {
        return {
          success: true,
          messageId: result.data.messageId.toString(),
          contactId: result.data.contactId.toString(),
        }
      }

      return {
        success: false,
        error: result.error || 'Failed to send template message',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format phone number to E.164 format
 */
export function formatPhoneE164(phone: string, defaultCountryCode = '52'): string {
  let digits = phone.replace(/\D/g, '')

  if (digits.length === 10 && !digits.startsWith(defaultCountryCode)) {
    digits = defaultCountryCode + digits
  }

  return `+${digits}`
}

// =============================================================================
// RE-EXPORT TYPES
// =============================================================================

export * from './types'
