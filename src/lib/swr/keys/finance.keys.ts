/**
 * Finance Module SWR Keys
 *
 * Centralized key management for the Finance module.
 * Ensures consistent cache keys across the application.
 *
 * Key Format: [prefix, sortedParams]
 * Example: ["finance-overview", {"compare":false,"endDate":"2024-12-31","startDate":"2024-01-01"}]
 */

import { serializeKey } from '../fetcher'

// =============================================================================
// KEY PREFIXES
// =============================================================================

export const FINANCE_KEY_PREFIX = {
  overview: 'finance-overview',
  payments: 'finance-payments',
  expenses: 'finance-expenses',
  income: 'finance-income',
  reports: 'finance-reports',
  categories: 'finance-categories',
  kpi: 'finance-kpi',
} as const

// =============================================================================
// PARAM TYPES
// =============================================================================

export interface FinanceOverviewParams {
  startDate: string
  endDate: string
  compare?: boolean
  compareStartDate?: string
  compareEndDate?: string
}

export interface FinanceListParams {
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
  search?: string
  status?: string
  category?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

export interface FinanceKpiParams {
  startDate?: string
  endDate?: string
}

// =============================================================================
// KEY GENERATORS
// =============================================================================

export const financeKeys = {
  /**
   * All finance-related keys (for bulk invalidation)
   */
  all: () => ['finance'] as const,

  /**
   * Finance overview key with date range and comparison params
   *
   * @example
   * ```ts
   * const key = financeKeys.overview({ startDate: '2024-01-01', endDate: '2024-01-31' })
   * ```
   */
  overview: (params: FinanceOverviewParams): string => {
    return serializeKey(FINANCE_KEY_PREFIX.overview, {
      startDate: params.startDate,
      endDate: params.endDate,
      compare: params.compare || false,
      compareStartDate: params.compareStartDate,
      compareEndDate: params.compareEndDate,
    })
  },

  /**
   * Payments list key with pagination and filters
   */
  payments: (params: FinanceListParams = {}): string => {
    return serializeKey(FINANCE_KEY_PREFIX.payments, {
      startDate: params.startDate,
      endDate: params.endDate,
      page: params.page || 1,
      pageSize: params.pageSize || 20,
      search: params.search,
      status: params.status,
      sortBy: params.sortBy,
      sortDir: params.sortDir,
    })
  },

  /**
   * Single payment key
   */
  payment: (id: string): string => {
    return serializeKey(`${FINANCE_KEY_PREFIX.payments}-detail`, { id })
  },

  /**
   * Expenses list key with pagination and filters
   */
  expenses: (params: FinanceListParams = {}): string => {
    return serializeKey(FINANCE_KEY_PREFIX.expenses, {
      startDate: params.startDate,
      endDate: params.endDate,
      page: params.page || 1,
      pageSize: params.pageSize || 20,
      search: params.search,
      category: params.category,
      sortBy: params.sortBy,
      sortDir: params.sortDir,
    })
  },

  /**
   * Single expense key
   */
  expense: (id: string): string => {
    return serializeKey(`${FINANCE_KEY_PREFIX.expenses}-detail`, { id })
  },

  /**
   * Income list key with pagination and filters
   */
  income: (params: FinanceListParams = {}): string => {
    return serializeKey(FINANCE_KEY_PREFIX.income, {
      startDate: params.startDate,
      endDate: params.endDate,
      page: params.page || 1,
      pageSize: params.pageSize || 20,
      search: params.search,
      category: params.category,
      sortBy: params.sortBy,
      sortDir: params.sortDir,
    })
  },

  /**
   * Single income key
   */
  incomeItem: (id: string): string => {
    return serializeKey(`${FINANCE_KEY_PREFIX.income}-detail`, { id })
  },

  /**
   * Finance reports key
   */
  reports: (params: { startDate: string; endDate: string; type?: string }): string => {
    return serializeKey(FINANCE_KEY_PREFIX.reports, params)
  },

  /**
   * Revenue KPI key (for dashboard)
   */
  revenueKpi: (params: FinanceKpiParams = {}): string => {
    return serializeKey(FINANCE_KEY_PREFIX.kpi, {
      type: 'revenue',
      startDate: params.startDate,
      endDate: params.endDate,
    })
  },

  /**
   * Categories key (immutable - rarely changes)
   */
  categories: (type: 'expense' | 'income'): string => {
    return serializeKey(FINANCE_KEY_PREFIX.categories, { type })
  },
}

// =============================================================================
// KEY MATCHERS (for selective invalidation)
// =============================================================================

export const financeKeyMatchers = {
  /**
   * Matches any finance key
   */
  isFinanceKey: (key: unknown): boolean => {
    if (typeof key !== 'string') return false
    try {
      const parsed = JSON.parse(key)
      if (!Array.isArray(parsed)) return false
      return typeof parsed[0] === 'string' && parsed[0].startsWith('finance-')
    } catch {
      return false
    }
  },

  /**
   * Matches overview keys (for invalidation after mutations)
   */
  isOverviewKey: (key: unknown): boolean => {
    if (typeof key !== 'string') return false
    try {
      const parsed = JSON.parse(key)
      return Array.isArray(parsed) && parsed[0] === FINANCE_KEY_PREFIX.overview
    } catch {
      return false
    }
  },

  /**
   * Matches payment keys
   */
  isPaymentKey: (key: unknown): boolean => {
    if (typeof key !== 'string') return false
    try {
      const parsed = JSON.parse(key)
      return Array.isArray(parsed) && parsed[0].startsWith(FINANCE_KEY_PREFIX.payments)
    } catch {
      return false
    }
  },

  /**
   * Matches expense keys
   */
  isExpenseKey: (key: unknown): boolean => {
    if (typeof key !== 'string') return false
    try {
      const parsed = JSON.parse(key)
      return Array.isArray(parsed) && parsed[0].startsWith(FINANCE_KEY_PREFIX.expenses)
    } catch {
      return false
    }
  },

  /**
   * Matches income keys
   */
  isIncomeKey: (key: unknown): boolean => {
    if (typeof key !== 'string') return false
    try {
      const parsed = JSON.parse(key)
      return Array.isArray(parsed) && parsed[0].startsWith(FINANCE_KEY_PREFIX.income)
    } catch {
      return false
    }
  },
}
