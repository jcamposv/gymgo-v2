import type { LucideIcon } from 'lucide-react'
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
} from 'lucide-react'

// =============================================================================
// TYPES
// =============================================================================

export interface NavItem {
  id: string
  href: string
  label: string
  icon: LucideIcon
  badge?: string | number
}

export interface NavGroup {
  id: string
  label: string
  icon: LucideIcon
  items: NavItem[]
}

export type NavEntry = NavItem | NavGroup

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return 'items' in entry
}

// =============================================================================
// NAVIGATION CONFIG
// =============================================================================

export const mainNavigation: NavEntry[] = [
  {
    id: 'dashboard',
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'members-group',
    label: 'Miembros',
    icon: Users,
    items: [
      { id: 'members', href: '/dashboard/members', label: 'Ver miembros', icon: Users },
      { id: 'plans', href: '/dashboard/plans', label: 'Planes', icon: CreditCard },
      { id: 'check-in', href: '/dashboard/check-in', label: 'Check-in', icon: UserCheck },
      { id: 'groups', href: '/dashboard/members/groups', label: 'Grupos', icon: UsersRound },
    ],
  },
  {
    id: 'classes-group',
    label: 'Clases',
    icon: CalendarDays,
    items: [
      { id: 'classes', href: '/dashboard/classes', label: 'Ver clases', icon: CalendarDays },
      { id: 'templates', href: '/dashboard/templates', label: 'Plantillas', icon: CalendarClock },
    ],
  },
  {
    id: 'training-group',
    label: 'Entrenamiento',
    icon: Dumbbell,
    items: [
      { id: 'exercises', href: '/dashboard/exercises', label: 'Ejercicios', icon: Library },
      { id: 'routines', href: '/dashboard/routines', label: 'Rutinas', icon: Dumbbell },
    ],
  },
  {
    id: 'reports',
    href: '/dashboard/reports',
    label: 'Reportes',
    icon: BarChart3,
  },
]

export const bottomNavigation: NavItem[] = [
  {
    id: 'settings',
    href: '/dashboard/settings',
    label: 'Configuracion',
    icon: Settings,
  },
]
