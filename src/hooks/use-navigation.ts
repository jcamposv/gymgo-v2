'use client'

import { useMemo } from 'react'

import { usePermissions } from '@/contexts/user-context'
import {
  mainNavigation,
  bottomNavigation,
  adminNavigation,
  adminBottomNavigation,
  clientNavigation,
  isNavGroup,
  type NavEntry,
  type NavItem,
  type NavGroup,
} from '@/config/navigation'
import { isClient } from '@/lib/rbac'

// =============================================================================
// NAVIGATION FILTER HOOK
// =============================================================================

/**
 * Hook to filter navigation items based on user permissions
 * Returns filtered navigation arrays that the current user can access
 */
export function useFilteredNavigation() {
  const { hasPermission, hasAnyPermission, role, loading } = usePermissions()

  const filterNavItem = (item: NavItem): boolean => {
    // If item has a single permission requirement
    if (item.permission) {
      return hasPermission(item.permission)
    }

    // If item has multiple permissions (any)
    if (item.anyPermission && item.anyPermission.length > 0) {
      return hasAnyPermission(item.anyPermission)
    }

    // No permission specified = visible to all
    return true
  }

  const filterNavGroup = (group: NavGroup): NavGroup | null => {
    // First check group-level permission
    if (group.permission && !hasPermission(group.permission)) {
      return null
    }

    if (group.anyPermission && group.anyPermission.length > 0) {
      if (!hasAnyPermission(group.anyPermission)) {
        return null
      }
    }

    // Filter child items
    const filteredItems = group.items.filter(filterNavItem)

    // If no children are visible, hide the group
    if (filteredItems.length === 0) {
      return null
    }

    return {
      ...group,
      items: filteredItems,
    }
  }

  const filterNavEntries = (entries: NavEntry[]): NavEntry[] => {
    return entries
      .map((entry) => {
        if (isNavGroup(entry)) {
          return filterNavGroup(entry)
        }
        return filterNavItem(entry) ? entry : null
      })
      .filter((entry): entry is NavEntry => entry !== null)
  }

  // Memoize the filtered navigation
  const filteredMain = useMemo(() => {
    if (loading) return []
    return filterNavEntries(mainNavigation)
  }, [loading, role]) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredBottom = useMemo(() => {
    if (loading) return []
    return filterNavEntries(bottomNavigation) as NavItem[]
  }, [loading, role]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    mainNavigation: filteredMain,
    bottomNavigation: filteredBottom,
    loading,
  }
}

/**
 * Hook to get navigation based on user type (admin vs client)
 * Returns appropriate navigation set for the user's role
 */
export function useRoleBasedNavigation() {
  const { role, hasPermission, hasAnyPermission, loading } = usePermissions()

  const filterNavItem = (item: NavItem): boolean => {
    if (item.permission) {
      return hasPermission(item.permission)
    }
    if (item.anyPermission && item.anyPermission.length > 0) {
      return hasAnyPermission(item.anyPermission)
    }
    return true
  }

  const filterNavGroup = (group: NavGroup): NavGroup | null => {
    if (group.permission && !hasPermission(group.permission)) {
      return null
    }
    if (group.anyPermission && group.anyPermission.length > 0) {
      if (!hasAnyPermission(group.anyPermission)) {
        return null
      }
    }
    const filteredItems = group.items.filter(filterNavItem)
    if (filteredItems.length === 0) {
      return null
    }
    return { ...group, items: filteredItems }
  }

  const filterNavEntries = (entries: NavEntry[]): NavEntry[] => {
    return entries
      .map((entry) => {
        if (isNavGroup(entry)) {
          return filterNavGroup(entry)
        }
        return filterNavItem(entry) ? entry : null
      })
      .filter((entry): entry is NavEntry => entry !== null)
  }

  // Determine which navigation set to use
  const isClientRole = isClient({ id: '', role, organization_id: null })

  const navigation = useMemo(() => {
    if (loading) return { main: [], bottom: [] }

    // Client gets client navigation
    if (isClientRole) {
      return {
        main: filterNavEntries(clientNavigation),
        bottom: [] as NavItem[],
      }
    }

    // Staff gets admin navigation
    return {
      main: filterNavEntries(adminNavigation),
      bottom: filterNavEntries(adminBottomNavigation) as NavItem[],
    }
  }, [loading, role, isClientRole]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    mainNavigation: navigation.main,
    bottomNavigation: navigation.bottom,
    isClientView: isClientRole,
    loading,
  }
}
