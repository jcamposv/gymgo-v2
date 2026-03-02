'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { CreditCard, ExternalLink, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getPlanById } from '@/lib/pricing.config'
import { getCustomerPortalUrl } from '@/actions/billing.actions'
import { useBilling } from './billing-provider'
import { CancelSubscriptionDialog } from './cancel-subscription-dialog'

export function CurrentPlanCard() {
  const { currentPlan, subscription } = useBilling()
  const [isLoadingPortal, setIsLoadingPortal] = useState(false)

  const plan = getPlanById(currentPlan)

  const handleOpenPortal = async () => {
    setIsLoadingPortal(true)
    const result = await getCustomerPortalUrl()
    setIsLoadingPortal(false)

    if (result.success && result.data?.portalUrl) {
      window.open(result.data.portalUrl, '_blank')
    } else {
      toast.error(result.message || 'Error al abrir el portal')
    }
  }

  const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    active: { label: 'Activo', variant: 'default' },
    trialing: { label: 'Prueba', variant: 'secondary' },
    past_due: { label: 'Pago pendiente', variant: 'destructive' },
    canceled: { label: 'Cancelado', variant: 'destructive' },
    unpaid: { label: 'Sin pagar', variant: 'destructive' },
  }

  const status = subscription?.status
    ? statusLabels[subscription.status] || { label: subscription.status, variant: 'outline' as const }
    : { label: 'Trial', variant: 'secondary' as const }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Plan actual</CardTitle>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <CardDescription>
          {plan?.description || 'Gestiona tu suscripcion'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-2xl font-bold">{plan?.name || currentPlan}</h3>
          {plan && plan.priceMonthlyUSD > 0 && (
            <p className="text-muted-foreground">
              ${subscription?.billing_period === 'yearly'
                ? Math.round(plan.priceYearlyUSD / 12)
                : plan.priceMonthlyUSD} USD/mes
              {subscription?.billing_period === 'yearly' && ' (facturado anualmente)'}
            </p>
          )}
        </div>

        {subscription?.current_period_end && (
          <p className="text-sm text-muted-foreground">
            {subscription.cancel_at_period_end
              ? `Se cancela el ${new Date(subscription.current_period_end).toLocaleDateString('es-MX')}`
              : `Proximo cobro: ${new Date(subscription.current_period_end).toLocaleDateString('es-MX')}`}
          </p>
        )}

        {currentPlan !== 'free' && (
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenPortal}
              disabled={isLoadingPortal}
            >
              {isLoadingPortal ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Gestionar suscripcion
            </Button>
            {subscription && !subscription.cancel_at_period_end && subscription.status !== 'canceled' && (
              <CancelSubscriptionDialog />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
