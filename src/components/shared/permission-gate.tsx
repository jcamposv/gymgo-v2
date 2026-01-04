'use client'

import type { ReactNode } from 'react'

import { usePermissions } from '@/contexts/user-context'
import type { AppPermission, AppRole } from '@/lib/rbac'

// =============================================================================
// PERMISSION GATE
// =============================================================================

interface PermissionGateProps {
  children: ReactNode
  /**
   * Single permission required
   */
  permission?: AppPermission
  /**
   * Multiple permissions - user must have ALL
   */
  permissions?: AppPermission[]
  /**
   * Multiple permissions - user must have ANY
   */
  anyPermission?: AppPermission[]
  /**
   * Required role
   */
  role?: AppRole
  /**
   * Multiple roles - user must have ANY
   */
  anyRole?: AppRole[]
  /**
   * Require user to be admin (ADMIN or SUPER_ADMIN)
   */
  requireAdmin?: boolean
  /**
   * Require user to be staff (not CLIENT)
   */
  requireStaff?: boolean
  /**
   * Require user to have a member profile
   */
  requireMemberProfile?: boolean
  /**
   * Fallback content when access denied
   */
  fallback?: ReactNode
  /**
   * Show nothing while loading (default: true)
   */
  hideWhileLoading?: boolean
}

/**
 * Gate component for permission-based rendering
 *
 * Usage:
 * ```tsx
 * <PermissionGate permission="manage_members">
 *   <CreateMemberButton />
 * </PermissionGate>
 *
 * <PermissionGate anyPermission={['manage_plans', 'view_plans']}>
 *   <PlansSection />
 * </PermissionGate>
 *
 * <PermissionGate requireAdmin>
 *   <AdminOnlyFeature />
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  children,
  permission,
  permissions,
  anyPermission,
  role,
  anyRole,
  requireAdmin,
  requireStaff,
  requireMemberProfile,
  fallback = null,
  hideWhileLoading = true,
}: PermissionGateProps) {
  const {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    hasRole,
    isAdmin,
    isStaff,
    hasMemberProfile,
    loading,
  } = usePermissions()

  // While loading, hide or show fallback
  if (loading) {
    return hideWhileLoading ? null : <>{fallback}</>
  }

  // Check single permission
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>
  }

  // Check all permissions
  if (permissions && !hasAllPermissions(permissions)) {
    return <>{fallback}</>
  }

  // Check any permission
  if (anyPermission && !hasAnyPermission(anyPermission)) {
    return <>{fallback}</>
  }

  // Check single role
  if (role && !hasRole(role)) {
    return <>{fallback}</>
  }

  // Check any role
  if (anyRole && !anyRole.some((r) => hasRole(r))) {
    return <>{fallback}</>
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin()) {
    return <>{fallback}</>
  }

  // Check staff requirement
  if (requireStaff && !isStaff()) {
    return <>{fallback}</>
  }

  // Check member profile requirement
  if (requireMemberProfile && !hasMemberProfile) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// =============================================================================
// SPECIALIZED GATES
// =============================================================================

interface SimpleGateProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Gate for admin-only content
 */
export function AdminGate({ children, fallback = null }: SimpleGateProps) {
  return (
    <PermissionGate requireAdmin fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

/**
 * Gate for staff-only content (anyone except CLIENT)
 */
export function StaffGate({ children, fallback = null }: SimpleGateProps) {
  return (
    <PermissionGate requireStaff fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

/**
 * Gate for content requiring member profile
 */
export function MemberProfileGate({ children, fallback = null }: SimpleGateProps) {
  return (
    <PermissionGate requireMemberProfile fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

/**
 * Gate for financial content
 */
export function FinanceGate({ children, fallback = null }: SimpleGateProps) {
  return (
    <PermissionGate permission="view_gym_finances" fallback={fallback}>
      {children}
    </PermissionGate>
  )
}
