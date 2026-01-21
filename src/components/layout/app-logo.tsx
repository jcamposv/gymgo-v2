'use client'

import Image from 'next/image'
import Link from 'next/link'

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
 * App logo component that displays organization logo with fallback to default GymGo logo
 * Uses OrganizationContext to get the logo URL
 */
export function AppLogo({ collapsed, className, onClick }: AppLogoProps) {
  const { settings, loading } = useOrganizationSettings()

  const hasCustomLogo = !!settings?.logoUrl
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

  // Logo image - custom org logo or default GymGo logo
  const logoElement = hasCustomLogo ? (
    <Image
      src={logoUrl}
      alt={orgName}
      width={52}
      height={52}
      className="h-10 w-10 rounded-md object-contain shrink-0"
    />
  ) : (
    <Image
      src={DEFAULT_LOGO_PATH}
      alt="GymGo"
      width={120}
      height={32}
      className={cn(
        'h-8 w-auto shrink-0',
        collapsed && 'h-8 w-8 object-contain'
      )}
    />
  )

  // Full content
  const content = <>{logoElement}</>

  // If onClick is provided, use a button instead of Link
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
