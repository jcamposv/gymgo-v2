import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPostLoginRedirect } from '@/lib/auth/post-login-redirect'
import { ROUTES } from '@/lib/constants'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Use centralized post-login redirect logic
      // This properly handles:
      // - Users who signed up and need onboarding (first admin)
      // - Invited users who should go directly to dashboard
      // - Role-based routing (staff -> /dashboard, clients -> /member)
      const { redirectTo } = await getPostLoginRedirect()

      // If a specific 'next' URL was provided and user has an organization, use it
      // Otherwise use the computed redirect based on role/onboarding status
      const finalRedirect = next && redirectTo !== ROUTES.ONBOARDING
        ? next
        : redirectTo

      return NextResponse.redirect(`${origin}${finalRedirect}`)
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}${ROUTES.LOGIN}?error=auth_error`)
}
