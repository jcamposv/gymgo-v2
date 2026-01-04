import { hasPermission, hasAnyPermission, type UserWithRole } from '@/lib/rbac'
import {
  adminNavigation,
  adminBottomNavigation,
  isNavGroup,
  type NavEntry,
  type NavItem,
  type NavGroup,
} from '@/config/navigation'

// =============================================================================
// TYPES
// =============================================================================

export interface FilteredNavigation {
  mainNavigation: NavEntry[]
  bottomNavigation: NavItem[]
}

// =============================================================================
// SERVER-SIDE NAVIGATION FILTER
// =============================================================================

/**
 * Filters a single navigation item based on user permissions
 * @param user - User with role information
 * @param item - Navigation item to filter
 * @returns true if user can see this item
 */
function canAccessNavItem(user: UserWithRole, item: NavItem): boolean {
  // If item has a single permission requirement
  if (item.permission) {
    return hasPermission(user, item.permission)
  }

  // If item has multiple permissions (any)
  if (item.anyPermission && item.anyPermission.length > 0) {
    return hasAnyPermission(user, item.anyPermission)
  }

  // No permission specified = visible to all authenticated users
  return true
}

/**
 * Filters a navigation group based on user permissions
 * @param user - User with role information
 * @param group - Navigation group to filter
 * @returns Filtered group or null if not accessible
 */
function filterNavGroup(user: UserWithRole, group: NavGroup): NavGroup | null {
  // First check group-level permission
  if (group.permission && !hasPermission(user, group.permission)) {
    return null
  }

  if (group.anyPermission && group.anyPermission.length > 0) {
    if (!hasAnyPermission(user, group.anyPermission)) {
      return null
    }
  }

  // Filter child items
  const filteredItems = group.items.filter((item) => canAccessNavItem(user, item))

  // If no children are visible, hide the group
  if (filteredItems.length === 0) {
    return null
  }

  return {
    ...group,
    items: filteredItems,
  }
}

/**
 * Filters an array of navigation entries based on user permissions
 * @param user - User with role information
 * @param entries - Navigation entries to filter
 * @returns Filtered entries
 */
function filterNavEntries(user: UserWithRole, entries: NavEntry[]): NavEntry[] {
  return entries
    .map((entry) => {
      if (isNavGroup(entry)) {
        return filterNavGroup(user, entry)
      }
      return canAccessNavItem(user, entry) ? entry : null
    })
    .filter((entry): entry is NavEntry => entry !== null)
}

/**
 * Get filtered navigation for a user based on their permissions.
 * This is the main function to call from server components.
 *
 * @param user - User with role information (id, role, organization_id)
 * @returns Filtered main and bottom navigation arrays
 *
 * @example
 * ```tsx
 * // In a Server Component (e.g., layout.tsx)
 * const userWithRole = {
 *   id: user.id,
 *   role: mapLegacyRole(profile.role),
 *   organization_id: profile.organization_id,
 * }
 * const navigation = getFilteredNavigation(userWithRole)
 * ```
 */
export function getFilteredNavigation(user: UserWithRole): FilteredNavigation {
  return {
    mainNavigation: filterNavEntries(user, adminNavigation),
    bottomNavigation: filterNavEntries(user, adminBottomNavigation) as NavItem[],
  }
}
