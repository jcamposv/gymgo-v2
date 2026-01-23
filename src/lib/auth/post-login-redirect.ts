import { createClient } from '@/lib/supabase/server'
import { ROUTES } from '@/lib/constants'
import { mapLegacyRole } from '@/lib/rbac/helpers'
import { hasPermission, type UserWithRole } from '@/lib/rbac'

// =============================================================================
// POST-LOGIN REDIRECT HELPER
// =============================================================================
// This helper determines where to redirect a user after login/signup.
// It implements the following logic:
//
// 1. Onboarding is ONLY shown to:
//    - Users who signed up via public registration (not invited)
//    - AND their profile has no organization_id
//    - AND no organization exists for them (they need to create one)
//
// 2. Invited users should NEVER see onboarding because:
//    - They were invited to join an EXISTING organization
//    - Their profile should have organization_id set (if invitation worked correctly)
//    - Even if organization_id is missing, we can recover it from their member record
//
// 3. Dashboard routing is based on role/permissions AND preferred_view:
//    - Staff with both permissions uses their preferred_view setting
//    - Staff without member profile -> /dashboard
//    - Clients -> /member (client dashboard)
// =============================================================================

export type PreferredView = 'dashboard' | 'member'

export interface PostLoginRedirectResult {
  redirectTo: string
  reason: 'onboarding' | 'plan_selection' | 'dashboard' | 'member_dashboard' | 'recovery'
  organizationId: string | null
}

/**
 * Determines the correct redirect path after a user logs in or accepts an invitation.
 * This is the single source of truth for post-login routing.
 */
export async function getPostLoginRedirect(): Promise<PostLoginRedirectResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      redirectTo: ROUTES.LOGIN,
      reason: 'recovery',
      organizationId: null,
    }
  }

  // Step 1: Get user's profile including preferred_view
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role, preferred_view, email')
    .eq('id', user.id)
    .single()

  const profileData = profile as {
    organization_id: string | null
    role: string
    preferred_view: PreferredView | null
    email: string
  } | null

  // Step 2: If profile has organization_id, check if plan selection is needed
  if (profileData?.organization_id) {
    // Check if the organization has explicitly selected a plan
    // We use subscription_started_at (nullable, no default) to detect this
    // subscription_started_at is set when user selects a plan, null otherwise
    const { data: orgData } = await supabase
      .from('organizations')
      .select('subscription_started_at')
      .eq('id', profileData.organization_id)
      .single()

    const organization = orgData as { subscription_started_at: string | null } | null

    // If subscription_started_at is null, user hasn't selected a plan yet
    // This happens right after onboarding completion
    if (!organization?.subscription_started_at) {
      return {
        redirectTo: ROUTES.SELECT_PLAN,
        reason: 'plan_selection',
        organizationId: profileData.organization_id,
      }
    }

    // Plan is selected, redirect based on role and preferences
    return getRedirectByRole(
      supabase,
      profileData.role,
      profileData.organization_id,
      profileData.preferred_view,
      profileData.email
    )
  }

  // Step 3: No organization_id in profile - check if user was invited
  // Look for a member record that links to this user (via profile_id or matching email)
  const { data: memberByProfile } = await supabase
    .from('members')
    .select('id, organization_id, profile_id')
    .eq('profile_id', user.id)
    .single()

  if (memberByProfile) {
    const member = memberByProfile as { id: string; organization_id: string; profile_id: string }

    // User was invited! Fix their profile by setting organization_id
    await supabase
      .from('profiles')
      .update({ organization_id: member.organization_id } as never)
      .eq('id', user.id)

    // Get their role and preferred_view for routing
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('role, preferred_view, email')
      .eq('id', user.id)
      .single()

    const profileInfo = updatedProfile as { role: string; preferred_view: PreferredView | null; email: string } | null
    return getRedirectByRole(
      supabase,
      profileInfo?.role || 'client',
      member.organization_id,
      profileInfo?.preferred_view || null,
      profileInfo?.email || user.email || ''
    )
  }

  // Step 4: Check by email match (fallback for cases where profile_id wasn't linked)
  if (!user.email) {
    // No email, can't look up by email
    return {
      redirectTo: ROUTES.ONBOARDING,
      reason: 'onboarding',
      organizationId: null,
    }
  }

  const { data: memberByEmail } = await supabase
    .from('members')
    .select('id, organization_id')
    .eq('email', user.email)
    .single()

  if (memberByEmail) {
    const member = memberByEmail as { id: string; organization_id: string }

    // User was invited via email! Link their profile to the organization
    await supabase
      .from('profiles')
      .update({ organization_id: member.organization_id } as never)
      .eq('id', user.id)

    // Also link the member record to this profile
    await supabase
      .from('members')
      .update({ profile_id: user.id } as never)
      .eq('id', member.id)

    // Get their role and preferred_view for routing
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('role, preferred_view, email')
      .eq('id', user.id)
      .single()

    const profileInfo = updatedProfile as { role: string; preferred_view: PreferredView | null; email: string } | null
    return getRedirectByRole(
      supabase,
      profileInfo?.role || 'client',
      member.organization_id,
      profileInfo?.preferred_view || null,
      profileInfo?.email || user.email || ''
    )
  }

  // Step 5: No organization found - user needs onboarding
  // This should only happen for users who signed up via public registration
  return {
    redirectTo: ROUTES.ONBOARDING,
    reason: 'onboarding',
    organizationId: null,
  }
}

