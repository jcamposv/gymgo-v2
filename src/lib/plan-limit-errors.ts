/**
 * Plan Limit Error Handling (Frontend)
 *
 * Centralized handling for PLAN_LIMIT_EXCEEDED errors across the app.
 * Provides consistent UX for all plan limit violations.
 */

import { toast } from 'sonner'

// =============================================================================
// CONSTANTS
// =============================================================================

export const PLAN_LIMIT_ERROR_CODE = 'PLAN_LIMIT_EXCEEDED' as const

// Limit types for translation and display
export const LIMIT_TYPE_LABELS: Record<string, string> = {
  members: 'miembros',
  admin_users: 'usuarios del sistema',
  trainers: 'entrenadores',
  classes: 'clases',
  locations: 'ubicaciones',
  ai_requests: 'consultas de IA',
  emails: 'correos electrónicos',
  whatsapp: 'mensajes de WhatsApp',
  storage: 'almacenamiento',
  file_size: 'tamaño de archivo',
  push_notifications: 'notificaciones push',
}

// =============================================================================
// TYPES
// =============================================================================

export interface PlanLimitErrorData {
  limitType?: string
  current?: number
  limit?: number
  resetDate?: string
  message: string
}

export interface ActionResultWithErrors {
  success: boolean
  message: string
  errors?: Record<string, string[]>
  data?: unknown
}

// =============================================================================
// ERROR DETECTION
// =============================================================================

/**
 * Checks if an action result contains a plan limit error
 */
export function isPlanLimitError(result: ActionResultWithErrors): boolean {
  if (result.success) return false

  // Check for explicit PLAN_LIMIT_EXCEEDED error
  if (result.errors?.[PLAN_LIMIT_ERROR_CODE]) {
    return true
  }

  // Check for common limit-related messages
  const limitKeywords = [
    'límite',
    'limit',
    'alcanzado',
    'exceeded',
    'máximo',
    'maximum',
    'actualiza tu plan',
    'upgrade',
  ]

  const messageLower = result.message.toLowerCase()
  return limitKeywords.some(keyword => messageLower.includes(keyword))
}

/**
 * Extracts plan limit error data from an action result
 */
export function extractPlanLimitData(result: ActionResultWithErrors): PlanLimitErrorData {
  const errorMessages = result.errors?.[PLAN_LIMIT_ERROR_CODE] || []

  // Try to parse limit type from message
  let limitType: string | undefined
  for (const [key, label] of Object.entries(LIMIT_TYPE_LABELS)) {
    if (result.message.toLowerCase().includes(label)) {
      limitType = key
      break
    }
  }

  return {
    limitType,
    message: errorMessages[0] || result.message,
  }
}

// =============================================================================
// UI HANDLERS
// =============================================================================

/**
 * Shows a toast notification for plan limit errors
 * Use for non-blocking actions (e.g., failed background operations)
 */
export function showPlanLimitToast(
  data: PlanLimitErrorData,
  options?: {
    showUpgrade?: boolean
    duration?: number
  }
): void {
  const { showUpgrade = true, duration = 8000 } = options || {}

  const limitLabel = data.limitType
    ? LIMIT_TYPE_LABELS[data.limitType] || data.limitType
    : ''

  const description = data.resetDate
    ? `${data.message} Se reinicia el ${data.resetDate}.`
    : data.message

  if (showUpgrade) {
    toast.error(
      limitLabel ? `Límite de ${limitLabel} alcanzado` : 'Límite de plan alcanzado',
      {
        description,
        duration,
        action: {
          label: 'Mejorar plan',
          onClick: () => {
            window.location.href = '/pricing'
          },
        },
      }
    )
  } else {
    toast.error(
      limitLabel ? `Límite de ${limitLabel} alcanzado` : 'Límite de plan alcanzado',
      {
        description,
        duration,
      }
    )
  }
}

/**
 * Handles action result and shows appropriate feedback
 * Returns true if it was a plan limit error (handled)
 */
export function handleActionResult(
  result: ActionResultWithErrors,
  options?: {
    successMessage?: string
    errorMessage?: string
    showUpgradeOnLimit?: boolean
  }
): { wasLimitError: boolean; success: boolean } {
  const { successMessage, errorMessage, showUpgradeOnLimit = true } = options || {}

  if (result.success) {
    if (successMessage) {
      toast.success(successMessage)
    }
    return { wasLimitError: false, success: true }
  }

  // Check if it's a plan limit error
  if (isPlanLimitError(result)) {
    const limitData = extractPlanLimitData(result)
    showPlanLimitToast(limitData, { showUpgrade: showUpgradeOnLimit })
    return { wasLimitError: true, success: false }
  }

  // Regular error
  toast.error(errorMessage || 'Error', {
    description: result.message,
  })

  return { wasLimitError: false, success: false }
}

// =============================================================================
// USAGE DISPLAY HELPERS
// =============================================================================

/**
 * Formats usage as "X / Y" or "X / Ilimitado"
 */
export function formatUsage(current: number, limit: number): string {
  if (limit === -1) {
    return `${current} / Ilimitado`
  }
  return `${current} / ${limit}`
}

/**
 * Calculates usage percentage
 */
export function getUsagePercentage(current: number, limit: number): number {
  if (limit === -1) return 0
  if (limit === 0) return 100
  return Math.min(100, Math.round((current / limit) * 100))
}

/**
 * Returns color class based on usage percentage
 */
export function getUsageColor(percentage: number): string {
  if (percentage >= 90) return 'text-red-600'
  if (percentage >= 75) return 'text-amber-600'
  return 'text-green-600'
}

/**
 * Returns background color class based on usage percentage
 */
export function getUsageBgColor(percentage: number): string {
  if (percentage >= 90) return 'bg-red-500'
  if (percentage >= 75) return 'bg-amber-500'
  return 'bg-green-500'
}
