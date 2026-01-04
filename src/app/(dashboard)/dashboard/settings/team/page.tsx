import { redirect } from 'next/navigation'
import { getStaffMembers } from '@/actions/user.actions'
import { requireAdmin } from '@/lib/auth/server-auth'
import { mapLegacyRole } from '@/lib/rbac/helpers'
import { ROLE_LABELS } from '@/lib/rbac/role-labels'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, Shield, UserCog } from 'lucide-react'
import { RoleSelector } from './role-selector'

export const metadata = {
  title: 'Equipo | GymGo',
}

export default async function TeamSettingsPage() {
  // Check if user is admin
  const { authorized, user } = await requireAdmin()

  if (!authorized || !user) {
    redirect('/dashboard')
  }

  const { data: staffMembers, error } = await getStaffMembers()

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipo</h1>
          <p className="text-muted-foreground">Error al cargar el equipo: {error}</p>
        </div>
      </div>
    )
  }

  // Separate staff and clients for display
  const staff = staffMembers?.filter((m) => {
    const appRole = mapLegacyRole(m.role)
    return appRole !== 'client'
  }) || []

  const clients = staffMembers?.filter((m) => {
    const appRole = mapLegacyRole(m.role)
    return appRole === 'client'
  }) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Equipo</h1>
        <p className="text-muted-foreground">
          Administra los roles y permisos de tu equipo
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Usuarios
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffMembers?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Staff
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clientes con acceso
            </CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-lime-600" />
            Personal del Gimnasio
          </CardTitle>
          <CardDescription>
            Usuarios con permisos de administracion
          </CardDescription>
        </CardHeader>
        <CardContent>
          {staff.length > 0 ? (
            <div className="space-y-4">
              {staff.map((member) => {
                const appRole = mapLegacyRole(member.role)
                const initials = member.full_name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) || member.email[0].toUpperCase()

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback className="bg-lime-100 text-lime-800">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {member.full_name || 'Sin nombre'}
                          </p>
                          {member.is_current_user && (
                            <Badge variant="outline" className="text-xs">
                              Tu
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <RoleSelector
                        userId={member.id}
                        currentRole={appRole}
                        isCurrentUser={member.is_current_user}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
              <p className="text-muted-foreground">
                No hay personal registrado
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clients with access (optional section) */}
      {clients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              Clientes con Acceso al Sistema
            </CardTitle>
            <CardDescription>
              Usuarios registrados como clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clients.slice(0, 10).map((member) => {
                const appRole = mapLegacyRole(member.role)
                const initials = member.full_name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) || member.email[0].toUpperCase()

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {member.full_name || 'Sin nombre'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                    </div>

                    <RoleSelector
                      userId={member.id}
                      currentRole={appRole}
                      isCurrentUser={member.is_current_user}
                    />
                  </div>
                )
              })}
              {clients.length > 10 && (
                <p className="text-sm text-muted-foreground text-center">
                  y {clients.length - 10} clientes mas...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
