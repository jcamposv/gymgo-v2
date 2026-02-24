import { redirect } from 'next/navigation'
import { Globe } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganization } from '@/actions/organization.actions'
import { RegionalForm } from '../regional-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { Tables } from '@/types/database.types'

export const metadata = {
  title: 'Regional | Configuracion | GymGo',
}

export default async function SettingsRegionalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const orgResult = await getCurrentOrganization()

  if (!orgResult.success || !orgResult.data) {
    redirect('/dashboard')
  }

  const organization = orgResult.data as Tables<'organizations'>

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Configuracion Regional
        </CardTitle>
        <CardDescription>
          Pais, moneda, idioma y zona horaria de tu gimnasio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegionalForm
          initialData={{
            country: organization.country,
            currency: organization.currency,
            language: organization.language,
            timezone: organization.timezone,
          }}
        />
      </CardContent>
    </Card>
  )
}
