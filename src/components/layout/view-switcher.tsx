'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { LayoutDashboard, User, Loader2, Info } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { updatePreferredView, type PreferredView } from '@/actions/user.actions'
import type { ViewPreferences } from '@/lib/auth/get-view-preferences'

// =============================================================================
// VIEW SWITCHER COMPONENT
// =============================================================================

interface ViewSwitcherProps {
  className?: string
  variant?: 'dropdown' | 'standalone'
  /** Initial preferences from server-side */
  initialPreferences?: ViewPreferences | null
}

/**
 * ViewSwitcher component that allows staff members who are also gym members
 * to switch between Dashboard view and Client view.
 *
 * Only shows for users who:
 * - Have view_admin_dashboard permission (staff)
 * - Have a member profile in the organization
 */
export function ViewSwitcher({ className, variant = 'dropdown', initialPreferences }: ViewSwitcherProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [preferences, setPreferences] = useState<ViewPreferences | null>(initialPreferences ?? null)

  const handleViewChange = async (newView: PreferredView) => {
    if (!preferences?.canSwitchView) return
    if (newView === preferences.preferredView) {
      // Just navigate without updating preference
      const targetPath = newView === 'dashboard' ? '/dashboard' : '/member'
      if (pathname !== targetPath) {
        router.push(targetPath)
      }
      return
    }

    startTransition(async () => {
      const result = await updatePreferredView(newView)

      if (result.success) {
        setPreferences((prev) =>
          prev ? { ...prev, preferredView: newView } : null
        )
        // Navigate to the new view
        const targetPath = newView === 'dashboard' ? '/dashboard' : '/member'
        router.push(targetPath)
      } else {
        toast.error('No se pudo actualizar tu vista preferida. Intentalo de nuevo.')
      }
    })
  }

  // User can't switch views (not staff or no member profile)
  if (!preferences?.canSwitchView) {
    // Only show message in standalone variant if they are staff without member profile
    if (variant === 'standalone' && preferences?.hasAdminDashboard && !preferences?.hasMemberProfile) {
      return (
        <div className={cn('rounded-lg border p-4', className)}>
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Vista del sistema</p>
              <p className="text-sm text-muted-foreground mt-1">
                Para usar la vista de cliente, primero necesitas un perfil de miembro.
              </p>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  // Determine current view based on pathname
  const currentView: PreferredView = pathname?.startsWith('/member') ? 'member' : 'dashboard'

  if (variant === 'dropdown') {
    return (
      <div className={cn('px-2 py-1.5', className)}>
        <p className="text-xs font-medium text-muted-foreground mb-2 px-2">
          Vista del sistema
        </p>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => handleViewChange('dashboard')}
            disabled={isPending}
            className={cn(
              'flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md transition-colors',
              currentView === 'dashboard'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent'
            )}
          >
            {isPending && currentView !== 'dashboard' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LayoutDashboard className="h-4 w-4" />
            )}
            Modo Dashboard
          </button>
          <button
            onClick={() => handleViewChange('member')}
            disabled={isPending}
            className={cn(
              'flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md transition-colors',
              currentView === 'member'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent'
            )}
          >
            {isPending && currentView !== 'member' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <User className="h-4 w-4" />
            )}
            Modo Cliente
          </button>
        </div>
      </div>
    )
  }

  // Standalone variant (for profile page)
  return (
    <div className={cn('rounded-lg border p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-medium">Vista del sistema</p>
          <p className="text-sm text-muted-foreground">
            Elige tu vista predeterminada al iniciar sesion
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => handleViewChange('dashboard')}
          disabled={isPending}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm rounded-lg border transition-colors',
            preferences.preferredView === 'dashboard'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'hover:bg-accent border-input'
          )}
        >
          {isPending && preferences.preferredView !== 'dashboard' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LayoutDashboard className="h-4 w-4" />
          )}
          Dashboard
        </button>
        <button
          onClick={() => handleViewChange('member')}
          disabled={isPending}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm rounded-lg border transition-colors',
            preferences.preferredView === 'member'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'hover:bg-accent border-input'
          )}
        >
          {isPending && preferences.preferredView !== 'member' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <User className="h-4 w-4" />
          )}
          Mi Progreso
        </button>
      </div>
    </div>
  )
}
