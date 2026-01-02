import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ROUTES } from '@/lib/constants'
import { AppShell } from '@/components/layout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(ROUTES.LOGIN)
  }

  // Check if user has completed onboarding (has an organization)
  const { data: profileData } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  const profile = profileData as { organization_id: string | null } | null

  if (!profile?.organization_id) {
    redirect(ROUTES.ONBOARDING)
  }

  return <AppShell user={user}>{children}</AppShell>
}
