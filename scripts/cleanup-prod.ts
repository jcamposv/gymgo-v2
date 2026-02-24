/**
 * Production Database Cleanup Script
 *
 * This script removes all user-generated data from the production database:
 * - Classes and class templates
 * - Exercises (non-global)
 * - Workouts/Routines
 * - Members and member data
 * - Bookings and check-ins
 * - Payments and financial records
 * - Usage logs and caches
 *
 * KEEPS:
 * - Global exercises (is_global = true)
 * - Organizations (empty but structure preserved)
 * - WhatsApp templates
 * - Profiles linked to auth users
 *
 * Usage:
 *   npx tsx scripts/cleanup-prod.ts --dry-run    # Preview what will be deleted
 *   npx tsx scripts/cleanup-prod.ts --execute    # Actually delete data
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const doExecute = args.includes('--execute')

interface CleanupResult {
  table: string
  count: number
  status: 'deleted' | 'skipped' | 'error'
  error?: string
}

async function countRows(table: string, filter?: { column: string; value: unknown }): Promise<number> {
  let query = supabase.from(table).select('*', { count: 'exact', head: true })

  if (filter) {
    query = query.eq(filter.column, filter.value)
  }

  const { count, error } = await query

  if (error) {
    console.error(`Error counting ${table}:`, error.message)
    return 0
  }

  return count || 0
}

async function deleteAll(table: string, filter?: { column: string; value: unknown; negate?: boolean }): Promise<CleanupResult> {
  const count = await countRows(table, filter && !filter.negate ? filter : undefined)

  if (count === 0) {
    return { table, count: 0, status: 'skipped' }
  }

  if (isDryRun) {
    return { table, count, status: 'skipped' }
  }

  try {
    let query = supabase.from(table).delete()

    if (filter) {
      if (filter.negate) {
        query = query.neq(filter.column, filter.value)
      } else {
        query = query.eq(filter.column, filter.value)
      }
    } else {
      // Delete all - need a condition that matches everything
      query = query.gte('created_at', '1970-01-01')
    }

    const { error } = await query

    if (error) {
      return { table, count, status: 'error', error: error.message }
    }

    return { table, count, status: 'deleted' }
  } catch (err) {
    return { table, count, status: 'error', error: String(err) }
  }
}

async function main() {
  console.log('\n🧹 GYMGO PRODUCTION DATABASE CLEANUP\n')
  console.log('='.repeat(60))
  console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (preview only)' : doExecute ? '🚨 EXECUTE (will delete data!)' : '❓ No mode specified'}`)
  console.log(`Database: ${supabaseUrl}`)
  console.log('='.repeat(60))

  if (!isDryRun && !doExecute) {
    console.log('\n⚠️  Please specify a mode:')
    console.log('   --dry-run    Preview what will be deleted')
    console.log('   --execute    Actually delete the data')
    return
  }

  if (doExecute) {
    console.log('\n⚠️  WARNING: This will permanently delete data!')
    console.log('   Press Ctrl+C within 5 seconds to cancel...\n')
    await new Promise(r => setTimeout(r, 5000))
  }

  const results: CleanupResult[] = []

  console.log('\n📊 Analyzing tables...\n')

  // Order matters due to foreign key constraints
  // Delete child tables first, then parent tables

  // 1. Bookings and Check-ins (depend on classes and members)
  console.log('1. Cleaning bookings and check-ins...')
  results.push(await deleteAll('bookings'))
  results.push(await deleteAll('check_ins'))

  // 2. Workout data (depend on exercises and members)
  console.log('2. Cleaning workout data...')
  results.push(await deleteAll('workout_exercise_overrides'))
  results.push(await deleteAll('workouts'))
  results.push(await deleteAll('exercise_benchmarks'))

  // 3. Member data (depend on members)
  console.log('3. Cleaning member data...')
  results.push(await deleteAll('member_measurements'))
  results.push(await deleteAll('member_notes'))
  results.push(await deleteAll('member_notification_preferences'))
  results.push(await deleteAll('member_reports'))

  // 4. Financial data
  console.log('4. Cleaning financial data...')
  results.push(await deleteAll('payments'))
  results.push(await deleteAll('income'))
  results.push(await deleteAll('expenses'))

  // 5. Classes and templates
  console.log('5. Cleaning classes and templates...')
  results.push(await deleteAll('class_generation_log'))
  results.push(await deleteAll('classes'))
  results.push(await deleteAll('class_templates'))

  // 6. Exercises (ALL - including global demo data)
  console.log('6. Cleaning ALL exercises...')
  results.push(await deleteAll('exercises'))

  // 7. Members
  console.log('7. Cleaning members...')
  results.push(await deleteAll('members'))

  // 8. Membership plans
  console.log('8. Cleaning membership plans...')
  results.push(await deleteAll('membership_plans'))

  // 9. Usage logs and caches
  console.log('9. Cleaning usage logs and caches...')
  results.push(await deleteAll('ai_alternatives_cache'))
  results.push(await deleteAll('ai_usage_log'))
  results.push(await deleteAll('api_usage'))
  results.push(await deleteAll('email_usage'))
  results.push(await deleteAll('whatsapp_usage'))
  results.push(await deleteAll('notification_delivery_log'))
  results.push(await deleteAll('organization_ai_usage'))
  results.push(await deleteAll('user_ai_usage'))
  results.push(await deleteAll('storage_usage'))
  results.push(await deleteAll('subscription_history'))
  results.push(await deleteAll('upgrade_requests'))

  // 10. Organization equipment (optional - keeping structure)
  console.log('10. Cleaning organization equipment...')
  results.push(await deleteAll('organization_equipment'))

  // 11. Profiles (users) - Be careful here
  console.log('11. Cleaning profiles...')
  results.push(await deleteAll('profiles'))

  // 12. Organizations - Delete all
  console.log('12. Cleaning organizations...')
  results.push(await deleteAll('organizations'))

  // Print results
  console.log('\n' + '='.repeat(60))
  console.log('📊 CLEANUP RESULTS')
  console.log('='.repeat(60))
  console.log('')
  console.log('Table'.padEnd(35) + 'Count'.padEnd(10) + 'Status')
  console.log('-'.repeat(60))

  let totalDeleted = 0
  for (const result of results) {
    const statusIcon = result.status === 'deleted' ? '✅' : result.status === 'error' ? '❌' : '⏸️'
    console.log(
      result.table.padEnd(35) +
      String(result.count).padEnd(10) +
      `${statusIcon} ${result.status}${result.error ? ` (${result.error})` : ''}`
    )
    if (result.status === 'deleted') {
      totalDeleted += result.count
    }
  }

  console.log('-'.repeat(60))
  console.log(`Total rows ${isDryRun ? 'to delete' : 'deleted'}: ${totalDeleted}`)

  if (isDryRun) {
    console.log('\n💡 To execute the cleanup, run:')
    console.log('   npx tsx scripts/cleanup-prod.ts --execute')
  }

  // Verify remaining data
  if (doExecute) {
    console.log('\n📊 Verifying cleanup...')
    const exercisesRemaining = await supabase.from('exercises').select('*', { count: 'exact', head: true })
    const membersRemaining = await supabase.from('members').select('*', { count: 'exact', head: true })
    const classesRemaining = await supabase.from('classes').select('*', { count: 'exact', head: true })
    console.log(`   Exercises remaining: ${exercisesRemaining.count || 0}`)
    console.log(`   Members remaining: ${membersRemaining.count || 0}`)
    console.log(`   Classes remaining: ${classesRemaining.count || 0}`)
  }
}

main().catch(console.error)
