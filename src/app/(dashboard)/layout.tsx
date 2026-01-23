import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ROUTES } from '@/lib/constants'
import { AppShell } from '@/components/layout'
import { mapLegacyRole, hasPermission } from '@/lib/rbac'
import { getFilteredNavigation } from '@/lib/navigation/filter-navigation'
import { getViewPreferences } from '@/lib/auth/get-view-preferences'

/**
 * Dashboard pages should NOT be indexed by search engines
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(ROUTES.LOGIN)
  }

  // Get user profile with role
  const { data: profileData } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  const profile = profileData as { organization_id: string | null; role: string } | null

  // Check if user has completed onboarding (has an organization)
  if (!profile?.organization_id) {
    redirect(ROUTES.ONBOARDING)
  }

  // Get organization status - check subscription_started_at (nullable, no default)
  // This field is set when user explicitly selects a plan
  const { data: orgData } = await supabase
    .from('organizations')
    .select('subscription_started_at')
    .eq('id', profile.organization_id)
    .single()

  const org = orgData as {
    subscription_started_at: string | null
  } | null

  // Check if user needs to select a plan (subscription_started_at is null until plan is selected)
  if (!org?.subscription_started_at) {
    redirect(ROUTES.SELECT_PLAN)
  }

  // Map database role to AppRole and check permissions
  const appRole = mapLegacyRole(profile.role)
  const userWithRole = {
    id: user.id,
    role: appRole,
    organization_id: profile.organization_id,
  }

  // Check if user has permission to view admin dashboard
  if (!hasPermission(userWithRole, 'view_admin_dashboard')) {
    // If user has client dashboard permission, redirect there
    if (hasPermission(userWithRole, 'view_client_dashboard')) {
      redirect('/member')
    }
    // Otherwise redirect to login (shouldn't happen normally)
    redirect(ROUTES.LOGIN)
  }

  // Filter navigation based on user permissions (server-side)
  const navigation = getFilteredNavigation(userWithRole)

  // Get view preferences (server-side)
  const viewPreferences = await getViewPreferences(userWithRole)

  return (
    <AppShell user={user} navigation={navigation} viewPreferences={viewPreferences}>
      {children}
    </AppShell>
  )
}
