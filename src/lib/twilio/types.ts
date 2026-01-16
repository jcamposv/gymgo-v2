/**
 * Twilio Service Types
 *
 * Type definitions for Twilio WhatsApp integration.
 */

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

export interface TwilioConfig {
  accountSid: string
  authToken: string
}

export interface TwilioMasterConfig {
  accountSid: string
  authToken: string
}

// =============================================================================
// SUBACCOUNT TYPES
// =============================================================================

export interface SubaccountCreateParams {
  friendlyName: string
}

export interface SubaccountResult {
  accountSid: string
  authToken: string
  friendlyName: string
  status: string
}

// =============================================================================
// CONTENT API TYPES (Templates)
// =============================================================================

export interface ContentTemplateParams {
  friendlyName: string
  language: string
  variables?: Record<string, string>
  types: {
    'twilio/text'?: {
      body: string
    }
    'twilio/card'?: {
      title?: string
      body: string
      actions?: Array<{
        type: 'URL' | 'PHONE_NUMBER' | 'QUICK_REPLY'
        title: string
        url?: string
        phone?: string
        id?: string
      }>
    }
  }
}

export interface ContentTemplateResult {
  sid: string
  friendlyName: string
  language: string
  approvalStatus: string
}

export interface ContentApprovalStatus {
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string
}

// =============================================================================
// MESSAGING API TYPES
// =============================================================================

export interface SendMessageParams {
  to: string
  contentSid: string
  contentVariables?: Record<string, string>
  messagingServiceSid?: string
  from?: string
}

export interface SendMessageResult {
  messageSid: string
  status: string
  errorCode?: string
  errorMessage?: string
}

export interface MessageStatusResult {
  status: string
  errorCode?: string
  errorMessage?: string
}

// =============================================================================
// SERVICE INTERFACES
// =============================================================================

export interface ITwilioSubaccountService {
  /**
   * Create a new Twilio subaccount for a gym
   */
  createSubaccount(params: SubaccountCreateParams): Promise<SubaccountResult>

  /**
   * Get subaccount details
   */
  getSubaccount(accountSid: string): Promise<SubaccountResult | null>

  /**
   * Suspend a subaccount
   */
  suspendSubaccount(accountSid: string): Promise<void>

  /**
   * Activate a suspended subaccount
   */
  activateSubaccount(accountSid: string): Promise<void>
}

export interface ITwilioContentService {
  /**
   * Create a new WhatsApp template via Content API
   */
  createTemplate(
    config: TwilioConfig,
    params: ContentTemplateParams
  ): Promise<ContentTemplateResult>

  /**
   * Delete a template
   */
  deleteTemplate(config: TwilioConfig, contentSid: string): Promise<void>

  /**
   * Get template details
   */
  getTemplate(
    config: TwilioConfig,
    contentSid: string
  ): Promise<ContentTemplateResult | null>

  /**
   * List all templates for an account
   */
  listTemplates(config: TwilioConfig): Promise<ContentTemplateResult[]>

  /**
   * Get template approval status
   */
  getApprovalStatus(
    config: TwilioConfig,
    contentSid: string
  ): Promise<ContentApprovalStatus>
}

export interface ITwilioMessagingService {
  /**
   * Send a WhatsApp template message
   */
  sendWhatsAppTemplate(
    config: TwilioConfig,
    params: SendMessageParams
  ): Promise<SendMessageResult>

  /**
   * Get message delivery status
   */
  getMessageStatus(
    config: TwilioConfig,
    messageSid: string
  ): Promise<MessageStatusResult>
}
