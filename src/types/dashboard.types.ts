// Dashboard KPI Card
export interface DashboardKpi {
  id: string
  title: string
  value: number
  subtitle: string
  delta: number
  deltaType: 'increase' | 'decrease'
  icon: 'revenue' | 'clients' | 'classes' | 'equipment'
}

// Client Overview Bar Chart (Age Segments)
export interface ClientOverviewPoint {
  date: string
  child: number
  adult: number
  elderly: number
}

// Revenue Chart
export interface RevenuePoint {
  day: string
  income: number
  expense: number
}

export type RevenuePeriod = 'week' | 'month' | 'year'

// Activity Donut Chart
export interface ActivityBreakdown {
  name: string
  value: number
  percentage: number
  color: string
}

export interface ActivityOverview {
  total: number
  period: string
  breakdown: ActivityBreakdown[]
}

// Trainer Schedule
export interface TrainerSchedule {
  id: string
  name: string
  role: string
  activity: string
  startTime: string
  endTime: string
  status: 'available' | 'unavailable'
  avatarUrl?: string
}

// Maintenance Report
export interface MaintenanceReport {
  id: string
  title: string
  timeAgo: string
  status?: 'pending' | 'in_progress' | 'completed'
  icon: 'cleaning' | 'maintenance' | 'restock' | 'hvac' | 'relocation'
}

// Client Class Schedule
export interface ClientClass {
  id: string
  name: string
  date: string
  time: string
  trainer: string
  className: string
  status: 'confirmed' | 'pending' | 'cancelled'
}

// Recent Activity
export interface RecentActivity {
  id: string
  message: string
  time: string
  type: 'session' | 'maintenance' | 'alert' | 'booking'
}

// Calendar Event
export interface CalendarEvent {
  id: string
  title: string
  startTime: string
  endTime: string
  color: string
}

// Dashboard Data (aggregated)
export interface DashboardData {
  kpis: DashboardKpi[]
  clientOverview: ClientOverviewPoint[]
  revenue: RevenuePoint[]
  activityOverview: ActivityOverview
  trainerSchedule: TrainerSchedule[]
  reports: MaintenanceReport[]
  clientClasses: ClientClass[]
  recentActivity: RecentActivity[]
  calendarEvents: CalendarEvent[]
}
