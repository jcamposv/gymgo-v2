'use client'

import Link from 'next/link'
import { Dumbbell } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSidebar } from './sidebar-context'
import { SidebarNav } from './sidebar-nav'
import { SidebarUserMenu } from './sidebar-user-menu'
import { mainNavigation, bottomNavigation } from '@/config/navigation'

interface SidebarProps {
  user: User
  className?: string
}

export function Sidebar({ user, className }: SidebarProps) {
  const { collapsed } = useSidebar()

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
        <Link
          href="/dashboard"
          className={cn(
            'flex items-center gap-2',
            collapsed && 'justify-center w-full'
          )}
        >
          <Dumbbell className="h-6 w-6 shrink-0" />
          {!collapsed && <span className="font-bold text-lg">GymGo</span>}
        </Link>
      </div>

      {/* Main Navigation */}
      <ScrollArea className="flex-1 py-4">
        <SidebarNav items={mainNavigation} collapsed={collapsed} />
      </ScrollArea>

      {/* Bottom Navigation + User */}
      <div className="border-t">
        <div className="py-2">
          <SidebarNav items={bottomNavigation} collapsed={collapsed} />
        </div>
        <SidebarUserMenu user={user} collapsed={collapsed} />
      </div>
    </aside>
  )
}
