'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createLocation } from '@/actions/location.actions'
import { LocationForm } from './location-form'
import type { LocationCreateFormData } from '@/schemas/location.schema'

interface AddLocationDialogProps {
  children: React.ReactNode
  canAdd: boolean
  limit: number
  current: number
}

export function AddLocationDialog({ children, canAdd, limit, current }: AddLocationDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: LocationCreateFormData) => {
    setIsSubmitting(true)
    const result = await createLocation(data)

    if (result.success) {
      toast.success('Sucursal creada exitosamente')
      setOpen(false)
      window.location.reload()
    } else {
      toast.error(result.message)
      // Show field errors if any
      if (result.errors) {
        Object.values(result.errors).forEach((errors) => {
          errors.forEach((error) => toast.error(error))
        })
      }
    }

    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar sucursal</DialogTitle>
          <DialogDescription>
            Crea una nueva ubicacion para tu gimnasio
          </DialogDescription>
        </DialogHeader>

        {!canAdd ? (
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              Has alcanzado el limite de {limit} sucursales de tu plan actual.
              Actualiza tu plan para agregar mas ubicaciones.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {limit !== -1 && (
              <p className="text-sm text-muted-foreground">
                {current} de {limit} sucursales utilizadas
              </p>
            )}
            <LocationForm
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              submitLabel="Crear sucursal"
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
