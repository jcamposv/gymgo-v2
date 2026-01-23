'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  requirePermission,
  requireAdmin,
  type ActionResult,
  successResult,
  errorResult,
  forbiddenResult,
  unauthorizedResult,
} from '@/lib/auth/server-auth'
import { type AppRole } from '@/lib/rbac'
import { mapToDbRole, type DatabaseRole } from '@/lib/rbac/helpers'
import { ROLE_LABELS, ROLE_DESCRIPTIONS, ASSIGNABLE_ROLES } from '@/lib/rbac/role-labels'
import { checkRoleLimit, PLAN_LIMIT_ERROR_CODE } from '@/lib/plan-limits'

// =============================================================================
// TYPES
// =============================================================================

export interface StaffMember {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: DatabaseRole
  organization_id: string
  created_at: string
  updated_at: string
}

export interface StaffWithDetails extends StaffMember {
  is_current_user: boolean
}

// =============================================================================
// GET STAFF MEMBERS
// =============================================================================

export async function getStaffMembers(): Promise<{
  data: StaffWithDetails[] | null
  error: string | null
}> {
  const { authorized, user, error } = await requirePermission('view_staff')

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()

  // Get all users in the organization that are staff (not clients)
  const { data, error: dbError } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, role, organization_id, created_at, updated_at')
    .eq('organization_id', user.organizationId)
    .order('created_at', { ascending: true })

  if (dbError) {
    return { data: null, error: dbError.message }
  }

  // Add is_current_user flag and filter to show staff primarily
  const staffMembers = (data as StaffMember[]).map((member) => ({
    ...member,
    is_current_user: member.id === user.id,
  }))

  return { data: staffMembers, error: null }
}

// =============================================================================
// GET USER BY ID
// =============================================================================

export async function getStaffMember(userId: string): Promise<{
  data: StaffWithDetails | null
  error: string | null
}> {
  const { authorized, user, error } = await requirePermission('view_staff')

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()

  const { data, error: dbError } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, role, organization_id, created_at, updated_at')
    .eq('id', userId)
    .eq('organization_id', user.organizationId)
    .single()

  if (dbError) {
    return { data: null, error: dbError.message }
  }

  const staffMember = data as StaffMember

  return {
    data: {
      ...staffMember,
      is_current_user: staffMember.id === user.id,
    },
    error: null,
  }
}

// =============================================================================
// UPDATE USER ROLE
// =============================================================================

export async function updateUserRole(
  userId: string,
  newRole: AppRole
): Promise<ActionResult> {
  // Only admins can change roles
  const { authorized, user, error } = await requireAdmin()

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  // Validate the new role is assignable
  if (!ASSIGNABLE_ROLES.includes(newRole)) {
    return errorResult('Rol no valido para asignar')
  }

  const supabase = await createClient()

  // Get the target user
  const { data: targetUser, error: fetchError } = await supabase
    .from('profiles')
    .select('id, email, role, organization_id')
    .eq('id', userId)
    .eq('organization_id', user!.organizationId)
    .single()

  if (fetchError || !targetUser) {
    return errorResult('Usuario no encontrado')
  }

  const target = targetUser as { id: string; email: string; role: string; organization_id: string }

  // Prevent changing own role (must be done by another admin)
  if (target.id === user!.id) {
    return errorResult('No puedes cambiar tu propio rol')
  }

  // Prevent modifying super_admin users (only other super_admins could, but we don't allow it)
  if (target.role === 'super_admin') {
    return errorResult('No puedes modificar el rol de un Super Admin')
  }

  // Convert AppRole to database role
  const dbRole = mapToDbRole(newRole)

  // Check plan limits before changing role (only if assigning a staff role)
  if (newRole !== 'client' && target.role !== dbRole) {
    const limitCheck = await checkRoleLimit(user!.organizationId, dbRole)
    if (!limitCheck.allowed) {
      return {
        success: false,
        message: limitCheck.message || 'Límite de plan alcanzado',
        errors: {
          [PLAN_LIMIT_ERROR_CODE]: [limitCheck.message || 'Límite alcanzado'],
        },
      }
    }
  }

  // Update the role
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: dbRole } as never)
    .eq('id', userId)
    .eq('organization_id', user!.organizationId)

  if (updateError) {
    return errorResult('Error al actualizar el rol: ' + updateError.message)
  }

  revalidatePath('/dashboard/settings/team')
  revalidatePath('/dashboard/settings/users')
  return successResult(`Rol actualizado a ${ROLE_LABELS[newRole]}`)
}

// =============================================================================
// REMOVE USER FROM ORGANIZATION
// =============================================================================

