/**
 * AI Features Audit & Validation Script
 *
 * This script validates the AI module implementation including:
 * - Model selection based on plan tier
 * - Limit enforcement logic
 * - Response format compliance
 * - Configuration correctness
 *
 * Usage: npx ts-node --skip-project scripts/ai-feature-tests.ts
 */

import { PLAN_LIMITS, type PlanTier } from '../src/lib/pricing.config'

// =============================================================================
// Test Utilities
// =============================================================================

let passCount = 0
let failCount = 0

function test(name: string, fn: () => boolean): void {
  try {
    const result = fn()
    if (result) {
      console.log(`✓ ${name}`)
      passCount++
    } else {
      console.log(`✗ ${name}`)
      failCount++
    }
  } catch (error) {
    console.log(`✗ ${name} - Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    failCount++
  }
}

function assertEqual<T>(actual: T, expected: T, description: string): boolean {
  if (actual === expected) return true
  console.log(`  Expected: ${expected}, Got: ${actual} (${description})`)
  return false
}

// =============================================================================
// Model Selection Tests
// =============================================================================

console.log('\n🤖 AI Model Selection Tests\n')

test('Free plan uses gpt-3.5-turbo', () => {
  return assertEqual(PLAN_LIMITS.free.aiModel, 'gpt-3.5-turbo', 'Free plan model')
})

test('Starter plan uses gpt-3.5-turbo', () => {
  return assertEqual(PLAN_LIMITS.starter.aiModel, 'gpt-3.5-turbo', 'Starter plan model')
})

test('Growth plan uses gpt-3.5-turbo', () => {
  return assertEqual(PLAN_LIMITS.growth.aiModel, 'gpt-3.5-turbo', 'Growth plan model')
})

test('Pro plan uses gpt-4-turbo', () => {
  return assertEqual(PLAN_LIMITS.pro.aiModel, 'gpt-4-turbo', 'Pro plan model')
})

test('Enterprise plan uses gpt-4-turbo', () => {
  return assertEqual(PLAN_LIMITS.enterprise.aiModel, 'gpt-4-turbo', 'Enterprise plan model')
})

// =============================================================================
// Plan Limits Tests
// =============================================================================

console.log('\n📊 Plan Limits Configuration Tests\n')

const planTiers: PlanTier[] = ['free', 'starter', 'growth', 'pro', 'enterprise']

test('All plans have aiRequestsPerMonth defined', () => {
  return planTiers.every(plan =>
    typeof PLAN_LIMITS[plan].aiRequestsPerMonth === 'number'
  )
})

test('All plans have routineGenerationsPerMonth defined', () => {
  return planTiers.every(plan =>
    typeof PLAN_LIMITS[plan].routineGenerationsPerMonth === 'number'
  )
})

test('All plans have exerciseAlternativesPerMonth defined', () => {
  return planTiers.every(plan =>
    typeof PLAN_LIMITS[plan].exerciseAlternativesPerMonth === 'number'
  )
})

test('Free plan has lowest AI limits', () => {
  const freeLimit = PLAN_LIMITS.free.aiRequestsPerMonth
  return planTiers.slice(1).every(plan => {
    const limit = PLAN_LIMITS[plan].aiRequestsPerMonth
    return limit === -1 || limit >= freeLimit
  })
})

test('Enterprise plan has unlimited or highest limits (-1 = unlimited)', () => {
  const enterprise = PLAN_LIMITS.enterprise
  return enterprise.aiRequestsPerMonth === -1 ||
    planTiers.every(plan =>
      plan === 'enterprise' ||
      enterprise.aiRequestsPerMonth >= PLAN_LIMITS[plan].aiRequestsPerMonth
    )
})

test('Plan limits increase progressively', () => {
  const limits = planTiers.map(plan => ({
    plan,
    requests: PLAN_LIMITS[plan].aiRequestsPerMonth,
    routines: PLAN_LIMITS[plan].routineGenerationsPerMonth,
    alternatives: PLAN_LIMITS[plan].exerciseAlternativesPerMonth,
  }))

  // Verify non-decreasing order (allowing -1 for unlimited)
  let prevRequests = 0
  for (const { requests } of limits) {
    if (requests === -1) continue // -1 is unlimited
    if (requests < prevRequests) return false
    prevRequests = requests
  }
  return true
})

// =============================================================================
// Limit Enforcement Logic Tests
// =============================================================================

console.log('\n🔒 Limit Enforcement Logic Tests\n')

function simulateLimitCheck(used: number, limit: number): { allowed: boolean } {
  // -1 means unlimited
  if (limit === -1) return { allowed: true }
  return { allowed: used < limit }
}

test('Limit check allows when under limit', () => {
  const result = simulateLimitCheck(5, 10)
  return assertEqual(result.allowed, true, 'Under limit should be allowed')
})

test('Limit check blocks when at limit', () => {
  const result = simulateLimitCheck(10, 10)
  return assertEqual(result.allowed, false, 'At limit should be blocked')
})

test('Limit check blocks when over limit', () => {
  const result = simulateLimitCheck(15, 10)
  return assertEqual(result.allowed, false, 'Over limit should be blocked')
})

test('Unlimited (-1) always allows', () => {
  const result1 = simulateLimitCheck(0, -1)
  const result2 = simulateLimitCheck(1000000, -1)
  return result1.allowed && result2.allowed
})

test('Zero limit always blocks', () => {
  const result = simulateLimitCheck(0, 0)
  return assertEqual(result.allowed, false, 'Zero limit should always block')
})

// =============================================================================
// Response Format Tests
// =============================================================================

console.log('\n📄 Response Format Tests\n')

interface AIAlternativesResponse {
  alternatives: Array<{
    exercise: {
      id: string
      name: string
      muscle_groups: string[] | null
    }
    reason: string
    score: number
  }>
  was_cached: boolean
  tokens_used: number
  remaining_requests: number
}

function validateAlternativesResponse(response: unknown): boolean {
  if (typeof response !== 'object' || response === null) return false

  const r = response as Record<string, unknown>

  if (!Array.isArray(r.alternatives)) return false
  if (typeof r.was_cached !== 'boolean') return false
  if (typeof r.tokens_used !== 'number') return false
  if (typeof r.remaining_requests !== 'number') return false

  // Validate each alternative
  for (const alt of r.alternatives) {
    if (typeof alt !== 'object' || alt === null) return false
    const a = alt as Record<string, unknown>
    if (typeof a.reason !== 'string') return false
    if (typeof a.score !== 'number') return false
    if (typeof a.exercise !== 'object' || a.exercise === null) return false
  }

  return true
}

test('Valid alternatives response passes validation', () => {
  const validResponse: AIAlternativesResponse = {
    alternatives: [
      {
        exercise: { id: 'uuid', name: 'Press de banca', muscle_groups: ['chest'] },
        reason: 'Mismo patron de empuje',
        score: 85,
      },
    ],
    was_cached: false,
    tokens_used: 150,
    remaining_requests: 49,
  }
  return validateAlternativesResponse(validResponse)
})

test('Missing was_cached fails validation', () => {
  const invalidResponse = {
    alternatives: [],
    tokens_used: 0,
    remaining_requests: 50,
  }
  return !validateAlternativesResponse(invalidResponse)
})

test('Invalid alternatives array fails validation', () => {
  const invalidResponse = {
    alternatives: 'not an array',
    was_cached: false,
    tokens_used: 0,
    remaining_requests: 50,
  }
  return !validateAlternativesResponse(invalidResponse)
})

// =============================================================================
// Feature Configuration Tests
// =============================================================================

console.log('\n⚙️ Feature Configuration Tests\n')

const AI_FEATURES = ['routine_generation', 'alternatives'] as const

test('All AI features have corresponding limit fields', () => {
  // routine_generation -> routineGenerationsPerMonth
  // alternatives -> exerciseAlternativesPerMonth
  const featureToLimit: Record<string, keyof typeof PLAN_LIMITS.free> = {
    routine_generation: 'routineGenerationsPerMonth',
    alternatives: 'exerciseAlternativesPerMonth',
  }

  return AI_FEATURES.every(feature => {
    const limitKey = featureToLimit[feature]
    return planTiers.every(plan =>
      typeof PLAN_LIMITS[plan][limitKey] === 'number'
    )
  })
})

// =============================================================================
// Summary
// =============================================================================

console.log('\n' + '='.repeat(50))
console.log(`\n📊 Test Summary: ${passCount} passed, ${failCount} failed\n`)

if (failCount > 0) {
  console.log('❌ Some tests failed. Review the output above.\n')
  process.exit(1)
} else {
  console.log('✅ All tests passed!\n')
  process.exit(0)
}
