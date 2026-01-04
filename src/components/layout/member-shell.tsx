'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import {
  LayoutDashboard,
  User as UserIcon,
  Dumbbell,
  Activity,
  CalendarDays,
  LogOut,
  Menu,
  ChevronsUpDown,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ViewSwitcher } from './view-switcher'
import { MemberLogo } from './member-logo'
import { OrganizationProvider } from '@/providers'
import type { AppRole } from '@/lib/rbac'
import type { ViewPreferences } from '@/lib/auth/get-view-preferences'

// =============================================================================
// TYPES
// =============================================================================

interface MemberShellProps {
  user: User
  profile: {
    full_name: string | null
    email: string
    role: AppRole
  }
  memberProfile: {
    id: string
    full_name: string
    email: string
    status: string
  } | null
  viewPreferences: ViewPreferences | null
  children: React.ReactNode
}

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

// =============================================================================
// NAVIGATION
// =============================================================================

const memberNavItems: NavItem[] = [
  { href: '/member', label: 'Inicio', icon: LayoutDashboard },
  { href: '/member/profile', label: 'Mi Perfil', icon: UserIcon },
  { href: '/member/workouts', label: 'Mis Rutinas', icon: Dumbbell },
  { href: '/member/progress', label: 'Mi Progreso', icon: Activity },
  { href: '/member/classes', label: 'Clases', icon: CalendarDays },
]

// =============================================================================
// COMPONENT
// =============================================================================

export function MemberShell({ user, profile, memberProfile, viewPreferences, children }: MemberShellProps) {
  return (
    <OrganizationProvider>
      <MemberShellContent
        user={user}
        profile={profile}
        memberProfile={memberProfile}
        viewPreferences={viewPreferences}
      >
        {children}
      </MemberShellContent>
    </OrganizationProvider>
  )
}

function MemberShellContent({ user, profile, memberProfile, viewPreferences, children }: MemberShellProps) {
  const pathname = usePathname()
  const { signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const initials = profile.full_name
    ? profile.full_name.slice(0, 2).toUpperCase()
    : profile.email.slice(0, 2).toUpperCase()

  const displayName = profile.full_name || profile.email

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center px-4">
          {/* Mobile menu button */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-14 items-center border-b px-4">
                <MemberLogo />
              </div>
              <nav className="flex flex-col gap-1 p-4">
                {memberNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-lime-100 text-lime-900'
                          : 'text-muted-foreground hover:bg-accent'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <MemberLogo />

          {/* Desktop Navigation */}
          <nav className="ml-8 hidden lg:flex items-center gap-1">
            {memberNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-lime-100 text-lime-900'
                      : 'text-muted-foreground hover:bg-accent'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Right side - User menu */}
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-md p-1 hover:bg-accent transition-colors">
                  <div className="hidden sm:flex flex-col items-end mr-1">
                    <span className="text-sm font-medium">{displayName}</span>
                    <span className="text-xs text-muted-foreground">Miembro</span>
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-lime-100 text-lime-800">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronsUpDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{displayName}</p>
                    <p className="text-xs text-muted-foreground">{profile.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* View Switcher - Only shows for staff with member profile */}
                <ViewSwitcher variant="dropdown" initialPreferences={viewPreferences} />
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {!memberProfile && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
            <p className="text-sm">
              No tienes un perfil de miembro activo. Contacta a la administracion del gimnasio
              para activar tu membresia.
            </p>
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
