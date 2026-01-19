/**
 * OpenAI Exercise Ranker
 * Uses GPT-3.5-turbo to rank exercise alternatives
 */

import OpenAI from 'openai'
import type { Exercise, OpenAIRanking } from '@/types/ai.types'

// =============================================================================
// OpenAI Client
// =============================================================================

let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured')
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiClient
}

// =============================================================================
// Prompt Template
// =============================================================================

const RANKING_PROMPT = `Eres un fisiologo del ejercicio experto. Dado un ejercicio fuente y una lista de alternativas candidatas, clasifícalas por similitud y efectividad como sustitutos.

Ejercicio Fuente:
- Nombre: {source_name}
- Categoria: {source_category}
- Grupos Musculares: {source_muscles}
- Equipo: {source_equipment}
- Patron de Movimiento: {source_movement_pattern}
- Dificultad: {source_difficulty}

Equipo Disponible en el Gimnasio: {available_equipment}

Alternativas Candidatas:
{candidates_list}

Para cada candidato, proporciona:
1. Un puntaje de similitud (0-100) considerando activacion muscular, patron de movimiento y sustituibilidad practica
2. Una breve razon (maximo 15 palabras en español) explicando por que es una buena alternativa

Responde SOLO con JSON valido en este formato exacto:
{
  "rankings": [
    {"id": "uuid", "score": 85, "reason": "Mismo patron de empuje, trabaja musculos identicos"},
    ...
  ]
}

Reglas:
- Prioriza ejercicios que usen el equipo disponible
- Considera ejercicios de peso corporal como muy versatiles
- Mayor puntaje = mejor sustituto
- Enfócate en similitud funcional, no solo superposicion muscular`

// =============================================================================
// Ranking Function
// =============================================================================

/**
 * Ranks candidate exercises using OpenAI GPT-3.5-turbo
 * Returns rankings sorted by score (highest first)
 */
export async function rankWithOpenAI(
  sourceExercise: Exercise,
  candidates: Exercise[],
  availableEquipment: string[]
): Promise<OpenAIRanking[]> {
  const openai = getOpenAIClient()

  // Format candidates list
  const candidatesList = candidates
    .map(
      (c, i) =>
        `${i + 1}. [${c.id}] ${c.name}
       Musculos: ${c.muscle_groups?.join(', ') || 'N/A'}
       Equipo: ${c.equipment?.join(', ') || 'Ninguno'}
       Patron: ${c.movement_pattern || 'N/A'}
       Dificultad: ${c.difficulty || 'N/A'}`
    )
    .join('\n\n')

  const prompt = RANKING_PROMPT.replace('{source_name}', sourceExercise.name)
    .replace('{source_category}', sourceExercise.category || 'N/A')
    .replace(
      '{source_muscles}',
      sourceExercise.muscle_groups?.join(', ') || 'N/A'
    )
    .replace('{source_equipment}', sourceExercise.equipment?.join(', ') || 'Ninguno')
    .replace('{source_movement_pattern}', sourceExercise.movement_pattern || 'N/A')
    .replace('{source_difficulty}', sourceExercise.difficulty || 'N/A')
    .replace('{available_equipment}', availableEquipment.join(', '))
    .replace('{candidates_list}', candidatesList)

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content:
          'Eres un fisiologo del ejercicio experto. Responde solo con JSON valido.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.1,
    max_tokens: 1500,
  })

  const content = response.choices[0]?.message?.content?.trim() || ''

  // Parse JSON response
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error(`No JSON found in OpenAI response: ${content.substring(0, 100)}`)
  }

  const parsed = JSON.parse(jsonMatch[0])

  if (!Array.isArray(parsed.rankings)) {
    throw new Error('Invalid rankings format from OpenAI')
  }

  // Validate and filter rankings
  const validRankings: OpenAIRanking[] = parsed.rankings
    .filter(
      (r: unknown): r is OpenAIRanking =>
        typeof r === 'object' &&
        r !== null &&
        'id' in r &&
        'score' in r &&
        'reason' in r &&
        typeof (r as OpenAIRanking).id === 'string' &&
        typeof (r as OpenAIRanking).score === 'number' &&
        typeof (r as OpenAIRanking).reason === 'string'
    )
    .map((r: OpenAIRanking) => ({
      id: r.id,
      score: Math.min(100, Math.max(0, r.score)), // Clamp to 0-100
      reason: r.reason.substring(0, 100), // Truncate long reasons
    }))

  return validRankings.sort((a, b) => b.score - a.score)
}
