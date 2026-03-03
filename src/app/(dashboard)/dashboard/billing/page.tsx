import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganization } from '@/actions/organization.actions'
import { getBillingInfo } from '@/actions/billing.actions'
import type { Tables } from '@/types/database.types'
import type { PlanTier } from '@/lib/pricing.config'

import { BillingProvider } from '@/components/billing/billing-provider'
import { CurrentPlanCard } from '@/components/billing/current-plan-card'
import { PlanSelector } from '@/components/billing/plan-selector'
import { BillingHistoryTable } from '@/components/billing/billing-history-table'

export const metadata = {
  title: 'Plan y Facturacion | GymGo',
}

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [orgResult, billingResult] = await Promise.all([
    getCurrentOrganization(),
    getBillingInfo(),
  ])

  if (!orgResult.success || !orgResult.data) redirect('/dashboard')

  const organization = orgResult.data as Tables<'organizations'>
  const currentPlan = (organization.subscription_plan || 'free') as PlanTier

  const subscription = billingResult.success ? billingResult.data?.subscription ?? null : null
  const billingHistory = billingResult.success
    ? billingResult.data?.billingHistory ?? { records: [], total: 0 }
    : { records: [], total: 0 }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Plan y Facturacion</h2>
        <p className="text-muted-foreground">
          Gestiona tu suscripcion y revisa tu historial de pagos.
        </p>
      </div>

      <BillingProvider
        currentPlan={currentPlan}
        subscription={subscription}
        billingHistory={billingHistory}
      >
        <CurrentPlanCard />
        <PlanSelector />
        <BillingHistoryTable />
      </BillingProvider>
    </div>
  )
}
