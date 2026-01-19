'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import {
  getMemberBenchmarkEntries,
  getMemberCurrentPRs,
  getMemberBenchmarkHistory,
  createBenchmark,
  getExercisesForBenchmark,
} from '@/actions/benchmark.actions'
import type {
  ExerciseBenchmark,
  CurrentPR,
  BenchmarkFormData,
  BenchmarkChartPoint,
} from '@/types/benchmark.types'

// =============================================================================
// MAIN HOOK: useMemberBenchmarks
// =============================================================================

interface UseMemberBenchmarksReturn {
  // Data
  benchmarks: ExerciseBenchmark[]
  currentPRs: CurrentPR[]
  totalBenchmarks: number

  // Pagination
  page: number
  pageSize: number

  // Loading states
  isLoading: boolean
  isRefreshing: boolean
  isSubmitting: boolean

  // Error state
  error: string | null

  // Filters
  selectedExerciseId: string | null
  dateFrom: string | null
  dateTo: string | null

  // Actions
  addBenchmark: (data: BenchmarkFormData) => Promise<{ success: boolean; error?: string }>
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  setExerciseFilter: (exerciseId: string | null) => void
  setDateRange: (from: string | null, to: string | null) => void
  refresh: () => Promise<void>
}

export function useMemberBenchmarks(memberId: string): UseMemberBenchmarksReturn {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Parse URL params
  const page = parseInt(searchParams.get('pr_page') || '1')
  const pageSize = parseInt(searchParams.get('pr_pageSize') || '10')
  const selectedExerciseId = searchParams.get('pr_exercise') || null
  const dateFrom = searchParams.get('pr_from') || null
  const dateTo = searchParams.get('pr_to') || null

  const [benchmarks, setBenchmarks] = useState<ExerciseBenchmark[]>([])
  const [currentPRs, setCurrentPRs] = useState<CurrentPR[]>([])
  const [totalBenchmarks, setTotalBenchmarks] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Update URL params
  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })

      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  // Fetch benchmark entries
  const fetchBenchmarks = useCallback(async () => {
    if (!memberId) {
      setIsLoading(false)
      return
    }

    try {
      setError(null)
      const { data, total, error: fetchError } = await getMemberBenchmarkEntries(memberId, {
        exerciseId: selectedExerciseId || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        pageSize,
      })

      if (fetchError) {
        setError(fetchError)
        return
      }

      setBenchmarks(data ?? [])
      setTotalBenchmarks(total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los PRs')
    } finally {
      setIsLoading(false)
    }
  }, [memberId, page, pageSize, selectedExerciseId, dateFrom, dateTo])

  // Fetch current PRs
  const fetchCurrentPRs = useCallback(async () => {
    if (!memberId) return

    try {
      const { data, error: fetchError } = await getMemberCurrentPRs(memberId)
      if (!fetchError && data) {
        setCurrentPRs(data)
      }
    } catch {
      // Silent fail for current PRs
    }
  }, [memberId])

  // Initial fetch
  useEffect(() => {
    setIsLoading(true)
    Promise.all([fetchBenchmarks(), fetchCurrentPRs()])
  }, [fetchBenchmarks, fetchCurrentPRs])

  // Refresh
  const refresh = useCallback(async () => {
    await Promise.all([fetchBenchmarks(), fetchCurrentPRs()])
  }, [fetchBenchmarks, fetchCurrentPRs])

  // Add benchmark
  const addBenchmark = useCallback(
    async (data: BenchmarkFormData): Promise<{ success: boolean; error?: string }> => {
      try {
        const result = await createBenchmark(memberId, data)

        if (!result.success) {
          return { success: false, error: result.message }
        }

        // Refresh data
        startTransition(() => {
          refresh()
        })

        return { success: true }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al guardar el PR'
        return { success: false, error: errorMessage }
      }
    },
    [memberId, refresh]
  )

  // Pagination actions
  const setPage = useCallback(
    (newPage: number) => {
      updateParams({ pr_page: newPage.toString() })
    },
    [updateParams]
  )

  const setPageSize = useCallback(
    (newSize: number) => {
      updateParams({ pr_pageSize: newSize.toString(), pr_page: '1' })
    },
    [updateParams]
  )

  // Filter actions
  const setExerciseFilter = useCallback(
    (exerciseId: string | null) => {
      updateParams({ pr_exercise: exerciseId, pr_page: '1' })
    },
    [updateParams]
  )

  const setDateRange = useCallback(
    (from: string | null, to: string | null) => {
      updateParams({ pr_from: from, pr_to: to, pr_page: '1' })
    },
    [updateParams]
  )

  return {
    benchmarks,
    currentPRs,
    totalBenchmarks,
    page,
    pageSize,
    isLoading,
    isRefreshing: isPending,
    isSubmitting: isPending,
    error,
    selectedExerciseId,
    dateFrom,
    dateTo,
    addBenchmark,
    setPage,
    setPageSize,
    setExerciseFilter,
    setDateRange,
    refresh,
  }
}

// =============================================================================
// HOOK: useBenchmarkChartData
// =============================================================================

interface UseBenchmarkChartDataReturn {
  chartData: BenchmarkChartPoint[]
  isLoading: boolean
  error: string | null
}

export function useBenchmarkChartData(
  memberId: string,
  exerciseId: string | null,
  dateFrom?: string | null,
  dateTo?: string | null
): UseBenchmarkChartDataReturn {
  const [chartData, setChartData] = useState<BenchmarkChartPoint[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!memberId || !exerciseId) {
      setChartData([])
      return
    }

    const fetchChartData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await getMemberBenchmarkHistory(
          memberId,
          exerciseId,
          {
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
          }
        )

        if (fetchError) {
          setError(fetchError)
          return
        }

        setChartData(data ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos del gráfico')
      } finally {
        setIsLoading(false)
      }
    }

    fetchChartData()
  }, [memberId, exerciseId, dateFrom, dateTo])

  return { chartData, isLoading, error }
}

// =============================================================================
// HOOK: useExerciseOptions
// =============================================================================

interface UseExerciseOptionsReturn {
  exercises: { id: string; name: string; category: string | null }[]
  isLoading: boolean
  error: string | null
}

export function useExerciseOptions(): UseExerciseOptionsReturn {
  const [exercises, setExercises] = useState<{ id: string; name: string; category: string | null }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const { data, error: fetchError } = await getExercisesForBenchmark()

        if (fetchError) {
          setError(fetchError)
          return
        }

        setExercises(data ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar ejercicios')
      } finally {
        setIsLoading(false)
      }
    }

    fetchExercises()
  }, [])

  return { exercises, isLoading, error }
}
