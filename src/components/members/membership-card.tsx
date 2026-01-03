'use client'

import { Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { membershipLabels, formatValidityDate } from '@/lib/i18n'
import type { MemberExtended } from '@/types/member.types'

// =============================================================================
// TYPES
// =============================================================================

interface MembershipCardProps {
  member: MemberExtended
  className?: string
}

type CardColorScheme = {
  bg: string
  badge: string
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Determina el esquema de colores basado en el precio del plan
 * Planes más caros = colores más premium
 */
function getCardColorsFromPlan(plan: MemberExtended['current_plan']): CardColorScheme {
  if (!plan) {
    // Sin plan - color gris
    return { bg: 'from-gray-500 to-gray-700', badge: 'bg-gray-600' }
  }

  const price = plan.price

  // VIP/Premium: precio >= 2000
  if (price >= 2000) {
    return { bg: 'from-black to-gray-800', badge: 'bg-black' }
  }

  // Gold: precio >= 1000
  if (price >= 1000) {
    return { bg: 'from-yellow-500 to-yellow-700', badge: 'bg-yellow-600' }
  }

  // Premium: precio >= 500
  if (price >= 500) {
    return { bg: 'from-purple-600 to-purple-800', badge: 'bg-purple-600' }
  }

  // Blue/Standard: default
  return { bg: 'from-lime-600 to-lime-800', badge: 'bg-lime-700' }
}

/**
 * Obtiene el nombre a mostrar en el badge de la tarjeta
 */
function getPlanBadgeText(plan: MemberExtended['current_plan']): string {
  if (!plan) {
    return membershipLabels.noPlan || 'SIN PLAN'
  }
  return plan.name.toUpperCase()
}

/**
 * Formatea el periodo de facturación
 */
function getBillingPeriodLabel(period: string): string {
  const labels: Record<string, string> = {
    monthly: 'Mensual',
    quarterly: 'Trimestral',
    yearly: 'Anual',
    one_time: 'Pago único',
  }
  return labels[period] || period
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// =============================================================================
// COMPONENT
// =============================================================================

export function MembershipCard({ member, className }: MembershipCardProps) {
  const plan = member.current_plan
  const colors = getCardColorsFromPlan(plan)

  const validUntil = member.membership_end_date
    ? formatValidityDate(member.membership_end_date)
    : '-'

  const badgeText = getPlanBadgeText(plan)

  return (
    <Card className={cn('overflow-hidden border-0 shadow-none py-0', className)}>
      <CardContent className={cn('p-0')}>
        <div className={cn('bg-gradient-to-br p-5 text-white rounded-xl', colors.bg)}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold text-sm">{member.gym_name || 'WellNest GymGo'}</span>
            </div>
            {plan && (
              <span className="text-xs text-white/70">
                {getBillingPeriodLabel(plan.billing_period)}
              </span>
            )}
          </div>

          {/* Plan Badge */}
          <div className="mb-8">
            <span className={cn('px-3 py-1.5 rounded text-xs font-bold', colors.badge)}>
              {badgeText}
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
