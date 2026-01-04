import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Phone, Calendar, CreditCard } from 'lucide-react'

export default async function MemberProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get profile
  const { data: profileData } = await supabase
    .from('profiles')
    .select('organization_id, email, full_name')
    .eq('id', user?.id ?? '')
    .single()

  const profile = profileData as {
    organization_id: string
    email: string
    full_name: string | null
  } | null

  // Get member data
  let memberData = null
  if (profile?.organization_id) {
    const { data } = await supabase
      .from('members')
      .select(`
        id, full_name, email, phone, date_of_birth, gender,
        status, membership_status, membership_start_date, membership_end_date,
        current_plan_id, experience_level, fitness_goals
      `)
      .eq('organization_id', profile.organization_id)
      .eq('email', profile.email)
      .single()
    memberData = data
  }

  const member = memberData as {
    id: string
    full_name: string
    email: string
    phone: string | null
    date_of_birth: string | null
    gender: string | null
    status: string
    membership_status: string
    membership_start_date: string | null
    membership_end_date: string | null
    current_plan_id: string | null
    experience_level: string
    fitness_goals: string[] | null
  } | null

  if (!member) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mi Perfil</h1>
          <p className="text-muted-foreground">Tu informacion personal y membresia</p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
            <p className="text-muted-foreground">
              No tienes un perfil de miembro activo.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Contacta a la administracion del gimnasio para activar tu membresia.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    suspended: 'bg-amber-100 text-amber-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground">Tu informacion personal y membresia</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-lime-600" />
              Informacion Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow label="Nombre" value={member.full_name} />
            <InfoRow
              label="Email"
              value={member.email}
              icon={<Mail className="h-4 w-4 text-muted-foreground" />}
            />
            <InfoRow
              label="Telefono"
              value={member.phone || 'No registrado'}
              icon={<Phone className="h-4 w-4 text-muted-foreground" />}
            />
            <InfoRow
              label="Fecha de nacimiento"
              value={member.date_of_birth ? formatDate(member.date_of_birth) : 'No registrada'}
              icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
            />
            <InfoRow label="Genero" value={member.gender || 'No especificado'} />
            <InfoRow label="Nivel de experiencia" value={formatExperience(member.experience_level)} />
          </CardContent>
        </Card>

        {/* Membership Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-lime-600" />
              Membresia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estado</span>
              <Badge className={statusColors[member.status] || statusColors.inactive}>
                {formatStatus(member.status)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estado de membresia</span>
              <Badge variant="outline">
                {formatMembershipStatus(member.membership_status)}
              </Badge>
            </div>
            <InfoRow
              label="Inicio de membresia"
              value={member.membership_start_date ? formatDate(member.membership_start_date) : 'No definido'}
            />
            <InfoRow
              label="Vencimiento"
              value={member.membership_end_date ? formatDate(member.membership_end_date) : 'Sin fecha'}
            />
          </CardContent>
        </Card>

        {/* Fitness Goals */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Objetivos de Fitness</CardTitle>
            <CardDescription>Tus metas personales de entrenamiento</CardDescription>
          </CardHeader>
          <CardContent>
            {member.fitness_goals && member.fitness_goals.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {member.fitness_goals.map((goal, index) => (
                  <Badge key={index} variant="secondary">
                    {goal}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No tienes objetivos de fitness registrados. Habla con tu entrenador para definirlos.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// =============================================================================
// COMPONENTS
// =============================================================================

interface InfoRowProps {
  label: string
  value: string
  icon?: React.ReactNode
}

function InfoRow({ label, value, icon }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className="text-sm font-medium">{value}</span>
    </div>
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

function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
    suspended: 'Suspendido',
    cancelled: 'Cancelado',
  }
  return labels[status] || status
}

function formatMembershipStatus(status: string): string {
  const labels: Record<string, string> = {
    active: 'Activa',
    expired: 'Vencida',
    cancelled: 'Cancelada',
    frozen: 'Congelada',
  }
  return labels[status] || status
}

function formatExperience(level: string): string {
  const labels: Record<string, string> = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
    expert: 'Experto',
  }
  return labels[level] || level
}
