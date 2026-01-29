/**
 * Respond.io Service Types
 *
 * Type definitions for Respond.io WhatsApp integration.
 * API Docs: https://developers.respond.io/
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

export interface RespondIoConfig {
  apiKey: string
  whatsappChannelId: string
  baseUrl?: string
}

// =============================================================================
// CONTACT TYPES
// =============================================================================

export interface RespondIoContact {
  id: string
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  customFields?: Record<string, string>
}

export interface CreateContactParams {
  channelId: string
  phone: string
  firstName?: string
  lastName?: string
  customFields?: Record<string, string>
}

export interface ContactSearchParams {
  phone?: string
  email?: string
}

// =============================================================================
// MESSAGE TYPES
// =============================================================================

export interface SendMessageParams {
  contactId: string
  channelId?: string
  message: {
    type: 'text' | 'image' | 'file' | 'video' | 'audio'
    text?: string
    url?: string
    caption?: string
  }
}

export interface SendWhatsAppMessageParams {
  to: string // Phone number
  body: string
  firstName?: string
  lastName?: string
}

export interface SendWhatsAppTemplateParams {
  to: string // Phone number
  templateName: string
  templateVariables: string[] // Variables in order: {{1}}, {{2}}, {{3}}
  firstName?: string
  lastName?: string
}

export interface SendMessageResult {
  success: boolean
  messageId?: string
  contactId?: string
  error?: string
  errorCode?: string
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface RespondIoApiResponse<T = unknown> {
  status: 'success' | 'error'
  data?: T
  error?: {
    code: string
    message: string
  }
}

export interface ContactResponse {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string
  channelId: string
}

export interface MessageResponse {
  id: string
  contactId: string
  channelId: string
  status: string
  createdAt: string
}

// =============================================================================
// SERVICE INTERFACE
// =============================================================================

export interface IRespondIoService {
  /**
   * Send a WhatsApp message to a phone number
   * Creates contact if doesn't exist
   */
  sendWhatsAppMessage(params: SendWhatsAppMessageParams): Promise<SendMessageResult>

  /**
   * Send a WhatsApp template message
   * Creates contact if doesn't exist
   */
  sendWhatsAppTemplate(params: SendWhatsAppTemplateParams): Promise<SendMessageResult>

  /**
   * Find or create a contact by phone number
   */
  findOrCreateContact(params: CreateContactParams): Promise<RespondIoContact | null>

  /**
   * Send a message to an existing contact
   */
  sendMessage(params: SendMessageParams): Promise<SendMessageResult>

  /**
   * Check if respond.io is configured
   */
  isConfigured(): boolean
}
