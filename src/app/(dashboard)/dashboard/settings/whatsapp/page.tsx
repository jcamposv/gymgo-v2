import { redirect } from 'next/navigation'
import { MessageSquare, AlertCircle } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { getWhatsAppSettings } from '@/actions/whatsapp.actions'
import { SettingsForm as WhatsAppSettingsForm } from './settings-form'
import { DeliveryLogSection } from './delivery-log-section'
import { SandboxTest } from '@/components/whatsapp/sandbox-test'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const metadata = {
  title: 'WhatsApp | Configuracion | GymGo',
}

export default async function WhatsAppSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const whatsappResult = await getWhatsAppSettings()
  const whatsappSettings = whatsappResult.data
  const whatsappAvailable = whatsappSettings && whatsappSettings.setup_status === 'active'

  if (!whatsappAvailable) {
    return (
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
    )
  }

  return (
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
  )
}
