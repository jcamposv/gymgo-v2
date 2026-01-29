import { redirect } from 'next/navigation'
import { getPostLoginRedirect } from '@/lib/auth/post-login-redirect'

/**
 * Server-side redirect page
 * This page instantly redirects the user to the correct destination based on their role.
 * The user should never see this page - it's purely for server-side routing.
 */
export default async function AuthRedirectPage() {
  const { redirectTo } = await getPostLoginRedirect()
  redirect(redirectTo)
}
