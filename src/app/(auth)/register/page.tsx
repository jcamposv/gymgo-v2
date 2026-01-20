import type { Metadata } from 'next'
import Link from 'next/link'
import { RegisterForm } from '@/components/forms/register-form'
import { generatePageMetadata } from '@/lib/seo.config'

export const metadata: Metadata = generatePageMetadata({
  title: 'Crear cuenta',
  description: 'Crea tu cuenta en GymGo y comienza a administrar tu gimnasio, box de CrossFit o centro fitness de forma profesional.',
  path: '/register',
})

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center lg:text-left">
        <h1 className="text-2xl font-bold tracking-tight">
          Crear cuenta
        </h1>
        <p className="text-sm text-muted-foreground">
          Crea la cuenta de tu centro fitness en GymGo
        </p>
      </div>

      {/* Register Form */}
      <RegisterForm />

      {/* Login Link */}
      <p className="text-center text-sm text-muted-foreground">
        Ya tienes cuenta?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Inicia sesion
        </Link>
      </p>

      {/* Terms */}
      <p className="text-center text-xs text-muted-foreground">
        Al crear una cuenta, aceptas nuestros{' '}
        <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
          Terminos de Servicio
        </Link>{' '}
        y{' '}
        <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
          Politica de Privacidad
        </Link>
      </p>
    </div>
  )
}
