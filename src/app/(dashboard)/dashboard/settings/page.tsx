import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganization } from '@/actions/organization.actions'
import { BrandingForm } from './branding-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { Tables } from '@/types/database.types'

export const metadata = {
  title: 'Branding | Configuracion | GymGo',
}

export default async function SettingsBrandingPage() {
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
        <CardTitle>Branding</CardTitle>
        <CardDescription>
          Logo y colores de tu gimnasio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <BrandingForm
          organizationId={organization.id}
          initialData={{
            logo_url: organization.logo_url,
            primary_color: organization.primary_color,
            secondary_color: organization.secondary_color,
          }}
        />
      </CardContent>
    </Card>
  )
}
