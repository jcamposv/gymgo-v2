'use client'

import { useState } from 'react'
import { ExternalLink, Image as ImageIcon, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

interface ExerciseMediaPlayerProps {
  videoUrl?: string | null
  gifUrl?: string | null
  thumbnailUrl?: string | null
  title: string
  className?: string
}

/**
 * ExerciseMediaPlayer - Inline media player for exercise detail page
 *
 * Priority:
 * 1. gif_url (image/gif) - Render as img
 * 2. video_url - Render as HTML5 video player with controls
 * 3. No media - Show placeholder
 *
 * Features:
 * - Inline video playback (no new tab)
 * - Poster/thumbnail support
 * - Loading state
 * - Error handling
 * - "Open in new tab" secondary action
 */
export function ExerciseMediaPlayer({
  videoUrl,
  gifUrl,
  thumbnailUrl,
  title,
  className,
}: ExerciseMediaPlayerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Priority 1: GIF/Image
  if (gifUrl) {
    return (
      <div className={cn('rounded-lg overflow-hidden bg-muted relative', className)}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        <img
          src={gifUrl}
          alt={title}
          className={cn(
            'w-full object-contain max-h-80 transition-opacity',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false)
            setHasError(true)
          }}
        />
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-2" />
              <p className="text-sm">Error al cargar la imagen</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Priority 2: Video
  if (videoUrl) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="rounded-lg overflow-hidden bg-black relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          <video
            src={videoUrl}
            poster={thumbnailUrl || undefined}
            controls
            playsInline
            preload="metadata"
            className={cn(
              'w-full aspect-video',
              hasError && 'hidden'
            )}
            onLoadedData={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false)
              setHasError(true)
            }}
          >
            Tu navegador no soporta la reproduccion de video.
          </video>
          {hasError && (
            <div className="aspect-video flex items-center justify-center bg-muted">
              <div className="text-center text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                <p className="text-sm">Error al cargar el video</p>
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm mt-2 inline-flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Abrir en nueva pestana
                </a>
              </div>
            </div>
          )}
        </div>
        {/* Secondary action - Open in new tab */}
        {!hasError && (
          <div className="flex justify-end">
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Abrir en nueva pestana
            </a>
          </div>
        )}
      </div>
    )
  }

  // Priority 3: No media
  return (
    <div className={cn('aspect-video rounded-lg bg-muted flex items-center justify-center', className)}>
      <div className="text-center text-muted-foreground">
        <ImageIcon className="h-12 w-12 mx-auto mb-2" />
        <p>Sin demostracion disponible</p>
      </div>
    </div>
  )
}
