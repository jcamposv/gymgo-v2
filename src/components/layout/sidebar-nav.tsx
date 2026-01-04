'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  type NavEntry,
  type NavItem,
  type NavGroup,
  isNavGroup,
  getIcon,
} from '@/config/navigation'

interface SidebarNavProps {
  items: NavEntry[]
  collapsed?: boolean
  onItemClick?: () => void
}

export function SidebarNav({ items, collapsed, onItemClick }: SidebarNavProps) {
  return (
    <nav className={cn('space-y-1', collapsed ? 'px-1' : 'px-2')}>
      {items.map((item) =>
        isNavGroup(item) ? (
          <NavGroupItem
            key={item.id}
            group={item}
            collapsed={collapsed}
            onItemClick={onItemClick}
          />
        ) : (
          <NavLinkItem
            key={item.id}
            item={item}
            collapsed={collapsed}
            onItemClick={onItemClick}
          />
        )
      )}
    </nav>
  )
}

// =============================================================================
// NavLinkItem - Single navigation link
// =============================================================================

interface NavLinkItemProps {
  item: NavItem
  collapsed?: boolean
  onItemClick?: () => void
  isNested?: boolean
}

function NavLinkItem({ item, collapsed, onItemClick, isNested }: NavLinkItemProps) {
  const pathname = usePathname()
  const Icon = getIcon(item.icon)
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

  const linkContent = (
    <Link
      href={item.href}
      onClick={onItemClick}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground',
        isNested && !collapsed && 'pl-9',
        collapsed && 'justify-center px-2'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && item.badge && (
        <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
          {item.badge}
        </span>
      )}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    )
  }

  return linkContent
}

// =============================================================================
// NavGroupItem - Collapsible group of navigation items
// =============================================================================

interface NavGroupItemProps {
  group: NavGroup
  collapsed?: boolean
  onItemClick?: () => void
}

function NavGroupItem({ group, collapsed, onItemClick }: NavGroupItemProps) {
  const pathname = usePathname()
  const Icon = getIcon(group.icon)

  // Check if any child is active
  const isChildActive = group.items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  )

  // Start expanded if a child is active
  const [isOpen, setIsOpen] = useState(isChildActive)

  // In collapsed mode, show as dropdown/popover
  if (collapsed) {
    return (
      <CollapsedNavGroup
        group={group}
        isChildActive={isChildActive}
        onItemClick={onItemClick}
      />
    )
  }

  return (
    <div>
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full justify-start gap-3 px-3 py-2 text-sm font-medium',
          'hover:bg-accent hover:text-accent-foreground',
          isChildActive ? 'text-accent-foreground' : 'text-muted-foreground'
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{group.label}</span>
        <ChevronDown
          className={cn(
            'ml-auto h-4 w-4 shrink-0 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </Button>

      {isOpen && (
        <div className="mt-1 space-y-1">
          {group.items.map((item) => (
            <NavLinkItem key={item.id} item={item} onItemClick={onItemClick} isNested />
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// CollapsedNavGroup - Group shown as tooltip menu when collapsed
// =============================================================================

interface CollapsedNavGroupProps {
  group: NavGroup
  isChildActive: boolean
  onItemClick?: () => void
}

function CollapsedNavGroup({ group, isChildActive, onItemClick }: CollapsedNavGroupProps) {
  const Icon = getIcon(group.icon)
  const pathname = usePathname()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={group.items[0]?.href || '#'}
          onClick={onItemClick}
          className={cn(
            'flex items-center justify-center rounded-md px-2 py-2 text-sm font-medium transition-colors',
            'hover:bg-accent hover:text-accent-foreground',
            isChildActive
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground'
          )}
        >
          <Icon className="h-4 w-4" />
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" className="flex flex-col gap-1 p-2">
        <span className="font-medium text-xs text-muted-foreground mb-1">
          {group.label}
        </span>
        {group.items.map((item) => {
          const ItemIcon = getIcon(item.icon)
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                'flex items-center gap-2 rounded px-2 py-1.5 text-sm',
                'hover:bg-accent hover:text-accent-foreground',
                isActive && 'bg-accent/50'
              )}
            >
              <ItemIcon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          )
        })}
      </TooltipContent>
    </Tooltip>
  )
}
