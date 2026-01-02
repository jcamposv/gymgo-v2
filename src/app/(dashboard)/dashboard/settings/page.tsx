import { redirect } from 'next/navigation'
import { getCurrentOrganization } from '@/actions/organization.actions'
import { BrandingForm } from './branding-form'
import { InfoForm } from './info-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Tables } from '@/types/database.types'

export const metadata = {
  title: 'Configuracion | GymGo',
}

export default async function SettingsPage() {
  const result = await getCurrentOrganization()

  if (!result.success || !result.data) {
    redirect('/dashboard')
  }

  const organization = result.data as Tables<'organizations'>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuracion</h1>
        <p className="text-muted-foreground">
          Administra la configuracion de tu gimnasio
        </p>
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="info">Informacion</TabsTrigger>
        </TabsList>

        <TabsContent value="branding">
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
        </TabsContent>

        <TabsContent value="info">
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
