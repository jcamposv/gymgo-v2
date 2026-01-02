import { getDashboardMetrics, getRecentMembers, getUpcomingClasses } from '@/actions/dashboard.actions'
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
  const organization = orgResult.data

  // Build KPIs from real data when available, fallback to mock
  const kpis: import('@/types/dashboard.types').DashboardKpi[] = metrics
    ? [
        {
          id: '1',
          title: 'Total Revenue',
          value: metrics.monthlyRevenue || mockKpis[0].value,
          subtitle: 'Total revenue today',
          delta: 2.14,
          deltaType: 'increase',
          icon: 'revenue',
        },
        {
          id: '2',
          title: 'Total Clients',
          value: metrics.totalMembers || mockKpis[1].value,
          subtitle: 'Active clients today',
          delta: metrics.membersTrend || 3.78,
          deltaType: metrics.membersTrend && metrics.membersTrend >= 0 ? 'increase' : 'decrease',
          icon: 'clients',
        },
        {
          id: '3',
          title: 'Classes Booked',
          value: metrics.todayClasses || mockKpis[2].value,
          subtitle: 'Classes scheduled today',
          delta: 1.56,
          deltaType: 'decrease',
          icon: 'classes',
        },
        {
          id: '4',
          title: 'Check-ins Today',
          value: metrics.todayCheckIns || mockKpis[3].value,
          subtitle: 'Check-ins today',
          delta: metrics.checkInsTrend || 1.64,
          deltaType: metrics.checkInsTrend && metrics.checkInsTrend >= 0 ? 'increase' : 'decrease',
          icon: 'equipment',
        },
      ]
    : mockKpis

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
