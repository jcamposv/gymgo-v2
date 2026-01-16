'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { updateOrganizationBranding } from '@/actions/organization.actions'
import { useOrganizationContext } from '@/providers'
import { ImageUpload } from '@/components/shared/image-upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface BrandingFormProps {
  organizationId: string
  initialData: {
    logo_url: string | null
    primary_color: string | null
    secondary_color: string | null
  }
}

export function BrandingForm({ organizationId, initialData }: BrandingFormProps) {
  const { refresh: refreshOrganization } = useOrganizationContext()
  const [saving, setSaving] = useState(false)
  const [logoUrl, setLogoUrl] = useState(initialData.logo_url)
  const [primaryColor, setPrimaryColor] = useState(initialData.primary_color ?? '#000000')
  const [secondaryColor, setSecondaryColor] = useState(initialData.secondary_color ?? '#ffffff')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const result = await updateOrganizationBranding({
      logo_url: logoUrl,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
    })

    if (result.success) {
      toast.success(result.message)
      // Refresh organization context to update logo in sidebar
      await refreshOrganization()
    } else {
      toast.error(result.message)
    }

    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Logo del gimnasio</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Se recomienda una imagen cuadrada de al menos 200x200px
        </p>
        <ImageUpload
          value={logoUrl}
          onChange={setLogoUrl}
          organizationId={organizationId}
          bucket="organizations"
          folder="logos"
          aspectRatio="square"
          placeholder="Arrastra tu logo o haz clic para seleccionar"
          className="max-w-xs"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="primary_color">Color primario</Label>
          <div className="flex gap-2">
            <Input
              id="primary_color"
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              placeholder="#000000"
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="secondary_color">Color secundario</Label>
          <div className="flex gap-2">
            <Input
              id="secondary_color"
              type="color"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              placeholder="#000000"
              className="flex-1"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
        <div className="text-sm text-muted-foreground">Vista previa:</div>
        <div className="flex gap-2">
          <div
            className="w-10 h-10 rounded-lg border"
            style={{ backgroundColor: primaryColor }}
          />
          <div
            className="w-10 h-10 rounded-lg border"
            style={{ backgroundColor: secondaryColor }}
          />
        </div>
        {logoUrl && (
          <img
            src={logoUrl}
            alt="Logo preview"
            className="w-10 h-10 rounded-lg object-cover"
          />
        )}
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
