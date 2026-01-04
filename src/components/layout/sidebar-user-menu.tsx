'use client'

import { LogOut, ChevronsUpDown } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ViewSwitcher } from './view-switcher'
import type { ViewPreferences } from '@/lib/auth/get-view-preferences'

interface SidebarUserMenuProps {
  user: User
  collapsed?: boolean
  viewPreferences?: ViewPreferences | null
}

export function SidebarUserMenu({ user, collapsed, viewPreferences }: SidebarUserMenuProps) {
  const { signOut } = useAuth()

  const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario'
  const initials = name.slice(0, 2).toUpperCase()
  const email = user.email || ''

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex w-full items-center gap-3 border-t p-3 hover:bg-accent transition-colors',
            collapsed && 'justify-center p-2'
          )}
        >
          <Avatar className={cn('h-9 w-9', collapsed && 'h-8 w-8')}>
            <AvatarFallback className="text-sm">{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium truncate">{name}</p>
                <p className="text-xs text-muted-foreground truncate">{email}</p>
              </div>
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={collapsed ? 'right' : 'top'}
        align={collapsed ? 'start' : 'start'}
        className="w-56"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{name}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
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
  )
}
