import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { getPostLoginRedirect } from '@/lib/auth/post-login-redirect'
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
  const { reason, redirectTo } = await getPostLoginRedirect()

  // Only show onboarding if user truly needs it
  if (reason !== 'onboarding') {
    redirect(redirectTo)
  }

  // Redirect to step1
  redirect('/onboarding/step1')
}
