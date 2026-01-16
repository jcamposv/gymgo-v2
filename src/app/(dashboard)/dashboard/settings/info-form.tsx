'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { updateOrganizationInfo, updateOrganizationAddress } from '@/actions/organization.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

interface InfoFormProps {
  initialData: {
    name: string
    email: string | null
    phone: string | null
    website: string | null
    address_line1: string | null
    address_line2: string | null
    city: string | null
    state: string | null
    postal_code: string | null
    country: string | null
  }
}

export function InfoForm({ initialData }: InfoFormProps) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: initialData.name,
    email: initialData.email ?? '',
    phone: initialData.phone ?? '',
    website: initialData.website ?? '',
    address_line1: initialData.address_line1 ?? '',
    address_line2: initialData.address_line2 ?? '',
    city: initialData.city ?? '',
    state: initialData.state ?? '',
    postal_code: initialData.postal_code ?? '',
    country: initialData.country ?? '',
  })

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    // Update info
    const infoResult = await updateOrganizationInfo({
      name: formData.name,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      website: formData.website || undefined,
    })

    if (!infoResult.success) {
      toast.error(infoResult.message)
      setSaving(false)
      return
    }

    // Update address
    const addressResult = await updateOrganizationAddress({
      address_line1: formData.address_line1 || undefined,
      address_line2: formData.address_line2 || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      postal_code: formData.postal_code || undefined,
      country: formData.country,
    })

    if (addressResult.success) {
      toast.success('Informacion actualizada')
    } else {
      toast.error(addressResult.message)
    }

    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre del gimnasio *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="contacto@migimnasio.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefono</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+52 55 1234 5678"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Sitio web</Label>
          <Input
            id="website"
            value={formData.website}
            onChange={(e) => handleChange('website', e.target.value)}
            placeholder="https://migimnasio.com"
          />
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Direccion</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address_line1">Direccion</Label>
            <Input
              id="address_line1"
              value={formData.address_line1}
              onChange={(e) => handleChange('address_line1', e.target.value)}
              placeholder="Calle y numero"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address_line2">Direccion 2 (opcional)</Label>
            <Input
              id="address_line2"
              value={formData.address_line2}
              onChange={(e) => handleChange('address_line2', e.target.value)}
              placeholder="Colonia, edificio, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Ciudad</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="Ciudad de Mexico"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">Estado</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => handleChange('state', e.target.value)}
              placeholder="CDMX"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postal_code">Codigo postal</Label>
            <Input
              id="postal_code"
              value={formData.postal_code}
              onChange={(e) => handleChange('postal_code', e.target.value)}
              placeholder="06600"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Pais</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => handleChange('country', e.target.value)}
              placeholder="Mexico"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar cambios'
          )}
        </Button>
      </div>
    </form>
  )
}
