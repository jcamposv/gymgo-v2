'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Palette,
  Building2,
  Globe,
  CalendarDays,
  MessageSquare,
  CreditCard,
  User,
  Users,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard/settings', label: 'Branding', icon: Palette, exact: true },
  { href: '/dashboard/settings/info', label: 'Informacion', icon: Building2 },
  { href: '/dashboard/settings/regional', label: 'Regional', icon: Globe },
  { href: '/dashboard/settings/classes', label: 'Clases', icon: CalendarDays },
  { href: '/dashboard/settings/whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { href: '/dashboard/settings/plan', label: 'Plan', icon: CreditCard },
  { href: '/dashboard/settings/account', label: 'Mi Cuenta', icon: User },
  { href: '/dashboard/settings/team', label: 'Equipo', icon: Users },
  { href: '/dashboard/settings/locations', label: 'Ubicaciones', icon: MapPin },
]

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-wrap gap-1 border-b pb-4">
      {navItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
