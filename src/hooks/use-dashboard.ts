'use client'

import useSWR from 'swr'
import { useSWRConfig } from 'swr'
import {
  getDashboardMetrics,
  getDashboardRevenueChart,
  getActivityBreakdown,
  getTodaySchedule,
  getTodayBookings,
  getRecentActivity,
  getCalendarEvents,
  getCheckInsChart,
} from '@/actions/dashboard.actions'
import { getRevenueKpi } from '@/actions/finance.actions'
import {
  dashboardKeys,
  dashboardKeyMatchers,
  type DashboardRevenueChartParams,
  type DashboardCalendarEventsParams,
} from '@/lib/swr/keys'
import { FetcherError } from '@/lib/swr/fetcher'
import type {
  RevenuePoint,
  ActivityOverview,
  TrainerSchedule,
  ClientClass,
  RecentActivity,
  CalendarEvent,
} from '@/types/dashboard.types'

// =============================================================================
// TYPES
// =============================================================================

interface DashboardMetrics {
  totalMembers: number
  activeMembers: number
  totalClasses: number
  todayClasses: number
  todayCheckIns: number
  monthlyRevenue: number
  membersTrend: number
  checkInsTrend: number
}

interface RevenueKpi {
  totalRevenue: number
  currency: string
  period: {
    from: string
    to: string
  }
  previousPeriodRevenue: number
  changePct: number
}

interface CheckInsChartData {
  date: string
  checkIns: number
}

// =============================================================================
// SWR CONFIG
// =============================================================================

const swrConfig = {
  revalidateOnFocus: false,
  keepPreviousData: true,
  dedupingInterval: 10000, // Dashboard data doesn't change frequently
  shouldRetryOnError: (error: Error) => {
    if (error instanceof FetcherError) {
      // Don't retry 4xx errors (permissions, not found, etc.)
      return error.status >= 500
    }
    return true
  },
  errorRetryCount: 2,
}

// =============================================================================
// DASHBOARD METRICS HOOK
// =============================================================================

interface UseDashboardMetricsParams {
  location_id?: string | null
}

export function useDashboardMetrics(params?: UseDashboardMetricsParams) {
  const locationId = params?.location_id
  // Include location in cache key so switching locations refetches data
  const swrKey = `dashboard-metrics-${locationId ?? 'all'}`

  const { data, error, isLoading, isValidating, mutate } = useSWR<DashboardMetrics | null>(
    swrKey,
    async () => {
      const result = await getDashboardMetrics({
        location_id: locationId ?? undefined,
      })
      if (result.error) {
        throw new FetcherError(result.error, 400)
      }
      return result.data
    },
    swrConfig
  )

  return {
    data: data ?? null,
    isLoading,
    isValidating,
    error: error ?? null,
    mutate,
  }
}

// =============================================================================
// REVENUE KPI HOOK (for KPI card)
// =============================================================================

interface UseRevenueKpiParams {
  range?: 'today' | 'week' | 'month' | 'year'
  location_id?: string | null
  include_org_wide?: boolean
}

export function useRevenueKpi(
  rangeOrParams: 'today' | 'week' | 'month' | 'year' | UseRevenueKpiParams = 'month'
) {
  // Support both legacy string param and new object param
  const params: UseRevenueKpiParams = typeof rangeOrParams === 'string'
    ? { range: rangeOrParams }
    : rangeOrParams

  const range = params.range ?? 'month'
  const locationId = params.location_id
  const includeOrgWide = params.include_org_wide

  // Include location in the cache key so switching locations refetches data
  const swrKey = `revenue-kpi-${range}-${locationId ?? 'all'}`

  const { data, error, isLoading, isValidating, mutate } = useSWR<RevenueKpi | null>(
    swrKey,
    async () => {
      const result = await getRevenueKpi({
        range,
        location_id: locationId ?? undefined,
        include_org_wide: includeOrgWide,
      })
      if (result.error) {
        throw new FetcherError(result.error, 403) // Permission error
      }
      return result.data
    },
    {
      ...swrConfig,
      // Don't show error toast for permission errors
      shouldRetryOnError: false,
    }
  )

  return {
    data: data ?? null,
    isLoading,
    isValidating,
    error: error ?? null,
    mutate,
  }
}

