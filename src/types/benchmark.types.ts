import type { Tables } from './database.types'

// =============================================================================
// BENCHMARK UNIT ENUM
// =============================================================================

export type BenchmarkUnit =
  | 'kg'       // Weight in kilograms
  | 'lbs'      // Weight in pounds
  | 'reps'     // Repetitions
  | 'seconds'  // Time in seconds
  | 'minutes'  // Time in minutes
  | 'meters'   // Distance in meters
  | 'calories' // Calories burned
  | 'rounds'   // Rounds completed (e.g., AMRAP)

// Helper: Units where lower is better (time-based)
export const TIME_BASED_UNITS: BenchmarkUnit[] = ['seconds', 'minutes']

// Helper: Units where higher is better
export const VALUE_BASED_UNITS: BenchmarkUnit[] = ['kg', 'lbs', 'reps', 'meters', 'calories', 'rounds']

// =============================================================================
// EXERCISE BENCHMARK
// =============================================================================

export interface ExerciseBenchmark {
  id: string
  member_id: string
  organization_id: string
  exercise_id: string

  // Performance data
  value: number
  unit: BenchmarkUnit

  // Optional context
  reps?: number | null
  sets?: number | null
  rpe?: number | null  // Rate of Perceived Exertion (1-10)

  // When achieved
  achieved_at: string

  // Additional info
  notes?: string | null
  is_pr: boolean

  // Who recorded
  recorded_by_id?: string | null

  // Timestamps
  created_at: string
  updated_at: string

  // Relations (populated via joins)
  exercise?: Tables<'exercises'>
}

export type ExerciseBenchmarkInsert = Omit<ExerciseBenchmark, 'id' | 'created_at' | 'updated_at' | 'is_pr' | 'exercise'>

// =============================================================================
// CURRENT PR (Aggregated view)
// =============================================================================

/**
 * Represents the current personal record for an exercise.
 * This is typically the MAX value for weight-based and the MIN value for time-based.
 */
export interface CurrentPR {
  exercise_id: string
  exercise_name: string
  exercise_category?: string | null
  value: number
  unit: BenchmarkUnit
  reps?: number | null
  achieved_at: string
  benchmark_id: string
}

// =============================================================================
// BENCHMARK FILTERS
// =============================================================================

export interface BenchmarkFilters {
  exerciseId?: string
  dateFrom?: string
  dateTo?: string
}

// =============================================================================
// PAGINATED RESPONSE
// =============================================================================

export interface PaginatedBenchmarks {
  data: ExerciseBenchmark[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// =============================================================================
// FORM DATA
// =============================================================================

export interface BenchmarkFormData {
  exercise_id: string
  value: number
  unit: BenchmarkUnit
  reps?: number
  sets?: number
  rpe?: number
  achieved_at: string
  notes?: string
}

// =============================================================================
// CHART DATA
// =============================================================================

export interface BenchmarkChartPoint {
  date: string
  value: number
  is_pr: boolean
}

export interface BenchmarkChartData {
  exercise_name: string
  unit: BenchmarkUnit
  data: BenchmarkChartPoint[]
}

// =============================================================================
// UNIT LABELS & HELPERS
// =============================================================================

export const BENCHMARK_UNIT_LABELS: Record<BenchmarkUnit, string> = {
  kg: 'kg',
  lbs: 'lbs',
  reps: 'reps',
  seconds: 'sec',
  minutes: 'min',
  meters: 'm',
  calories: 'cal',
  rounds: 'rounds',
}

export const BENCHMARK_UNIT_OPTIONS: { label: string; value: BenchmarkUnit }[] = [
  { label: 'Kilogramos (kg)', value: 'kg' },
  { label: 'Libras (lbs)', value: 'lbs' },
  { label: 'Repeticiones', value: 'reps' },
  { label: 'Segundos', value: 'seconds' },
  { label: 'Minutos', value: 'minutes' },
  { label: 'Metros', value: 'meters' },
  { label: 'Calorías', value: 'calories' },
  { label: 'Rondas', value: 'rounds' },
]

/**
 * Format a benchmark value with its unit for display.
 */
export function formatBenchmarkValue(value: number, unit: BenchmarkUnit): string {
  const label = BENCHMARK_UNIT_LABELS[unit]

  // Format time-based values nicely
  if (unit === 'seconds' && value >= 60) {
    const minutes = Math.floor(value / 60)
    const seconds = Math.round(value % 60)
    return seconds > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')} min` : `${minutes} min`
  }

  if (unit === 'minutes' && value >= 60) {
    const hours = Math.floor(value / 60)
    const minutes = Math.round(value % 60)
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`
  }

  return `${value} ${label}`
}

/**
 * Check if a unit is time-based (lower is better).
 */
export function isTimeBased(unit: BenchmarkUnit): boolean {
  return TIME_BASED_UNITS.includes(unit)
}
