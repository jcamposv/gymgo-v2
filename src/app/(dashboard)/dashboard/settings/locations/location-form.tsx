'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  locationCreateSchema,
  generateSlug,
  type LocationCreateFormData,
} from '@/schemas/location.schema'

interface LocationFormProps {
  defaultValues?: Partial<LocationCreateFormData>
  onSubmit: (data: LocationCreateFormData) => Promise<void>
  isSubmitting?: boolean
  submitLabel?: string
}

export function LocationForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel = 'Guardar',
}: LocationFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LocationCreateFormData>({
    resolver: zodResolver(locationCreateSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'MX',
      phone: '',
      email: '',
      ...defaultValues,
    },
  })

  const name = watch('name')

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setValue('name', newName)
    // Only auto-generate if slug is empty or matches previous auto-generated value
    const currentSlug = watch('slug')
    if (!currentSlug || currentSlug === generateSlug(name)) {
      setValue('slug', generateSlug(newName))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">Informacion basica</h4>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              placeholder="Ej: Sucursal Centro"
              {...register('name')}
              onChange={handleNameChange}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Identificador *</Label>
            <Input
              id="slug"
              placeholder="ej: centro"
              {...register('slug')}
            />
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Se usa internamente para identificar la sucursal
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripcion</Label>
          <Textarea
            id="description"
            placeholder="Descripcion opcional de la sucursal"
            rows={2}
            {...register('description')}
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">Direccion</h4>

        <div className="space-y-2">
          <Label htmlFor="address_line1">Direccion</Label>
          <Input
            id="address_line1"
            placeholder="Calle y numero"
            {...register('address_line1')}
          />
          {errors.address_line1 && (
            <p className="text-sm text-destructive">{errors.address_line1.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address_line2">Direccion linea 2</Label>
          <Input
            id="address_line2"
            placeholder="Colonia, edificio, piso (opcional)"
            {...register('address_line2')}
          />
          {errors.address_line2 && (
            <p className="text-sm text-destructive">{errors.address_line2.message}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="city">Ciudad</Label>
            <Input
              id="city"
              placeholder="Ciudad"
              {...register('city')}
            />
            {errors.city && (
              <p className="text-sm text-destructive">{errors.city.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">Estado</Label>
            <Input
              id="state"
              placeholder="Estado"
              {...register('state')}
            />
            {errors.state && (
              <p className="text-sm text-destructive">{errors.state.message}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="postal_code">Codigo postal</Label>
            <Input
              id="postal_code"
              placeholder="Codigo postal"
              {...register('postal_code')}
            />
            {errors.postal_code && (
              <p className="text-sm text-destructive">{errors.postal_code.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Pais</Label>
            <Input
              id="country"
              placeholder="MX"
              {...register('country')}
            />
            {errors.country && (
              <p className="text-sm text-destructive">{errors.country.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">Contacto</h4>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefono</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+52 55 1234 5678"
              {...register('phone')}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electronico</Label>
            <Input
              id="email"
              type="email"
              placeholder="sucursal@gimnasio.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? 'Guardando...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
