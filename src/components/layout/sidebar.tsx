'use client'

import type { User } from '@supabase/supabase-js'

import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSidebar } from './sidebar-context'
import { SidebarNav } from './sidebar-nav'
import { SidebarUserMenu } from './sidebar-user-menu'
import { AppLogo } from './app-logo'
import type { FilteredNavigation } from '@/lib/navigation/filter-navigation'
import type { ViewPreferences } from '@/lib/auth/get-view-preferences'

interface SidebarProps {
  user: User
  navigation: FilteredNavigation
  viewPreferences: ViewPreferences | null
  className?: string
}

export function Sidebar({ user, navigation, viewPreferences, className }: SidebarProps) {
  const { collapsed } = useSidebar()
  const { mainNavigation, bottomNavigation } = navigation

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r bg-background transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-3">
        <AppLogo collapsed={collapsed} />
      </div>

      {/* Main Navigation */}
      <ScrollArea className="flex-1 py-4">
        <SidebarNav items={mainNavigation} collapsed={collapsed} />
      </ScrollArea>

      {/* Bottom Navigation + User */}
      <div className="border-t">
        {bottomNavigation.length > 0 && (
          <div className="py-2">
            <SidebarNav items={bottomNavigation} collapsed={collapsed} />
          </div>
        )}
        <SidebarUserMenu user={user} collapsed={collapsed} viewPreferences={viewPreferences} />
      </div>
    </aside>
  )
}
