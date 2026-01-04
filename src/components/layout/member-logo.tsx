'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Dumbbell } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useOrganizationSettings } from '@/providers'
import { Skeleton } from '@/components/ui/skeleton'

const DEFAULT_LOGO_PATH = '/default-logo.svg'

interface MemberLogoProps {
  /** Custom class name */
  className?: string
}

/**
 * Member logo component that displays organization logo with fallback
 * Similar to AppLogo but links to /member instead of /dashboard
 */
export function MemberLogo({ className }: MemberLogoProps) {
  const { settings, loading } = useOrganizationSettings()

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

  // Logo image or fallback icon
  const logoElement = settings?.logoUrl ? (
    <Image
      src={logoUrl}
      alt={orgName}
      width={40}
      height={40}
      className="h-8 w-8 rounded-md object-contain shrink-0"
    />
  ) : (
    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-lime-600 shrink-0">
      <Dumbbell className="h-5 w-5 text-white" />
    </div>
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
      <span className="font-bold hidden sm:inline">{orgName}</span>
    </Link>
  )
}
