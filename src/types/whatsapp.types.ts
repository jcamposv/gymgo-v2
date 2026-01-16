/**
 * WhatsApp Module Types
 *
 * Type definitions for the WhatsApp payment reminders system.
 */

// =============================================================================
// ENUMS
// =============================================================================

export type WhatsAppTemplateType =
  | 'payment_reminder'
  | 'payment_overdue'
  | 'payment_confirmation'
  | 'membership_expiring'
  | 'membership_expired'
  | 'welcome'
  | 'custom'

export type WhatsAppTemplateStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'disabled'

export type WhatsAppSetupStatus =
  | 'pending'
  | 'phone_pending'
  | 'active'
  | 'suspended'

export type NotificationChannel = 'push' | 'whatsapp' | 'email' | 'sms'

export type NotificationDeliveryStatus =
  | 'pending'
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'undelivered'

// =============================================================================
// GYM WHATSAPP SETTINGS
// =============================================================================

export interface GymWhatsAppSettings {
  id: string
  organization_id: string
  twilio_account_sid: string
  twilio_auth_token: string
  twilio_subaccount_name: string | null
  whatsapp_phone_number: string | null
  whatsapp_sender_sid: string | null
  is_enabled: boolean
  reminder_days_before: number[]
  reminder_hour: number
  auto_opt_in_new_members: boolean
  send_payment_confirmation: boolean
  send_membership_expiry_warning: boolean
  setup_status: WhatsAppSetupStatus
  last_sync_at: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface GymWhatsAppSettingsInput {
  is_enabled?: boolean
  reminder_days_before?: number[]
  reminder_hour?: number
  auto_opt_in_new_members?: boolean
  send_payment_confirmation?: boolean
  send_membership_expiry_warning?: boolean
}

// =============================================================================
// WHATSAPP TEMPLATES
// =============================================================================

export interface TemplateVariable {
  key: string
  type: 'text' | 'date' | 'currency' | 'url'
  example: string
  description?: string
}

export interface TemplateCtaButton {
  type: 'url' | 'phone' | 'quick_reply'
  text: string
  url?: string
  phone?: string
}

export interface WhatsAppTemplate {
  id: string
  organization_id: string
  name: string
  template_type: WhatsAppTemplateType
  twilio_content_sid: string | null
  twilio_template_name: string | null
  language: string
  header_text: string | null
  body_text: string
  footer_text: string | null
  variables: TemplateVariable[]
  cta_buttons: TemplateCtaButton[]
  status: WhatsAppTemplateStatus
  rejection_reason: string | null
  is_default: boolean
  last_used_at: string | null
  send_count: number
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface WhatsAppTemplateInput {
  name: string
  template_type: WhatsAppTemplateType
  language?: string
  header_text?: string | null
  body_text: string
  footer_text?: string | null
  variables?: TemplateVariable[]
  cta_buttons?: TemplateCtaButton[]
  is_default?: boolean
}

// =============================================================================
// MEMBER NOTIFICATION PREFERENCES
// =============================================================================

export interface MemberNotificationPreferences {
  id: string
  member_id: string
  organization_id: string
  whatsapp_phone: string | null
  whatsapp_phone_verified: boolean
  whatsapp_opted_in: boolean
  whatsapp_opted_in_at: string | null
  whatsapp_opted_out_at: string | null
  receive_payment_reminders: boolean
  receive_payment_confirmations: boolean
  receive_membership_alerts: boolean
  receive_class_reminders: boolean
  receive_promotional: boolean
  push_enabled: boolean
  push_payment_reminders: boolean
  push_class_reminders: boolean
  quiet_hours_start: string | null
  quiet_hours_end: string | null
  created_at: string
  updated_at: string
}

export interface MemberNotificationPreferencesInput {
  whatsapp_phone?: string | null
  whatsapp_opted_in?: boolean
  receive_payment_reminders?: boolean
  receive_payment_confirmations?: boolean
  receive_membership_alerts?: boolean
  receive_class_reminders?: boolean
  receive_promotional?: boolean
  push_enabled?: boolean
  push_payment_reminders?: boolean
  push_class_reminders?: boolean
  quiet_hours_start?: string | null
  quiet_hours_end?: string | null
}

// =============================================================================
// NOTIFICATION DELIVERY LOG
// =============================================================================

export interface NotificationDeliveryLog {
  id: string
  organization_id: string
  member_id: string | null
  channel: NotificationChannel
  notification_type: string
  template_id: string | null
  subject: string | null
  body: string
  variables_used: Record<string, string> | null
  recipient_phone: string | null
  recipient_email: string | null
  recipient_device_token: string | null
  provider: string | null
  provider_message_id: string | null
  provider_status: string | null
  provider_response: Record<string, unknown> | null
  status: NotificationDeliveryStatus
  sent_at: string | null
  delivered_at: string | null
  read_at: string | null
  failed_at: string | null
  error_message: string | null
  error_code: string | null
  retry_count: number
  max_retries: number
  next_retry_at: string | null
  idempotency_key: string | null
  created_at: string
  updated_at: string
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

export interface TestSendRequest {
  template_id: string
  phone_number: string
  variables?: Record<string, string>
}

export interface TestSendResponse {
  success: boolean
  message_sid?: string
  error?: string
}

export interface TwilioWebhookPayload {
  MessageSid: string
  MessageStatus: string
  To: string
  From: string
  ErrorCode?: string
  ErrorMessage?: string
  Body?: string
}

// =============================================================================
// DELIVERY LOG FILTERS
// =============================================================================

export interface DeliveryLogFilters {
  channel?: NotificationChannel
  status?: NotificationDeliveryStatus
  notification_type?: string
  member_id?: string
  from_date?: string
  to_date?: string
  page?: number
  limit?: number
}
