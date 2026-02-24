'use client'

/**
 * File Upload Limits Hook
 *
 * Provides plan-based file size limits for client-side validation
 */

import { useCallback, useState } from 'react'
import { checkOrgFileSizeLimit, checkOrgStorageLimit } from '@/actions/storage.actions'

// =============================================================================
// TYPES
// =============================================================================

export interface FileValidationResult {
  allowed: boolean
  message?: string
  limitType?: 'file_size' | 'storage'
}

export interface UseFileUploadLimitsReturn {
  /** Validate a file before upload */
  validateFile: (file: File) => Promise<FileValidationResult>
  /** Check if a file size is within limits */
  checkFileSize: (sizeBytes: number) => Promise<{ allowed: boolean; maxSizeMB: number; message?: string }>
  /** Check remaining storage */
  checkStorage: (additionalBytes: number) => Promise<{ allowed: boolean; usedGB: number; limitGB: number; message?: string }>
  /** Whether validation is in progress */
  isValidating: boolean
}

// =============================================================================
// HOOK
// =============================================================================

export function useFileUploadLimits(): UseFileUploadLimitsReturn {
  const [isValidating, setIsValidating] = useState(false)

  const checkFileSize = useCallback(async (sizeBytes: number) => {
    return checkOrgFileSizeLimit(sizeBytes)
  }, [])

  const checkStorage = useCallback(async (additionalBytes: number) => {
    return checkOrgStorageLimit(additionalBytes)
  }, [])

  const validateFile = useCallback(async (file: File): Promise<FileValidationResult> => {
    setIsValidating(true)
    try {
      // Check file size limit first
      const sizeCheck = await checkFileSize(file.size)
      if (!sizeCheck.allowed) {
        return {
          allowed: false,
          message: sizeCheck.message,
          limitType: 'file_size',
        }
      }

      // Check storage limit
      const storageCheck = await checkStorage(file.size)
      if (!storageCheck.allowed) {
        return {
          allowed: false,
          message: storageCheck.message,
          limitType: 'storage',
        }
      }

      return { allowed: true }
    } finally {
      setIsValidating(false)
    }
  }, [checkFileSize, checkStorage])

  return {
    validateFile,
    checkFileSize,
    checkStorage,
    isValidating,
  }
}

// =============================================================================
// UTILITY: Format file size for display
// =============================================================================

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`
}
