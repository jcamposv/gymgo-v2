import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Users,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  DollarSign,
  UserCheck,
  Clock,
  Plus,
  ArrowRight,
} from 'lucide-react'

import { getDashboardMetrics, getRecentMembers, getUpcomingClasses } from '@/actions/dashboard.actions'
import { getCurrentOrganization } from '@/actions/onboarding.actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Dashboard | GymGo',
}

export default async function DashboardPage() {
  const [metricsResult, recentMembersResult, upcomingClassesResult, orgResult] = await Promise.all([
    getDashboardMetrics(),
    getRecentMembers(),
    getUpcomingClasses(),
    getCurrentOrganization(),
  ])

  const metrics = metricsResult.data
  const recentMembers = recentMembersResult.data || []
  const upcomingClasses = upcomingClassesResult.data || []
  const organization = orgResult.data

  const formatCurrency = (amount: number) => {
    const currency = organization?.currency || 'MXN'
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/members/new">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Miembro
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Miembros Totales
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalMembers || 0}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {metrics?.activeMembers || 0} activos
              {metrics?.membersTrend !== 0 && (
                <span className={`flex items-center ${metrics?.membersTrend && metrics.membersTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics?.membersTrend && metrics.membersTrend > 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(metrics?.membersTrend || 0)}%
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clases Hoy
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.todayClasses || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.totalClasses || 0} programadas en total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Check-ins Hoy
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.todayCheckIns || 0}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {metrics?.checkInsTrend !== 0 && (
                <span className={`flex items-center ${metrics?.checkInsTrend && metrics.checkInsTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics?.checkInsTrend && metrics.checkInsTrend > 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(metrics?.checkInsTrend || 0)}% vs ayer
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos del Mes
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics?.monthlyRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(), 'MMMM yyyy', { locale: es })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Members & Upcoming Classes */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Miembros Recientes</CardTitle>
                <CardDescription>
                  Ultimos miembros registrados
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/members">
                  Ver todos
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentMembers.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay miembros registrados</p>
                <Button variant="link" asChild className="mt-2">
                  <Link href="/dashboard/members/new">Agregar primer miembro</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {member.full_name.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{member.full_name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                      {member.status === 'active' ? 'Activo' : member.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Classes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Proximas Clases</CardTitle>
                <CardDescription>
                  Clases programadas
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/classes">
                  Ver todas
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingClasses.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay clases programadas</p>
                <Button variant="link" asChild className="mt-2">
                  <Link href="/dashboard/classes/new">Crear primera clase</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingClasses.map((classItem) => (
                  <div key={classItem.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{classItem.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(classItem.start_time), "EEE d MMM, HH:mm", { locale: es })}
                          {classItem.instructor_name && ` - ${classItem.instructor_name}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">
                        {classItem.current_bookings}/{classItem.max_capacity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rapidas</CardTitle>
          <CardDescription>
            Tareas comunes para administrar tu gimnasio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link href="/dashboard/members/new">
                <Users className="h-5 w-5" />
                <span>Nuevo Miembro</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link href="/dashboard/classes/new">
                <CalendarDays className="h-5 w-5" />
                <span>Nueva Clase</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link href="/dashboard/members">
                <UserCheck className="h-5 w-5" />
                <span>Check-in Manual</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link href="/settings">
                <DollarSign className="h-5 w-5" />
                <span>Configuracion</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
