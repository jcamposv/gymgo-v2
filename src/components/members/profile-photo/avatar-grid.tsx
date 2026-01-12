'use client'

import Image from 'next/image'
import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'
import { AVATARS } from '@/config/avatars'

interface AvatarGridProps {
  selectedAvatar: string | null
  onSelect: (avatarPath: string) => void
  className?: string
}

/**
 * Grid component displaying available avatars for selection
 */
export function AvatarGrid({ selectedAvatar, onSelect, className }: AvatarGridProps) {
  return (
    <div className={cn('grid grid-cols-5 gap-3', className)}>
      {AVATARS.map((avatarPath) => {
        const isSelected = selectedAvatar === avatarPath

        return (
          <button
            key={avatarPath}
            type="button"
            onClick={() => onSelect(avatarPath)}
            className={cn(
              'relative aspect-square rounded-xl overflow-hidden',
              'transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              'hover:scale-105 hover:shadow-md',
              isSelected && 'ring-2 ring-primary ring-offset-2'
            )}
          >
            <Image
              src={avatarPath}
              alt="Avatar option"
              fill
              className="object-cover"
              sizes="80px"
            />
            {isSelected && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <div className="bg-primary rounded-full p-1">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
