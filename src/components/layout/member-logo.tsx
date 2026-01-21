'use client'

import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/utils'
import { useOrganizationSettings } from '@/providers'
import { Skeleton } from '@/components/ui/skeleton'

const DEFAULT_LOGO_PATH = '/default-logo.svg'

interface MemberLogoProps {
  /** Custom class name */
  className?: string
}

/**
 * Member logo component that displays organization logo with fallback to default GymGo logo
 * Similar to AppLogo but links to /member instead of /dashboard
 */
export function MemberLogo({ className }: MemberLogoProps) {
  const { settings, loading } = useOrganizationSettings()

  const hasCustomLogo = !!settings?.logoUrl
  const logoUrl = settings?.logoUrl || DEFAULT_LOGO_PATH
  const orgName = settings?.name || 'GymGo'

  // Show skeleton while loading
  if (loading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    )
  }

  // Logo image - custom org logo or default GymGo logo
  const logoElement = hasCustomLogo ? (
    <Image
      src={logoUrl}
      alt={orgName}
      width={40}
      height={40}
      className="h-8 w-8 rounded-md object-contain shrink-0"
    />
  ) : (
    <Image
      src={DEFAULT_LOGO_PATH}
      alt="GymGo"
      width={120}
      height={32}
      className="h-7 w-auto shrink-0"
    />
  )

  return (
    <Link
      href="/member"
      className={cn(
        'flex items-center gap-2 hover:opacity-80 transition-opacity',
        className
      )}
    >
      {logoElement}
      {hasCustomLogo && (
        <span className="font-bold hidden sm:inline">{orgName}</span>
      )}
    </Link>
  )
}
