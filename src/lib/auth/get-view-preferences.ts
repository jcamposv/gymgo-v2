import { createClient } from '@/lib/supabase/server'
import { mapLegacyRole, hasPermission, type UserWithRole } from '@/lib/rbac'

// =============================================================================
// TYPES
// =============================================================================

export type PreferredView = 'dashboard' | 'member'

export interface ViewPreferences {
  preferredView: PreferredView
  canSwitchView: boolean
  hasMemberProfile: boolean
  hasAdminDashboard: boolean
  hasClientDashboard: boolean
}

// =============================================================================
// SERVER-SIDE VIEW PREFERENCES
// =============================================================================

/**
 * Gets view preferences for a user. This is a server-side helper
 * that can be called from layouts and server components.
 *
 * @param userWithRole - The authenticated user with role information
 * @returns View preferences or null if user has no organization
 */
export async function getViewPreferences(
  userWithRole: UserWithRole
): Promise<ViewPreferences | null> {
  const supabase = await createClient()

  if (!userWithRole.organization_id) {
    return null
  }

  // Get profile with preferred_view and email
  const { data: profile } = await supabase
    .from('profiles')
    .select('preferred_view, email')
    .eq('id', userWithRole.id)
    .single()

  if (!profile) {
    return null
  }

  const profileData = profile as {
    preferred_view: PreferredView | null
    email: string
  }

  const hasAdminDashboard = hasPermission(userWithRole, 'view_admin_dashboard')
  const hasClientDashboard = hasPermission(userWithRole, 'view_client_dashboard')

  // Check if user has a member profile (by email match in members table)
  const { data: memberProfile } = await supabase
    .from('members')
    .select('id')
    .eq('organization_id', userWithRole.organization_id)
    .eq('email', profileData.email)
    .single()

  const hasMemberProfile = !!memberProfile

  // User can switch views if they are staff AND have a member profile
  const canSwitchView = hasAdminDashboard && hasMemberProfile

  return {
    preferredView: profileData.preferred_view || 'dashboard',
    canSwitchView,
    hasMemberProfile,
    hasAdminDashboard,
    hasClientDashboard,
  }
}