// =============================================================================
// REVENUE CHART HOOK
// =============================================================================

export function useRevenueChart(params: DashboardRevenueChartParams) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<RevenuePoint[] | null>(
    dashboardKeys.revenueChart(params),
    async () => {
      const result = await getDashboardRevenueChart({ period: params.period })
      if (result.error) {
        throw new FetcherError(result.error, 403)
      }
      return result.data
    },
    {
      ...swrConfig,
      shouldRetryOnError: false,
    }
  )

  return {
    data: data ?? [],
    isLoading,
    isValidating,
    error: error ?? null,
    mutate,
  }
}

// =============================================================================
// ACTIVITY BREAKDOWN HOOK
// =============================================================================

export function useActivityBreakdown() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<ActivityOverview | null>(
    dashboardKeys.activityBreakdown(),
    async () => {
      const result = await getActivityBreakdown()
      if (result.error) {
        throw new FetcherError(result.error, 400)
      }
      return result.data
    },
    swrConfig
  )

  return {
    data: data ?? null,
    isLoading,
    isValidating,
    error: error ?? null,
    mutate,
  }
}

// =============================================================================
// TODAY'S SCHEDULE HOOK
// =============================================================================

export function useTodaySchedule() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<TrainerSchedule[] | null>(
    dashboardKeys.todaySchedule(),
    async () => {
      const result = await getTodaySchedule()
      if (result.error) {
        throw new FetcherError(result.error, 400)
      }
      return result.data
    },
    swrConfig
  )

  return {
    data: data ?? [],
    isLoading,
    isValidating,
    error: error ?? null,
    mutate,
  }
}

// =============================================================================
// TODAY'S BOOKINGS HOOK
// =============================================================================

export function useTodayBookings() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<ClientClass[] | null>(
    dashboardKeys.todayBookings(),
    async () => {
      const result = await getTodayBookings()
      if (result.error) {
        throw new FetcherError(result.error, 400)
      }
      return result.data
    },
    swrConfig
  )

  return {
    data: data ?? [],
    isLoading,
    isValidating,
    error: error ?? null,
    mutate,
  }
}

// =============================================================================
// RECENT ACTIVITY HOOK
// =============================================================================

export function useRecentActivity() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<RecentActivity[] | null>(
    dashboardKeys.recentActivity(),
    async () => {
      const result = await getRecentActivity()
      if (result.error) {
        throw new FetcherError(result.error, 400)
      }
      return result.data
    },
    swrConfig
  )

  return {
    data: data ?? [],
    isLoading,
    isValidating,
    error: error ?? null,
    mutate,
  }
}

// =============================================================================
// CALENDAR EVENTS HOOK
// =============================================================================

export function useCalendarEvents(params: DashboardCalendarEventsParams = {}) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<CalendarEvent[] | null>(
    dashboardKeys.calendarEvents(params),
    async () => {
      const result = await getCalendarEvents({ date: params.date })
      if (result.error) {
        throw new FetcherError(result.error, 400)
      }
      return result.data
    },
    swrConfig
  )

  return {
    data: data ?? [],
    isLoading,
    isValidating,
    error: error ?? null,
    mutate,
  }
}

// =============================================================================
// CHECK-INS CHART HOOK
// =============================================================================

export function useCheckInsChart(days: number = 8) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<CheckInsChartData[] | null>(
    dashboardKeys.checkInsChart({ days }),
    async () => {
      const result = await getCheckInsChart({ days })
      if (result.error) {
        throw new FetcherError(result.error, 400)
      }
      return result.data
    },
    swrConfig
  )

  return {
    data: data ?? [],
    isLoading,
    isValidating,
    error: error ?? null,
    mutate,
  }
}

// =============================================================================
// INVALIDATION UTILITIES
// =============================================================================

export function useInvalidateDashboard() {
  const { mutate } = useSWRConfig()

  return () => {
    mutate(
      (key) => dashboardKeyMatchers.isDashboardKey(key),
      undefined,
      { revalidate: true }
    )
  }
}
