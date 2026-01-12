'use client'

import { useState, useCallback, useEffect } from 'react'
import { validateFile, MAX_FILE_SIZES, ALLOWED_FILE_TYPES } from '@/lib/storage'

// =============================================================================
// TYPES
// =============================================================================

export type ProfileImageState =
  | { type: 'none' }
  | { type: 'avatar'; avatarPath: string }
  | { type: 'upload'; file: File; previewUrl: string }

export interface ProfileImagePickerOptions {
  maxSizeMB?: number
  allowedTypes?: string[]
}

export interface UseProfileImagePickerReturn {
  /** Current selection state */
  state: ProfileImageState
  /** Error message if validation fails */
  error: string | null
  /** Whether there are unsaved changes */
  hasChanges: boolean
  /** Select an avatar */
  selectAvatar: (avatarPath: string) => void
  /** Handle file selection */
  selectFile: (file: File) => void
  /** Clear selection (set to none) */
  clearSelection: () => void
  /** Reset to initial state */
  reset: () => void
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook to manage profile image picker state
 * Handles avatar selection, file upload validation, and blob URL cleanup
 */
export function useProfileImagePicker(
  initialValue: { avatarUrl: string | null },
  options: ProfileImagePickerOptions = {}
): UseProfileImagePickerReturn {
  const {
    maxSizeMB = MAX_FILE_SIZES.avatars,
    allowedTypes = ALLOWED_FILE_TYPES.avatars,
  } = options

  // Derive initial state from props
  const getInitialState = useCallback((): ProfileImageState => {
    const { avatarUrl } = initialValue

    if (!avatarUrl) {
      return { type: 'none' }
    }

    // Check if it's a local avatar path
    if (avatarUrl.startsWith('/avatar/')) {
      return { type: 'avatar', avatarPath: avatarUrl }
    }

    // It's an uploaded image URL - treat as avatar type with the full URL
    return { type: 'avatar', avatarPath: avatarUrl }
  }, [initialValue])

  const [state, setState] = useState<ProfileImageState>(getInitialState)
  const [initialState] = useState<ProfileImageState>(getInitialState)
  const [error, setError] = useState<string | null>(null)

  // Cleanup blob URLs on unmount or when state changes
  useEffect(() => {
    return () => {
      if (state.type === 'upload') {
        URL.revokeObjectURL(state.previewUrl)
      }
    }
  }, [state])

  // Check if there are unsaved changes
  const hasChanges = useCallback(() => {
    if (state.type !== initialState.type) return true

    if (state.type === 'avatar' && initialState.type === 'avatar') {
      return state.avatarPath !== initialState.avatarPath
    }

    if (state.type === 'upload') return true

    return false
  }, [state, initialState])

  // Select an avatar
  const selectAvatar = useCallback((avatarPath: string) => {
    // Cleanup previous blob URL if exists
    setState((prev) => {
      if (prev.type === 'upload') {
        URL.revokeObjectURL(prev.previewUrl)
      }
      return { type: 'avatar', avatarPath }
    })
    setError(null)
  }, [])

  // Handle file selection
  const selectFile = useCallback(
    (file: File) => {
      // Validate file
      const validation = validateFile(file, {
        maxSizeMB,
        allowedTypes,
      })

      if (!validation.valid) {
        setError(validation.error || 'Archivo invalido')
        return
      }

      // Cleanup previous blob URL if exists
      setState((prev) => {
        if (prev.type === 'upload') {
          URL.revokeObjectURL(prev.previewUrl)
        }
        return {
          type: 'upload',
          file,
          previewUrl: URL.createObjectURL(file),
        }
      })
      setError(null)
    },
    [maxSizeMB, allowedTypes]
  )

  // Clear selection
  const clearSelection = useCallback(() => {
    setState((prev) => {
      if (prev.type === 'upload') {
        URL.revokeObjectURL(prev.previewUrl)
      }
      return { type: 'none' }
    })
    setError(null)
  }, [])

  // Reset to initial state
  const reset = useCallback(() => {
    setState((prev) => {
      if (prev.type === 'upload') {
        URL.revokeObjectURL(prev.previewUrl)
      }
      return getInitialState()
    })
    setError(null)
  }, [getInitialState])

  return {
    state,
    error,
    hasChanges: hasChanges(),
    selectAvatar,
    selectFile,
    clearSelection,
    reset,
  }
}
