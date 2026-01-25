/**
 * Training Program Types
 *
 * Types for the training program system with multi-day workouts,
 * weekly structure, and completion tracking.
 */

import type { Tables } from './database.types'

// =============================================================================
// Program Duration Options
// =============================================================================

export type ProgramDuration = 4 | 6 | 8 | 12
export type DaysPerWeek = 2 | 3 | 4 | 5 | 6

// =============================================================================
// Progress Types
// =============================================================================

/**
 * Weekly progress within a program
 */
export interface WeeklyProgress {
  /** Current week number (1-based) */
  currentWeek: number
  /** Total weeks in the program */
  totalWeeks: number
  /** Days completed this week */
  daysCompletedThisWeek: number
  /** Target days per week */
  daysPerWeek: number
  /** Percentage complete this week (0-100) */
  weekPercentage: number
}

/**
 * Overall program progress
 */
export interface ProgramProgress {
  /** Total workout days completed in the program */
  totalDaysCompleted: number
  /** Total workout days in the full program */
  totalDaysInProgram: number
  /** Current week number (1-based) */
  currentWeek: number
  /** Total weeks in the program */
  totalWeeks: number
  /** Overall percentage complete (0-100) */
  percentageComplete: number
  /** Days remaining in program */
  daysRemaining: number
  /** Whether the program is completed */
  isCompleted: boolean
}

// =============================================================================
// Workout/Day Types
// =============================================================================

/**
 * A program day (child workout)
 */
export interface ProgramDay {
  id: string
  dayNumber: number
  name: string
  description: string | null
  focus?: string
  exerciseCount: number
}

/**
 * Today's workout info for member dashboard
 */
export interface TodaysWorkout {
  /** The workout to do today */
  workout: Tables<'workouts'> | null
  /** Exercise details for the workout */
  exerciseDetails?: Tables<'exercises'>[]
  /** Current program progress */
  progress: WeeklyProgress | null
  /** Program info */
  program: {
    id: string
    name: string
    totalWeeks: number
  } | null
  /** Next day number */
  nextDayNumber: number
  /** Has active program */
  hasActiveProgram: boolean
}

// =============================================================================
// Completion Types
// =============================================================================

/**
 * Workout completion record
 */
export interface WorkoutCompletion {
  id: string
  workoutId: string
  memberId: string
  completedAt: Date
  completedDate: string
  programWeek: number | null
  durationMinutes: number | null
  notes: string | null
}

/**
 * Input for completing a workout
 */
export interface CompleteWorkoutInput {
  durationMinutes?: number
  notes?: string
}

// =============================================================================
// Program Creation Types
// =============================================================================

/**
 * Program day input for creation/editing
 */
export interface ProgramDayInput {
  dayNumber: number
  name: string
  focus?: string
  exercises: {
    exercise_id: string
    exercise_name: string
    sets?: number
    reps?: string
    weight?: string
    rest_seconds?: number
    tempo?: string
    notes?: string
    order: number
  }[]
}

/**
 * Full program input for creation
 */
export interface ProgramInput {
  name: string
  description?: string
  durationWeeks: ProgramDuration
  daysPerWeek: DaysPerWeek
  days: ProgramDayInput[]
  assignedToMemberId?: string
  isTemplate?: boolean
}

// =============================================================================
// Display Helpers
// =============================================================================

export const DURATION_OPTIONS: { value: ProgramDuration; label: string }[] = [
  { value: 4, label: '4 semanas' },
  { value: 6, label: '6 semanas' },
  { value: 8, label: '8 semanas' },
  { value: 12, label: '12 semanas' },
]

export const DAYS_PER_WEEK_OPTIONS: { value: DaysPerWeek; label: string }[] = [
  { value: 2, label: '2 dias' },
  { value: 3, label: '3 dias' },
  { value: 4, label: '4 dias' },
  { value: 5, label: '5 dias' },
  { value: 6, label: '6 dias' },
]

/**
 * Get day name for display
 */
export function getDayDisplayName(dayNumber: number): string {
  const dayNames: Record<number, string> = {
    1: 'Dia 1',
    2: 'Dia 2',
    3: 'Dia 3',
    4: 'Dia 4',
    5: 'Dia 5',
    6: 'Dia 6',
  }
  return dayNames[dayNumber] || `Dia ${dayNumber}`
}

/**
 * Calculate which week a completion belongs to
 */
export function calculateProgramWeek(
  totalCompletions: number,
  daysPerWeek: number
): number {
  return Math.floor(totalCompletions / daysPerWeek) + 1
}

/**
 * Calculate next day number based on completions
 */
export function calculateNextDayNumber(
  totalCompletions: number,
  daysPerWeek: number
): number {
  return (totalCompletions % daysPerWeek) + 1
}
