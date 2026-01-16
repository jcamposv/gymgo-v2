'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'

import { initializeWhatsAppSettings } from '@/actions/whatsapp.actions'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

type SetupStep = 'intro' | 'creating' | 'success' | 'error'

export function SetupWizard() {
  const router = useRouter()
  const [step, setStep] = useState<SetupStep>('intro')
  const [error, setError] = useState<string | null>(null)

  const handleSetup = async () => {
    setStep('creating')
    setError(null)

    const result = await initializeWhatsAppSettings()

    if (result.success) {
      setStep('success')
      toast.success('WhatsApp configurado correctamente')
      // Refresh the page to show settings form
      setTimeout(() => {
        router.refresh()
      }, 1500)
    } else {
      setStep('error')
      setError(result.error || 'Error desconocido')
      toast.error(result.error || 'Error desconocido')
    }
  }

  if (step === 'creating') {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium">Configurando WhatsApp...</p>
        <p className="text-sm text-muted-foreground">
          Creando subcuenta de Twilio y configuracion inicial
        </p>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <CheckCircle className="h-12 w-12 text-green-500" />
        <p className="text-lg font-medium">WhatsApp configurado</p>
        <p className="text-sm text-muted-foreground">
          Redirigiendo a la configuracion...
        </p>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error al configurar WhatsApp</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => setStep('intro')}>
            Volver
          </Button>
          <Button onClick={handleSetup}>Reintentar</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Antes de comenzar</h3>
        <p className="text-muted-foreground">
          Para enviar mensajes de WhatsApp, necesitas una cuenta de Twilio con
          acceso a la API de WhatsApp Business.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 border rounded-lg space-y-2">
            <h4 className="font-medium">1. Cuenta de Twilio</h4>
            <p className="text-sm text-muted-foreground">
              Si no tienes una cuenta, puedes crear una gratis en Twilio.
            </p>
            <a
              href="https://www.twilio.com/try-twilio"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-primary hover:underline"
            >
              Crear cuenta <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>

          <div className="p-4 border rounded-lg space-y-2">
            <h4 className="font-medium">2. WhatsApp Business API</h4>
            <p className="text-sm text-muted-foreground">
              Necesitas solicitar acceso a la API de WhatsApp Business en tu
              cuenta de Twilio.
            </p>
            <a
              href="https://www.twilio.com/whatsapp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-primary hover:underline"
            >
              Ver documentacion <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Variables de entorno requeridas</AlertTitle>
          <AlertDescription>
            Asegurate de tener configuradas las siguientes variables de entorno:
            <code className="block mt-2 p-2 bg-muted rounded text-sm">
              TWILIO_ACCOUNT_SID=ACxxxxxx
              <br />
              TWILIO_AUTH_TOKEN=xxxxxx
            </code>
          </AlertDescription>
        </Alert>
      </div>

      <div className="flex justify-center">
        <Button onClick={handleSetup} size="lg">
          Configurar WhatsApp
        </Button>
      </div>
    </div>
  )
}
