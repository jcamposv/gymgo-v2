'use client'

import Link from 'next/link'
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  CreditCard,
  Calendar,
  ArrowRight,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  MEMBERSHIP_STATUS_CONFIG,
  formatDate,
  type MembershipStatusType,
} from '@/schemas/membership.schema'
import type { MembershipStatus } from '@/actions/membership.actions'

interface MembershipStatusCardProps {
  status: MembershipStatus
  showPaymentLink?: boolean
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'active':
      return <CheckCircle className="h-6 w-6 text-green-600" />
    case 'expiring_soon':
      return <Clock className="h-6 w-6 text-yellow-600" />
    case 'expired':
      return <XCircle className="h-6 w-6 text-red-600" />
    default:
      return <AlertCircle className="h-6 w-6 text-gray-600" />
  }
}

export function MembershipStatusCard({
  status,
  showPaymentLink = true,
}: MembershipStatusCardProps) {
  const config = MEMBERSHIP_STATUS_CONFIG[status.status as MembershipStatusType] || MEMBERSHIP_STATUS_CONFIG.no_membership

  // Calculate progress for visual indicator (e.g., 30-day rolling window)
  const progressPercentage = status.days_remaining !== null
    ? Math.max(0, Math.min(100, (status.days_remaining / 30) * 100))
    : 0

  return (
    <Card className={status.status === 'expired' ? 'border-red-200 bg-red-50/50' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-lime-600" />
            Mi Membresia
          </CardTitle>
          <Badge className={config.color}>
            <StatusIcon status={status.status} />
            <span className="ml-1">{config.label}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {status.status === 'no_membership' ? (
          <div className="text-center py-4">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-muted-foreground mb-4">
              No tienes una membresia activa
            </p>
            <p className="text-sm text-muted-foreground">
              Contacta a recepcion para activar tu membresia
            </p>
          </div>
        ) : (
          <>
            {/* Status Details */}
            <div className="space-y-3">
              {status.plan_name && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Plan</span>
                  <span className="font-medium">{status.plan_name}</span>
                </div>
              )}

              {status.end_date && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {status.status === 'expired' ? 'Vencio' : 'Vence'}
                  </span>
                  <span className={`font-medium ${status.status === 'expired' ? 'text-red-600' : ''}`}>
                    {formatDate(status.end_date)}
                  </span>
                </div>
              )}

              {status.days_remaining !== null && status.days_remaining > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Dias restantes</span>
                    <span className="font-medium">{status.days_remaining} dias</span>
                  </div>
                  <Progress
                    value={progressPercentage}
                    className={`h-2 ${
                      status.status === 'expiring_soon' ? '[&>div]:bg-yellow-500' : '[&>div]:bg-lime-500'
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Warning for expiring soon */}
            {status.is_expiring_soon && (
              <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <p className="text-sm text-yellow-800 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Tu membresia vence pronto. Renueva para mantener acceso a clases.
                </p>
              </div>
            )}

            {/* Expired Warning */}
            {status.status === 'expired' && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-800 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Tu membresia ha vencido. No puedes reservar clases hasta renovar.
                </p>
              </div>
            )}

            {/* Last Payment Info */}
            {status.last_payment_date && (
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Ultimo pago</span>
                  <span>{formatDate(status.last_payment_date)}</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Payment History Link */}
        {showPaymentLink && (
          <div className="pt-3 border-t">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/member/payments">
                Ver historial de pagos
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
