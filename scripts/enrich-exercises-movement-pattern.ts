/**
 * Script: enrich-exercises-movement-pattern.ts
 * Purpose: Use OpenAI to classify movement patterns for all exercises
 *
 * Usage:
 *   npx tsx scripts/enrich-exercises-movement-pattern.ts [--dry-run] [--limit N]
 *
 * Options:
 *   --dry-run    Preview changes without updating database
 *   --limit N    Process only N exercises (for testing)
 *
 * Required env vars:
 *   OPENAI_API_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

// ============================================================================
// CONFIGURATION
// ============================================================================

const MOVEMENT_PATTERNS = [
  'horizontal_push',  // Bench press, push-ups, chest press
  'horizontal_pull',  // Rows, cable rows
  'vertical_push',    // Overhead press, shoulder press
  'vertical_pull',    // Pull-ups, lat pulldown
  'squat',            // Squats, leg press, goblet squat
  'hinge',            // Deadlift, hip thrust, good morning
  'lunge',            // Lunges, split squats, step-ups
  'carry',            // Farmer walks, suitcase carry
  'rotation',         // Russian twist, wood chops
  'isolation',        // Curls, tricep extensions, leg extensions
  'core',             // Planks, crunches, leg raises
] as const

type MovementPattern = typeof MOVEMENT_PATTERNS[number]

interface Exercise {
  id: string
  name: string
  name_es: string | null
  description: string | null
  category: string | null
  muscle_groups: string[] | null
  equipment: string[] | null
  difficulty: string | null
  movement_pattern: string | null
}

interface EnrichmentResult {
  exerciseId: string
  name: string
  suggestedPattern: MovementPattern
  confidence: number
  reasoning: string
}

// ============================================================================
// SETUP
// ============================================================================

// Parse args
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const limitIndex = args.indexOf('--limit')
const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : undefined

// Validate env
const requiredEnvVars = [
  'OPENAI_API_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`)
    process.exit(1)
  }
}

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// ============================================================================
// OPENAI CLASSIFICATION
// ============================================================================

async function classifyExercise(exercise: Exercise): Promise<EnrichmentResult> {
  const prompt = `Classify this exercise into ONE movement pattern.

Exercise:
- Name: ${exercise.name}${exercise.name_es ? ` (${exercise.name_es})` : ''}
- Category: ${exercise.category || 'unknown'}
- Muscles: ${exercise.muscle_groups?.join(', ') || 'unknown'}
- Equipment: ${exercise.equipment?.join(', ') || 'unknown'}
- Description: ${exercise.description || 'none'}

Movement Pattern Options:
- horizontal_push: Pushing away from body horizontally (bench press, push-ups, chest press machines)
- horizontal_pull: Pulling toward body horizontally (rows, cable rows, seated rows)
- vertical_push: Pushing overhead (shoulder press, military press, overhead tricep)
- vertical_pull: Pulling from above (pull-ups, lat pulldown, chin-ups)
- squat: Knee-dominant lower body (squats, leg press, goblet squat, hack squat)
- hinge: Hip-dominant lower body (deadlift, hip thrust, Romanian deadlift, good morning)
- lunge: Single-leg lower body (lunges, split squats, step-ups, Bulgarian split)
- carry: Loaded locomotion (farmer walks, suitcase carry, overhead carry)
- rotation: Rotational core (Russian twist, wood chops, cable rotation)
- isolation: Single-joint exercises (bicep curls, tricep extensions, leg curls, leg extensions, calf raises, lateral raises)
- core: Core stabilization/flexion (planks, crunches, leg raises, ab rollout)

Respond in JSON format only:
{
  "pattern": "<one of the patterns above>",
  "confidence": <0.0 to 1.0>,
  "reasoning": "<brief 10-word max explanation>"
}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert exercise physiologist. Classify exercises by their primary movement pattern. Respond only with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 150,
    })

    const content = response.choices[0]?.message?.content?.trim() || ''

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error(`No JSON found in response: ${content}`)
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Validate pattern
    if (!MOVEMENT_PATTERNS.includes(parsed.pattern)) {
      throw new Error(`Invalid pattern: ${parsed.pattern}`)
    }

    return {
      exerciseId: exercise.id,
      name: exercise.name,
      suggestedPattern: parsed.pattern as MovementPattern,
      confidence: parsed.confidence || 0.8,
      reasoning: parsed.reasoning || 'AI classification',
    }
  } catch (error) {
    console.error(`  ⚠️ Error classifying "${exercise.name}":`, error)

    // Fallback: guess based on muscle groups
    const fallbackPattern = guessPatternFromMuscles(exercise)
    return {
      exerciseId: exercise.id,
      name: exercise.name,
      suggestedPattern: fallbackPattern,
      confidence: 0.5,
      reasoning: 'Fallback: guessed from muscle groups',
    }
  }
}

function guessPatternFromMuscles(exercise: Exercise): MovementPattern {
  const muscles = exercise.muscle_groups || []
  const category = exercise.category?.toLowerCase() || ''

  if (category === 'core' || muscles.some(m => ['abs', 'obliques'].includes(m))) {
    return 'core'
  }
  if (muscles.includes('chest')) {
    return 'horizontal_push'
  }
  if (muscles.includes('back') || muscles.includes('lats')) {
    return exercise.equipment?.some(e => ['pull_up_bar', 'cable'].includes(e))
      ? 'vertical_pull'
      : 'horizontal_pull'
  }
  if (muscles.includes('shoulders')) {
    return 'vertical_push'
  }
  if (muscles.includes('quadriceps')) {
    return 'squat'
  }
  if (muscles.includes('hamstrings') || muscles.includes('glutes')) {
    return muscles.includes('quadriceps') ? 'squat' : 'hinge'
  }
  if (muscles.includes('biceps') || muscles.includes('triceps')) {
    return 'isolation'
  }

  return 'isolation' // Default fallback
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

async function processExercises(exercises: Exercise[]): Promise<EnrichmentResult[]> {
  const results: EnrichmentResult[] = []
  const batchSize = 5 // Process 5 at a time to avoid rate limits

  console.log(`\n📊 Processing ${exercises.length} exercises...\n`)

  for (let i = 0; i < exercises.length; i += batchSize) {
    const batch = exercises.slice(i, i + batchSize)

    const batchResults = await Promise.all(
      batch.map(async (exercise) => {
        const result = await classifyExercise(exercise)
        const icon = result.confidence >= 0.8 ? '✅' : result.confidence >= 0.6 ? '⚠️' : '❓'
        console.log(
          `  ${icon} ${result.name.padEnd(40)} → ${result.suggestedPattern.padEnd(18)} (${(result.confidence * 100).toFixed(0)}%)`
        )
        return result
      })
    )

    results.push(...batchResults)

    // Progress update
    const progress = Math.min(i + batchSize, exercises.length)
    console.log(`\n  [${progress}/${exercises.length}] processed\n`)

    // Small delay to respect rate limits
    if (i + batchSize < exercises.length) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  return results
}

// ============================================================================
// DATABASE UPDATE
// ============================================================================

async function updateExercises(results: EnrichmentResult[]): Promise<void> {
  console.log('\n💾 Updating database...\n')

  let successCount = 0
  let errorCount = 0

  for (const result of results) {
    const { error } = await supabase
      .from('exercises')
      .update({ movement_pattern: result.suggestedPattern })
      .eq('id', result.exerciseId)

    if (error) {
      console.error(`  ❌ Failed to update "${result.name}":`, error.message)
      errorCount++
    } else {
      successCount++
    }
  }

  console.log(`\n✅ Updated: ${successCount}`)
  console.log(`❌ Errors: ${errorCount}`)
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

function generateReport(results: EnrichmentResult[]): void {
  console.log('\n' + '='.repeat(80))
  console.log('📋 ENRICHMENT REPORT')
  console.log('='.repeat(80))

  // Group by pattern
  const byPattern = results.reduce(
    (acc, r) => {
      acc[r.suggestedPattern] = acc[r.suggestedPattern] || []
      acc[r.suggestedPattern].push(r)
      return acc
    },
    {} as Record<MovementPattern, EnrichmentResult[]>
  )

  console.log('\n📊 Distribution by Pattern:\n')
  for (const pattern of MOVEMENT_PATTERNS) {
    const count = byPattern[pattern]?.length || 0
    const bar = '█'.repeat(Math.ceil(count / 2))
    console.log(`  ${pattern.padEnd(18)} ${count.toString().padStart(3)} ${bar}`)
  }

  // Low confidence items (need review)
  const needsReview = results.filter((r) => r.confidence < 0.7)
  if (needsReview.length > 0) {
    console.log('\n⚠️ NEEDS MANUAL REVIEW (confidence < 70%):\n')
    for (const r of needsReview) {
      console.log(`  - ${r.name}: ${r.suggestedPattern} (${(r.confidence * 100).toFixed(0)}%)`)
      console.log(`    Reason: ${r.reasoning}`)
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80))
  console.log('📈 SUMMARY')
  console.log('='.repeat(80))
  console.log(`\nTotal exercises: ${results.length}`)
  console.log(`High confidence (≥80%): ${results.filter((r) => r.confidence >= 0.8).length}`)
  console.log(`Medium confidence (60-79%): ${results.filter((r) => r.confidence >= 0.6 && r.confidence < 0.8).length}`)
  console.log(`Low confidence (<60%): ${results.filter((r) => r.confidence < 0.6).length}`)

  // Export to JSON for review
  const exportPath = './scripts/movement-pattern-results.json'
  const fs = require('fs')
  fs.writeFileSync(exportPath, JSON.stringify(results, null, 2))
  console.log(`\n📁 Results exported to: ${exportPath}`)
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🏋️ Exercise Movement Pattern Enrichment Script')
  console.log('='.repeat(50))

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No database changes will be made')
  }

  if (limit) {
    console.log(`📊 Limited to ${limit} exercises`)
  }

  // Fetch exercises without movement_pattern
  console.log('\n📥 Fetching exercises...')

  let query = supabase
    .from('exercises')
    .select('id, name, name_es, description, category, muscle_groups, equipment, difficulty, movement_pattern')
    .is('movement_pattern', null)
    .order('name')

  if (limit) {
    query = query.limit(limit)
  }

  const { data: exercises, error } = await query

  if (error) {
    console.error('❌ Failed to fetch exercises:', error.message)
    process.exit(1)
  }

  if (!exercises || exercises.length === 0) {
    console.log('✅ All exercises already have movement_pattern assigned!')
    process.exit(0)
  }

  console.log(`📊 Found ${exercises.length} exercises without movement_pattern`)

  // Process exercises
  const results = await processExercises(exercises as Exercise[])

  // Generate report
  generateReport(results)

  // Update database (unless dry run)
  if (!isDryRun) {
    await updateExercises(results)
  } else {
    console.log('\n🔍 DRY RUN - Skipping database update')
  }

  console.log('\n✅ Done!')
}

main().catch((error) => {
  console.error('❌ Script failed:', error)
  process.exit(1)
})
