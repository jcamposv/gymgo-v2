/**
 * Dashboard Module SWR Keys
 *
 * Centralized key management for the Dashboard module.
 * Ensures consistent cache keys across the application.
 */

import { serializeKey } from '../fetcher'

// =============================================================================
// KEY PREFIXES
// =============================================================================

export const DASHBOARD_KEY_PREFIX = {
  overview: 'dashboard-overview',
  metrics: 'dashboard-metrics',
  revenueChart: 'dashboard-revenue-chart',
  activityBreakdown: 'dashboard-activity-breakdown',
  todaySchedule: 'dashboard-today-schedule',
  todayBookings: 'dashboard-today-bookings',
  recentActivity: 'dashboard-recent-activity',
  checkInsChart: 'dashboard-checkins-chart',
  calendarEvents: 'dashboard-calendar-events',
} as const

// =============================================================================
// PARAM TYPES
// =============================================================================

export interface DashboardOverviewParams {
  /** Date for dashboard data (defaults to today) */
  date?: string
}

export interface DashboardRevenueChartParams {
  /** Period for revenue chart: week, month, year */
  period: 'week' | 'month' | 'year'
}

export interface DashboardCheckInsChartParams {
  /** Number of days to show */
  days?: number
}

export interface DashboardCalendarEventsParams {
  /** Date for calendar events (ISO string) */
  date?: string
}

// =============================================================================
// KEY GENERATORS
// =============================================================================

export const dashboardKeys = {
  /**
   * All dashboard-related keys (for bulk invalidation)
   */
  all: () => ['dashboard'] as const,

  /**
   * Dashboard overview key (aggregated data for all widgets)
   */
  overview: (params: DashboardOverviewParams = {}): string => {
    return serializeKey(DASHBOARD_KEY_PREFIX.overview, {
      date: params.date || new Date().toISOString().split('T')[0],
    })
  },

  /**
   * Dashboard metrics key (KPIs)
   */
  metrics: (): string => {
    return serializeKey(DASHBOARD_KEY_PREFIX.metrics, {
      date: new Date().toISOString().split('T')[0],
    })
  },

  /**
   * Revenue chart key with period
   */
  revenueChart: (params: DashboardRevenueChartParams): string => {
    return serializeKey(DASHBOARD_KEY_PREFIX.revenueChart, {
      period: params.period,
    })
  },

  /**
   * Activity breakdown key (for donut chart)
   */
  activityBreakdown: (): string => {
    return serializeKey(DASHBOARD_KEY_PREFIX.activityBreakdown, {
      date: new Date().toISOString().split('T')[0],
    })
  },

  /**
   * Today's schedule key (trainers/instructors)
   */
  todaySchedule: (): string => {
    return serializeKey(DASHBOARD_KEY_PREFIX.todaySchedule, {
      date: new Date().toISOString().split('T')[0],
    })
  },

  /**
   * Today's bookings key (class bookings)
   */
  todayBookings: (): string => {
    return serializeKey(DASHBOARD_KEY_PREFIX.todayBookings, {
      date: new Date().toISOString().split('T')[0],
    })
  },

  /**
   * Recent activity key
   */
  recentActivity: (): string => {
    return serializeKey(DASHBOARD_KEY_PREFIX.recentActivity, {
      date: new Date().toISOString().split('T')[0],
    })
  },

  /**
   * Check-ins chart key
   */
  checkInsChart: (params: DashboardCheckInsChartParams = {}): string => {
    return serializeKey(DASHBOARD_KEY_PREFIX.checkInsChart, {
      days: params.days || 8,
    })
  },

  /**
   * Calendar events key with specific date
   */
  calendarEvents: (params: DashboardCalendarEventsParams = {}): string => {
    return serializeKey(DASHBOARD_KEY_PREFIX.calendarEvents, {
      date: params.date || new Date().toISOString().split('T')[0],
    })
  },
}

// =============================================================================
// KEY MATCHERS (for selective invalidation)
// =============================================================================

export const dashboardKeyMatchers = {
  /**
   * Matches any dashboard key
   */
  isDashboardKey: (key: unknown): boolean => {
    if (typeof key !== 'string') return false
    try {
      const parsed = JSON.parse(key)
      if (!Array.isArray(parsed)) return false
      return typeof parsed[0] === 'string' && parsed[0].startsWith('dashboard-')
    } catch {
      return false
    }
  },
}
