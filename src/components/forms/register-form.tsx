'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Mail, Eye, EyeOff, Check, X } from 'lucide-react'

import { useAuth } from '@/hooks/use-auth'
import { registerSchema, type RegisterFormData } from '@/schemas/auth.schema'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { cn } from '@/lib/utils'

export function RegisterForm() {
  const [emailSent, setEmailSent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { signUp } = useAuth()
  const searchParams = useSearchParams()

  const selectedPlan = searchParams.get('plan')
  const selectedInterval = searchParams.get('interval')

  // Capture plan/interval from URL and save to sessionStorage
  useEffect(() => {
    if (selectedPlan) sessionStorage.setItem('gymgo_selected_plan', selectedPlan)
    if (selectedInterval) sessionStorage.setItem('gymgo_selected_interval', selectedInterval)
  }, [selectedPlan, selectedInterval])

  const planLabels: Record<string, string> = {
    free: 'Gratis ($0/mes)',
    starter: 'Starter ($19/mes)',
    growth: 'Growth ($39/mes)',
    pro: 'Pro ($59/mes)',
  }
  const intervalLabels: Record<string, string> = {
    monthly: 'mensual',
    yearly: 'anual',
  }

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  })

  const password = form.watch('password')

  // Password requirements
  const requirements = [
    { label: 'Al menos 8 caracteres', met: password.length >= 8 },
    { label: 'Una letra mayuscula', met: /[A-Z]/.test(password) },
    { label: 'Una letra minuscula', met: /[a-z]/.test(password) },
    { label: 'Un numero', met: /[0-9]/.test(password) },
  ]

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await signUp(data.email, data.password, { name: data.name })
      setEmailSent(true)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'

      if (errorMessage.includes('already registered')) {
        toast.error('Este correo ya esta registrado. Intenta iniciar sesion.')
      } else {
        toast.error('Error al crear la cuenta. Intentalo de nuevo.')
      }
    }
  }

  if (emailSent) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-lime-100 rounded-full flex items-center justify-center">
          <Mail className="h-6 w-6 text-lime-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Revisa tu correo</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Enviamos un enlace de confirmacion a{' '}
            <span className="font-medium">{form.getValues('email')}</span>
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          No recibiste el correo? Revisa tu carpeta de spam.
        </p>
        <Button variant="ghost" onClick={() => setEmailSent(false)}>
          Usar otro correo
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {selectedPlan && planLabels[selectedPlan] && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 text-sm">
            <p className="font-medium text-primary">
              Plan seleccionado: {planLabels[selectedPlan]}
              {selectedInterval ? ` (${intervalLabels[selectedInterval] || selectedInterval})` : ''}
            </p>
            <p className="text-muted-foreground text-xs mt-0.5">
              {selectedPlan === 'free'
                ? 'Acceso gratuito para siempre. Crea tu cuenta para continuar.'
                : 'Incluye 30 dias de prueba gratis. Crea tu cuenta para continuar.'}
            </p>
          </div>
        )}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre completo</FormLabel>
              <FormControl>
                <Input
                  placeholder="Juan Perez"
                  autoComplete="name"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo electronico</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="tu@ejemplo.com"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contrasena</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Crea una contrasena"
                    autoComplete="new-password"
                    className="pr-10"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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
              {password && (
                <div className="space-y-1 mt-2">
                  {requirements.map((req, index) => (
                    <div
                      key={index}
                      className={cn(
                        'flex items-center gap-2 text-xs',
                        req.met ? 'text-lime-600' : 'text-muted-foreground'
                      )}
                    >
                      {req.met ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      {req.label}
                    </div>
                  ))}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar contrasena</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirma tu contrasena"
                    autoComplete="new-password"
                    className="pr-10"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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

        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creando cuenta...
            </>
          ) : (
            'Crear cuenta'
          )}
        </Button>
      </form>
    </Form>
  )
}
