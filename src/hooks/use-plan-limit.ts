'use client'

/**
 * Plan Limit Hook
 *
 * React hook for handling plan limit errors and displaying upgrade prompts.
 */

import { useState, useCallback } from 'react'
import {
  isPlanLimitError,
  extractPlanLimitData,
  showPlanLimitToast,
  handleActionResult,
  type ActionResultWithErrors,
  type PlanLimitErrorData,
} from '@/lib/plan-limit-errors'

// =============================================================================
// TYPES
// =============================================================================

export interface UsePlanLimitReturn {
  /** Whether a plan limit error dialog should be shown */
  showLimitDialog: boolean
  /** Data about the current limit error */
  limitErrorData: PlanLimitErrorData | null
  /** Handle an action result, returns true if successful */
  handleResult: (
    result: ActionResultWithErrors,
    options?: HandleResultOptions
  ) => boolean
  /** Clear the limit error state */
  clearLimitError: () => void
  /** Manually set a limit error to show */
  setLimitError: (data: PlanLimitErrorData) => void
}

export interface HandleResultOptions {
  /** Custom success message to show */
  successMessage?: string
  /** Custom error message for non-limit errors */
  errorMessage?: string
  /** Whether to show upgrade CTA (default: true) */
  showUpgrade?: boolean
  /** Use dialog instead of toast for limit errors (default: false) */
  useDialog?: boolean
}

// =============================================================================
// HOOK
// =============================================================================

export function usePlanLimit(): UsePlanLimitReturn {
  const [showLimitDialog, setShowLimitDialog] = useState(false)
  const [limitErrorData, setLimitErrorData] = useState<PlanLimitErrorData | null>(null)

  const handleResult = useCallback((
    result: ActionResultWithErrors,
    options?: HandleResultOptions
  ): boolean => {
    const {
      successMessage,
      errorMessage,
      showUpgrade = true,
      useDialog = false,
    } = options || {}

    if (result.success) {
      if (successMessage) {
        // Use toast from handleActionResult
        handleActionResult(result, { successMessage })
      }
      return true
    }

    // Check for plan limit error
    if (isPlanLimitError(result)) {
      const data = extractPlanLimitData(result)

      if (useDialog) {
        // Show dialog for blocking actions
        setLimitErrorData(data)
        setShowLimitDialog(true)
      } else {
        // Show toast for non-blocking actions
        showPlanLimitToast(data, { showUpgrade })
      }
      return false
    }

    // Regular error - use toast
    handleActionResult(result, { errorMessage })
    return false
  }, [])

  const clearLimitError = useCallback(() => {
    setShowLimitDialog(false)
    setLimitErrorData(null)
  }, [])

  const setLimitError = useCallback((data: PlanLimitErrorData) => {
    setLimitErrorData(data)
    setShowLimitDialog(true)
  }, [])

  return {
    showLimitDialog,
    limitErrorData,
    handleResult,
    clearLimitError,
    setLimitError,
  }
}

// Re-export utilities for convenience
export {
  isPlanLimitError,
  extractPlanLimitData,
  showPlanLimitToast,
  handleActionResult,
  formatUsage,
  getUsagePercentage,
  getUsageColor,
  getUsageBgColor,
} from '@/lib/plan-limit-errors'

export type { PlanLimitErrorData, ActionResultWithErrors } from '@/lib/plan-limit-errors'
