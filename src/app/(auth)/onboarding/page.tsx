import { redirect } from 'next/navigation'
import { Dumbbell } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { getPostLoginRedirect } from '@/lib/auth/post-login-redirect'
import { OnboardingWizard } from '@/components/onboarding'
import { ROUTES } from '@/lib/constants'

export const metadata = {
  title: 'Configurar tu gimnasio | GymGo',
  description: 'Configura tu organizacion para empezar a usar GymGo',
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(ROUTES.LOGIN)
  }

  // Use centralized redirect logic to check if user really needs onboarding
  // This prevents invited users from seeing onboarding even if they navigate here directly
  const { reason, redirectTo } = await getPostLoginRedirect()

  // Only show onboarding if user truly needs it (signed up, no organization)
  // Invited users will be redirected to their appropriate dashboard
  if (reason !== 'onboarding') {
    redirect(redirectTo)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <Dumbbell className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Bienvenido a GymGo
          </h1>
          <p className="text-muted-foreground mt-2">
            Configura tu organizacion en pocos pasos
          </p>
        </div>

        {/* Wizard */}
        <OnboardingWizard />
      </div>
    </div>
  )
}
