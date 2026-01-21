import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { PUBLIC_ROUTES, ONBOARDING_ROUTES, ROUTES } from '@/lib/constants'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for API routes - they handle their own authentication
  // This is important for mobile/Flutter apps that use Bearer tokens
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const { supabaseResponse, user } = await updateSession(request)

  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route)
  const isOnboardingRoute = ONBOARDING_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  )

  // Redirect unauthenticated users to login
  if (!user && !isPublicRoute && !isOnboardingRoute) {
    const url = request.nextUrl.clone()
    url.pathname = ROUTES.LOGIN
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect unauthenticated users from onboarding to login
  if (!user && isOnboardingRoute) {
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url))
  }

  // Redirect authenticated users away from login/register pages
  // but NOT from onboarding (they might need to complete it)
  if (user && (pathname === ROUTES.LOGIN || pathname === ROUTES.REGISTER)) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
