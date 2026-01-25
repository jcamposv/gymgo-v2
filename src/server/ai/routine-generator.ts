/**
 * AI Routine Generator
 *
 * Generates workout routines using AI based on member goals,
 * experience level, and available equipment.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  type AIServiceContext,
  jsonCompletion,
} from './ai.service'

// =============================================================================
// Types
// =============================================================================

export type FitnessGoal = 'muscle_gain' | 'fat_loss' | 'strength' | 'general' | 'endurance' | 'flexibility'
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

export interface RoutineGenerationRequest {
  memberId?: string
  memberName?: string
  goal: FitnessGoal
  daysPerWeek: number
  sessionMinutes: number
  equipment: string[]
  restrictions?: string[]
  experienceLevel: ExperienceLevel
  preferences?: string
}

export interface GeneratedExercise {
  exercise_id: string
  exercise_name: string
  sets: number
  reps: string
  rest_seconds: number
  notes?: string
  order: number
}

export interface GeneratedDay {
  day_number: number
  day_name: string
  focus: string
  exercises: GeneratedExercise[]
}

export interface GeneratedRoutine {
  name: string
  description: string
  workout_type: 'routine' | 'program'
  week_plan: GeneratedDay[]
  notes?: string
}

interface ExerciseCandidate {
  id: string
  name: string
  name_es: string | null
  category: string | null
  muscle_groups: string[] | null
  equipment: string[] | null
  difficulty: string | null
  movement_pattern: string | null
}

// =============================================================================
// Goal Configuration
// =============================================================================

const GOAL_CONFIG: Record<FitnessGoal, {
  label: string
  muscleGroups: string[]
  setsRange: [number, number]
  repsRange: string
  restRange: [number, number]
  emphasis: string
}> = {
  muscle_gain: {
    label: 'Ganancia muscular',
    muscleGroups: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'quadriceps', 'hamstrings', 'glutes'],
    setsRange: [3, 4],
    repsRange: '8-12',
    restRange: [60, 90],
    emphasis: 'hipertrofia con volumen moderado-alto y descansos controlados',
  },
  fat_loss: {
    label: 'Perdida de grasa',
    muscleGroups: ['full_body', 'cardio', 'core'],
    setsRange: [3, 4],
    repsRange: '12-15',
    restRange: [30, 45],
    emphasis: 'circuitos, supersets y descansos cortos para mantener frecuencia cardiaca elevada',
  },
  strength: {
    label: 'Fuerza maxima',
    muscleGroups: ['chest', 'back', 'legs', 'shoulders'],
    setsRange: [4, 5],
    repsRange: '3-6',
    restRange: [120, 180],
    emphasis: 'ejercicios compuestos pesados con descansos largos',
  },
  general: {
    label: 'Acondicionamiento general',
    muscleGroups: ['full_body'],
    setsRange: [3, 3],
    repsRange: '10-12',
    restRange: [60, 60],
    emphasis: 'equilibrio entre fuerza y resistencia',
  },
  endurance: {
    label: 'Resistencia',
    muscleGroups: ['full_body', 'cardio'],
    setsRange: [2, 3],
    repsRange: '15-20',
    restRange: [30, 45],
    emphasis: 'alta repeticiones y circuitos',
  },
  flexibility: {
    label: 'Flexibilidad y movilidad',
    muscleGroups: ['full_body', 'core'],
    setsRange: [2, 3],
    repsRange: '30s hold',
    restRange: [30, 30],
    emphasis: 'estiramientos dinamicos y estaticos, trabajo de movilidad articular',
  },
}

const EXPERIENCE_CONFIG: Record<ExperienceLevel, {
  label: string
  exercisesPerDay: number
  complexity: string
}> = {
  beginner: {
    label: 'Principiante',
    exercisesPerDay: 5,
    complexity: 'ejercicios basicos y maquinas guiadas',
  },
  intermediate: {
    label: 'Intermedio',
    exercisesPerDay: 6,
    complexity: 'ejercicios compuestos y algunos aislados',
  },
  advanced: {
    label: 'Avanzado',
    exercisesPerDay: 7,
    complexity: 'ejercicios complejos, tecnicas avanzadas como drop sets y supersets',
  },
}

// =============================================================================
// Prompt Builder
// =============================================================================

function buildRoutinePrompt(
  request: RoutineGenerationRequest,
  exercises: ExerciseCandidate[]
): string {
  const goalConfig = GOAL_CONFIG[request.goal]
  const expConfig = EXPERIENCE_CONFIG[request.experienceLevel]

  // Format exercise list
  const exerciseList = exercises
    .slice(0, 50) // Limit for prompt size
    .map(
      (e) =>
        `- [${e.id}] ${e.name_es || e.name} (${e.category || 'N/A'}, ${e.difficulty || 'N/A'}, equipo: ${e.equipment?.join(', ') || 'ninguno'})`
    )
    .join('\n')

  return `Genera una rutina de entrenamiento personalizada con los siguientes parametros:

PERFIL DEL USUARIO:
- Nombre: ${request.memberName || 'Miembro'}
- Nivel: ${expConfig.label}
- Objetivo: ${goalConfig.label}

CONFIGURACION:
- Dias por semana: ${request.daysPerWeek}
- Duracion por sesion: ${request.sessionMinutes} minutos
- Equipo disponible: ${request.equipment.join(', ') || 'peso corporal'}
- Restricciones/Lesiones: ${request.restrictions?.join(', ') || 'ninguna'}
${request.preferences ? `- Preferencias adicionales: ${request.preferences}` : ''}

DIRECTRICES DE ENTRENAMIENTO:
- Enfasis: ${goalConfig.emphasis}
- Series por ejercicio: ${goalConfig.setsRange[0]}-${goalConfig.setsRange[1]}
- Rango de repeticiones: ${goalConfig.repsRange}
- Descanso entre series: ${goalConfig.restRange[0]}-${goalConfig.restRange[1]} segundos
- Ejercicios por dia: ${expConfig.exercisesPerDay}
- Complejidad: ${expConfig.complexity}

EJERCICIOS DISPONIBLES (DEBES usar SOLO los IDs de esta lista):
${exerciseList}

INSTRUCCIONES IMPORTANTES:
1. SOLO usa ejercicios de la lista anterior (usa el ID exacto entre corchetes)
2. Respeta las restricciones del usuario
3. Distribuye los grupos musculares de manera balanceada en la semana
4. Incluye calentamiento y vuelta a la calma si el tiempo lo permite
5. Adapta al nivel de experiencia del usuario

Responde con JSON en este formato exacto:
{
  "name": "Nombre descriptivo de la rutina",
  "description": "Descripcion breve de 1-2 oraciones",
  "workout_type": "routine",
  "week_plan": [
    {
      "day_number": 1,
      "day_name": "Dia 1 - Tren Superior",
      "focus": "Pecho y Triceps",
      "exercises": [
        {
          "exercise_id": "uuid-del-ejercicio",
          "exercise_name": "Nombre del ejercicio",
          "sets": 3,
          "reps": "10-12",
          "rest_seconds": 60,
          "notes": "Nota opcional",
          "order": 1
        }
      ]
    }
  ],
  "notes": "Notas adicionales sobre la rutina (opcional)"
}`
}

// =============================================================================
// Exercise Fetching
// =============================================================================

async function fetchCandidateExercises(
  supabase: SupabaseClient,
  organizationId: string,
  equipment: string[],
  experienceLevel: ExperienceLevel
): Promise<ExerciseCandidate[]> {
  // Map experience level to difficulty - include null for exercises without difficulty set
  const difficultyMap: Record<ExperienceLevel, string[]> = {
    beginner: ['beginner'],
    intermediate: ['beginner', 'intermediate'],
    advanced: ['beginner', 'intermediate', 'advanced'],
  }
  const allowedDifficulties = difficultyMap[experienceLevel]

  // Build query - get global exercises (is_global=true) OR org-specific exercises
  // Use is_global column for global exercises, which is more reliable than checking organization_id
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, name_es, category, muscle_groups, equipment, difficulty, movement_pattern')
    .eq('is_active', true)
    .or(`is_global.eq.true,organization_id.eq.${organizationId}`)
    .limit(200)

  if (error) {
    console.error('Error fetching exercises:', error)
    return []
  }

  const exercises = (data || []) as ExerciseCandidate[]

  console.log(`[AI] Found ${exercises.length} exercises from database`)

  // Filter by difficulty (client-side to include exercises without difficulty set)
  const filteredByDifficulty = exercises.filter((exercise) => {
    // Include exercises without difficulty set (null)
    if (!exercise.difficulty) return true
    return allowedDifficulties.includes(exercise.difficulty)
  })

  console.log(`[AI] After difficulty filter: ${filteredByDifficulty.length} exercises`)

  // Filter by available equipment
  const normalizedEquipment = equipment.map((e) => e.toLowerCase())

  const finalExercises = filteredByDifficulty.filter((exercise) => {
    const requiredEquipment = exercise.equipment || []

    // No equipment required = always valid
    if (requiredEquipment.length === 0) return true

    // Bodyweight = always valid
    if (requiredEquipment.includes('bodyweight')) return true

    // At least one equipment available
    return requiredEquipment.some((eq) =>
      normalizedEquipment.includes(eq.toLowerCase())
    )
  })

  console.log(`[AI] After equipment filter: ${finalExercises.length} exercises for equipment: ${equipment.join(', ')}`)

  return finalExercises
}

// =============================================================================
// Main Generation Function
// =============================================================================

/**
 * Generate a workout routine using AI
 */
