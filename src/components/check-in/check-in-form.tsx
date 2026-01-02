'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

import { checkInByAccessCode } from '@/actions/checkin.actions'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function CheckInForm() {
  const [accessCode, setAccessCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    memberName?: string
  } | null>(null)

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!accessCode.trim()) {
      toast.error('Ingresa un codigo de acceso')
      return
    }

    setIsLoading(true)
    setResult(null)

    const response = await checkInByAccessCode(accessCode.trim(), 'pin')

    setIsLoading(false)

    if (response.success) {
      const data = response.data as { member: { full_name: string } } | undefined
      setResult({
        success: true,
        message: response.message,
        memberName: data?.member?.full_name,
      })
      setAccessCode('')
      toast.success(response.message)

      // Clear success message after 3 seconds
      setTimeout(() => setResult(null), 3000)
    } else {
      setResult({
        success: false,
        message: response.message,
      })
      toast.error(response.message)
    }
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="pin" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pin">Codigo PIN</TabsTrigger>
          <TabsTrigger value="qr" disabled>
            Escanear QR (pronto)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pin" className="space-y-4">
          <form onSubmit={handleCheckIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accessCode">Codigo de acceso</Label>
              <Input
                id="accessCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Ingresa el codigo de 6 digitos"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest font-mono"
                disabled={isLoading}
                autoFocus
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading || accessCode.length < 6}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Registrar Check-in'
              )}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="qr">
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <p>El escaneo de QR estara disponible proximamente</p>
          </div>
        </TabsContent>
      </Tabs>

      {result && (
        <div
          className={`flex items-center gap-3 p-4 rounded-lg ${
            result.success
              ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
              : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
          }`}
        >
          {result.success ? (
            <CheckCircle2 className="h-6 w-6" />
          ) : (
            <XCircle className="h-6 w-6" />
          )}
          <div>
            <div className="font-medium">{result.message}</div>
            {result.memberName && (
              <div className="text-sm opacity-75">
                Check-in registrado exitosamente
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
