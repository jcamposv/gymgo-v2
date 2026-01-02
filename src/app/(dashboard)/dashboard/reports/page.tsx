import {
  Users,
  UserCheck,
  CalendarDays,
  DollarSign,
  TrendingUp,
  Activity,
} from 'lucide-react'

import { getReportSummary } from '@/actions/reports.actions'
import { getCurrentOrganization } from '@/actions/onboarding.actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Reportes | GymGo',
}

const statusLabels: Record<string, string> = {
  active: 'Activos',
  inactive: 'Inactivos',
  suspended: 'Suspendidos',
  cancelled: 'Cancelados',
}

const classTypeLabels: Record<string, string> = {
  crossfit: 'CrossFit',
  yoga: 'Yoga',
  pilates: 'Pilates',
  spinning: 'Spinning',
  hiit: 'HIIT',
  strength: 'Fuerza',
  cardio: 'Cardio',
  functional: 'Funcional',
  boxing: 'Box',
  mma: 'MMA',
  stretching: 'Estiramiento',
  open_gym: 'Open Gym',
  personal: 'Personal',
  other: 'Otro',
}

export default async function ReportsPage() {
  const [reportResult, orgResult] = await Promise.all([
    getReportSummary('month'),
    getCurrentOrganization(),
  ])

  const report = reportResult.data
  const organization = orgResult.data

  const formatCurrency = (amount: number) => {
    const currency = organization?.currency || 'MXN'
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground">
            Analisis y estadisticas de tu gimnasio
          </p>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No se pudieron cargar los reportes
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground">
            Analisis y estadisticas de tu gimnasio
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {report.period}
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Miembros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              {report.activeMembers} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuevos Miembros</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{report.newMembers}</div>
            <p className="text-xs text-muted-foreground">
              {report.period.toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-ins</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.totalCheckIns}</div>
            <p className="text-xs text-muted-foreground">
              ~{report.avgCheckInsPerDay}/dia promedio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(report.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {report.period.toLowerCase()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Members by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Miembros por estado
            </CardTitle>
            <CardDescription>
              Distribucion de membresias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.membersByStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        item.status === 'active'
                          ? 'bg-green-500'
                          : item.status === 'inactive'
                          ? 'bg-gray-400'
                          : item.status === 'suspended'
                          ? 'bg-orange-500'
                          : 'bg-red-500'
                      }`}
                    />
                    <span className="text-sm">{statusLabels[item.status] || item.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.count}</span>
                    <span className="text-xs text-muted-foreground">
                      ({report.totalMembers > 0 ? Math.round((item.count / report.totalMembers) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Popular Class Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Tipos de clases populares
            </CardTitle>
            <CardDescription>
              Clases mas frecuentes {report.period.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {report.popularClassTypes.length > 0 ? (
              <div className="space-y-4">
                {report.popularClassTypes.map((item, index) => (
                  <div key={item.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm w-4">{index + 1}.</span>
                      <span className="text-sm">{classTypeLabels[item.type] || item.type}</span>
                    </div>
                    <Badge variant="secondary">{item.count} clases</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No hay datos de clases para este periodo
              </p>
            )}
          </CardContent>
        </Card>

        {/* Classes Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Actividad
            </CardTitle>
            <CardDescription>
              Resumen de actividad {report.period.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Clases realizadas</span>
                <span className="font-medium">{report.totalClasses}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Check-ins totales</span>
                <span className="font-medium">{report.totalCheckIns}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Promedio diario</span>
                <span className="font-medium">{report.avgCheckInsPerDay} check-ins</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Month */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Ingresos por mes
            </CardTitle>
            <CardDescription>
              Ultimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.revenueByMonth.map((item) => {
                const maxRevenue = Math.max(...report.revenueByMonth.map(r => r.revenue))
                const percentage = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0

                return (
                  <div key={item.month} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize">{item.month}</span>
                      <span className="font-medium">{formatCurrency(item.revenue)}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
