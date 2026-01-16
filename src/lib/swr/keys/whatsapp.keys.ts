/**
 * WhatsApp Module SWR Keys
 *
 * Centralized key management for the WhatsApp module.
 * Ensures consistent cache keys across the application.
 */

import { serializeKey } from '../fetcher'
import type { DeliveryLogFilters } from '@/types/whatsapp.types'

// =============================================================================
// KEY PREFIXES
// =============================================================================

export const WHATSAPP_KEY_PREFIX = {
  settings: 'whatsapp-settings',
  templates: 'whatsapp-templates',
  deliveryLogs: 'whatsapp-delivery-logs',
  memberPreferences: 'whatsapp-member-preferences',
} as const

// =============================================================================
// PARAM TYPES
// =============================================================================

export interface WhatsAppDeliveryLogParams {
  channel?: string
  status?: string
  notification_type?: string
  member_id?: string
  from_date?: string
  to_date?: string
  page?: number
  limit?: number
}

// =============================================================================
// KEY GENERATORS
// =============================================================================

export const whatsappKeys = {
  /**
   * All whatsapp-related keys (for bulk invalidation)
   */
  all: () => ['whatsapp'] as const,

  /**
   * WhatsApp settings key
   */
  settings: (): string => {
    return serializeKey(WHATSAPP_KEY_PREFIX.settings, {})
  },

  /**
   * WhatsApp templates list key
   */
  templates: (): string => {
    return serializeKey(WHATSAPP_KEY_PREFIX.templates, {})
  },

  /**
   * Single WhatsApp template key
   */
  template: (id: string): string => {
    return serializeKey(`${WHATSAPP_KEY_PREFIX.templates}-detail`, { id })
  },

  /**
   * Delivery logs key with filters
   */
  deliveryLogs: (params: WhatsAppDeliveryLogParams = {}): string => {
    return serializeKey(WHATSAPP_KEY_PREFIX.deliveryLogs, {
      channel: params.channel,
      status: params.status,
      notification_type: params.notification_type,
      member_id: params.member_id,
      from_date: params.from_date,
      to_date: params.to_date,
      page: params.page || 1,
      limit: params.limit || 20,
    })
  },

  /**
   * Member notification preferences key
   */
  memberPreferences: (memberId: string): string => {
    return serializeKey(WHATSAPP_KEY_PREFIX.memberPreferences, { memberId })
  },
}

// =============================================================================
// KEY MATCHERS (for selective invalidation)
// =============================================================================

export const whatsappKeyMatchers = {
  /**
   * Matches any whatsapp key
   */
  isWhatsAppKey: (key: unknown): boolean => {
    if (typeof key !== 'string') return false
    try {
      const parsed = JSON.parse(key)
      if (!Array.isArray(parsed)) return false
      return typeof parsed[0] === 'string' && parsed[0].startsWith('whatsapp-')
    } catch {
      return false
    }
  },

  /**
   * Matches settings keys
   */
  isSettingsKey: (key: unknown): boolean => {
    if (typeof key !== 'string') return false
    try {
      const parsed = JSON.parse(key)
      return Array.isArray(parsed) && parsed[0] === WHATSAPP_KEY_PREFIX.settings
    } catch {
      return false
    }
  },

  /**
   * Matches template keys
   */
  isTemplateKey: (key: unknown): boolean => {
    if (typeof key !== 'string') return false
    try {
      const parsed = JSON.parse(key)
      return (
        Array.isArray(parsed) &&
        parsed[0].startsWith(WHATSAPP_KEY_PREFIX.templates)
      )
    } catch {
      return false
    }
  },

  /**
   * Matches delivery log keys
   */
  isDeliveryLogKey: (key: unknown): boolean => {
    if (typeof key !== 'string') return false
    try {
      const parsed = JSON.parse(key)
      return (
        Array.isArray(parsed) && parsed[0] === WHATSAPP_KEY_PREFIX.deliveryLogs
      )
    } catch {
      return false
    }
  },
}
