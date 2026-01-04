import {
  LayoutDashboard,
  Dumbbell,
  Users,
  UsersRound,
  CalendarDays,
  CreditCard,
  UserCheck,
  BarChart3,
  CalendarClock,
  Library,
  Settings,
  User,
  Activity,
  type LucideIcon,
} from 'lucide-react'

import type { AppPermission } from '@/lib/rbac'

// =============================================================================
// ICON REGISTRY - Map icon names to components
// =============================================================================

export const iconRegistry = {
  LayoutDashboard,
  Dumbbell,
  Users,
  UsersRound,
  CalendarDays,
  CreditCard,
  UserCheck,
  BarChart3,
  CalendarClock,
  Library,
  Settings,
  User,
  Activity,
} as const

export type IconName = keyof typeof iconRegistry

/**
 * Get icon component from icon name
 */
export function getIcon(name: IconName): LucideIcon {
  return iconRegistry[name]
}

// =============================================================================
// TYPES
// =============================================================================

export interface NavItem {
  id: string
  href: string
  label: string
  icon: IconName
  badge?: string | number
  /**
   * Permission required to see this item
   * If not specified, item is visible to all authenticated users
   */
  permission?: AppPermission
  /**
   * Any of these permissions will allow access
   */
  anyPermission?: AppPermission[]
}

export interface NavGroup {
  id: string
  label: string
  icon: IconName
  items: NavItem[]
  /**
   * Permission required to see this group
   * If not specified, visibility depends on child items
   */
  permission?: AppPermission
  /**
   * Any of these permissions will allow access to the group
   */
  anyPermission?: AppPermission[]
}

export type NavEntry = NavItem | NavGroup

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return 'items' in entry
}

// =============================================================================
// ADMIN NAVIGATION - For staff (ADMIN, ASSISTANT, TRAINER, NUTRITIONIST)
// =============================================================================

export const adminNavigation: NavEntry[] = [
  {
    id: 'dashboard',
    href: '/dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    permission: 'view_admin_dashboard',
  },
  {
    id: 'members-group',
    label: 'Miembros',
    icon: 'Users',
    anyPermission: ['view_members', 'manage_members'],
    items: [
      {
        id: 'members',
        href: '/dashboard/members',
        label: 'Ver miembros',
        icon: 'Users',
        permission: 'view_members',
      },
      {
        id: 'plans',
        href: '/dashboard/plans',
        label: 'Planes',
        icon: 'CreditCard',
        anyPermission: ['view_plans', 'manage_plans'],
      },
      {
        id: 'check-in',
        href: '/dashboard/check-in',
        label: 'Check-in',
        icon: 'UserCheck',
        anyPermission: ['view_check_ins', 'manage_check_ins', 'perform_check_in'],
      },
      {
        id: 'groups',
        href: '/dashboard/members/groups',
        label: 'Grupos',
        icon: 'UsersRound',
        permission: 'view_members',
      },
    ],
  },
  {
    id: 'classes-group',
    label: 'Clases',
    icon: 'CalendarDays',
    anyPermission: ['view_classes', 'manage_classes'],
    items: [
      {
        id: 'classes',
        href: '/dashboard/classes',
        label: 'Ver clases',
        icon: 'CalendarDays',
        permission: 'view_classes',
      },
      {
        id: 'templates',
        href: '/dashboard/templates',
        label: 'Plantillas',
        icon: 'CalendarClock',
        permission: 'manage_class_templates',
      },
    ],
  },
  {
    id: 'training-group',
    label: 'Entrenamiento',
    icon: 'Dumbbell',
    anyPermission: ['view_exercises', 'manage_exercises', 'view_any_member_routines'],
    items: [
      {
        id: 'exercises',
        href: '/dashboard/exercises',
        label: 'Ejercicios',
        icon: 'Library',
        permission: 'view_exercises',
      },
      {
        id: 'routines',
        href: '/dashboard/routines',
        label: 'Rutinas',
        icon: 'Dumbbell',
        anyPermission: ['view_any_member_routines', 'manage_any_member_routines'],
      },
    ],
  },
  {
    id: 'reports',
    href: '/dashboard/reports',
    label: 'Reportes',
    icon: 'BarChart3',
    permission: 'view_reports',
  },
]

export const adminBottomNavigation: NavItem[] = [
  {
    id: 'settings',
    href: '/dashboard/settings',
    label: 'Configuracion',
    icon: 'Settings',
    permission: 'manage_gym_settings',
  },
]

// =============================================================================
// CLIENT NAVIGATION - For gym members (CLIENT role)
// =============================================================================

export const clientNavigation: NavEntry[] = [
  {
    id: 'my-dashboard',
    href: '/member',
    label: 'Mi Dashboard',
    icon: 'LayoutDashboard',
    permission: 'view_client_dashboard',
  },
  {
    id: 'my-profile',
    href: '/member/profile',
    label: 'Mi Perfil',
    icon: 'User',
    permission: 'view_own_member_profile',
  },
  {
    id: 'my-routines',
    href: '/member/routines',
    label: 'Mis Rutinas',
    icon: 'Dumbbell',
    permission: 'view_own_routines',
  },
  {
    id: 'my-progress',
    href: '/member/progress',
    label: 'Mi Progreso',
    icon: 'Activity',
    permission: 'view_own_metrics',
  },
  {
    id: 'classes',
    href: '/member/classes',
    label: 'Clases',
    icon: 'CalendarDays',
    permission: 'view_classes',
  },
]

// =============================================================================
// LEGACY EXPORT - For backward compatibility
// Keep this until we fully migrate the sidebar
// =============================================================================

export const mainNavigation = adminNavigation
export const bottomNavigation = adminBottomNavigation
