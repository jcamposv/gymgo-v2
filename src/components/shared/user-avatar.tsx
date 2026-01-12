'use client'

import { User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface UserAvatarProps {
  src?: string | null
  name?: string | null
  className?: string
  fallbackClassName?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
}

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

/**
 * Get initials from a name
 * "John Doe" -> "JD"
 * "John" -> "J"
 */
function getInitials(name?: string | null): string {
  if (!name) return ''

  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return parts[0].slice(0, 2).toUpperCase()
}

export function UserAvatar({
  src,
  name,
  className,
  fallbackClassName,
  size = 'md',
}: UserAvatarProps) {
  const initials = getInitials(name)

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {src && <AvatarImage src={src} alt={name || 'User avatar'} />}
      <AvatarFallback className={cn('text-xs font-medium', fallbackClassName)}>
        {initials || <User className={cn(iconSizes[size], 'text-muted-foreground')} />}
      </AvatarFallback>
    </Avatar>
  )
}
