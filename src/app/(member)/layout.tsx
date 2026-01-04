import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { ROUTES } from '@/lib/constants'
import { mapLegacyRole, hasPermission } from '@/lib/rbac'
import { MemberShell } from '@/components/layout/member-shell'
import { getViewPreferences } from '@/lib/auth/get-view-preferences'

export default async function MemberLayout({
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
    .select('organization_id, role, full_name, email')
    .eq('id', user.id)
    .single()

  const profile = profileData as {
    organization_id: string | null
    role: string
    full_name: string | null
    email: string
  } | null

  if (!profile?.organization_id) {
    redirect(ROUTES.ONBOARDING)
  }

  // Map database role to AppRole
  const appRole = mapLegacyRole(profile.role)
  const userWithRole = {
    id: user.id,
    role: appRole,
    organization_id: profile.organization_id,
  }

  // Check if user has permission to view client dashboard
  if (!hasPermission(userWithRole, 'view_client_dashboard')) {
    // If user is admin/staff, redirect to admin dashboard
    if (hasPermission(userWithRole, 'view_admin_dashboard')) {
      redirect('/dashboard')
    }
    // Otherwise, show access denied
    redirect('/access-denied')
  }

  // Check if user has a member profile (can view their own data)
  const { data: memberData } = await supabase
    .from('members')
    .select('id, full_name, email, status')
    .eq('organization_id', profile.organization_id)
    .eq('email', profile.email)
    .single()

  const memberProfile = memberData as {
    id: string
    full_name: string
    email: string
    status: string
  } | null

  // Get view preferences (server-side)
  const viewPreferences = await getViewPreferences(userWithRole)

  return (
    <MemberShell
      user={user}
      profile={{
        full_name: profile.full_name,
        email: profile.email,
        role: appRole,
      }}
      memberProfile={memberProfile}
      viewPreferences={viewPreferences}
    >
      {children}
    </MemberShell>
  )
}
