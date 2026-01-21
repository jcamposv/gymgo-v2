'use client'

import { useState } from 'react'
import { Menu, PanelLeftClose, PanelLeft, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useSidebar } from './sidebar-context'
import { useOrganizationContext } from '@/providers'
import { useUser } from '@/contexts/user-context'
import { UpgradePlanDialog } from '@/components/billing/upgrade-plan-dialog'
import type { PlanTier } from '@/lib/pricing.config'

interface TopBarProps {
  onMenuClick: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { collapsed, toggleCollapsed } = useSidebar()
  const { organization } = useOrganizationContext()
  const { user } = useUser()
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)

  // Determine current plan and if upgrade should be shown
  const currentPlan = (organization?.subscription_plan || 'free') as PlanTier
  const isTopPlan = currentPlan === 'enterprise'

  return (
    <>
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

        {/* Upgrade CTA - only show if not on top plan */}
        {!isTopPlan && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-primary/50 text-primary hover:bg-primary/10 hover:text-primary"
            onClick={() => setUpgradeDialogOpen(true)}
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Mejorar plan</span>
            <span className="sm:hidden">Upgrade</span>
          </Button>
        )}
      </header>

      {/* Upgrade Dialog */}
      <UpgradePlanDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        currentPlan={currentPlan}
        userEmail={user?.email || ''}
        userName={user?.user_metadata?.full_name || user?.user_metadata?.name || ''}
      />
    </>
  )
}
