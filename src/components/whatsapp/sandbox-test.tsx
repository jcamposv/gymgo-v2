'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Send, Loader2, AlertTriangle } from 'lucide-react'

import { sendSandboxTestMessage } from '@/actions/whatsapp.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function SandboxTest() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSend = async () => {
    if (!phoneNumber) {
      toast.error('Ingresa un numero de telefono')
      return
    }

    setSending(true)
    setLastResult(null)

    const result = await sendSandboxTestMessage(phoneNumber, message || undefined)

    if (result.success) {
      toast.success('Mensaje enviado!')
      setLastResult({
        success: true,
        message: `Enviado! SID: ${result.data?.messageSid}`,
      })
    } else {
      toast.error(result.error || 'Error al enviar')
      setLastResult({
        success: false,
        message: result.error || 'Error desconocido',
      })
    }

    setSending(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Probar Sandbox
        </CardTitle>
        <CardDescription>
          Envia un mensaje de prueba al sandbox de Twilio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Importante</AlertTitle>
          <AlertDescription>
            El destinatario debe haber enviado primero el mensaje de activacion al sandbox
            (ej: &quot;join example-word&quot; al +14155238886).
            Ve a Twilio Console → Messaging → Try WhatsApp para ver tu codigo.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="phone">Numero de telefono (con codigo de pais)</Label>
          <Input
            id="phone"
            placeholder="+521234567890"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Mensaje (opcional)</Label>
          <Textarea
            id="message"
            placeholder="Mensaje de prueba personalizado..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
        </div>

        <Button onClick={handleSend} disabled={sending || !phoneNumber}>
          {sending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Enviar mensaje de prueba
            </>
          )}
        </Button>

        {lastResult && (
          <Alert variant={lastResult.success ? 'default' : 'destructive'}>
            <AlertDescription>{lastResult.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
