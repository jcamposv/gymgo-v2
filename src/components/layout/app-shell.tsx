'use client'

import { useState } from 'react'
import type { User } from '@supabase/supabase-js'

import { TooltipProvider } from '@/components/ui/tooltip'
import { OrganizationProvider } from '@/providers'
import { UserProvider } from '@/contexts/user-context'
import { SidebarProvider } from './sidebar-context'
import { Sidebar } from './sidebar'
import { MobileSidebar } from './mobile-sidebar'
import { MainContent } from './main-content'
import type { FilteredNavigation } from '@/lib/navigation/filter-navigation'
import type { ViewPreferences } from '@/lib/auth/get-view-preferences'

interface AppShellProps {
  user: User
  navigation: FilteredNavigation
  viewPreferences: ViewPreferences | null
  children: React.ReactNode
}

export function AppShell({ user, navigation, viewPreferences, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <UserProvider initialUser={user}>
      <OrganizationProvider>
        <TooltipProvider delayDuration={0}>
          <SidebarProvider>
            <div className="flex min-h-screen bg-background">
              {/* Desktop Sidebar - hidden on mobile */}
              <Sidebar
                user={user}
                navigation={navigation}
                viewPreferences={viewPreferences}
                className="hidden lg:flex fixed left-0 top-0 z-30"
              />

              {/* Mobile Sidebar - Sheet drawer */}
              <MobileSidebar
                user={user}
                navigation={navigation}
                viewPreferences={viewPreferences}
                open={mobileOpen}
                onOpenChange={setMobileOpen}
              />

              {/* Main content area - with margin for sidebar */}
              <MainContent onMenuClick={() => setMobileOpen(true)}>
                {children}
              </MainContent>
            </div>
          </SidebarProvider>
        </TooltipProvider>
      </OrganizationProvider>
    </UserProvider>
  )
}
