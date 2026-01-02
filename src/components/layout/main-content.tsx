'use client'

import { cn } from '@/lib/utils'
import { useSidebar } from './sidebar-context'
import { TopBar } from './top-bar'

interface MainContentProps {
  children: React.ReactNode
  onMenuClick: () => void
}

export function MainContent({ children, onMenuClick }: MainContentProps) {
  const { collapsed } = useSidebar()

  return (
    <div
      className={cn(
        'flex flex-1 flex-col transition-all duration-300',
        collapsed ? 'lg:ml-16' : 'lg:ml-64'
      )}
    >
      {/* Top bar - only shows menu button on mobile */}
      <TopBar onMenuClick={onMenuClick} />

      {/* Page content */}
      <main className="flex-1 p-4 lg:p-6">{children}</main>
    </div>
  )
}
