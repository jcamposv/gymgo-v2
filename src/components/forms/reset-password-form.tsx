'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff, Check, X, CheckCircle } from 'lucide-react'

import { useAuth } from '@/hooks/use-auth'
import { resetPasswordSchema, type ResetPasswordFormData } from '@/schemas/auth.schema'

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

export function ResetPasswordForm() {
  const { updatePassword } = useAuth()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [success, setSuccess] = useState(false)

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
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

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      await updatePassword(data.password)
      setSuccess(true)
      toast.success('Contrasena actualizada correctamente')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'

      if (errorMessage.includes('same password')) {
        toast.error('La nueva contrasena debe ser diferente a la anterior.')
      } else {
        toast.error('Error al actualizar la contrasena. Intentalo de nuevo.')
      }
    }
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-lime-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-6 w-6 text-lime-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Contrasena actualizada</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Tu contrasena ha sido actualizada correctamente.
            Ya puedes iniciar sesion con tu nueva contrasena.
          </p>
        </div>
        <Button onClick={() => router.push('/login')} className="w-full">
          Ir a iniciar sesion
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nueva contrasena</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ingresa tu nueva contrasena"
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
                    placeholder="Confirma tu nueva contrasena"
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
              Actualizando...
            </>
          ) : (
            'Actualizar contrasena'
          )}
        </Button>
      </form>
    </Form>
  )
}
