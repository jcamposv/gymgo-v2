'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, Loader2, Sparkles, ArrowRight, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

import { PRICING_PLANS, type PlanTier } from '@/lib/pricing.config'
import { selectSubscriptionPlan } from '@/actions/subscription.actions'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

// =============================================================================
// COMPONENT
// =============================================================================

export function SelectPlanClient() {
  const router = useRouter()
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [selectedPlan, setSelectedPlan] = useState<PlanTier | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSelectPlan = async (planId: PlanTier) => {
    // Enterprise requires contact
    if (planId === 'enterprise') {
      window.open('mailto:contact@gymgo.io?subject=Enterprise%20Plan%20Inquiry', '_blank')
      return
    }

    setSelectedPlan(planId)
    setIsSubmitting(true)

    const result = await selectSubscriptionPlan({
      plan: planId,
      billingPeriod,
    })

    if (result.success) {
      toast.success('Plan seleccionado exitosamente')
      router.push('/dashboard')
    } else {
      toast.error(result.message || 'Error al seleccionar el plan')
      setSelectedPlan(null)
      setIsSubmitting(false)
    }
  }

  const formatPrice = (plan: typeof PRICING_PLANS[0]) => {
    if (plan.id === 'enterprise') {
      return 'Personalizado'
    }

    if (plan.id === 'free') {
      return '$0'
    }

    const price = billingPeriod === 'monthly'
      ? plan.priceMonthlyUSD
      : Math.round(plan.priceYearlyUSD / 12)

    return `$${price}`
  }

  const getYearlySavings = (plan: typeof PRICING_PLANS[0]) => {
    if (plan.id === 'enterprise' || plan.priceMonthlyUSD === 0) return null
    const monthlyCost = plan.priceMonthlyUSD * 12
    const yearlyCost = plan.priceYearlyUSD
    return monthlyCost - yearlyCost
  }

  return (
    <>
      {/* Header Section */}
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Selecciona tu plan
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Elige el plan que mejor se adapte a las necesidades de tu gimnasio.
              Todos los precios están en USD.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <Label
              htmlFor="billing-toggle"
              className={cn(
                "text-sm cursor-pointer transition-colors",
                billingPeriod === 'monthly' ? 'text-foreground font-medium' : 'text-muted-foreground'
              )}
            >
              Mensual
            </Label>
            <Switch
              id="billing-toggle"
              checked={billingPeriod === 'yearly'}
              onCheckedChange={(checked) => setBillingPeriod(checked ? 'yearly' : 'monthly')}
            />
            <Label
              htmlFor="billing-toggle"
              className={cn(
                "text-sm cursor-pointer transition-colors",
                billingPeriod === 'yearly' ? 'text-foreground font-medium' : 'text-muted-foreground'
              )}
            >
              Anual
            </Label>
            {billingPeriod === 'yearly' && (
              <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-0">
                Ahorra 20%
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5 max-w-[1400px] mx-auto">
          {PRICING_PLANS.map((plan) => {
            const isEnterprise = plan.id === 'enterprise'
            const isPopular = plan.popular
            const yearlySavings = getYearlySavings(plan)

            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative flex flex-col transition-all duration-200",
                  isPopular && "border-primary shadow-lg ring-1 ring-primary/20",
                  selectedPlan === plan.id && "ring-2 ring-primary"
                )}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground shadow-md">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Más popular
                    </Badge>
                  </div>
                )}

                <CardHeader className={cn("pb-4", isPopular && "pt-6")}>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {isEnterprise && <Building2 className="h-5 w-5 text-muted-foreground" />}
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-bold tracking-tight">
                        {formatPrice(plan)}
                      </span>
                      {!isEnterprise && plan.id !== 'free' && (
                        <span className="text-muted-foreground text-sm">
                          USD / mes
                        </span>
                      )}
                      {plan.id === 'free' && (
                        <span className="text-muted-foreground text-sm">
                          para siempre
                        </span>
                      )}
                    </div>
                    {plan.id === 'free' && (
                      <p className="text-xs text-primary font-medium mt-1">
                        Sin tarjeta de crédito requerida
                      </p>
                    )}
                    {!isEnterprise && plan.id !== 'free' && (
                      <p className="text-xs text-primary font-medium mt-1">
                        3 meses gratis, después ${billingPeriod === 'yearly' ? Math.round(plan.priceYearlyUSD / 12) : plan.priceMonthlyUSD} USD/mes
                      </p>
                    )}
                    {billingPeriod === 'yearly' && yearlySavings && yearlySavings > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Ahorras ${yearlySavings} USD al año (facturado ${plan.priceYearlyUSD} USD/año)
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {plan.features.slice(0, 8).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                    {plan.features.length > 8 && (
                      <li className="text-xs text-muted-foreground pl-6">
                        +{plan.features.length - 8} más...
                      </li>
                    )}
                  </ul>

                  {/* Not Included (for lower tiers) */}
                  {plan.notIncluded && plan.notIncluded.length > 0 && (
                    <div className="mb-6 pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-2">No incluido:</p>
                      <ul className="space-y-1">
                        {plan.notIncluded.map((item, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground/70 flex items-center gap-1.5">
                            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isSubmitting}
                    variant={isPopular ? 'default' : 'outline'}
                    className={cn(
                      "w-full mt-auto",
                      isPopular && "bg-primary hover:bg-primary/90"
                    )}
                    size="lg"
                  >
                    {isSubmitting && selectedPlan === plan.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : isEnterprise ? (
                      <>
                        Contactar ventas
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    ) : plan.id === 'free' ? (
                      <>
                        Comenzar gratis
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Seleccionar {plan.name}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8 sm:mt-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">3 meses de prueba gratis</span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
            Todos los planes incluyen 3 meses de prueba gratis sin compromiso.
            El cobro inicia al finalizar el período de prueba.
            Puedes cambiar tu plan en cualquier momento.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            ¿Tienes preguntas?{' '}
            <a href="mailto:contact@gymgo.io" className="text-primary hover:underline">
              contact@gymgo.io
            </a>
          </p>
        </div>
      </div>
    </>
  )
}
