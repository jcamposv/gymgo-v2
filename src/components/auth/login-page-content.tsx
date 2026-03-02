'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LoginForm } from '@/components/forms/login-form'
import { ForgotPasswordForm } from '@/components/forms/forgot-password-form'

export function LoginPageContent() {
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const searchParams = useSearchParams()

  // Capture plan/interval from URL and save to sessionStorage
  useEffect(() => {
    const plan = searchParams.get('plan')
    const interval = searchParams.get('interval')
    if (plan) sessionStorage.setItem('gymgo_selected_plan', plan)
    if (interval) sessionStorage.setItem('gymgo_selected_interval', interval)
  }, [searchParams])

  if (showForgotPassword) {
    return (
      <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center lg:text-left">
        <h1 className="text-2xl font-bold tracking-tight">
          Iniciar sesion
        </h1>
        <p className="text-sm text-muted-foreground">
          Ingresa tus credenciales para acceder a tu cuenta de GymGo
        </p>
      </div>

      {/* Login Form */}
      <LoginForm />

      {/* Forgot Password Link */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => setShowForgotPassword(true)}
          className="text-sm text-primary hover:underline"
        >
          Olvidaste tu contrasena?
        </button>
      </div>

      {/* Register Link */}
      <p className="text-center text-sm text-muted-foreground">
        No tienes cuenta?{' '}
        <Link href="/register" className="text-primary font-medium hover:underline">
          Registrate
        </Link>
      </p>
    </div>
  )
}
