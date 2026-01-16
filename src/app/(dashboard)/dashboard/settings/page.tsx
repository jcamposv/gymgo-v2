import { redirect } from 'next/navigation'
import { Globe, MessageSquare, AlertCircle } from 'lucide-react'

import { getCurrentOrganization } from '@/actions/organization.actions'
import { getWhatsAppSettings } from '@/actions/whatsapp.actions'
import { BrandingForm } from './branding-form'
import { InfoForm } from './info-form'
import { RegionalForm } from './regional-form'
import { SettingsForm as WhatsAppSettingsForm } from './whatsapp/settings-form'
import { DeliveryLogSection } from './whatsapp/delivery-log-section'
import { SandboxTest } from '@/components/whatsapp/sandbox-test'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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

interface SettingsPageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams
  const defaultTab = params.tab || 'branding'

  const [orgResult, whatsappResult] = await Promise.all([
    getCurrentOrganization(),
    getWhatsAppSettings(),
  ])

  if (!orgResult.success || !orgResult.data) {
    redirect('/dashboard')
  }

  const organization = orgResult.data as Tables<'organizations'>
  const whatsappSettings = whatsappResult.data
  const whatsappAvailable = whatsappSettings && whatsappSettings.setup_status === 'active'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuracion</h1>
        <p className="text-muted-foreground">
          Administra la configuracion de tu gimnasio
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="info">Informacion</TabsTrigger>
          <TabsTrigger value="regional">Regional</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
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

        <TabsContent value="regional">
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
        </TabsContent>

        <TabsContent value="whatsapp">
          {!whatsappAvailable ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Notificaciones por WhatsApp
                </CardTitle>
                <CardDescription>
                  Envia recordatorios automaticos a tus miembros
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Funcion no disponible</AlertTitle>
                  <AlertDescription>
                    Las notificaciones por WhatsApp no estan habilitadas para tu cuenta.
                    Contacta a soporte para activar esta funcion.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Notificaciones por WhatsApp
                  </CardTitle>
                  <CardDescription>
                    Configura los recordatorios automaticos para tus miembros
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <WhatsAppSettingsForm initialData={whatsappSettings} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Historial de envios</CardTitle>
                  <CardDescription>
                    Registro de mensajes enviados a tus miembros
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DeliveryLogSection />
                </CardContent>
              </Card>

              {/* Sandbox Test - Solo para desarrollo/testing */}
              {process.env.NODE_ENV === 'development' && <SandboxTest />}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
