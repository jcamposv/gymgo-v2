'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ResetPasswordForm } from '@/components/forms/reset-password-form'
import { Button } from '@/components/ui/button'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const handleRecovery = async () => {
      const supabase = createClient()

      // Check if we have a session (user clicked the recovery link)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        setError('Error al verificar la sesion. Por favor, solicita un nuevo enlace.')
        setIsLoading(false)
        return
      }

      if (session) {
        // User has a valid session from the recovery link
        setIsReady(true)
        setIsLoading(false)
        return
      }

      // Check URL hash for recovery tokens (Supabase implicit flow)
      const hash = window.location.hash
      if (hash && hash.includes('access_token')) {
        // Parse hash parameters
        const params = new URLSearchParams(hash.substring(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const type = params.get('type')

        if (type === 'recovery' && accessToken) {
          // Set the session with the recovery tokens
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          })

          if (setSessionError) {
            setError('El enlace ha expirado o es invalido. Por favor, solicita uno nuevo.')
            setIsLoading(false)
            return
          }

          // Clear the hash from URL for cleaner display
          window.history.replaceState(null, '', window.location.pathname)

          setIsReady(true)
          setIsLoading(false)
          return
        }
      }

      // No valid session or tokens - show error
      setError('No se encontro un enlace de recuperacion valido. Por favor, solicita uno nuevo desde la pagina de inicio de sesion.')
      setIsLoading(false)
    }

    handleRecovery()
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Verificando enlace...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Enlace invalido</h2>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
          </div>
        </div>
        <Button asChild className="w-full">
          <Link href="/login">Volver a iniciar sesion</Link>
        </Button>
      </div>
    )
  }

  // Ready to show form
  if (isReady) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center lg:text-left">
          <h1 className="text-2xl font-bold tracking-tight">
            Restablecer contrasena
          </h1>
          <p className="text-sm text-muted-foreground">
            Ingresa tu nueva contrasena para restablecer el acceso a tu cuenta
          </p>
        </div>

        {/* Reset Password Form */}
        <ResetPasswordForm />

        {/* Back to Login Link */}
        <p className="text-center text-sm text-muted-foreground">
          Recordaste tu contrasena?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Volver a iniciar sesion
          </Link>
        </p>
      </div>
    )
  }

  return null
}
