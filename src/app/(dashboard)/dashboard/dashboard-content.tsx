'use client'

import { useState } from 'react'

import {
  KpiCard,
  RevenueChart,
  ActivityDonutChart,
  TrainerScheduleList,
  CalendarSchedule,
  ClientClassSchedule,
  RecentActivityList,
} from '@/components/dashboard'
import { CheckInsChart } from './components/check-ins-chart'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useDashboardMetrics,
  useRevenueKpi,
  useRevenueChart,
  useActivityBreakdown,
  useTodaySchedule,
  useTodayBookings,
  useRecentActivity,
  useCalendarEvents,
  useCheckInsChart,
} from '@/hooks/use-dashboard'
import type { DashboardKpi, RevenuePeriod } from '@/types/dashboard.types'

// =============================================================================
// SKELETON COMPONENTS
// =============================================================================

function KpiCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-1" />
        <Skeleton className="h-3 w-28" />
      </CardContent>
    </Card>
  )
}

function ChartSkeleton({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <Skeleton className="h-3 w-32" />
      </CardHeader>
      <CardContent className="pt-4">
        <Skeleton className="h-[250px] w-full" />
      </CardContent>
    </Card>
  )
}

function ListSkeleton({ title, items = 4 }: { title: string; items?: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function TableSkeleton({ title, rows = 5 }: { title: string; rows?: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// EMPTY STATE COMPONENT
// =============================================================================

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground">
      {message}
    </div>
  )
}

// =============================================================================
// KPI CARDS SECTION
// =============================================================================

function KpiCardsSection() {
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics()
  const { data: revenueKpi, isLoading: revenueLoading } = useRevenueKpi('month')

  if (metricsLoading || revenueLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
      </div>
    )
  }

  const kpis: DashboardKpi[] = []

  // Revenue KPI - Only shown if user has permission (revenueKpi will be null if not authorized)
  if (revenueKpi) {
    kpis.push({
      id: '1',
      title: 'Ingresos Totales',
      value: revenueKpi.totalRevenue,
      subtitle: 'Ingresos este mes',
      delta: Math.abs(revenueKpi.changePct),
      deltaType: revenueKpi.changePct >= 0 ? 'increase' : 'decrease',
      icon: 'revenue',
      currency: revenueKpi.currency,
      requiresPermission: true,
    })
  }

  // Other KPIs (visible to all staff)
  if (metrics) {
    kpis.push(
      {
        id: '2',
        title: 'Total Miembros',
        value: metrics.totalMembers || 0,
        subtitle: 'Miembros activos',
        delta: Math.abs(metrics.membersTrend || 0),
        deltaType: (metrics.membersTrend || 0) >= 0 ? 'increase' : 'decrease',
        icon: 'clients',
      },
      {
        id: '3',
        title: 'Clases Hoy',
        value: metrics.todayClasses || 0,
        subtitle: 'Clases programadas hoy',
        delta: 0,
        deltaType: 'increase',
        icon: 'classes',
      },
      {
        id: '4',
        title: 'Check-ins Hoy',
        value: metrics.todayCheckIns || 0,
        subtitle: 'Check-ins hoy',
        delta: Math.abs(metrics.checkInsTrend || 0),
        deltaType: (metrics.checkInsTrend || 0) >= 0 ? 'increase' : 'decrease',
        icon: 'equipment',
      }
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} />
      ))}
    </div>
  )
}

// =============================================================================
// CHARTS SECTION
// =============================================================================

function ChartsSection() {
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>('week')

  const { data: revenueData, isLoading: revenueLoading, error: revenueError } = useRevenueChart({ period: revenuePeriod })
  const { data: checkInsData, isLoading: checkInsLoading } = useCheckInsChart(8)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Check-ins Chart (replaces Client Overview) */}
      {checkInsLoading ? (
        <ChartSkeleton title="Check-ins por Dia" />
      ) : (
        <CheckInsChart data={checkInsData} />
      )}

      {/* Revenue Chart - Only visible if user has permission */}
      {revenueError ? (
        // User doesn't have permission - don't show anything
        <div className="hidden lg:block" />
      ) : revenueLoading ? (
        <ChartSkeleton title="Ingresos vs Gastos" />
      ) : (
        <RevenueChart
          data={revenueData}
          period={revenuePeriod}
          onPeriodChange={setRevenuePeriod}
        />
      )}
    </div>
  )
}

// =============================================================================
// ACTIVITY & SCHEDULE SECTION
// =============================================================================

function ActivityScheduleSection() {
  const { data: activityData, isLoading: activityLoading } = useActivityBreakdown()
  const { data: scheduleData, isLoading: scheduleLoading } = useTodaySchedule()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Activity Donut Chart */}
      {activityLoading ? (
        <ChartSkeleton title="Actividades" />
      ) : activityData && activityData.breakdown.length > 0 ? (
        <ActivityDonutChart data={activityData} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Actividades</CardTitle>
            <CardDescription>Esta Semana</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState message="No hay clases esta semana" />
          </CardContent>
        </Card>
      )}

      {/* Trainer Schedule */}
      {scheduleLoading ? (
        <ListSkeleton title="Horario de Instructores" />
      ) : scheduleData.length > 0 ? (
        <TrainerScheduleList trainers={scheduleData} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Horario de Instructores</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState message="No hay clases programadas hoy" />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// =============================================================================
// BOOKINGS SECTION
// =============================================================================

function BookingsSection() {
  const { data: bookingsData, isLoading } = useTodayBookings()

  if (isLoading) {
    return <TableSkeleton title="Reservas de Hoy" />
  }

  if (bookingsData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Reservas de Hoy</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState message="No hay reservas para hoy" />
        </CardContent>
      </Card>
    )
  }

  return <ClientClassSchedule classes={bookingsData} />
}

// =============================================================================
// SIDEBAR SECTION (Calendar + Recent Activity)
// =============================================================================

function SidebarSection() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // Convert selected date to ISO string for the hook
  const dateParam = selectedDate.toISOString().split('T')[0]
  const { data: calendarData, isLoading: calendarLoading } = useCalendarEvents({ date: dateParam })
  const { data: activityData, isLoading: activityLoading } = useRecentActivity()

  return (
    <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
      {/* Calendar */}
      {calendarLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : (
        <CalendarSchedule
          events={calendarData}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      )}

      {/* Recent Activity */}
      {activityLoading ? (
        <ListSkeleton title="Actividad Reciente" items={5} />
      ) : activityData.length > 0 ? (
        <RecentActivityList activities={activityData} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState message="No hay actividad reciente" />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function DashboardContent() {
  return (
    <div className="space-y-6">
      {/* Main content grid - 3 columns on desktop, calendar on right */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* Left side - main dashboard content */}
        <div className="space-y-6">
          {/* Row 1: KPI Cards */}
          <KpiCardsSection />

          {/* Row 2: Charts */}
          <ChartsSection />

          {/* Row 3: Activity Donut + Trainer Schedule */}
          <ActivityScheduleSection />

          {/* Row 4: Client Class Schedule */}
          <BookingsSection />
        </div>

        {/* Right side - Calendar + Recent Activity (sticky on desktop) */}
        <SidebarSection />
      </div>
    </div>
  )
}
