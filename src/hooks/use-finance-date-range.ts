'use client'

import { useCallback, useMemo } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  format,
  parse,
  isValid,
  isBefore,
  isAfter,
  getWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'

// =============================================================================
// TYPES
// =============================================================================

export type DateViewMode = 'day' | 'week' | 'month' | 'year' | 'range'

export interface DateRange {
  from: Date
  to: Date
}

export interface FinanceDateRangeState {
  view: DateViewMode
  from: Date
  to: Date
  compare: boolean
  anchor: Date // Reference date for navigation
}

export interface FinanceDateRangeActions {
  setView: (view: DateViewMode) => void
  setRange: (from: Date, to: Date) => void
  goPrev: () => void
  goNext: () => void
  goToday: () => void
  toggleCompare: () => void
  applyPreset: (preset: DatePreset) => void
}

export interface FinanceDateRangeReturn extends FinanceDateRangeState, FinanceDateRangeActions {
  /** Formatted label for current period */
  periodLabel: string
  /** Formatted short label for mobile */
  periodLabelShort: string
  /** Previous period dates for comparison */
  previousPeriod: DateRange | null
  /** Whether navigation to next period is allowed (no future dates) */
  canGoNext: boolean
  /** ISO string for API calls */
  fromISO: string
  toISO: string
}

// =============================================================================
// PRESETS
// =============================================================================

export type DatePreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'last_30_days'
  | 'last_90_days'
  | 'last_year'

export interface PresetConfig {
  id: DatePreset
  label: string
  shortLabel: string
}

export const DATE_PRESETS: PresetConfig[] = [
  { id: 'today', label: 'Hoy', shortLabel: 'Hoy' },
  { id: 'yesterday', label: 'Ayer', shortLabel: 'Ayer' },
  { id: 'this_week', label: 'Esta semana', shortLabel: 'Semana' },
  { id: 'last_week', label: 'Semana anterior', shortLabel: 'Sem. ant.' },
  { id: 'this_month', label: 'Este mes', shortLabel: 'Mes' },
  { id: 'last_month', label: 'Mes anterior', shortLabel: 'Mes ant.' },
  { id: 'this_year', label: 'Este año', shortLabel: 'Año' },
  { id: 'last_30_days', label: 'Últimos 30 días', shortLabel: '30 días' },
  { id: 'last_90_days', label: 'Últimos 90 días', shortLabel: '90 días' },
  { id: 'last_year', label: 'Año anterior', shortLabel: 'Año ant.' },
]

// =============================================================================
// HELPERS
// =============================================================================

const DATE_FORMAT = 'yyyy-MM-dd'

function parseDate(str: string | null): Date | null {
  if (!str) return null
  const parsed = parse(str, DATE_FORMAT, new Date())
  return isValid(parsed) ? parsed : null
}

function formatDate(date: Date): string {
  return format(date, DATE_FORMAT)
}

function getPresetRange(preset: DatePreset, today: Date = new Date()): DateRange {
  switch (preset) {
    case 'today':
      return { from: startOfDay(today), to: endOfDay(today) }
    case 'yesterday':
      const yesterday = subDays(today, 1)
      return { from: startOfDay(yesterday), to: endOfDay(yesterday) }
    case 'this_week':
      return {
        from: startOfWeek(today, { weekStartsOn: 1 }),
        to: endOfWeek(today, { weekStartsOn: 1 }),
      }
    case 'last_week':
      const lastWeek = subWeeks(today, 1)
      return {
        from: startOfWeek(lastWeek, { weekStartsOn: 1 }),
        to: endOfWeek(lastWeek, { weekStartsOn: 1 }),
      }
    case 'this_month':
      return { from: startOfMonth(today), to: endOfMonth(today) }
    case 'last_month':
      const lastMonth = subMonths(today, 1)
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) }
    case 'this_year':
      return { from: startOfYear(today), to: endOfYear(today) }
    case 'last_30_days':
      return { from: startOfDay(subDays(today, 29)), to: endOfDay(today) }
    case 'last_90_days':
      return { from: startOfDay(subDays(today, 89)), to: endOfDay(today) }
    case 'last_year':
      const lastYear = subYears(today, 1)
      return { from: startOfYear(lastYear), to: endOfYear(lastYear) }
    default:
      return { from: startOfMonth(today), to: endOfMonth(today) }
  }
}

