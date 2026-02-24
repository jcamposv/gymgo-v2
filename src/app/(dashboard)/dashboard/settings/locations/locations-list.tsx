'use client'

import { useState } from 'react'
import { MapPin, Star, MoreVertical, Pencil, Trash2, Crown } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deleteLocation, setPrimaryLocation } from '@/actions/location.actions'
import { EditLocationDialog } from './edit-location-dialog'
import type { Location } from '@/schemas/location.schema'

interface LocationsListProps {
  locations: Location[]
}

export function LocationsList({ locations }: LocationsListProps) {
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [deletingLocation, setDeletingLocation] = useState<Location | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSettingPrimary, setIsSettingPrimary] = useState<string | null>(null)

  if (locations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No tienes sucursales configuradas</p>
      </div>
    )
  }

  const handleDelete = async () => {
    if (!deletingLocation) return

    setIsDeleting(true)
    const result = await deleteLocation(deletingLocation.id)

    if (result.success) {
      toast.success('Sucursal eliminada')
      window.location.reload()
    } else {
      toast.error(result.message)
    }

    setIsDeleting(false)
    setDeletingLocation(null)
  }

  const handleSetPrimary = async (location: Location) => {
    setIsSettingPrimary(location.id)
    const result = await setPrimaryLocation(location.id)

    if (result.success) {
      toast.success('Sucursal principal actualizada')
      window.location.reload()
    } else {
      toast.error(result.message)
    }

    setIsSettingPrimary(null)
  }

  return (
    <>
      <div className="space-y-3">
        {locations.map((location) => (
          <div
            key={location.id}
            className={cn(
              'flex items-center gap-4 p-4 rounded-lg border bg-card transition-colors hover:bg-accent/50',
              location.is_primary && 'border-primary/50 bg-primary/5'
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg shrink-0',
                location.is_primary ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}
            >
              <MapPin className="h-5 w-5" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium truncate">{location.name}</h3>
                {location.is_primary && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary shrink-0">
                    <Star className="h-3 w-3 mr-1" />
                    Principal
                  </Badge>
                )}
                {!location.is_active && (
                  <Badge variant="secondary" className="bg-muted text-muted-foreground shrink-0">
                    Inactiva
                  </Badge>
                )}
              </div>
              {(location.city || location.address_line1) && (
                <p className="text-sm text-muted-foreground truncate">
                  {[location.address_line1, location.city].filter(Boolean).join(', ')}
                </p>
              )}
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditingLocation(location)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                {!location.is_primary && (
                  <DropdownMenuItem
                    onClick={() => handleSetPrimary(location)}
                    disabled={isSettingPrimary === location.id}
                  >
                    <Crown className="mr-2 h-4 w-4" />
                    Establecer como principal
                  </DropdownMenuItem>
                )}
                {!location.is_primary && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeletingLocation(location)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      {/* Edit Dialog */}
      <EditLocationDialog
        location={editingLocation}
        open={!!editingLocation}
        onOpenChange={(open) => !open && setEditingLocation(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingLocation} onOpenChange={(open) => !open && setDeletingLocation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar sucursal</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estas seguro de que deseas eliminar la sucursal &quot;{deletingLocation?.name}&quot;?
              Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
