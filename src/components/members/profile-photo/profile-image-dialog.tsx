'use client'

import { useRef, useState, useCallback } from 'react'
import { Upload, ImageIcon, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MAX_FILE_SIZES } from '@/lib/storage'

import { AvatarGrid } from './avatar-grid'
import { ImagePreview } from './image-preview'
import type { ProfileImageState } from '@/hooks/use-profile-image-picker'

interface ProfileImageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  state: ProfileImageState
  error: string | null
  hasChanges: boolean
  onSelectAvatar: (avatarPath: string) => void
  onSelectFile: (file: File) => void
  onClearSelection: () => void
  onSave: () => Promise<void>
  onCancel: () => void
  isSaving?: boolean
}

/**
 * Dialog for selecting profile image (upload or avatar)
 */
export function ProfileImageDialog({
  open,
  onOpenChange,
  state,
  error,
  hasChanges,
  onSelectAvatar,
  onSelectFile,
  onClearSelection,
  onSave,
  onCancel,
  isSaving = false,
}: ProfileImageDialogProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Determine which tab to show based on current state
  const defaultTab = state.type === 'upload' ? 'upload' : 'avatars'

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) {
        onSelectFile(file)
      }
    },
    [onSelectFile]
  )

  // Handle file input change
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        onSelectFile(file)
      }
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    },
    [onSelectFile]
  )

  // Get preview URL based on state
  const getPreviewUrl = (): string | null => {
    if (state.type === 'upload') return state.previewUrl
    if (state.type === 'avatar') return state.avatarPath
    return null
  }

  const previewUrl = getPreviewUrl()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Foto de perfil</DialogTitle>
          <DialogDescription>
            Sube una imagen o selecciona un avatar
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="upload" className="flex-1 gap-2">
              <Upload className="h-4 w-4" />
              Subir
            </TabsTrigger>
            <TabsTrigger value="avatars" className="flex-1 gap-2">
              <ImageIcon className="h-4 w-4" />
              Avatares
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            <div className="space-y-4">
              {/* Upload zone */}
              <div
                className={cn(
                  'relative border-2 border-dashed rounded-lg p-8 transition-colors',
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50',
                  'cursor-pointer'
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2 text-center">
                  <Upload className="h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Arrastra una imagen o haz clic para seleccionar
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    JPG, PNG o WebP. Max {MAX_FILE_SIZES.avatars}MB
                  </p>
                </div>
              </div>

              {/* Preview for upload */}
              {state.type === 'upload' && (
                <div className="flex justify-center">
                  <ImagePreview
                    src={state.previewUrl}
                    alt="Preview"
                    onRemove={onClearSelection}
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="avatars" className="mt-4">
            <AvatarGrid
              selectedAvatar={state.type === 'avatar' ? state.avatarPath : null}
              onSelect={onSelectAvatar}
            />
          </TabsContent>
        </Tabs>

        {/* Error message */}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {/* Current selection preview (when avatar is selected) */}
        {state.type === 'avatar' && previewUrl && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <ImagePreview
              src={previewUrl}
              alt="Selected"
              className="w-12 h-12"
              showRemoveButton={false}
            />
            <div className="flex-1">
              <p className="text-sm font-medium">Avatar seleccionado</p>
              <p className="text-xs text-muted-foreground">
                Haz clic en Guardar para confirmar
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {/* Remove button - only show if there's something selected */}
          {state.type !== 'none' && (
            <Button
              type="button"
              variant="ghost"
              onClick={onClearSelection}
              disabled={isSaving}
              className="text-destructive hover:text-destructive"
            >
              Quitar
            </Button>
          )}

          <div className="flex gap-2 ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={onSave}
              disabled={!hasChanges || isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
