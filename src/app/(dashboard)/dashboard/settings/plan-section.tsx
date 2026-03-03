'use client'

import { useState } from 'react'
import { Sparkles, CreditCard } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { UpgradePlanDialog } from '@/components/billing/upgrade-plan-dialog'
import { AIUsageSection } from '@/components/ai/ai-usage-section'
import { PRICING_PLANS, PLAN_FEATURE_SECTIONS, type PlanTier } from '@/lib/pricing.config'
import { PlanFeaturesDisplay } from '@/components/billing/plan-features-display'

// =============================================================================
// TYPES
// =============================================================================

interface PlanSectionProps {
  currentPlan: PlanTier
  userEmail: string
  userName: string
}

// =============================================================================
// COMPONENT
// =============================================================================

export function PlanSection({ currentPlan }: PlanSectionProps) {
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)

  const currentPlanInfo = PRICING_PLANS.find((p) => p.id === currentPlan)
  const isTopPlan = currentPlan === 'enterprise'

  return (
    <>
      <div className="space-y-6">
        {/* Current Plan Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Plan actual
            </CardTitle>
            <CardDescription>
              Tu plan de suscripcion actual y opciones de mejora
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Plan Info */}
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">
                      {currentPlanInfo?.name || 'Gratis'}
                    </span>
                    {currentPlanInfo?.popular && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        Popular
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentPlanInfo?.description || 'Plan gratuito basico'}
                  </p>
                </div>
                <div className="text-right">
                  {currentPlanInfo && currentPlanInfo.priceMonthlyUSD > 0 ? (
                    <>
                      <span className="text-2xl font-bold">
                        ${currentPlanInfo.priceMonthlyUSD}
                      </span>
                      <span className="text-muted-foreground">/mes</span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-primary">Gratis</span>
                  )}
                </div>
              </div>

              {/* Plan Features - User-friendly display */}
              {currentPlanInfo && PLAN_FEATURE_SECTIONS[currentPlan] && (
                <div>
                  <h4 className="text-sm font-medium mb-3">Tu plan incluye:</h4>
                  <PlanFeaturesDisplay
                    planId={currentPlan}
                    variant="compact"
                    maxFeatures={8}
                  />
                </div>
              )}

              {/* Upgrade Button */}
              {!isTopPlan && (
                <Button
                  onClick={() => setUpgradeDialogOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Mejorar plan
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Usage Section */}
        <AIUsageSection />
      </div>

      {/* Upgrade Dialog */}
      <UpgradePlanDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        currentPlan={currentPlan}
      />
    </>
  )
}