function getRangeForView(view: DateViewMode, anchor: Date): DateRange {
  switch (view) {
    case 'day':
      return { from: startOfDay(anchor), to: endOfDay(anchor) }
    case 'week':
      return {
        from: startOfWeek(anchor, { weekStartsOn: 1 }),
        to: endOfWeek(anchor, { weekStartsOn: 1 }),
      }
    case 'month':
      return { from: startOfMonth(anchor), to: endOfMonth(anchor) }
    case 'year':
      return { from: startOfYear(anchor), to: endOfYear(anchor) }
    case 'range':
      // For range mode, we return the anchor date as both from and to
      // The actual range is set via setRange()
      return { from: startOfDay(anchor), to: endOfDay(anchor) }
    default:
      return { from: startOfMonth(anchor), to: endOfMonth(anchor) }
  }
}

function getPreviousPeriod(from: Date, to: Date): DateRange {
  const duration = to.getTime() - from.getTime()
  const prevTo = new Date(from.getTime() - 1) // 1ms before current period
  const prevFrom = new Date(prevTo.getTime() - duration)
  return { from: startOfDay(prevFrom), to: endOfDay(prevTo) }
}

function formatPeriodLabel(view: DateViewMode, from: Date, to: Date): string {
  switch (view) {
    case 'day':
      return format(from, "d 'de' MMMM, yyyy", { locale: es })
    case 'week':
      const weekNum = getWeek(from, { weekStartsOn: 1 })
      return `Semana ${weekNum} (${format(from, 'd MMM', { locale: es })} - ${format(to, 'd MMM', { locale: es })})`
    case 'month':
      return format(from, 'MMMM yyyy', { locale: es })
    case 'year':
      return format(from, 'yyyy')
    case 'range':
      if (formatDate(from) === formatDate(to)) {
        return format(from, "d 'de' MMMM, yyyy", { locale: es })
      }
      return `${format(from, 'd MMM', { locale: es })} - ${format(to, 'd MMM yyyy', { locale: es })}`
    default:
      return format(from, 'MMMM yyyy', { locale: es })
  }
}

function formatPeriodLabelShort(view: DateViewMode, from: Date, to: Date): string {
  switch (view) {
    case 'day':
      return format(from, 'd MMM', { locale: es })
    case 'week':
      const weekNum = getWeek(from, { weekStartsOn: 1 })
      return `Sem. ${weekNum}`
    case 'month':
      return format(from, 'MMM yyyy', { locale: es })
    case 'year':
      return format(from, 'yyyy')
    case 'range':
      return `${format(from, 'd/M', { locale: es })} - ${format(to, 'd/M', { locale: es })}`
    default:
      return format(from, 'MMM yyyy', { locale: es })
  }
}

function navigatePeriod(view: DateViewMode, anchor: Date, direction: 'prev' | 'next'): Date {
  const modifier = direction === 'prev' ? -1 : 1

  switch (view) {
    case 'day':
      return direction === 'prev' ? subDays(anchor, 1) : addDays(anchor, 1)
    case 'week':
      return direction === 'prev' ? subWeeks(anchor, 1) : addWeeks(anchor, 1)
    case 'month':
      return direction === 'prev' ? subMonths(anchor, 1) : addMonths(anchor, 1)
    case 'year':
      return direction === 'prev' ? subYears(anchor, 1) : addYears(anchor, 1)
    case 'range':
      // For range mode, move by the duration of the range
      return anchor
    default:
      return anchor
  }
}

// =============================================================================
// HOOK
// =============================================================================

