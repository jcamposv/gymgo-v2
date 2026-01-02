'use client'

import { useState } from 'react'

import {
  KpiCard,
  ClientOverviewChart,
  RevenueChart,
  ActivityDonutChart,
  TrainerScheduleList,
  CalendarSchedule,
  ClientClassSchedule,
  RecentActivityList,
} from '@/components/dashboard'
import type {
  DashboardKpi,
  ClientOverviewPoint,
  RevenuePoint,
  RevenuePeriod,
  ActivityOverview,
  TrainerSchedule,
  ClientClass,
  RecentActivity,
  CalendarEvent,
} from '@/types/dashboard.types'

interface DashboardContentProps {
  kpis: DashboardKpi[]
  clientOverview: ClientOverviewPoint[]
  revenue: RevenuePoint[]
  activityOverview: ActivityOverview
  trainerSchedule: TrainerSchedule[]
  clientClasses: ClientClass[]
  recentActivity: RecentActivity[]
  calendarEvents: CalendarEvent[]
}

export function DashboardContent({
  kpis,
  clientOverview,
  revenue,
  activityOverview,
  trainerSchedule,
  clientClasses,
  recentActivity,
  calendarEvents,
}: DashboardContentProps) {
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>('week')
  const [clientOverviewPeriod, setClientOverviewPeriod] = useState('last8days')

  return (
    <div className="space-y-6">
      {/* Main content grid - 3 columns on desktop, calendar on right */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* Left side - main dashboard content */}
        <div className="space-y-6">
          {/* Row 1: KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi) => (
              <KpiCard key={kpi.id} kpi={kpi} />
            ))}
          </div>

          {/* Row 2: Client Overview + Revenue Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ClientOverviewChart
              data={clientOverview}
              period={clientOverviewPeriod}
              onPeriodChange={setClientOverviewPeriod}
            />
            <RevenueChart
              data={revenue}
              period={revenuePeriod}
              onPeriodChange={setRevenuePeriod}
            />
          </div>

          {/* Row 3: Activity Donut + Trainer Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ActivityDonutChart data={activityOverview} />
            <TrainerScheduleList trainers={trainerSchedule} />
          </div>

          {/* Row 4: Client Class Schedule */}
          <ClientClassSchedule classes={clientClasses} />
        </div>

        {/* Right side - Calendar + Recent Activity (sticky on desktop) */}
        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <CalendarSchedule events={calendarEvents} />
          <RecentActivityList activities={recentActivity} />
        </div>
      </div>
    </div>
  )
}
