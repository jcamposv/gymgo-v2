import { redirect } from 'next/navigation'
import { CalendarDays } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganization } from '@/actions/organization.actions'
import { BookingLimitsForm } from '../booking-limits-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { Tables } from '@/types/database.types'

export const metadata = {
  title: 'Clases | Configuracion | GymGo',
}

export default async function SettingsClassesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const orgResult = await getCurrentOrganization()

  if (!orgResult.success || !orgResult.data) {
    redirect('/dashboard')
  }

  const organization = orgResult.data as Tables<'organizations'>

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Configuracion de Clases
        </CardTitle>
        <CardDescription>
          Reglas y limites para las reservas de clases
        </CardDescription>
      </CardHeader>
      <CardContent>
        <BookingLimitsForm
          initialData={{
            max_classes_per_day: organization.max_classes_per_day ?? null,
          }}
          timezone={organization.timezone ?? undefined}
        />
      </CardContent>
    </Card>
  )
}
