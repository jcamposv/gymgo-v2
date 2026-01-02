import { z } from 'zod'

// =============================================================================
// Exercise Schemas
// =============================================================================

export const exerciseSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(2, 'Minimo 2 caracteres')
    .max(100, 'Maximo 100 caracteres'),
  name_es: z
    .string()
    .max(100, 'Maximo 100 caracteres')
    .optional()
    .nullable(),
  name_en: z
    .string()
    .max(100, 'Maximo 100 caracteres')
    .optional()
    .nullable(),
  description: z
    .string()
    .max(1000, 'Maximo 1000 caracteres')
    .optional()
    .nullable(),
  category: z
    .string()
    .max(50, 'Maximo 50 caracteres')
    .optional()
    .nullable(),
  muscle_groups: z
    .array(z.string())
    .optional()
    .nullable(),
  equipment: z
    .array(z.string())
    .optional()
    .nullable(),
  difficulty: z
    .enum(['beginner', 'intermediate', 'advanced']),
  video_url: z
    .string()
    .url('URL invalida')
    .max(500, 'Maximo 500 caracteres')
    .optional()
    .nullable()
    .or(z.literal('')),
  gif_url: z
    .string()
    .url('URL invalida')
    .max(500, 'Maximo 500 caracteres')
    .optional()
    .nullable()
    .or(z.literal('')),
  thumbnail_url: z
    .string()
    .url('URL invalida')
    .max(500, 'Maximo 500 caracteres')
    .optional()
    .nullable()
    .or(z.literal('')),
  instructions: z
    .array(z.string())
    .optional()
    .nullable(),
  tips: z
    .array(z.string())
    .optional()
    .nullable(),
  common_mistakes: z
    .array(z.string())
    .optional()
    .nullable(),
  is_global: z
    .boolean(),
  is_active: z
    .boolean(),
})

export const exerciseUpdateSchema = exerciseSchema.partial()

export const exerciseSearchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  muscle_group: z.string().optional(),
  equipment: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
  include_global: z.coerce.boolean().default(true),
  page: z.coerce.number().min(1).default(1),
  per_page: z.coerce.number().min(1).max(100).default(20),
})

export type ExerciseFormData = z.infer<typeof exerciseSchema>
export type ExerciseUpdateData = z.infer<typeof exerciseUpdateSchema>
export type ExerciseSearchParams = z.infer<typeof exerciseSearchSchema>

// Category labels
export const categoryLabels: Record<string, string> = {
  strength: 'Fuerza',
  cardio: 'Cardio',
  flexibility: 'Flexibilidad',
  olympic: 'Olimpico',
  gymnastics: 'Gimnasia',
  plyometric: 'Pliometrico',
  core: 'Core',
  compound: 'Compuesto',
  isolation: 'Aislamiento',
  functional: 'Funcional',
}

// Difficulty labels
export const difficultyLabels: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
}

// Muscle group labels
export const muscleGroupLabels: Record<string, string> = {
  chest: 'Pecho',
  back: 'Espalda',
  shoulders: 'Hombros',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Antebrazos',
  abs: 'Abdominales',
  obliques: 'Oblicuos',
  lower_back: 'Espalda Baja',
  glutes: 'Gluteos',
  quadriceps: 'Cuadriceps',
  hamstrings: 'Isquiotibiales',
  calves: 'Pantorrillas',
  hip_flexors: 'Flexores de Cadera',
  full_body: 'Cuerpo Completo',
}

// Equipment labels
export const equipmentLabels: Record<string, string> = {
  barbell: 'Barra',
  dumbbell: 'Mancuernas',
  kettlebell: 'Kettlebell',
  cable: 'Polea',
  machine: 'Maquina',
  bodyweight: 'Peso Corporal',
  resistance_band: 'Banda Elastica',
  medicine_ball: 'Balon Medicinal',
  foam_roller: 'Foam Roller',
  pull_up_bar: 'Barra de Dominadas',
  bench: 'Banco',
  box: 'Caja',
  rings: 'Anillas',
  rope: 'Cuerda',
  trx: 'TRX',
  rower: 'Remo',
  bike: 'Bicicleta',
  treadmill: 'Caminadora',
  none: 'Sin Equipo',
}

// Arrays for select inputs
export const categories = Object.entries(categoryLabels).map(([value, label]) => ({
  value,
  label,
}))

export const difficulties = Object.entries(difficultyLabels).map(([value, label]) => ({
  value,
  label,
}))

export const muscleGroups = Object.entries(muscleGroupLabels).map(([value, label]) => ({
  value,
  label,
}))

export const equipmentOptions = Object.entries(equipmentLabels).map(([value, label]) => ({
  value,
  label,
}))
