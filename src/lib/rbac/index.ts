// =============================================================================
// RBAC - Role-Based Access Control
// =============================================================================

// Types
export {
  APP_ROLES,
  ALL_ROLES,
  STAFF_ROLES,
  ADMIN_ROLES,
  PERMISSIONS,
  ALL_PERMISSIONS,
  type AppRole,
  type AppPermission,
  type UserWithRole,
  type MemberProfile,
  type UserContext,
} from './types'

// Permissions mapping
export {
  ROLE_PERMISSIONS,
  PERMISSION_GROUPS,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
} from './permissions'

// Helper functions
export {
  // Basic checks
  hasRole,
  hasAnyRole,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getUserPermissions,

  // Role category checks
  isAdmin,
  isStaff,
  isSuperAdmin,
  isClient,

  // Access control
  canAccessAdminDashboard,
  canAccessClientDashboard,
  canManage,
  canViewFinances,
  canManageMemberWorkouts,
  canManageMemberMetrics,

  // Database role mapping
  mapLegacyRole,
  mapToDbRole,
  mapToLegacyRole,
  type DatabaseRole,
} from './helpers'