export async function removeUserFromOrganization(userId: string): Promise<ActionResult> {
  const { authorized, user, error } = await requirePermission('manage_staff')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  const supabase = await createClient()

  // Get the target user
  const { data: targetUser, error: fetchError } = await supabase
    .from('profiles')
    .select('id, email, role, organization_id')
    .eq('id', userId)
    .eq('organization_id', user!.organizationId)
    .single()

  if (fetchError || !targetUser) {
    return errorResult('Usuario no encontrado')
  }

  const target = targetUser as { id: string; email: string; role: string }

  // Prevent removing yourself
  if (target.id === user!.id) {
    return errorResult('No puedes eliminarte a ti mismo de la organizacion')
  }

  // Prevent removing super_admin or admin (protection)
  if (target.role === 'super_admin' || target.role === 'admin' || target.role === 'owner') {
    return errorResult('No puedes eliminar a un administrador')
  }

  // Remove from organization by setting organization_id to null and role to client
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      organization_id: null,
      role: 'client',
    } as never)
    .eq('id', userId)

  if (updateError) {
    return errorResult('Error al eliminar usuario: ' + updateError.message)
  }

  revalidatePath('/dashboard/settings/team')
  revalidatePath('/dashboard/settings/users')
  return successResult('Usuario eliminado de la organizacion')
}

// =============================================================================
// GET MEMBER PROFILE ROLE
// =============================================================================

export interface MemberAccountStatus {
  hasAccount: boolean
  profile_id: string | null
  role: DatabaseRole | null
  email: string | null
  invitationSentAt: string | null
}

/**
 * Gets the account status and role for a member.
 * This determines:
 * - hasAccount: true if the member has a linked user account
 * - profile_id: the ID of the linked profile (if any)
 * - role: the user's role (if they have a profile)
 * - email: the profile's email (if they have a profile)
 * - invitationSentAt: when the invitation was sent (if any)
 */
export async function getMemberProfileRole(memberId: string): Promise<{
  data: MemberAccountStatus | null
  error: string | null
}> {
  const { authorized, user, error } = await requirePermission('view_staff')

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()

  // Get the member with profile_id and invitation_sent_at
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('profile_id, invitation_sent_at')
    .eq('id', memberId)
    .eq('organization_id', user.organizationId)
    .single()

  if (memberError || !member) {
    return { data: null, error: memberError?.message || 'Miembro no encontrado' }
  }

  const memberData = member as { profile_id: string | null; invitation_sent_at: string | null }

  // If no profile_id, member doesn't have an account yet
  if (!memberData.profile_id) {
    return {
      data: {
        hasAccount: false,
        profile_id: null,
        role: null,
        email: null,
        invitationSentAt: memberData.invitation_sent_at,
      },
      error: null,
    }
  }

  // Get the profile to verify it exists and get the role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, email')
    .eq('id', memberData.profile_id)
    .single()

  if (profileError || !profile) {
    // Profile doesn't exist (maybe was deleted) - treat as no account
    return {
      data: {
        hasAccount: false,
        profile_id: null,
        role: null,
        email: null,
        invitationSentAt: memberData.invitation_sent_at,
      },
      error: null,
    }
  }

  const profileData = profile as { id: string; role: DatabaseRole; email: string }

  return {
    data: {
      hasAccount: true,
      profile_id: profileData.id,
      role: profileData.role,
      email: profileData.email,
      invitationSentAt: memberData.invitation_sent_at,
    },
    error: null,
  }
}

// =============================================================================
// UPDATE MEMBER PROFILE ROLE
// =============================================================================

export async function updateMemberProfileRole(
  memberId: string,
  newRole: AppRole
): Promise<ActionResult> {
  // Only admins can change roles
  const { authorized, user, error } = await requireAdmin()

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  // Validate the new role is assignable
  if (!ASSIGNABLE_ROLES.includes(newRole)) {
    return errorResult('Rol no valido para asignar')
  }

  const supabase = await createClient()

  // Get the member's profile_id
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('profile_id')
    .eq('id', memberId)
    .eq('organization_id', user!.organizationId)
    .single()

  if (memberError || !member) {
    return errorResult('Miembro no encontrado')
  }

  const memberData = member as { profile_id: string | null }

  if (!memberData.profile_id) {
    return errorResult('Este miembro no tiene una cuenta de usuario')
  }

  // Get the target profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', memberData.profile_id)
    .single()

  if (profileError || !profile) {
    return errorResult('Perfil no encontrado')
  }

  const profileData = profile as { id: string; role: string }

  // Prevent modifying super_admin
  if (profileData.role === 'super_admin') {
    return errorResult('No puedes modificar el rol de un Super Admin')
  }

  // Convert AppRole to database role
  const dbRole = mapToDbRole(newRole)

  // Check plan limits before changing role (only if assigning a staff role)
  if (newRole !== 'client' && profileData.role !== dbRole) {
    const limitCheck = await checkRoleLimit(user!.organizationId, dbRole)
    if (!limitCheck.allowed) {
      return {
        success: false,
        message: limitCheck.message || 'Límite de plan alcanzado',
        errors: {
          [PLAN_LIMIT_ERROR_CODE]: [limitCheck.message || 'Límite alcanzado'],
        },
      }
    }
  }

  // Update the role
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: dbRole } as never)
    .eq('id', memberData.profile_id)

  if (updateError) {
    return errorResult('Error al actualizar el rol: ' + updateError.message)
  }

  revalidatePath('/dashboard/members')
  revalidatePath(`/dashboard/members/${memberId}`)
  revalidatePath('/dashboard/settings/team')
  return successResult(`Rol actualizado a ${ROLE_LABELS[newRole]}`)
}

