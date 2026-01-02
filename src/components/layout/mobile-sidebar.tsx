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
import { mainNavigation, bottomNavigation } from '@/config/navigation'

interface MobileSidebarProps {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileSidebar({ user, open, onOpenChange }: MobileSidebarProps) {
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

        <div className="flex flex-col h-[calc(100vh-57px)]">
          {/* Main Navigation */}
          <ScrollArea className="flex-1 py-4">
            <SidebarNav items={mainNavigation} onItemClick={handleItemClick} />
          </ScrollArea>

          {/* Bottom Navigation + User */}
          <div className="border-t">
            <div className="py-2">
              <SidebarNav items={bottomNavigation} onItemClick={handleItemClick} />
            </div>
            <SidebarUserMenu user={user} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
