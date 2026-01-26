'use client'

import { XCircle, Clock, X } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { formatDate } from '@/schemas/membership.schema'
import type { MembershipStatus } from '@/actions/membership.actions'

interface MembershipBannerProps {
  status: MembershipStatus
  dismissible?: boolean
}

export function MembershipBanner({ status, dismissible = false }: MembershipBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  // Only show for expired or expiring soon
  if (status.status !== 'expired' && status.status !== 'expiring_soon') {
    return null
  }

  const isExpired = status.status === 'expired'

  return (
    <div
      className={`rounded-lg p-4 ${
        isExpired
          ? 'bg-red-50 border border-red-200'
          : 'bg-yellow-50 border border-yellow-200'
      }`}
    >
      <div className="flex items-start gap-3">
        {isExpired ? (
          <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
        ) : (
          <Clock className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <h4 className={`font-medium ${isExpired ? 'text-red-800' : 'text-yellow-800'}`}>
            {isExpired
              ? 'Tu membresia ha vencido'
              : `Tu membresia vence ${status.days_remaining === 1 ? 'manana' : `en ${status.days_remaining} dias`}`}
          </h4>
          <p className={`text-sm mt-1 ${isExpired ? 'text-red-700' : 'text-yellow-700'}`}>
            {isExpired ? (
              <>
                Vencio el {formatDate(status.end_date)}.
                No puedes reservar clases hasta renovar tu membresia.
              </>
            ) : (
              <>
                Vence el {formatDate(status.end_date)}.
                Renueva tu membresia para mantener acceso a todas las clases.
              </>
            )}
          </p>
          <p className={`text-sm mt-2 ${isExpired ? 'text-red-600' : 'text-yellow-600'}`}>
            Contacta a recepcion para renovar.
          </p>
        </div>

        {dismissible && !isExpired && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * Server component wrapper that fetches status and renders banner
 */
export function MembershipBannerWrapper({
  status,
  dismissible,
}: MembershipBannerProps) {
  return <MembershipBanner status={status} dismissible={dismissible} />
}
