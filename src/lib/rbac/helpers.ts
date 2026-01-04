import { ROLE_PERMISSIONS } from './permissions'
import {
  APP_ROLES,
  ADMIN_ROLES,
  STAFF_ROLES,
  type AppRole,
  type AppPermission,
  type UserWithRole,
} from './types'

// =============================================================================
// PERMISSION HELPERS
// =============================================================================

/**
 * Check if a user has a specific role
 */
export function hasRole(
  user: UserWithRole | null | undefined,
  role: AppRole
): boolean {
  if (!user) return false
  return user.role === role
}

/**
 * Check if a user has any of the specified roles
 */
export function hasAnyRole(
  user: UserWithRole | null | undefined,
  roles: AppRole[]
): boolean {
  if (!user) return false
  return roles.includes(user.role)
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  user: UserWithRole | null | undefined,
  permission: AppPermission
): boolean {
  if (!user) return false

  const rolePermissions = ROLE_PERMISSIONS[user.role]
  if (!rolePermissions) return false

  return rolePermissions.includes(permission)
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(
  user: UserWithRole | null | undefined,
  permissions: AppPermission[]
): boolean {
  if (!user) return false
  return permissions.every((permission) => hasPermission(user, permission))
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(
  user: UserWithRole | null | undefined,
  permissions: AppPermission[]
): boolean {
  if (!user) return false
  return permissions.some((permission) => hasPermission(user, permission))
}

/**
 * Get all permissions for a user based on their role
 */
export function getUserPermissions(
  user: UserWithRole | null | undefined
): AppPermission[] {
  if (!user) return []
  return ROLE_PERMISSIONS[user.role] || []
}

// =============================================================================
// ROLE CATEGORY HELPERS
// =============================================================================

/**
 * Check if user is an admin (ADMIN or SUPER_ADMIN)
 */
export function isAdmin(user: UserWithRole | null | undefined): boolean {
  return hasAnyRole(user, ADMIN_ROLES)
}

/**
 * Check if user is staff (any role except CLIENT)
 */
export function isStaff(user: UserWithRole | null | undefined): boolean {
  return hasAnyRole(user, STAFF_ROLES)
}

/**
 * Check if user is a super admin
 */
export function isSuperAdmin(user: UserWithRole | null | undefined): boolean {
  return hasRole(user, APP_ROLES.SUPER_ADMIN)
}

/**
 * Check if user is a client
 */
export function isClient(user: UserWithRole | null | undefined): boolean {
  return hasRole(user, APP_ROLES.CLIENT)
}

// =============================================================================
// ACCESS CONTROL HELPERS
// =============================================================================

/**
 * Check if user can access admin dashboard
 */
export function canAccessAdminDashboard(
  user: UserWithRole | null | undefined
): boolean {
  return hasPermission(user, 'view_admin_dashboard')
}

/**
 * Check if user can access client dashboard
 */
export function canAccessClientDashboard(
  user: UserWithRole | null | undefined
): boolean {
  return hasPermission(user, 'view_client_dashboard')
}

/**
 * Check if user can manage a specific resource
 * Useful for showing/hiding edit buttons
 */
export function canManage(
  user: UserWithRole | null | undefined,
  resource: 'members' | 'plans' | 'classes' | 'exercises' | 'settings' | 'staff'
): boolean {
  const permissionMap: Record<string, AppPermission> = {
    members: 'manage_members',
    plans: 'manage_plans',
    classes: 'manage_classes',
    exercises: 'manage_exercises',
    settings: 'manage_gym_settings',
    staff: 'manage_staff',
  }

  const permission = permissionMap[resource]
  return permission ? hasPermission(user, permission) : false
}

/**
 * Check if user can view financial data
 */
export function canViewFinances(user: UserWithRole | null | undefined): boolean {
  return hasPermission(user, 'view_gym_finances')
}

/**
 * Check if user can manage member workouts/routines
 */
export function canManageMemberWorkouts(
  user: UserWithRole | null | undefined
): boolean {
  return hasPermission(user, 'manage_any_member_routines')
}

/**
 * Check if user can manage member metrics/measurements
 */
export function canManageMemberMetrics(
  user: UserWithRole | null | undefined
): boolean {
  return hasPermission(user, 'manage_any_member_metrics')
}

// =============================================================================
// DATABASE ROLE MAPPING
// =============================================================================

/**
 * Database role type (all possible values in user_role enum)
 */
export type DatabaseRole =
  | 'owner'
  | 'admin'
  | 'instructor'
  | 'member'
  | 'super_admin'
  | 'assistant'
  | 'trainer'
  | 'nutritionist'
  | 'client'

/**
 * Map database role to AppRole
 * Handles both legacy and new role values
 */
export function mapLegacyRole(dbRole: DatabaseRole | string | null): AppRole {
  switch (dbRole) {
    // New role values (preferred)
    case 'super_admin':
      return APP_ROLES.SUPER_ADMIN
    case 'assistant':
      return APP_ROLES.ASSISTANT
    case 'trainer':
      return APP_ROLES.TRAINER
    case 'nutritionist':
      return APP_ROLES.NUTRITIONIST
    case 'client':
      return APP_ROLES.CLIENT

    // Legacy role values (backwards compatibility)
    case 'owner':
      return APP_ROLES.ADMIN
    case 'admin':
      return APP_ROLES.ADMIN
    case 'instructor':
      return APP_ROLES.TRAINER
    case 'member':
      return APP_ROLES.CLIENT

    default:
      return APP_ROLES.CLIENT
  }
}

/**
 * Map AppRole to database role value
 * Uses new role names when available
 */
export function mapToDbRole(appRole: AppRole): DatabaseRole {
  switch (appRole) {
    case APP_ROLES.SUPER_ADMIN:
      return 'super_admin'
    case APP_ROLES.ADMIN:
      return 'admin'
    case APP_ROLES.ASSISTANT:
      return 'assistant'
    case APP_ROLES.TRAINER:
      return 'trainer'
    case APP_ROLES.NUTRITIONIST:
      return 'nutritionist'
    case APP_ROLES.CLIENT:
      return 'client'
    default:
      return 'client'
  }
}

/**
 * @deprecated Use mapToDbRole instead
 * Map new AppRole to legacy database role (for DB compatibility)
 */
export function mapToLegacyRole(
  appRole: AppRole
): 'owner' | 'admin' | 'instructor' | 'member' {
  switch (appRole) {
    case APP_ROLES.SUPER_ADMIN:
      return 'owner'
    case APP_ROLES.ADMIN:
      return 'admin'
    case APP_ROLES.ASSISTANT:
      return 'admin'
    case APP_ROLES.TRAINER:
      return 'instructor'
    case APP_ROLES.NUTRITIONIST:
      return 'instructor'
    case APP_ROLES.CLIENT:
      return 'member'
    default:
      return 'member'
  }
}
