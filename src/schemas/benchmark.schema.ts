import { z } from 'zod'

// =============================================================================
// BENCHMARK UNIT OPTIONS
// =============================================================================

export const benchmarkUnits = [
  'kg',
  'lbs',
  'reps',
  'seconds',
  'minutes',
  'meters',
  'calories',
  'rounds',
] as const

export type BenchmarkUnitValue = (typeof benchmarkUnits)[number]

export const benchmarkUnitLabels: Record<BenchmarkUnitValue, string> = {
  kg: 'Kilogramos (kg)',
  lbs: 'Libras (lbs)',
  reps: 'Repeticiones',
  seconds: 'Segundos',
  minutes: 'Minutos',
  meters: 'Metros',
  calories: 'Calorías',
  rounds: 'Rondas',
}

export const benchmarkUnitShortLabels: Record<BenchmarkUnitValue, string> = {
  kg: 'kg',
  lbs: 'lbs',
  reps: 'reps',
  seconds: 'seg',
  minutes: 'min',
  meters: 'm',
  calories: 'cal',
  rounds: 'rondas',
}

// =============================================================================
// BENCHMARK FORM SCHEMA
// =============================================================================

export const benchmarkFormSchema = z.object({
  exercise_id: z.string().min(1, 'El ejercicio es obligatorio').uuid('Selecciona un ejercicio válido'),
  value: z
    .number()
    .positive('El valor debe ser mayor a 0'),
  unit: z.enum(benchmarkUnits),
  reps: z
    .number()
    .int('Las repeticiones deben ser un número entero')
    .positive('Las repeticiones deben ser mayor a 0')
    .optional()
    .nullable(),
  sets: z
    .number()
    .int('Las series deben ser un número entero')
    .positive('Las series deben ser mayor a 0')
    .optional()
    .nullable(),
  rpe: z
    .number()
    .min(1, 'El RPE debe estar entre 1 y 10')
    .max(10, 'El RPE debe estar entre 1 y 10')
    .optional()
    .nullable(),
  achieved_at: z.string().min(1, 'La fecha es obligatoria'),
  notes: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').optional().nullable(),
})

export type BenchmarkFormValues = z.infer<typeof benchmarkFormSchema>

// =============================================================================
// BENCHMARK FILTERS SCHEMA
// =============================================================================

export const benchmarkFiltersSchema = z.object({
  exerciseId: z.string().uuid().optional().nullable(),
  dateFrom: z.string().optional().nullable(),
  dateTo: z.string().optional().nullable(),
})

export type BenchmarkFiltersValues = z.infer<typeof benchmarkFiltersSchema>

// =============================================================================
// DEFAULT VALUES
// =============================================================================

export const defaultBenchmarkFormValues: Partial<BenchmarkFormValues> = {
  exercise_id: '',
  value: undefined,
  unit: 'kg',
  reps: null,
  sets: null,
  rpe: null,
  achieved_at: new Date().toISOString().split('T')[0],
  notes: '',
}

export const defaultBenchmarkFiltersValues: BenchmarkFiltersValues = {
  exerciseId: null,
  dateFrom: null,
  dateTo: null,
}
