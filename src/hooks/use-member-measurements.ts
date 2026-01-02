'use client'

import { useState, useEffect, useCallback, useTransition, useMemo } from 'react'
import {
  getMemberMeasurements,
  getLatestMeasurement,
  createMeasurement,
} from '@/actions/measurement.actions'
import type { MemberMeasurement, MeasurementFormData, MeasurementWithBMI } from '@/types/member.types'

// =============================================================================
// BMI CALCULATION UTILITY
// =============================================================================

/**
 * Calculate BMI from height (cm) and weight (kg)
 * Formula: BMI = weight / (height/100)²
 */
export function calculateBMI(heightCm: number | null | undefined, weightKg: number | null | undefined): number | null {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) {
    return null
  }
  const heightM = heightCm / 100
  const bmi = weightKg / (heightM * heightM)
  return Math.round(bmi * 10) / 10 // Round to 1 decimal
}

/**
 * Get BMI category for display
 */
export function getBMICategory(bmi: number | null): string {
  if (bmi === null) return '-'
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Normal'
  if (bmi < 30) return 'Overweight'
  return 'Obese'
}

/**
 * Add calculated BMI to a measurement
 */
function withBMI(measurement: MemberMeasurement | null): MeasurementWithBMI | null {
  if (!measurement) return null
  return {
    ...measurement,
    bmi: calculateBMI(measurement.body_height_cm, measurement.body_weight_kg),
  }
}

// =============================================================================
// MAIN HOOK: useMemberMeasurements
// =============================================================================

interface UseMemberMeasurementsReturn {
  // Data (with calculated BMI)
  measurements: MeasurementWithBMI[]
  latestMeasurement: MeasurementWithBMI | null

  // Loading states
  isLoading: boolean
  isRefreshing: boolean
  isSubmitting: boolean

  // Error state
  error: string | null

  // Actions
  addMeasurement: (data: MeasurementFormData) => Promise<{ success: boolean; error?: string }>
  refresh: () => Promise<void>
}

export function useMemberMeasurements(memberId: string): UseMemberMeasurementsReturn {
  const [measurements, setMeasurements] = useState<MemberMeasurement[]>([])
  const [latestMeasurement, setLatestMeasurement] = useState<MemberMeasurement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Fetch measurements on mount and when memberId changes
  const fetchMeasurements = useCallback(async () => {
    if (!memberId) {
      setIsLoading(false)
      return
    }

    try {
      setError(null)
      const { data, error: fetchError } = await getMemberMeasurements(memberId)

      if (fetchError) {
        setError(fetchError)
        return
      }

      const measurementsList = data ?? []
      setMeasurements(measurementsList)

      // Set latest measurement (first one since sorted by measured_at desc)
      setLatestMeasurement(measurementsList.length > 0 ? measurementsList[0] : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load measurements')
    } finally {
      setIsLoading(false)
    }
  }, [memberId])

  useEffect(() => {
    setIsLoading(true)
    fetchMeasurements()
  }, [fetchMeasurements])

  // Refresh measurements (for manual refresh)
  const refresh = useCallback(async () => {
    await fetchMeasurements()
  }, [fetchMeasurements])

  // Add a new measurement
  const addMeasurement = useCallback(
    async (data: MeasurementFormData): Promise<{ success: boolean; error?: string }> => {
      try {
        const result = await createMeasurement(memberId, data)

        if (!result.success) {
          return { success: false, error: result.message }
        }

        const newMeasurement = result.data as MemberMeasurement

        // Update local state optimistically
        startTransition(() => {
          setMeasurements((prev) => {
            // Add new measurement and sort by date descending
            const updated = [newMeasurement, ...prev]
            return updated.sort(
              (a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime()
            )
          })

          // Check if this is the latest measurement
          setLatestMeasurement((prev) => {
            if (!prev) return newMeasurement
            const prevDate = new Date(prev.measured_at).getTime()
            const newDate = new Date(newMeasurement.measured_at).getTime()
            return newDate >= prevDate ? newMeasurement : prev
          })
        })

        return { success: true }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create measurement'
        return { success: false, error: errorMessage }
      }
    },
    [memberId]
  )

  // Calculate BMI for all measurements
  const measurementsWithBMI = useMemo(
    () => measurements.map((m) => ({ ...m, bmi: calculateBMI(m.body_height_cm, m.body_weight_kg) })),
    [measurements]
  )

  const latestWithBMI = useMemo(() => withBMI(latestMeasurement), [latestMeasurement])

  return {
    measurements: measurementsWithBMI,
    latestMeasurement: latestWithBMI,
    isLoading,
    isRefreshing: isPending,
    isSubmitting: isPending,
    error,
    addMeasurement,
    refresh,
  }
}

// =============================================================================
// SIMPLER HOOK: Just for latest measurement (if only that's needed)
// =============================================================================

interface UseLatestMeasurementReturn {
  latestMeasurement: MeasurementWithBMI | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useLatestMeasurement(memberId: string): UseLatestMeasurementReturn {
  const [latestMeasurement, setLatestMeasurement] = useState<MemberMeasurement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLatest = useCallback(async () => {
    if (!memberId) {
      setIsLoading(false)
      return
    }

    try {
      setError(null)
      const { data, error: fetchError } = await getLatestMeasurement(memberId)

      if (fetchError) {
        setError(fetchError)
        return
      }

      setLatestMeasurement(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load measurement')
    } finally {
      setIsLoading(false)
    }
  }, [memberId])

  useEffect(() => {
    setIsLoading(true)
    fetchLatest()
  }, [fetchLatest])

  const refresh = useCallback(async () => {
    await fetchLatest()
  }, [fetchLatest])

  const latestWithBMI = useMemo(() => withBMI(latestMeasurement), [latestMeasurement])

  return {
    latestMeasurement: latestWithBMI,
    isLoading,
    error,
    refresh,
  }
}
