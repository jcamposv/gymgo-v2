'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Dumbbell } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useOrganizationSettings } from '@/providers'
import { Skeleton } from '@/components/ui/skeleton'

const DEFAULT_LOGO_PATH = '/default-logo.svg'

interface AppLogoProps {
  /** Show only the icon (collapsed mode) */
  collapsed?: boolean
  /** Custom class name */
  className?: string
  /** Click handler (optional, defaults to link behavior) */
  onClick?: () => void
}

/**
 * App logo component that displays organization logo with fallback
 * Uses OrganizationContext to get the logo URL
 */
export function AppLogo({ collapsed, className, onClick }: AppLogoProps) {
  const { settings, loading } = useOrganizationSettings()

  const logoUrl = settings?.logoUrl || DEFAULT_LOGO_PATH
  const orgName = settings?.name || 'GymGo'

  // Show skeleton while loading
  if (loading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Skeleton className="h-8 w-8 rounded-md" />
        {!collapsed && <Skeleton className="h-5 w-20" />}
      </div>
    )
  }

  // Logo image or fallback icon
  const logoElement = settings?.logoUrl ? (
    <Image
      src={logoUrl}
      alt={orgName}
      width={52}
      height={52}
      className="h-10 w-10 rounded-md object-contain shrink-0"
    />
  ) : (
    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary shrink-0">
      <Dumbbell className="h-5 w-5 text-primary-foreground" />
    </div>
  )

  // Full content with optional text
  const content = (
    <>
      {logoElement}
    </>
  )

  // If onClick is provided, use a button/div instead of Link
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'flex items-center gap-2 hover:opacity-80 transition-opacity',
          collapsed && 'justify-center w-full',
          className
        )}
      >
        {content}
      </button>
    )
  }

  // Default: wrap in Link to dashboard
  return (
    <Link
      href="/dashboard"
      className={cn(
        'flex items-center gap-2 hover:opacity-80 transition-opacity',
        collapsed && 'justify-center w-full',
        className
      )}
    >
      {content}
    </Link>
  )
}
