'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, X, Loader2, Image as ImageIcon, Film } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  uploadFile,
  deleteFile,
  extractPathFromUrl,
  validateFile,
  type StorageBucket,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZES,
} from '@/lib/storage'
import { checkOrgFileSizeLimit, checkOrgStorageLimit } from '@/actions/storage.actions'

interface ImageUploadProps {
  value?: string | null
  onChange: (url: string | null) => void
  organizationId: string
  bucket: StorageBucket
  folder?: string
  accept?: 'images' | 'videos' | 'all'
  className?: string
  aspectRatio?: 'square' | 'video' | 'banner' | 'auto'
  placeholder?: string
  disabled?: boolean
}

export function ImageUpload({
  value,
  onChange,
  organizationId,
  bucket,
  folder,
  accept = 'images',
  className,
  aspectRatio = 'auto',
  placeholder = 'Arrastra una imagen o haz clic para seleccionar',
  disabled = false,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [planMaxSizeMB, setPlanMaxSizeMB] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch plan-based max file size on mount
  useEffect(() => {
    checkOrgFileSizeLimit(0).then((result) => {
      if (result.maxSizeMB) {
        setPlanMaxSizeMB(result.maxSizeMB)
      }
    })
  }, [])

  // Determinar tipos permitidos
  const getAllowedTypes = () => {
    if (bucket === 'exercises') {
      if (accept === 'images') return ALLOWED_FILE_TYPES.exercises.images
      if (accept === 'videos') return ALLOWED_FILE_TYPES.exercises.videos
      return ALLOWED_FILE_TYPES.exercises.all
    }
    return ALLOWED_FILE_TYPES[bucket]
  }

  const allowedTypes = getAllowedTypes()
  const maxSizeMB = MAX_FILE_SIZES[bucket]

  // Manejar subida de archivo
  const handleUpload = useCallback(async (file: File) => {
    setError(null)

    // Validar tipo de archivo (local validation - fast)
    const typeValidation = validateFile(file, {
      maxSizeMB: 500, // High limit for type check only
      allowedTypes,
    })

    if (!typeValidation.valid && typeValidation.error?.includes('Tipo')) {
      setError(typeValidation.error || 'Tipo de archivo no permitido')
      return
    }

    setIsUploading(true)

    try {
      // Validate file size against plan limits (server-side)
      const fileSizeCheck = await checkOrgFileSizeLimit(file.size)
      if (!fileSizeCheck.allowed) {
        setError(fileSizeCheck.message || `El archivo excede el límite de ${fileSizeCheck.maxSizeMB}MB de tu plan`)
        setIsUploading(false)
        return
      }

      // Check storage limits
      const storageCheck = await checkOrgStorageLimit(file.size)
      if (!storageCheck.allowed) {
        setError(storageCheck.message || 'Límite de almacenamiento alcanzado')
        setIsUploading(false)
        return
      }

      // Si hay una imagen existente, eliminarla primero
      if (value) {
        const oldPath = extractPathFromUrl(value, bucket)
        if (oldPath) {
          await deleteFile(bucket, oldPath)
        }
      }

      // Subir nuevo archivo
      const result = await uploadFile(file, organizationId, {
        bucket,
        folder,
      })

      if (result.success && result.url) {
        onChange(result.url)
      } else {
        setError(result.error || 'Error al subir el archivo')
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError('Error al subir el archivo')
    } finally {
      setIsUploading(false)
    }
  }, [value, bucket, folder, organizationId, allowedTypes, onChange])

  // Manejar eliminacion
  const handleRemove = async () => {
    if (!value || disabled) return

    setIsUploading(true)
    try {
      const path = extractPathFromUrl(value, bucket)
      if (path) {
        await deleteFile(bucket, path)
      }
      onChange(null)
    } catch (err) {
      console.error('Delete error:', err)
      setError('Error al eliminar el archivo')
    } finally {
      setIsUploading(false)
    }
  }

  // Eventos de drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (disabled) return

    const file = e.dataTransfer.files[0]
    if (file) {
      handleUpload(file)
    }
  }

  // Evento de seleccion de archivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
    // Reset input para permitir seleccionar el mismo archivo
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  // Aspect ratio classes
  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    banner: 'aspect-[3/1]',
    auto: 'min-h-[200px]',
  }

  // Determinar si es video
  const isVideo = value?.match(/\.(mp4|webm)$/i)

  // Generar accept string para input
  const acceptString = allowedTypes.join(',')

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-colors overflow-hidden',
          aspectRatioClasses[aspectRatio],
          isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50',
          value && 'border-solid border-muted'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !value && inputRef.current?.click()}
      >
        {/* Input oculto */}
        <input
          ref={inputRef}
          type="file"
          accept={acceptString}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        {/* Estado: Subiendo */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Subiendo...</span>
            </div>
          </div>
        )}

        {/* Estado: Con imagen/video */}
        {value && !isUploading && (
          <>
            {isVideo ? (
              <video
                src={value}
                className="w-full h-full object-cover"
                controls
                muted
                loop
              />
            ) : (
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            )}
            {!disabled && (
              <div className="absolute top-2 right-2 flex gap-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 shadow-md"
                  onClick={(e) => {
                    e.stopPropagation()
                    inputRef.current?.click()
                  }}
                >
                  <Upload className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8 shadow-md"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove()
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* Estado: Sin imagen */}
        {!value && !isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <div className="flex items-center gap-2 mb-2">
              {accept === 'videos' ? (
                <Film className="h-10 w-10 text-muted-foreground/50" />
              ) : accept === 'all' ? (
                <>
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                  <Film className="h-8 w-8 text-muted-foreground/50" />
                </>
              ) : (
                <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
              )}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {placeholder}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Max {planMaxSizeMB ?? maxSizeMB}MB
            </p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
