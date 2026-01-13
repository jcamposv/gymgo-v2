import { getDashboardMetrics, getRecentMembers, getUpcomingClasses } from '@/actions/dashboard.actions'
import { getRevenueKpi } from '@/actions/finance.actions'
import { getCurrentOrganization } from '@/actions/onboarding.actions'
import { DashboardContent } from './dashboard-content'
import {
  mockKpis,
  mockClientOverview,
  mockRevenue,
  mockActivityOverview,
  mockTrainerSchedule,
  mockClientClasses,
  mockRecentActivity,
  mockCalendarEvents,
} from '@/lib/dashboard.mocks'
import type { DashboardKpi } from '@/types/dashboard.types'

export const metadata = {
  title: 'Dashboard | GymGo',
}

export default async function DashboardPage() {
  const [metricsResult, revenueKpiResult, orgResult] = await Promise.all([
    getDashboardMetrics(),
    getRevenueKpi({ range: 'month' }),
    getCurrentOrganization(),
  ])

  const metrics = metricsResult.data
  const revenueKpi = revenueKpiResult.data
  const organization = orgResult.data

  // Build KPIs from real data when available
  const kpis: DashboardKpi[] = []

  // Revenue KPI - Only shown if user has view_gym_finances permission
  // (the action returns null if unauthorized)
  if (revenueKpi) {
    kpis.push({
      id: '1',
      title: 'Total Revenue',
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
        title: 'Total Clients',
        value: metrics.totalMembers || 0,
        subtitle: 'Miembros activos',
        delta: Math.abs(metrics.membersTrend || 0),
        deltaType: metrics.membersTrend >= 0 ? 'increase' : 'decrease',
        icon: 'clients',
      },
      {
        id: '3',
        title: 'Classes Booked',
        value: metrics.todayClasses || 0,
        subtitle: 'Clases programadas hoy',
        delta: 0,
        deltaType: 'increase',
        icon: 'classes',
      },
      {
        id: '4',
        title: 'Check-ins Today',
        value: metrics.todayCheckIns || 0,
        subtitle: 'Check-ins hoy',
        delta: Math.abs(metrics.checkInsTrend || 0),
        deltaType: metrics.checkInsTrend >= 0 ? 'increase' : 'decrease',
        icon: 'equipment',
      }
    )
  } else {
    // Fallback to mock KPIs if no metrics available
    kpis.push(...mockKpis.slice(revenueKpi ? 1 : 0))
  }

  return (
    <DashboardContent
      kpis={kpis}
      clientOverview={mockClientOverview}
      revenue={mockRevenue}
      activityOverview={mockActivityOverview}
      trainerSchedule={mockTrainerSchedule}
      clientClasses={mockClientClasses}
      recentActivity={mockRecentActivity}
      calendarEvents={mockCalendarEvents}
    />
  )
}