/**
 * Returns the appropriate redirect path based on user role and preferred view.
 * Logic:
 * 1. If user has both admin and client dashboard access, use preferred_view
 * 2. If user only has admin dashboard access, go to /dashboard
 * 3. If user only has client dashboard access, go to /member
 */
async function getRedirectByRole(
  supabase: Awaited<ReturnType<typeof createClient>>,
  role: string,
  organizationId: string,
  preferredView: PreferredView | null,
  userEmail: string
): Promise<PostLoginRedirectResult> {
  const appRole = mapLegacyRole(role as never)

  // Create a minimal UserWithRole object for permission checks
  const userWithRole: UserWithRole = {
    id: '', // Not needed for permission check
    role: appRole,
    organization_id: organizationId,
  }

  const canViewAdminDashboard = hasPermission(userWithRole, 'view_admin_dashboard')
  const canViewClientDashboard = hasPermission(userWithRole, 'view_client_dashboard')

  // If user can only view one dashboard, go there
  if (canViewAdminDashboard && !canViewClientDashboard) {
    return {
      redirectTo: ROUTES.DASHBOARD,
      reason: 'dashboard',
      organizationId,
    }
  }

  if (!canViewAdminDashboard && canViewClientDashboard) {
    return {
      redirectTo: '/member',
      reason: 'member_dashboard',
      organizationId,
    }
  }

  // User can view both dashboards - check if they have a member profile
  // and respect their preferred_view setting
  if (canViewAdminDashboard && canViewClientDashboard) {
    // Check if user has a member profile (by email match)
    const { data: memberProfile } = await supabase
      .from('members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('email', userEmail)
      .single()

    const hasMemberProfile = !!memberProfile

    // If user has member profile and prefers member view, go there
    if (hasMemberProfile && preferredView === 'member') {
      return {
        redirectTo: '/member',
        reason: 'member_dashboard',
        organizationId,
      }
    }

    // Default to dashboard for staff
    return {
      redirectTo: ROUTES.DASHBOARD,
      reason: 'dashboard',
      organizationId,
    }
  }

  // Default fallback to dashboard
  return {
    redirectTo: ROUTES.DASHBOARD,
    reason: 'dashboard',
    organizationId,
  }
}

/**
 * Checks if the current user needs onboarding.
 * Returns true ONLY if:
 * - User has no organization_id in profile
 * - AND user is not linked to any member record (wasn't invited)
 */
export async function needsOnboarding(): Promise<boolean> {
  const result = await getPostLoginRedirect()
  return result.reason === 'onboarding'
}
