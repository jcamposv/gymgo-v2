'use client'

import { useState } from 'react'
import { Loader2, Sparkles, Check, CreditCard } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

import { createCheckoutSession } from '@/actions/billing.actions'
import { PRICING_PLANS, type PlanTier } from '@/lib/pricing.config'

// =============================================================================
// TYPES
// =============================================================================

interface UpgradePlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPlan?: PlanTier
  userEmail?: string
  userName?: string
}

type BillingPeriod = 'monthly' | 'yearly'

// =============================================================================
// COMPONENT
// =============================================================================

export function UpgradePlanDialog({
  open,
  onOpenChange,
  currentPlan = 'free',
}: UpgradePlanDialogProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly')

  // Get available upgrade plans (plans higher than current, exclude enterprise)
  const planOrder: PlanTier[] = ['free', 'starter', 'growth', 'pro', 'enterprise']
  const currentPlanIndex = planOrder.indexOf(currentPlan)
  const availablePlans = PRICING_PLANS.filter((plan) => {
    const planIndex = planOrder.indexOf(plan.id)
    return planIndex > currentPlanIndex && plan.id !== 'enterprise'
  })

  const handleCheckout = async (planId: string) => {
    if (planId === 'enterprise') {
      window.location.href = 'mailto:contact@gymgo.io?subject=Enterprise%20Plan%20Inquiry'
      return
    }

    setLoading(planId)

    try {
      const result = await createCheckoutSession({
        plan: planId as 'starter' | 'growth' | 'pro',
        billingPeriod,
      })

      if (result.success && result.data?.checkoutUrl) {
        window.location.href = result.data.checkoutUrl
      } else {
        toast.error(result.message || 'Error al crear la sesion de pago')
      }
    } catch {
      toast.error('Error al procesar. Intentalo de nuevo.')
    } finally {
      setLoading(null)
    }
  }

  const currentPlanInfo = PRICING_PLANS.find((p) => p.id === currentPlan)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Mejorar tu plan
          </DialogTitle>
          <DialogDescription>
            Selecciona un plan y procede al pago con Stripe.
          </DialogDescription>
        </DialogHeader>

        {/* Current plan info */}
        <div className="rounded-lg border p-3 bg-muted/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Plan actual</span>
            <Badge variant="outline">{currentPlanInfo?.name || 'Gratis'}</Badge>
          </div>
        </div>

        {/* Billing period toggle */}
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setBillingPeriod('monthly')}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              billingPeriod === 'monthly'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Mensual
          </button>
          <button
            type="button"
            onClick={() => setBillingPeriod('yearly')}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              billingPeriod === 'yearly'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Anual
            <span className="ml-1 text-xs opacity-80">-20%</span>
          </button>
        </div>

        {/* Plan cards */}
        <div className="space-y-3">
          {availablePlans.map((plan) => {
            const price = billingPeriod === 'yearly'
              ? Math.round(plan.priceYearlyUSD / 12)
              : plan.priceMonthlyUSD
            const isLoading = loading === plan.id

            return (
              <div
                key={plan.id}
                className="rounded-lg border p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{plan.name}</h4>
                      {plan.popular && (
                        <Badge variant="secondary" className="text-xs">Popular</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {plan.description}
                    </p>
                    <div className="mt-2">
                      <span className="text-2xl font-bold">${price}</span>
                      <span className="text-sm text-muted-foreground"> USD/mes</span>
                      {billingPeriod === 'yearly' && (
                        <span className="text-xs text-muted-foreground ml-1">
                          (${plan.priceYearlyUSD}/ano)
                        </span>
                      )}
                    </div>
                    <ul className="mt-2 space-y-1">
                      {plan.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Check className="h-3 w-3 text-primary shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button
                    size="sm"
                    className="shrink-0 ml-4"
                    disabled={!!loading}
                    onClick={() => handleCheckout(plan.id)}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-1" />
                        Pagar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )
          })}

          {/* Enterprise option */}
          {currentPlan !== 'enterprise' && (
            <div className="rounded-lg border border-dashed p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Enterprise</h4>
                  <p className="text-sm text-muted-foreground">
                    Precio personalizado para grandes operaciones.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 ml-4"
                  onClick={() => handleCheckout('enterprise')}
                >
                  Contactar
                </Button>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Incluye 30 dias de prueba gratis. Pago seguro con Stripe.
        </p>
      </DialogContent>
    </Dialog>
  )
}
