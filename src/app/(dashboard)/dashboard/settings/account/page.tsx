import { redirect } from 'next/navigation'
import { User } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { MyTrainingSection } from '../my-training-section'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const metadata = {
  title: 'Mi Cuenta | Configuracion | GymGo',
}

export default async function SettingsAccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user.id)
    .single()

  const userName = profile?.full_name || user.user_metadata?.full_name || ''
  const userEmail = profile?.email || user.email || ''
  const userRole = profile?.role || 'member'

  return (
    <div className="space-y-6">
      <MyTrainingSection />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informacion de Cuenta
          </CardTitle>
          <CardDescription>
            Tu informacion personal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nombre</p>
              <p className="font-medium">{userName || 'Sin nombre'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="font-medium">{userEmail}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rol</p>
              <p className="font-medium capitalize">{userRole}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
