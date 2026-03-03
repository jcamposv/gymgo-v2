'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, Loader2, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { PRICING_PLANS, type PlanTier } from '@/lib/pricing.config'
import { updateSubscription, createCheckoutSession } from '@/actions/billing.actions'
import { useBilling } from './billing-provider'

export function PlanSelector() {
  const router = useRouter()
  const { currentPlan, subscription } = useBilling()
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>(
    subscription?.billing_period || 'monthly'
  )
  const [isSubmitting, setIsSubmitting] = useState<PlanTier | null>(null)

  const billablePlans = PRICING_PLANS.filter(p => p.id !== 'free' && p.id !== 'enterprise')

  const handleChangePlan = async (planId: PlanTier) => {
    if (planId === currentPlan && billingPeriod === subscription?.billing_period) return

    setIsSubmitting(planId)

    // If no active subscription, create checkout
    if (!subscription || subscription.status === 'canceled') {
      const result = await createCheckoutSession({
        plan: planId as 'starter' | 'growth' | 'pro',
        billingPeriod,
      })
      if (result.success && result.data?.checkoutUrl) {
        window.location.href = result.data.checkoutUrl
      } else {
        toast.error(result.message)
        setIsSubmitting(null)
      }
      return
    }

    // Update existing subscription
    const result = await updateSubscription({
      plan: planId as 'starter' | 'growth' | 'pro',
      billingPeriod,
    })

    if (result.success) {
      toast.success('Plan actualizado exitosamente')
      router.refresh()
    } else {
      toast.error(result.message)
    }
    setIsSubmitting(null)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg">Cambiar plan</CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="plan-billing" className={cn("text-sm", billingPeriod === 'monthly' ? 'font-medium' : 'text-muted-foreground')}>
              Mensual
            </Label>
            <Switch
              id="plan-billing"
              checked={billingPeriod === 'yearly'}
              onCheckedChange={(c) => setBillingPeriod(c ? 'yearly' : 'monthly')}
            />
            <Label htmlFor="plan-billing" className={cn("text-sm", billingPeriod === 'yearly' ? 'font-medium' : 'text-muted-foreground')}>
              Anual
            </Label>
            {billingPeriod === 'yearly' && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-0">-20%</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {billablePlans.map((plan) => {
            const isCurrent = plan.id === currentPlan
            const price = billingPeriod === 'monthly'
              ? plan.priceMonthlyUSD
              : Math.round(plan.priceYearlyUSD / 12)

            return (
              <div
                key={plan.id}
                className={cn(
                  "border rounded-lg p-4 flex flex-col",
                  isCurrent && "border-primary bg-primary/5",
                  plan.popular && !isCurrent && "border-primary/50"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{plan.name}</h4>
                  {isCurrent && <Badge variant="outline">Actual</Badge>}
                  {plan.popular && !isCurrent && <Badge variant="secondary">Popular</Badge>}
                </div>
                <p className="text-2xl font-bold">${price}<span className="text-sm font-normal text-muted-foreground">/mes</span></p>
                <ul className="mt-3 space-y-1.5 flex-1 mb-4">
                  {plan.features.slice(0, 4).map((f, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Check className="h-3 w-3 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={isCurrent ? 'outline' : plan.popular ? 'default' : 'outline'}
                  size="sm"
                  disabled={isCurrent || isSubmitting !== null}
                  onClick={() => handleChangePlan(plan.id)}
                  className="w-full"
                >
                  {isSubmitting === plan.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCurrent ? (
                    'Plan actual'
                  ) : (
                    <>
                      Cambiar <ArrowRight className="h-3 w-3 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
