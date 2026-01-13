'use client'

import { useState, useMemo } from 'react'
import {
  Users,
  UserCheck,
  CalendarDays,
  DollarSign,
  TrendingUp,
  Activity,
} from 'lucide-react'

import { useReportSummary, type ReportSummary } from '@/hooks/use-report-summary'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

// =============================================================================
// TYPES
// =============================================================================

type Period = 'week' | 'month' | 'year'

interface ReportsClientProps {
  initialData?: ReportSummary
  currency?: string
}

// =============================================================================
// LABELS
// =============================================================================

const periodLabels: Record<Period, string> = {
  week: 'Ultima semana',
  month: 'Este mes',
  year: 'Este ano',
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

// =============================================================================
// HELPERS
// =============================================================================

function getDateRange(period: Period): { startDate: string; endDate: string } {
  const now = new Date()
  let start: Date

  switch (period) {
    case 'week':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
      break
    case 'year':
      start = new Date(now.getFullYear(), 0, 1)
      break
    case 'month':
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      break
  }

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: now.toISOString().split('T')[0],
  }
}

// =============================================================================
// SKELETON COMPONENTS
// =============================================================================

function MetricCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  )
}

function ChartCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32 mb-2" />
        <Skeleton className="h-3 w-40" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function ReportsLoadingSkeleton() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
    </>
  )
}

// =============================================================================
// PERIOD SELECTOR
// =============================================================================

interface PeriodSelectorProps {
  value: Period
  onChange: (period: Period) => void
  isLoading?: boolean
}

function PeriodSelector({ value, onChange, isLoading }: PeriodSelectorProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as Period)}>
      <TabsList>
        <TabsTrigger value="week" disabled={isLoading}>
          Semana
        </TabsTrigger>
        <TabsTrigger value="month" disabled={isLoading}>
          Mes
        </TabsTrigger>
        <TabsTrigger value="year" disabled={isLoading}>
          Ano
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

// =============================================================================
// REPORTS CONTENT
// =============================================================================

interface ReportsContentProps {
  report: ReportSummary
  currency: string
  period: Period
}

function ReportsContent({ report, currency, period }: ReportsContentProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <>
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
              {periodLabels[period].toLowerCase()}
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
              {periodLabels[period].toLowerCase()}
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
              Clases mas frecuentes {periodLabels[period].toLowerCase()}
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
              Resumen de actividad {periodLabels[period].toLowerCase()}
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
    </>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ReportsClient({ initialData, currency = 'MXN' }: ReportsClientProps) {
  const [period, setPeriod] = useState<Period>('month')

  const dateRange = useMemo(() => getDateRange(period), [period])

  const { data, isLoading, error } = useReportSummary(dateRange, {
    fallbackData: period === 'month' ? initialData : undefined,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground">
            Analisis y estadisticas de tu gimnasio
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodSelector
            value={period}
            onChange={setPeriod}
            isLoading={isLoading}
          />
          {data && (
            <Badge variant="outline" className="text-sm">
              {periodLabels[period]}
            </Badge>
          )}
        </div>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {error.message || 'No se pudieron cargar los reportes'}
          </CardContent>
        </Card>
      ) : isLoading || !data ? (
        <ReportsLoadingSkeleton />
      ) : (
        <ReportsContent report={data} currency={currency} period={period} />
      )}
    </div>
  )
}
