'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Check, Clock, X, Loader2, CreditCard } from 'lucide-react'

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
import { getLatestUpgradeRequest } from '@/actions/upgrade-request.actions'
import { PRICING_PLANS, PLAN_FEATURE_SECTIONS, type PlanTier } from '@/lib/pricing.config'
import { PlanFeaturesDisplay } from '@/components/billing/plan-features-display'
import type { UpgradeRequest } from '@/schemas/upgrade-request.schema'

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

export function PlanSection({ currentPlan, userEmail, userName }: PlanSectionProps) {
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const [latestRequest, setLatestRequest] = useState<UpgradeRequest | null>(null)
  const [loading, setLoading] = useState(true)

  const currentPlanInfo = PRICING_PLANS.find((p) => p.id === currentPlan)
  const isTopPlan = currentPlan === 'enterprise'

  // Fetch latest upgrade request
  useEffect(() => {
    getLatestUpgradeRequest()
      .then((result) => {
        if (result.success && result.data) {
          setLatestRequest(result.data)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  // Refresh after dialog closes
  const handleDialogChange = (open: boolean) => {
    setUpgradeDialogOpen(open)
    if (!open) {
      // Refresh the request status
      getLatestUpgradeRequest().then((result) => {
        if (result.success && result.data) {
          setLatestRequest(result.data)
        }
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            Pendiente
          </Badge>
        )
      case 'approved':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Check className="mr-1 h-3 w-3" />
            Aprobado
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <X className="mr-1 h-3 w-3" />
            Rechazado
          </Badge>
        )
      default:
        return null
    }
  }

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

        {/* Latest Upgrade Request */}
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : latestRequest ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ultima solicitud de upgrade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {PRICING_PLANS.find((p) => p.id === latestRequest.requested_plan)?.name ||
                          latestRequest.requested_plan}
                      </span>
                      {getStatusBadge(latestRequest.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Solicitado el{' '}
                      {new Date(latestRequest.created_at).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {latestRequest.status === 'pending' && (
                  <p className="text-sm text-muted-foreground">
                    Tu solicitud esta siendo revisada. Te contactaremos pronto a{' '}
                    <strong>{latestRequest.contact_email}</strong>.
                  </p>
                )}

                {latestRequest.status === 'approved' && (
                  <p className="text-sm text-green-600">
                    Tu solicitud fue aprobada. El plan ha sido actualizado.
                  </p>
                )}

                {latestRequest.status === 'rejected' && latestRequest.admin_notes && (
                  <p className="text-sm text-muted-foreground">
                    Nota: {latestRequest.admin_notes}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* AI Usage Section */}
        <AIUsageSection />
      </div>

      {/* Upgrade Dialog */}
      <UpgradePlanDialog
        open={upgradeDialogOpen}
        onOpenChange={handleDialogChange}
        currentPlan={currentPlan}
        userEmail={userEmail}
        userName={userName}
      />
    </>
  )
}
