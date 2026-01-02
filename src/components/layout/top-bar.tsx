'use client'

import { Menu, PanelLeftClose, PanelLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useSidebar } from './sidebar-context'

interface TopBarProps {
  onMenuClick: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { collapsed, toggleCollapsed } = useSidebar()

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Abrir menu</span>
      </Button>

      {/* Desktop collapse button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex"
            onClick={toggleCollapsed}
          >
            {collapsed ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
            <span className="sr-only">
              {collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        </TooltipContent>
      </Tooltip>

      {/* Page title area - can be used via slots or context if needed */}
      <div className="flex-1" />
    </header>
  )
}
