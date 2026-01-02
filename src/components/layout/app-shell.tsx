'use client'

import { useState } from 'react'
import type { User } from '@supabase/supabase-js'

import { TooltipProvider } from '@/components/ui/tooltip'
import { OrganizationProvider } from '@/providers'
import { SidebarProvider } from './sidebar-context'
import { Sidebar } from './sidebar'
import { MobileSidebar } from './mobile-sidebar'
import { MainContent } from './main-content'

interface AppShellProps {
  user: User
  children: React.ReactNode
}

export function AppShell({ user, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <OrganizationProvider>
      <TooltipProvider delayDuration={0}>
        <SidebarProvider>
          <div className="flex min-h-screen bg-background">
            {/* Desktop Sidebar - hidden on mobile */}
            <Sidebar user={user} className="hidden lg:flex fixed left-0 top-0 z-30" />

            {/* Mobile Sidebar - Sheet drawer */}
            <MobileSidebar
              user={user}
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
  )
}