export function useFinanceDateRange(): FinanceDateRangeReturn {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const today = useMemo(() => new Date(), [])

  // Parse URL params
  const state = useMemo<FinanceDateRangeState>(() => {
    const viewParam = searchParams.get('view') as DateViewMode | null
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')
    const compareParam = searchParams.get('compare')

    // Default view is month
    const view = viewParam && ['day', 'week', 'month', 'year', 'range'].includes(viewParam)
      ? viewParam
      : 'month'

    // Parse dates
    const parsedFrom = parseDate(fromParam)
    const parsedTo = parseDate(toParam)

    // Calculate anchor date (center of range or today)
    let anchor = today
    if (parsedFrom) {
      anchor = parsedFrom
    }

    // Calculate from/to based on view mode
    let from: Date
    let to: Date

    if (view === 'range' && parsedFrom && parsedTo) {
      // Range mode uses explicit dates
      from = parsedFrom
      to = parsedTo
    } else {
      // Other modes calculate from anchor
      const range = getRangeForView(view, anchor)
      from = range.from
      to = range.to
    }

    // Compare flag
    const compare = compareParam === '1'

    return { view, from, to, compare, anchor }
  }, [searchParams, today])

  // Update URL
  const updateUrl = useCallback(
    (newState: Partial<FinanceDateRangeState>) => {
      const params = new URLSearchParams(searchParams.toString())

      const view = newState.view ?? state.view
      const from = newState.from ?? state.from
      const to = newState.to ?? state.to
      const compare = newState.compare ?? state.compare

      params.set('view', view)
      params.set('from', formatDate(from))
      params.set('to', formatDate(to))

      if (compare) {
        params.set('compare', '1')
      } else {
        params.delete('compare')
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams, state]
  )

  // Actions
  const setView = useCallback(
    (view: DateViewMode) => {
      // When changing view, recalculate from/to based on current anchor
      const range = getRangeForView(view, state.anchor)
      updateUrl({ view, from: range.from, to: range.to, anchor: state.anchor })
    },
    [state.anchor, updateUrl]
  )

  const setRange = useCallback(
    (from: Date, to: Date) => {
      updateUrl({ view: 'range', from, to, anchor: from })
    },
    [updateUrl]
  )

  const goPrev = useCallback(() => {
    const newAnchor = navigatePeriod(state.view, state.anchor, 'prev')
    const range = getRangeForView(state.view, newAnchor)
    updateUrl({ from: range.from, to: range.to, anchor: newAnchor })
  }, [state.view, state.anchor, updateUrl])

  const goNext = useCallback(() => {
    const newAnchor = navigatePeriod(state.view, state.anchor, 'next')
    const range = getRangeForView(state.view, newAnchor)

    // Don't allow future periods
    if (isBefore(range.from, endOfDay(today)) || state.view === 'range') {
      updateUrl({ from: range.from, to: range.to, anchor: newAnchor })
    }
  }, [state.view, state.anchor, today, updateUrl])

  const goToday = useCallback(() => {
    const range = getRangeForView(state.view, today)
    updateUrl({ from: range.from, to: range.to, anchor: today })
  }, [state.view, today, updateUrl])

  const toggleCompare = useCallback(() => {
    updateUrl({ compare: !state.compare })
  }, [state.compare, updateUrl])

  const applyPreset = useCallback(
    (preset: DatePreset) => {
      const range = getPresetRange(preset, today)

      // Determine the appropriate view mode for the preset
      let view: DateViewMode = 'range'
      if (preset === 'today' || preset === 'yesterday') {
        view = 'day'
      } else if (preset === 'this_week' || preset === 'last_week') {
        view = 'week'
      } else if (preset === 'this_month' || preset === 'last_month') {
        view = 'month'
      } else if (preset === 'this_year' || preset === 'last_year') {
        view = 'year'
      }

      updateUrl({ view, from: range.from, to: range.to, anchor: range.from })
    },
    [today, updateUrl]
  )

  // Derived values
  const periodLabel = useMemo(
    () => formatPeriodLabel(state.view, state.from, state.to),
    [state.view, state.from, state.to]
  )

  const periodLabelShort = useMemo(
    () => formatPeriodLabelShort(state.view, state.from, state.to),
    [state.view, state.from, state.to]
  )

  const previousPeriod = useMemo<DateRange | null>(() => {
    if (!state.compare) return null
    return getPreviousPeriod(state.from, state.to)
  }, [state.compare, state.from, state.to])

  const canGoNext = useMemo(() => {
    if (state.view === 'range') return false
    const nextAnchor = navigatePeriod(state.view, state.anchor, 'next')
    const nextRange = getRangeForView(state.view, nextAnchor)
    return isBefore(nextRange.from, endOfDay(today))
  }, [state.view, state.anchor, today])

  return {
    // State
    view: state.view,
    from: state.from,
    to: state.to,
    compare: state.compare,
    anchor: state.anchor,
    // Derived
    periodLabel,
    periodLabelShort,
    previousPeriod,
    canGoNext,
    fromISO: state.from.toISOString(),
    toISO: state.to.toISOString(),
    // Actions
    setView,
    setRange,
    goPrev,
    goNext,
    goToday,
    toggleCompare,
    applyPreset,
  }
}
