import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { ROUTES } from '@/lib/constants'
import { SelectPlanClient } from './select-plan-client'

/**
 * Server component wrapper for plan selection page.
 * Guards:
 * 1. User must be authenticated
 * 2. User must have an organization (completed onboarding)
 * 3. Organization must NOT have a subscription plan yet
 */
export default async function SelectPlanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Guard 1: Must be authenticated
  if (!user) {
    redirect(ROUTES.LOGIN)
  }

  // Guard 2: Get user's profile and organization
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  const profileData = profile as { organization_id: string | null } | null

  // No organization means user needs to complete onboarding first
  if (!profileData?.organization_id) {
    redirect(ROUTES.ONBOARDING)
  }

  // Guard 3: Check if organization already has selected a plan
  // We check subscription_started_at (nullable, no default) - null means no plan selected yet
  const { data: orgData } = await supabase
    .from('organizations')
    .select('subscription_started_at')
    .eq('id', profileData.organization_id)
    .single()

  const organization = orgData as { subscription_started_at: string | null } | null

  // If subscription_started_at is set, user already selected a plan
  if (organization?.subscription_started_at) {
    redirect(ROUTES.DASHBOARD)
  }

  // User needs to select a plan - render the client component
  return <SelectPlanClient />
}
