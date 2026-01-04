'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { createBrowserClient } from '@supabase/ssr'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_LOGO = '/default-logo.svg'
const DEFAULT_GYM_NAME = 'GymGo'

// =============================================================================
// SCHEMA
// =============================================================================

const passwordSchema = z.object({
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type PasswordFormData = z.infer<typeof passwordSchema>

// =============================================================================
// GYM LOGO COMPONENT
// =============================================================================

interface GymLogoProps {
  logoUrl: string | null
  gymName: string
}

function GymLogo({ logoUrl, gymName }: GymLogoProps) {
  const [imgError, setImgError] = useState(false)
  const src = imgError || !logoUrl ? DEFAULT_LOGO : logoUrl

  return (
    <div className="flex flex-col items-center mb-0">
      <div className="relative h-34 w-42 sm:h-34 sm:w-42">
        <Image
          src={src}
          alt={`${gymName} logo`}
          fill
          className="object-contain"
          onError={() => setImgError(true)}
          priority
        />
      </div>
    </div>
  )
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function AcceptInvitationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Extract gym branding from URL params
  const gymName = searchParams.get('gym') || DEFAULT_GYM_NAME
  const logoUrl = searchParams.get('logo')

  const [status, setStatus] = useState<'loading' | 'ready' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  // Handle the auth callback (token exchange)
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if we have hash fragments (Supabase uses hash for tokens)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')

        // Also check query params (some flows use query params)
        const code = searchParams.get('code')
        const tokenHash = searchParams.get('token_hash')

        if (accessToken && refreshToken) {
          // Set the session from the tokens
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (error) {
            console.error('Session error:', error)
            setErrorMessage('El enlace ha expirado o no es válido')
            setStatus('error')
            return
          }

          // For invite/recovery type, user needs to set password
          if (type === 'invite' || type === 'recovery') {
            setStatus('ready')
            return
          }

          // For other types, redirect to dashboard
          router.push('/dashboard')
          return
        }

        if (code) {
          // Exchange code for session
          const { error } = await supabase.auth.exchangeCodeForSession(code)

          if (error) {
            console.error('Code exchange error:', error)
            setErrorMessage('El enlace ha expirado o no es válido')
            setStatus('error')
            return
          }

          setStatus('ready')
          return
        }

        if (tokenHash) {
          // Verify OTP token
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'invite',
          })

          if (error) {
            console.error('OTP error:', error)
            setErrorMessage('El enlace ha expirado o no es válido')
            setStatus('error')
            return
          }

          setStatus('ready')
          return
        }

        // Check if user is already authenticated (session exists)
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setStatus('ready')
          return
        }

        // No valid auth parameters found
        setErrorMessage('Enlace de invitación no válido')
        setStatus('error')

      } catch (err) {
        console.error('Auth callback error:', err)
        setErrorMessage('Error al procesar la invitación')
        setStatus('error')
      }
    }

    handleAuthCallback()
  }, [supabase, searchParams, router])

  const onSubmit = async (data: PasswordFormData) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (error) {
        console.error('Update password error:', error)
        form.setError('root', {
          message: 'Error al guardar la contraseña. Por favor intenta de nuevo.',
        })
        return
      }

      setStatus('success')

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (err) {
      console.error('Password update error:', err)
      form.setError('root', {
        message: 'Error al guardar la contraseña',
      })
    }
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <GymLogo logoUrl={logoUrl} gymName={gymName} />
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-lime-600 mb-4" />
            <p className="text-muted-foreground">Verificando invitación...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <GymLogo logoUrl={logoUrl} gymName={gymName} />
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Enlace no válido
            </h2>
            <p className="text-muted-foreground text-center mb-6">
              {errorMessage}
            </p>
            <Button onClick={() => router.push('/login')} variant="outline">
              Ir al inicio de sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <GymLogo logoUrl={logoUrl} gymName={gymName} />
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-12 w-12 text-lime-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              ¡Cuenta activada!
            </h2>
            <p className="text-muted-foreground text-center mb-4">
              Tu contraseña ha sido configurada correctamente.
            </p>
            <p className="text-sm text-muted-foreground">
              Redirigiendo al dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Password setup form
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <GymLogo logoUrl={logoUrl} gymName={gymName} />
      <Card className="w-full min-w-[300px] md:min-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Crear tu contraseña</CardTitle>
          <CardDescription>
            Configura una contraseña segura para acceder a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.formState.errors.root && (
                <p className="text-sm text-red-500 text-center">
                  {form.formState.errors.root.message}
                </p>
              )}

              <div className="text-xs text-muted-foreground space-y-1">
                <p>La contraseña debe tener:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Al menos 8 caracteres</li>
                  <li>Una letra mayúscula</li>
                  <li>Una letra minúscula</li>
                  <li>Un número</li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full bg-lime-600 hover:bg-lime-700"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Activar cuenta'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