// =============================================================================
// GET ROLE OPTIONS (for dropdowns)
// =============================================================================

export async function getRoleOptions(): Promise<{
  data: Array<{ value: AppRole; label: string; description: string }> | null
  error: string | null
}> {
  // Any authenticated user can get role options (for display purposes)
  const { authorized, error } = await requireAdmin()

  if (!authorized) {
    return { data: null, error: error || 'No autorizado' }
  }

  const options = ASSIGNABLE_ROLES.map((role) => ({
    value: role,
    label: ROLE_LABELS[role],
    description: ROLE_DESCRIPTIONS[role],
  }))

  return { data: options, error: null }
}

// =============================================================================
// PREFERRED VIEW MANAGEMENT
// =============================================================================

export type PreferredView = 'dashboard' | 'member'

export interface UserViewPreferences {
  preferredView: PreferredView
  canSwitchView: boolean
  hasMemberProfile: boolean
  hasAdminDashboard: boolean
  hasClientDashboard: boolean
}

/**
 * Gets the current user's view preferences and whether they can switch views.
 * A user can switch views if:
 * - They have view_admin_dashboard permission (is staff)
 * - They have a member profile in the organization
 */
export async function getUserViewPreferences(): Promise<{
  data: UserViewPreferences | null
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'No autenticado' }
  }

  // Get the profile with preferred_view
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id, role, preferred_view, email')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { data: null, error: 'Perfil no encontrado' }
  }

  const profileData = profile as {
    organization_id: string | null
    role: string
    preferred_view: PreferredView | null
    email: string
  }

  if (!profileData.organization_id) {
    return { data: null, error: 'Usuario sin organizacion' }
  }

  // Import helpers dynamically to avoid circular dependencies
  const { mapLegacyRole, hasPermission } = await import('@/lib/rbac')

  const appRole = mapLegacyRole(profileData.role)
  const userWithRole = {
    id: user.id,
    role: appRole,
    organization_id: profileData.organization_id,
  }

  const hasAdminDashboard = hasPermission(userWithRole, 'view_admin_dashboard')
  const hasClientDashboard = hasPermission(userWithRole, 'view_client_dashboard')

  // Check if user has a member profile (by email match in members table)
  const { data: memberProfile } = await supabase
    .from('members')
    .select('id')
    .eq('organization_id', profileData.organization_id)
    .eq('email', profileData.email)
    .single()

  const hasMemberProfile = !!memberProfile

  // User can switch views if they are staff AND have a member profile
  const canSwitchView = hasAdminDashboard && hasMemberProfile

  return {
    data: {
      preferredView: profileData.preferred_view || 'dashboard',
      canSwitchView,
      hasMemberProfile,
      hasAdminDashboard,
      hasClientDashboard,
    },
    error: null,
  }
}

/**
 * Updates the user's preferred view.
 * Only staff members with a member profile can change this.
 */
export async function updatePreferredView(
  newView: PreferredView
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return unauthorizedResult('No autenticado')
  }

  // Validate the view value
  if (newView !== 'dashboard' && newView !== 'member') {
    return errorResult('Vista no valida')
  }

  // Get current preferences to verify user can switch
  const { data: preferences, error: prefError } = await getUserViewPreferences()

  if (prefError || !preferences) {
    return errorResult(prefError || 'Error al obtener preferencias')
  }

  if (!preferences.canSwitchView) {
    return forbiddenResult('No tienes permiso para cambiar la vista')
  }

  // Update the preferred view
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ preferred_view: newView } as never)
    .eq('id', user.id)

  if (updateError) {
    return errorResult('Error al actualizar la vista: ' + updateError.message)
  }

  revalidatePath('/dashboard')
  revalidatePath('/member')
  return successResult(
    newView === 'dashboard'
      ? 'Vista cambiada a Dashboard'
      : 'Vista cambiada a Cliente'
  )
}
