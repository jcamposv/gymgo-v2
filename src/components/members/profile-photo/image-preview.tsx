'use client'

import Image from 'next/image'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ImagePreviewProps {
  src: string
  alt?: string
  onRemove?: () => void
  className?: string
  showRemoveButton?: boolean
}

/**
 * Preview component for uploaded images or selected avatars
 */
export function ImagePreview({
  src,
  alt = 'Preview',
  onRemove,
  className,
  showRemoveButton = true,
}: ImagePreviewProps) {
  return (
    <div
      className={cn(
        'relative w-32 h-32 rounded-xl overflow-hidden border-2 border-dashed border-muted-foreground/25',
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="128px"
        unoptimized={src.startsWith('blob:')}
      />
      {showRemoveButton && onRemove && (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-1 right-1 h-6 w-6 rounded-full shadow-md"
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