export async function generateRoutine(
  supabase: SupabaseClient,
  context: AIServiceContext,
  request: RoutineGenerationRequest
): Promise<{
  routine: GeneratedRoutine
  tokensUsed: number
  model: string
}> {
  // Fetch candidate exercises from the database
  const exercises = await fetchCandidateExercises(
    supabase,
    context.organizationId,
    request.equipment,
    request.experienceLevel
  )

  if (exercises.length === 0) {
    throw new Error('No hay ejercicios disponibles que coincidan con el equipo y nivel especificados')
  }

  // Build prompt
  const prompt = buildRoutinePrompt(request, exercises)

  // Call AI
  const { data, tokensUsed, model } = await jsonCompletion<GeneratedRoutine>(
    context,
    prompt,
    {
      systemPrompt: `Eres un entrenador personal certificado con experiencia en programacion de rutinas de entrenamiento.
Tu objetivo es crear rutinas seguras, efectivas y personalizadas.
IMPORTANTE: Solo puedes usar ejercicios de la lista proporcionada. Usa los IDs exactos.`,
      temperature: 0.3,
      maxTokens: 3000,
    }
  )

  // Validate exercise IDs exist in our database
  const exerciseIds = new Set(exercises.map((e) => e.id))

  console.log(`[AI] Generated routine with ${data.week_plan.length} days`)

  let totalGenerated = 0
  let totalValid = 0

  const validatedWeekPlan = data.week_plan.map((day) => {
    const originalCount = day.exercises.length
    const validExercises = day.exercises.filter((ex) => {
      const isValid = exerciseIds.has(ex.exercise_id)
      if (!isValid) {
        console.warn(`[AI] Invalid exercise ID: ${ex.exercise_id} (name: ${ex.exercise_name})`)
      }
      return isValid
    })

    totalGenerated += originalCount
    totalValid += validExercises.length

    console.log(`[AI] Day ${day.day_number}: ${validExercises.length}/${originalCount} valid exercises`)

    return {
      ...day,
      exercises: validExercises,
    }
  })

  console.log(`[AI] Total exercises: ${totalValid}/${totalGenerated} valid`)

  // Warn if too many exercises were invalid
  if (totalValid === 0 && totalGenerated > 0) {
    console.error('[AI] All generated exercise IDs were invalid! Check if exercises exist in database.')
  }

  return {
    routine: {
      ...data,
      week_plan: validatedWeekPlan,
    },
    tokensUsed,
    model,
  }
}

// =============================================================================
// Export Helper
// =============================================================================

export { GOAL_CONFIG, EXPERIENCE_CONFIG }
