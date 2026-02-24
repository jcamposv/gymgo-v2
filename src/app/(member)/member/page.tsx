import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dumbbell, Activity, CalendarDays, Trophy, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { getMyMembershipStatus } from '@/actions/membership.actions'
import { MembershipBanner } from '@/components/membership'

export default async function MemberDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get member profile
  const { data: profileData } = await supabase
    .from('profiles')
    .select('organization_id, email, full_name')
    .eq('id', user?.id ?? '')
    .single()

  const profile = profileData as { organization_id: string; email: string; full_name: string | null } | null

  // Get member data if exists
  let memberData = null
  if (profile?.organization_id) {
    const { data } = await supabase
      .from('members')
      .select('id, full_name, status, membership_status, current_plan_id')
      .eq('organization_id', profile.organization_id)
      .eq('email', profile.email)
      .single()
    memberData = data
  }

  // Get membership status
  const membershipResult = await getMyMembershipStatus()
  const membershipStatus = membershipResult.data

  const greeting = getGreeting()
  const displayName = profile?.full_name?.split(' ')[0] || 'Miembro'

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting}, {displayName}
        </h1>
        <p className="text-muted-foreground">
          Bienvenido a tu dashboard personal de entrenamiento
        </p>
      </div>

      {/* Membership Warning Banner */}
      {membershipStatus && (membershipStatus.status === 'expired' || membershipStatus.status === 'expiring_soon') && (
        <MembershipBanner status={membershipStatus} dismissible />
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <QuickStatCard
          title="Mi Membresia"
          value={membershipStatus?.days_remaining != null ? `${membershipStatus.days_remaining}` : '-'}
          description={membershipStatus?.status === 'active' ? 'Dias restantes' : membershipStatus?.status === 'expired' ? 'Vencida' : 'Sin membresia'}
          icon={CreditCard}
          href="/member/payments"
          status={membershipStatus?.status}
        />
        <QuickStatCard
          title="Mis Rutinas"
          value="3"
          description="Rutinas asignadas"
          icon={Dumbbell}
          href="/member/workouts"
        />
        <QuickStatCard
          title="Clases"
          value="5"
          description="Proximas reservas"
          icon={CalendarDays}
          href="/member/classes"
        />
        <QuickStatCard
          title="Mi Progreso"
          value="12"
          description="Mediciones registradas"
          icon={Activity}
          href="/member/progress"
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Workout */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-lime-600" />
              Entrenamiento de Hoy
            </CardTitle>
            <CardDescription>Tu rutina programada para hoy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No tienes rutina asignada para hoy</p>
              <Link
                href="/member/workouts"
                className="text-sm text-lime-600 hover:underline mt-2 inline-block"
              >
                Ver todas mis rutinas
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-lime-600" />
              Progreso Reciente
            </CardTitle>
            <CardDescription>Tus ultimas mediciones y avances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Aun no tienes mediciones registradas</p>
              <Link
                href="/member/progress"
                className="text-sm text-lime-600 hover:underline mt-2 inline-block"
              >
                Ver mi progreso
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Classes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-lime-600" />
            Proximas Clases
          </CardTitle>
          <CardDescription>Tus reservas para los proximos dias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No tienes clases reservadas</p>
            <Link
              href="/member/classes"
              className="text-sm text-lime-600 hover:underline mt-2 inline-block"
            >
              Explorar clases disponibles
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// HELPERS
// =============================================================================

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos dias'
  if (hour < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

// =============================================================================
// COMPONENTS
// =============================================================================

interface QuickStatCardProps {
  title: string
  value: string
  description: string
  icon: React.ElementType
  href: string
  status?: string
}

function QuickStatCard({ title, value, description, icon: Icon, href, status }: QuickStatCardProps) {
  const isExpired = status === 'expired'
  const isExpiringSoon = status === 'expiring_soon'

  return (
    <Link href={href}>
      <Card className={`hover:border-lime-300 transition-colors cursor-pointer ${
        isExpired ? 'border-red-200 bg-red-50/50' : isExpiringSoon ? 'border-yellow-200 bg-yellow-50/50' : ''
      }`}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className={`h-4 w-4 ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-lime-600'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : ''}`}>
            {value}
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
