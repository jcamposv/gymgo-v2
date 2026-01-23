'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { updateLocation } from '@/actions/location.actions'
import { LocationForm } from './location-form'
import type { Location, LocationCreateFormData } from '@/schemas/location.schema'

interface EditLocationDialogProps {
  location: Location | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditLocationDialog({ location, open, onOpenChange }: EditLocationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isActive, setIsActive] = useState(location?.is_active ?? true)

  if (!location) return null

  const handleSubmit = async (data: LocationCreateFormData) => {
    setIsSubmitting(true)
    const result = await updateLocation(location.id, {
      ...data,
      is_active: isActive,
    })

    if (result.success) {
      toast.success('Sucursal actualizada')
      onOpenChange(false)
      window.location.reload()
    } else {
      toast.error(result.message)
      if (result.errors) {
        Object.values(result.errors).forEach((errors) => {
          errors.forEach((error) => toast.error(error))
        })
      }
    }

    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar sucursal</DialogTitle>
          <DialogDescription>
            Actualiza la informacion de &quot;{location.name}&quot;
          </DialogDescription>
        </DialogHeader>

        {/* Active toggle */}
        {!location.is_primary && (
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Sucursal activa</Label>
              <p className="text-sm text-muted-foreground">
                Las sucursales inactivas no aparecen en el selector
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        )}

        <LocationForm
          defaultValues={{
            name: location.name,
            slug: location.slug,
            description: location.description ?? '',
            address_line1: location.address_line1 ?? '',
            address_line2: location.address_line2 ?? '',
            city: location.city ?? '',
            state: location.state ?? '',
            postal_code: location.postal_code ?? '',
            country: location.country ?? 'MX',
            phone: location.phone ?? '',
            email: location.email ?? '',
          }}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel="Guardar cambios"
        />
      </DialogContent>
    </Dialog>
  )
}
