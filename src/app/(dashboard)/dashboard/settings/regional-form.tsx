'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { updateOrganizationRegional } from '@/actions/organization.actions'
import { CURRENCIES } from '@/lib/constants/currencies'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// =============================================================================
// CONSTANTS
// =============================================================================

const COUNTRIES = [
  { code: 'MX', name: 'Mexico', currency: 'MXN', timezone: 'America/Mexico_City' },
  { code: 'US', name: 'Estados Unidos', currency: 'USD', timezone: 'America/New_York' },
  { code: 'CO', name: 'Colombia', currency: 'COP', timezone: 'America/Bogota' },
  { code: 'AR', name: 'Argentina', currency: 'ARS', timezone: 'America/Argentina/Buenos_Aires' },
  { code: 'CL', name: 'Chile', currency: 'CLP', timezone: 'America/Santiago' },
  { code: 'PE', name: 'Peru', currency: 'PEN', timezone: 'America/Lima' },
  { code: 'BR', name: 'Brasil', currency: 'BRL', timezone: 'America/Sao_Paulo' },
  { code: 'EC', name: 'Ecuador', currency: 'USD', timezone: 'America/Guayaquil' },
  { code: 'VE', name: 'Venezuela', currency: 'VES', timezone: 'America/Caracas' },
  { code: 'PA', name: 'Panama', currency: 'PAB', timezone: 'America/Panama' },
  { code: 'CR', name: 'Costa Rica', currency: 'CRC', timezone: 'America/Costa_Rica' },
  { code: 'GT', name: 'Guatemala', currency: 'GTQ', timezone: 'America/Guatemala' },
  { code: 'DO', name: 'Republica Dominicana', currency: 'DOP', timezone: 'America/Santo_Domingo' },
  { code: 'PR', name: 'Puerto Rico', currency: 'USD', timezone: 'America/Puerto_Rico' },
  { code: 'UY', name: 'Uruguay', currency: 'UYU', timezone: 'America/Montevideo' },
  { code: 'PY', name: 'Paraguay', currency: 'PYG', timezone: 'America/Asuncion' },
  { code: 'BO', name: 'Bolivia', currency: 'BOB', timezone: 'America/La_Paz' },
  { code: 'HN', name: 'Honduras', currency: 'HNL', timezone: 'America/Tegucigalpa' },
  { code: 'SV', name: 'El Salvador', currency: 'USD', timezone: 'America/El_Salvador' },
  { code: 'NI', name: 'Nicaragua', currency: 'NIO', timezone: 'America/Managua' },
  { code: 'CU', name: 'Cuba', currency: 'CUP', timezone: 'America/Havana' },
] as const

// CURRENCIES imported from @/lib/constants

const LANGUAGES = [
  { code: 'es', name: 'Espanol' },
  { code: 'en', name: 'English' },
  { code: 'pt', name: 'Portugues' },
] as const

// =============================================================================
// COMPONENT
// =============================================================================

interface RegionalFormProps {
  initialData: {
    country: string
    currency: string
    language: string
    timezone: string
  }
}

export function RegionalForm({ initialData }: RegionalFormProps) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    country: initialData.country,
    currency: initialData.currency,
    language: initialData.language,
    timezone: initialData.timezone,
  })

  const handleCountryChange = (countryCode: string) => {
    const country = COUNTRIES.find(c => c.code === countryCode)
    if (country) {
      setFormData(prev => ({
        ...prev,
        country: country.code,
        currency: country.currency,
        timezone: country.timezone,
      }))
    }
  }

  const handleCurrencyChange = (currency: string) => {
    setFormData(prev => ({ ...prev, currency }))
  }

  const handleLanguageChange = (language: string) => {
    setFormData(prev => ({ ...prev, language }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const result = await updateOrganizationRegional(formData)

    if (result.success) {
      toast.success('Configuracion regional actualizada')
    } else {
      toast.error(result.message)
    }

    setSaving(false)
  }

  const selectedCountry = COUNTRIES.find(c => c.code === formData.country)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Country */}
        <div className="space-y-2">
          <Label htmlFor="country">Pais</Label>
          <Select value={formData.country} onValueChange={handleCountryChange}>
            <SelectTrigger id="country">
              <SelectValue placeholder="Selecciona un pais" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map(country => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Al cambiar el pais se ajustara automaticamente la moneda y zona horaria
          </p>
        </div>

        {/* Currency */}
        <div className="space-y-2">
          <Label htmlFor="currency">Moneda</Label>
          <Select value={formData.currency} onValueChange={handleCurrencyChange}>
            <SelectTrigger id="currency">
              <SelectValue placeholder="Selecciona una moneda" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map(currency => (
                <SelectItem key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.code} - {currency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Esta moneda se usara en pagos, planes y reportes financieros
          </p>
        </div>

        {/* Language */}
        <div className="space-y-2">
          <Label htmlFor="language">Idioma</Label>
          <Select value={formData.language} onValueChange={handleLanguageChange}>
            <SelectTrigger id="language">
              <SelectValue placeholder="Selecciona un idioma" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map(lang => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Timezone (read-only, auto-set by country) */}
        <div className="space-y-2">
          <Label htmlFor="timezone">Zona horaria</Label>
          <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 text-sm">
            {formData.timezone}
          </div>
          <p className="text-xs text-muted-foreground">
            Se establece automaticamente segun el pais seleccionado
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <h4 className="text-sm font-medium mb-2">Resumen de configuracion</h4>
        <div className="grid gap-2 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Pais:</span>
            <span className="font-medium text-foreground">{selectedCountry?.name || formData.country}</span>
          </div>
          <div className="flex justify-between">
            <span>Moneda:</span>
            <span className="font-medium text-foreground">
              {CURRENCIES.find(c => c.code === formData.currency)?.symbol} {formData.currency}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Idioma:</span>
            <span className="font-medium text-foreground">
              {LANGUAGES.find(l => l.code === formData.language)?.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Zona horaria:</span>
            <span className="font-medium text-foreground">{formData.timezone}</span>
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
