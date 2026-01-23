'use client'

import type { User } from '@supabase/supabase-js'

import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { SidebarNav } from './sidebar-nav'
import { SidebarUserMenu } from './sidebar-user-menu'
import { AppLogo } from './app-logo'
import { LocationSwitcher } from './location-switcher'
import type { FilteredNavigation } from '@/lib/navigation/filter-navigation'
import type { ViewPreferences } from '@/lib/auth/get-view-preferences'

interface MobileSidebarProps {
  user: User
  navigation: FilteredNavigation
  viewPreferences: ViewPreferences | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileSidebar({ user, navigation, viewPreferences, open, onOpenChange }: MobileSidebarProps) {
  const { mainNavigation, bottomNavigation } = navigation

  const handleItemClick = () => {
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle asChild>
            <AppLogo onClick={handleItemClick} />
          </SheetTitle>
        </SheetHeader>

        {/* Location Switcher */}
        <div className="border-b px-2 py-2">
          <LocationSwitcher />
        </div>

        <div className="flex flex-col h-[calc(100vh-120px)]">
          {/* Main Navigation */}
          <ScrollArea className="flex-1 py-4">
            <SidebarNav items={mainNavigation} onItemClick={handleItemClick} />
          </ScrollArea>

          {/* Bottom Navigation + User */}
          <div className="border-t">
            {bottomNavigation.length > 0 && (
              <div className="py-2">
                <SidebarNav items={bottomNavigation} onItemClick={handleItemClick} />
              </div>
            )}
            <SidebarUserMenu user={user} viewPreferences={viewPreferences} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
