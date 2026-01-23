import { redirect } from 'next/navigation'
import { MapPin, Plus } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { getLocations, getLocationCount } from '@/actions/location.actions'
import { getPlanLimits, type PlanTier } from '@/lib/pricing.config'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LocationsList } from './locations-list'
import { AddLocationDialog } from './add-location-dialog'

export const metadata = {
  title: 'Sucursales | Configuracion | GymGo',
}

export default async function LocationsSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get profile to check organization
  const { data: profileData } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  const profile = profileData as { organization_id: string | null } | null

  if (!profile?.organization_id) {
    redirect('/onboarding')
  }

  // Get organization for plan info
  const { data: orgData } = await supabase
    .from('organizations')
    .select('subscription_plan')
    .eq('id', profile.organization_id)
    .single()

  const org = orgData as { subscription_plan: string | null } | null
  const planTier = (org?.subscription_plan || 'free') as PlanTier
  const planLimits = getPlanLimits(planTier)

  // Get locations
  const [locationsResult, countResult] = await Promise.all([
    getLocations(),
    getLocationCount(),
  ])

  const locations = locationsResult.data ?? []
  const { current, limit, canAddMore } = countResult

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sucursales</h1>
          <p className="text-muted-foreground">
            Administra las ubicaciones de tu gimnasio
          </p>
        </div>
        <AddLocationDialog canAdd={canAddMore} limit={limit} current={current}>
          <Button disabled={!canAddMore}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar sucursal
          </Button>
        </AddLocationDialog>
      </div>

      {/* Plan limit info */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Uso de sucursales
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {current} / {limit === -1 ? 'Ilimitadas' : limit}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{
                width: limit === -1 ? '10%' : `${Math.min((current / limit) * 100, 100)}%`,
              }}
            />
          </div>
          {!canAddMore && limit !== -1 && (
            <p className="text-sm text-muted-foreground mt-2">
              Has alcanzado el limite de tu plan. Actualiza a un plan superior para agregar mas sucursales.
            </p>
          )}
          {!planLimits.multiLocation && (
            <p className="text-sm text-muted-foreground mt-2">
              Tu plan actual solo permite una sucursal. Actualiza a Pro o Enterprise para multi-sucursales.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Locations list */}
      <Card>
        <CardHeader>
          <CardTitle>Tus sucursales</CardTitle>
          <CardDescription>
            Haz clic en una sucursal para editarla
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LocationsList locations={locations} />
        </CardContent>
      </Card>
    </div>
  )
}
