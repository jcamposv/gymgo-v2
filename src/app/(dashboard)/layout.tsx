import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ROUTES } from '@/lib/constants'
import { AppShell } from '@/components/layout'
import { mapLegacyRole, hasPermission } from '@/lib/rbac'
import { getFilteredNavigation } from '@/lib/navigation/filter-navigation'
import { getViewPreferences } from '@/lib/auth/get-view-preferences'

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
