'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LogOut,
  Settings,
  LayoutDashboard,
  Dumbbell,
  Users,
  UsersRound,
  CalendarDays,
  CreditCard,
  UserCheck,
  BarChart3,
  CalendarClock,
  ChevronDown,
  Library,
  MessageCircle,
  UserCog,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface DashboardNavProps {
  user: User
}

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

interface NavDropdownItem {
  label: string
  icon: LucideIcon
  basePath: string
  items: NavItem[]
}

const simpleNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/reports', label: 'Reportes', icon: BarChart3 },
]

const dropdownNavItems: NavDropdownItem[] = [
  {
    label: 'Miembros',
    icon: Users,
    basePath: '/dashboard/members',
    items: [
      { href: '/dashboard/members', label: 'Ver miembros', icon: Users },
      { href: '/dashboard/plans', label: 'Planes', icon: CreditCard },
      { href: '/dashboard/check-in', label: 'Check-in', icon: UserCheck },
      { href: '/dashboard/members/groups', label: 'Grupos', icon: UsersRound },
    ],
  },
  {
    label: 'Clases',
    icon: CalendarDays,
    basePath: '/dashboard/classes',
    items: [
      { href: '/dashboard/classes', label: 'Ver clases', icon: CalendarDays },
      { href: '/dashboard/templates', label: 'Plantillas', icon: CalendarClock },
    ],
  },
  {
    label: 'Entrenamiento',
    icon: Dumbbell,
    basePath: '/dashboard/exercises',
    items: [
      { href: '/dashboard/exercises', label: 'Ejercicios', icon: Library },
      { href: '/dashboard/routines', label: 'Rutinas', icon: Dumbbell },
    ],
  },
]

function NavDropdown({ item, pathname }: { item: NavDropdownItem; pathname: string }) {
  const Icon = item.icon
  const isActive = item.items.some(
    (subItem) => pathname === subItem.href || pathname.startsWith(subItem.href + '/')
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary',
            isActive ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <Icon className="h-4 w-4" />
          {item.label}
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {item.items.map((subItem) => {
          const SubIcon = subItem.icon
          return (
            <DropdownMenuItem key={subItem.href} asChild>
              <Link href={subItem.href} className="flex items-center gap-2">
                <SubIcon className="h-4 w-4" />
                {subItem.label}
              </Link>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname()
  const { signOut } = useAuth()

  const initials = user.user_metadata?.name
    ? user.user_metadata.name.slice(0, 2).toUpperCase()
    : user.email?.slice(0, 2).toUpperCase() ?? 'U'

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center">
        <Link href="/dashboard" className="flex items-center gap-2 mr-6">
          <Dumbbell className="h-6 w-6" />
          <span className="font-bold">GymGo</span>
        </Link>

        <nav className="flex items-center gap-4 flex-1">
          {/* Dashboard link */}
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary',
              pathname === '/dashboard' ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>

          {/* Dropdown menus */}
          {dropdownNavItems.map((item) => (
            <NavDropdown key={item.label} item={item} pathname={pathname} />
          ))}

          {/* Simple nav items (Check-in, Reports) */}
          {simpleNavItems.slice(1).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                {user.user_metadata?.name && (
                  <p className="font-medium">{user.user_metadata.name}</p>
                )}
                <p className="w-[200px] truncate text-sm text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <Settings className="mr-2 h-4 w-4" />
                Configuracion
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings/team">
                <UserCog className="mr-2 h-4 w-4" />
                Equipo
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings/whatsapp">
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
