import { createClient } from '@/lib/supabase/server'
import {
  type AppRole,
  type AppPermission,
  type UserWithRole,
  mapLegacyRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isAdmin,
  isStaff,
} from '@/lib/rbac'

// =============================================================================
// TYPES
// =============================================================================

export interface AuthenticatedUser {
  id: string
  email: string
  role: AppRole
  organizationId: string
  profile: {
    full_name: string | null
    avatar_url: string | null
  }
}

export interface AuthResult {
  user: AuthenticatedUser | null
  error: string | null
}

export interface PermissionCheckResult {
  authorized: boolean
  user: AuthenticatedUser | null
  error: string | null
}

// =============================================================================
// GET CURRENT USER WITH ROLE
// =============================================================================

/**
 * Get the current authenticated user with their role and organization
 * Use this in server actions to get user context
 */
export async function getCurrentUser(): Promise<AuthResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { user: null, error: 'No autenticado' }
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, role, full_name, avatar_url')
      .eq('id', user.id)
      .single()

    if (profileError || !profileData) {
      return { user: null, error: 'Perfil no encontrado' }
    }

    const profile = profileData as {
      organization_id: string | null
      role: string
      full_name: string | null
      avatar_url: string | null
    }

    if (!profile.organization_id) {
      return { user: null, error: 'No pertenece a ninguna organizacion' }
    }

    const appRole = mapLegacyRole(profile.role)

    return {
      user: {
        id: user.id,
        email: user.email!,
        role: appRole,
        organizationId: profile.organization_id,
        profile: {
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
        },
      },
      error: null,
    }
  } catch (error) {
    console.error('getCurrentUser error:', error)
    return { user: null, error: 'Error al obtener usuario' }
  }
}

// =============================================================================
// PERMISSION CHECK HELPERS
// =============================================================================

/**
 * Check if current user has a specific permission
 * Returns the user if authorized, or an error if not
 */
export async function requirePermission(
  permission: AppPermission
): Promise<PermissionCheckResult> {
  const { user, error } = await getCurrentUser()

  if (error || !user) {
    return { authorized: false, user: null, error: error || 'No autenticado' }
  }

  const userWithRole: UserWithRole = {
    id: user.id,
    role: user.role,
    organization_id: user.organizationId,
  }

  if (!hasPermission(userWithRole, permission)) {
    return {
      authorized: false,
      user,
      error: 'No tienes permiso para realizar esta accion',
    }
  }

  return { authorized: true, user, error: null }
}

/**
 * Check if current user has any of the specified permissions
 */
export async function requireAnyPermission(
  permissions: AppPermission[]
): Promise<PermissionCheckResult> {
  const { user, error } = await getCurrentUser()

  if (error || !user) {
    return { authorized: false, user: null, error: error || 'No autenticado' }
  }

  const userWithRole: UserWithRole = {
    id: user.id,
    role: user.role,
    organization_id: user.organizationId,
  }

  if (!hasAnyPermission(userWithRole, permissions)) {
    return {
      authorized: false,
      user,
      error: 'No tienes permiso para realizar esta accion',
    }
  }

  return { authorized: true, user, error: null }
}

/**
 * Check if current user has all of the specified permissions
 */
export async function requireAllPermissions(
  permissions: AppPermission[]
): Promise<PermissionCheckResult> {
  const { user, error } = await getCurrentUser()

  if (error || !user) {
    return { authorized: false, user: null, error: error || 'No autenticado' }
  }

  const userWithRole: UserWithRole = {
    id: user.id,
    role: user.role,
    organization_id: user.organizationId,
  }

  if (!hasAllPermissions(userWithRole, permissions)) {
    return {
      authorized: false,
      user,
      error: 'No tienes todos los permisos necesarios',
    }
  }

  return { authorized: true, user, error: null }
}

/**
 * Check if current user is admin (ADMIN or SUPER_ADMIN)
 */
export async function requireAdmin(): Promise<PermissionCheckResult> {
  const { user, error } = await getCurrentUser()

  if (error || !user) {
    return { authorized: false, user: null, error: error || 'No autenticado' }
  }

  const userWithRole: UserWithRole = {
    id: user.id,
    role: user.role,
    organization_id: user.organizationId,
  }

  if (!isAdmin(userWithRole)) {
    return {
      authorized: false,
      user,
      error: 'Se requiere rol de administrador',
    }
  }

  return { authorized: true, user, error: null }
}

/**
 * Check if current user is staff (not CLIENT)
 */
export async function requireStaff(): Promise<PermissionCheckResult> {
  const { user, error } = await getCurrentUser()

  if (error || !user) {
    return { authorized: false, user: null, error: error || 'No autenticado' }
  }

  const userWithRole: UserWithRole = {
    id: user.id,
    role: user.role,
    organization_id: user.organizationId,
  }

  if (!isStaff(userWithRole)) {
    return {
      authorized: false,
      user,
      error: 'Se requiere ser personal del gimnasio',
    }
  }

  return { authorized: true, user, error: null }
}

// =============================================================================
// ACTION RESULT HELPERS
// =============================================================================

/**
 * Standard action result type
 */
export type ActionResult<T = unknown> = {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string[]>
}

/**
 * Create a success result
 */
export function successResult<T>(message: string, data?: T): ActionResult<T> {
  return { success: true, message, data }
}

/**
 * Create an error result
 */
export function errorResult(message: string, errors?: Record<string, string[]>): ActionResult {
  return { success: false, message, errors }
}

/**
 * Create a forbidden error result
 */
export function forbiddenResult(message = 'No tienes permiso para realizar esta accion'): ActionResult {
  return { success: false, message }
}

/**
 * Create an unauthorized error result
 */
export function unauthorizedResult(message = 'No autenticado'): ActionResult {
  return { success: false, message }
}
