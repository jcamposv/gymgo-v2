'use client'

import { Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { membershipLabels, formatValidityDate } from '@/lib/i18n'
import type { MemberExtended, MembershipTier } from '@/types/member.types'

interface MembershipCardProps {
  member: MemberExtended
  className?: string
}

const tierColors: Record<MembershipTier, { bg: string; badge: string; text: string }> = {
  basic: { bg: 'from-gray-600 to-gray-800', badge: 'bg-gray-500', text: membershipLabels.basicMember },
  blue: { bg: 'from-lime-600 to-lime-800', badge: 'bg-blue-500', text: membershipLabels.blueMember },
  gold: { bg: 'from-yellow-500 to-yellow-700', badge: 'bg-yellow-500', text: membershipLabels.goldMember },
  premium: { bg: 'from-purple-600 to-purple-800', badge: 'bg-purple-500', text: membershipLabels.premiumMember },
  vip: { bg: 'from-black to-gray-800', badge: 'bg-black', text: membershipLabels.vipMember },
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function MembershipCard({ member, className }: MembershipCardProps) {
  const tier = member.membership_tier || 'blue'
  const colors = tierColors[tier]
  const validUntil = member.membership_end_date
    ? formatValidityDate(member.membership_end_date)
    : '-'

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className={cn('p-0')}>
        <div className={cn('bg-gradient-to-br p-5 text-white', colors.bg)}>
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5" />
            <span className="font-semibold text-sm">{member.gym_name || 'WellNest GymGo'}</span>
          </div>

          {/* Tier Badge */}
          <div className="mb-8">
            <span className={cn('px-3 py-1.5 rounded text-xs font-bold', colors.badge)}>
              {colors.text}
            </span>
          </div>

          {/* Member Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-white/30">
                <AvatarImage src={member.avatar_url || undefined} alt={member.full_name} />
                <AvatarFallback className="bg-white/20 text-white text-sm">
                  {getInitials(member.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{member.full_name}</p>
                <p className="text-xs text-white/70">
                  {member.client_id || member.access_code || member.id.slice(0, 6)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/70">{membershipLabels.validUntil}</p>
              <p className="font-semibold text-sm">{validUntil}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
