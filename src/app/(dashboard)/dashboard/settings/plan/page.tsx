import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganization } from '@/actions/organization.actions'
import { PlanSection } from '../plan-section'
import type { Tables } from '@/types/database.types'
import type { PlanTier } from '@/lib/pricing.config'

export const metadata = {
  title: 'Plan | Configuracion | GymGo',
}

export default async function SettingsPlanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [orgResult, profileResult] = await Promise.all([
    getCurrentOrganization(),
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
  ])

  if (!orgResult.success || !orgResult.data) {
    redirect('/dashboard')
  }

  const organization = orgResult.data as Tables<'organizations'>
  const currentPlan = (organization.subscription_plan || 'free') as PlanTier
  const userEmail = user.email || ''
  const userName = profileResult.data?.full_name || user.user_metadata?.full_name || ''

  return (
    <PlanSection
      currentPlan={currentPlan}
      userEmail={userEmail}
      userName={userName}
    />
  )
}
