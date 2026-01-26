import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganization } from '@/actions/organization.actions'
import { InfoForm } from '../info-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { Tables } from '@/types/database.types'

export const metadata = {
  title: 'Informacion | Configuracion | GymGo',
}

export default async function SettingsInfoPage() {
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
        <CardTitle>Informacion del gimnasio</CardTitle>
        <CardDescription>
          Datos de contacto y direccion
        </CardDescription>
      </CardHeader>
      <CardContent>
        <InfoForm
          initialData={{
            name: organization.name,
            email: organization.email,
            phone: organization.phone,
            website: organization.website,
            address_line1: organization.address_line1,
            address_line2: organization.address_line2,
            city: organization.city,
            state: organization.state,
            postal_code: organization.postal_code,
            country: organization.country,
          }}
        />
      </CardContent>
    </Card>
  )
}
