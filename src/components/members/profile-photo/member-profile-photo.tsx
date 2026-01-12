'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { Camera } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useProfileImagePicker, type ProfileImageState } from '@/hooks/use-profile-image-picker'
import { ProfileImageDialog } from './profile-image-dialog'

// =============================================================================
// TYPES
// =============================================================================

export interface ProfilePhotoSaveData {
  type: 'none' | 'avatar' | 'upload'
  avatarPath?: string
  file?: File
}

interface MemberProfilePhotoProps {
  /** Member's full name (for initials fallback) */
  name: string
  /** Current avatar URL (can be upload URL or /avatar/... path) */
  avatarUrl: string | null
  /** Callback when user saves changes */
  onSave: (data: ProfilePhotoSaveData) => Promise<void>
  /** Size of the avatar in pixels */
  size?: number
  /** Additional class names */
  className?: string
  /** Whether the component is disabled */
  disabled?: boolean
}

// =============================================================================
// HELPERS
// =============================================================================

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Clickable profile photo component with avatar/upload picker dialog
 *
 * Features:
 * - Displays current image (uploaded URL, avatar path, or initials fallback)
 * - Hover overlay with "Cambiar" indicator
 * - Opens dialog to upload image or select avatar
 * - Keyboard accessible (Enter/Space to open)
 */
export function MemberProfilePhoto({
  name,
  avatarUrl,
  onSave,
  size = 64,
  className,
  disabled = false,
}: MemberProfilePhotoProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const picker = useProfileImagePicker({ avatarUrl })

  // Handle dialog open
  const handleOpen = useCallback(() => {
    if (disabled) return
    setIsDialogOpen(true)
  }, [disabled])

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleOpen()
      }
    },
    [handleOpen]
  )

  // Handle save
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const state = picker.state
      let saveData: ProfilePhotoSaveData

      switch (state.type) {
        case 'none':
          saveData = { type: 'none' }
          break
        case 'avatar':
          saveData = { type: 'avatar', avatarPath: state.avatarPath }
          break
        case 'upload':
          saveData = { type: 'upload', file: state.file }
          break
      }

      await onSave(saveData)
      setIsDialogOpen(false)
    } finally {
      setIsSaving(false)
    }
  }, [picker.state, onSave])

  // Handle cancel
  const handleCancel = useCallback(() => {
    picker.reset()
    setIsDialogOpen(false)
  }, [picker])

  // Determine what to display
  const hasImage = avatarUrl !== null

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          'group relative shrink-0 rounded-xl overflow-hidden',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          'transition-transform hover:scale-105',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
        style={{ width: size, height: size }}
        aria-label="Cambiar foto de perfil"
      >
        {/* Background/Image */}
        {hasImage ? (
          <Image
            src={avatarUrl}
            alt={name}
            fill
            className="object-cover"
            sizes={`${size}px`}
          />
        ) : (
          <div className="h-full w-full bg-lime-200 flex items-center justify-center">
            <span
              className="text-lime-800 font-medium"
              style={{ fontSize: size * 0.3 }}
            >
              {getInitials(name)}
            </span>
          </div>
        )}

        {/* Hover overlay */}
        {!disabled && (
          <div
            className={cn(
              'absolute inset-0 bg-black/50 flex flex-col items-center justify-center',
              'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100',
              'transition-opacity'
            )}
          >
            <Camera className="h-5 w-5 text-white" />
            <span className="text-white text-xs mt-1">Cambiar</span>
          </div>
        )}
      </button>

      <ProfileImageDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleCancel()
          else setIsDialogOpen(open)
        }}
        state={picker.state}
        error={picker.error}
        hasChanges={picker.hasChanges}
        onSelectAvatar={picker.selectAvatar}
        onSelectFile={picker.selectFile}
        onClearSelection={picker.clearSelection}
        onSave={handleSave}
        onCancel={handleCancel}
        isSaving={isSaving}
      />
    </>
  )
}
