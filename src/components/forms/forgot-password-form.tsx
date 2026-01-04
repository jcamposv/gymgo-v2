'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Mail, ArrowLeft } from 'lucide-react'

import { useAuth } from '@/hooks/use-auth'
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/schemas/auth.schema'

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

interface ForgotPasswordFormProps {
  onBack: () => void
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const { resetPassword } = useAuth()
  const [emailSent, setEmailSent] = useState(false)

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await resetPassword(data.email)
      setEmailSent(true)
    } catch (error) {
      // For security, we show a success message even if the email doesn't exist
      // to prevent email enumeration attacks
      setEmailSent(true)
    }
  }

  if (emailSent) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-lime-100 rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6 text-lime-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Revisa tu correo</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Si existe una cuenta asociada a{' '}
              <span className="font-medium">{form.getValues('email')}</span>,
              te enviamos un enlace para restablecer tu contrasena.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-center text-muted-foreground">
            No recibiste el correo? Revisa tu carpeta de spam o
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setEmailSent(false)}
          >
            Intentar con otro correo
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={onBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a iniciar sesion
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          Recuperar contrasena
        </h2>
        <p className="text-sm text-muted-foreground">
          Ingresa el correo electronico asociado a tu cuenta y te enviaremos
          un enlace para restablecer tu contrasena.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar enlace'
            )}
          </Button>
        </form>
      </Form>

      <Button
        variant="ghost"
        className="w-full"
        onClick={onBack}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a iniciar sesion
      </Button>
    </div>
  )
}
