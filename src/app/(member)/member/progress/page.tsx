import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Scale, Ruler, Heart, TrendingUp, TrendingDown } from 'lucide-react'

export default async function MemberProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get profile
  const { data: profileData } = await supabase
    .from('profiles')
    .select('organization_id, email')
    .eq('id', user?.id ?? '')
    .single()

  const profile = profileData as { organization_id: string; email: string } | null

  // Get member and their measurements
  let measurements: Array<{
    id: string
    measured_at: string
    body_weight_kg: number | null
    body_fat_percentage: number | null
    muscle_mass_kg: number | null
  }> = []

  if (profile?.organization_id) {
    const { data: memberData } = await supabase
      .from('members')
      .select('id')
      .eq('organization_id', profile.organization_id)
      .eq('email', profile.email)
      .single()

    const member = memberData as { id: string } | null

    if (member) {
      const { data: measurementData } = await supabase
        .from('member_measurements')
        .select('id, measured_at, body_weight_kg, body_fat_percentage, muscle_mass_kg')
        .eq('member_id', member.id)
        .order('measured_at', { ascending: false })
        .limit(10)

      measurements = (measurementData || []) as typeof measurements
    }
  }

  const latestMeasurement = measurements[0]
  const previousMeasurement = measurements[1]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi Progreso</h1>
        <p className="text-muted-foreground">
          Seguimiento de tus metricas y avances en el gimnasio
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Peso Actual"
          value={latestMeasurement?.body_weight_kg ? `${latestMeasurement.body_weight_kg} kg` : '--'}
          change={calculateChange(latestMeasurement?.body_weight_kg, previousMeasurement?.body_weight_kg)}
          icon={Scale}
        />
        <MetricCard
          title="% Grasa Corporal"
          value={latestMeasurement?.body_fat_percentage ? `${latestMeasurement.body_fat_percentage}%` : '--'}
          change={calculateChange(latestMeasurement?.body_fat_percentage, previousMeasurement?.body_fat_percentage, true)}
          icon={Activity}
        />
        <MetricCard
          title="Masa Muscular"
          value={latestMeasurement?.muscle_mass_kg ? `${latestMeasurement.muscle_mass_kg} kg` : '--'}
          change={calculateChange(latestMeasurement?.muscle_mass_kg, previousMeasurement?.muscle_mass_kg)}
          icon={Ruler}
        />
        <MetricCard
          title="Mediciones"
          value={measurements.length.toString()}
          description="Total registradas"
          icon={Heart}
        />
      </div>

      {/* Measurements History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-lime-600" />
            Historial de Mediciones
          </CardTitle>
          <CardDescription>Tus ultimas mediciones registradas</CardDescription>
        </CardHeader>
        <CardContent>
          {measurements.length > 0 ? (
            <div className="space-y-4">
              {measurements.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">
                      {formatDate(m.measured_at)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {[
                        m.body_weight_kg && `${m.body_weight_kg} kg`,
                        m.body_fat_percentage && `${m.body_fat_percentage}% grasa`,
                        m.muscle_mass_kg && `${m.muscle_mass_kg} kg musculo`,
                      ].filter(Boolean).join(' • ') || 'Sin datos'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
              <p className="text-muted-foreground">
                Aun no tienes mediciones registradas
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Tu entrenador o nutricionista registrara tus mediciones periodicamente
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Charts Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Graficos de Progreso</CardTitle>
          <CardDescription>Visualiza tu evolucion a lo largo del tiempo</CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
          <p className="text-muted-foreground">
            Los graficos de progreso estaran disponibles cuando tengas mas mediciones
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// COMPONENTS
// =============================================================================

interface MetricCardProps {
  title: string
  value: string
  change?: { value: number; isPositive: boolean } | null
  description?: string
  icon: React.ElementType
}

function MetricCard({ title, value, change, description, icon: Icon }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-lime-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={`text-xs flex items-center gap-1 ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {change.isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {change.value > 0 ? '+' : ''}{change.value.toFixed(1)}
          </p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// HELPERS
// =============================================================================

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function calculateChange(
  current: number | null | undefined,
  previous: number | null | undefined,
  lowerIsBetter = false
): { value: number; isPositive: boolean } | null {
  if (!current || !previous) return null
  const diff = current - previous
  return {
    value: diff,
    isPositive: lowerIsBetter ? diff < 0 : diff > 0,
  }
}
