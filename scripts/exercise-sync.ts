/**
 * Exercise Sync Script
 *
 * This script:
 * 1. Maps exercises to media files with deduplication
 * 2. Uploads videos to Supabase Storage bucket "exercises"
 * 3. Updates/creates exercises in the database
 *
 * Usage:
 *   npx tsx scripts/exercise-sync.ts --dry-run     # Preview only
 *   npx tsx scripts/exercise-sync.ts --upload      # Upload media + update DB
 *   npx tsx scripts/exercise-sync.ts --limit 10    # Process only 10 exercises
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

// Load env
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Config
const RESOURCES_PATH = '/Users/jairocampos/Documents/projects/gymgo/resources'
const OUTPUT_DIR = '/Users/jairocampos/Documents/projects/gymgo/resources/audit'
const BUCKET_NAME = 'exercises'

// Parse CLI args
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const doUpload = args.includes('--upload')
const limitIndex = args.indexOf('--limit')
const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : undefined

// ============================================================================
// TYPES
// ============================================================================

interface Exercise {
  id: string
  name: string
  name_en: string | null
  name_es: string | null
  description: string | null
  category: string | null
  difficulty: string | null
  equipment: string[] | null
  muscle_groups: string[] | null
  instructions: string[] | null
  tips: string[] | null
  video_url: string | null
  gif_url: string | null
  is_active: boolean | null
  is_global: boolean | null
}

interface MediaFile {
  path: string
  filename: string
  folder: string
  extension: string
  size: number
  normalizedName: string
  isFemale: boolean
  baseExerciseName: string
}

interface MappingResult {
  action: 'UPDATE' | 'CREATE' | 'SKIP'
  exerciseId: string | null
  exerciseName: string
  nameEs: string
  mediaFile: MediaFile | null
  storageUrl: string | null
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  reason: string
  folder: string
}

// ============================================================================
// HELPERS
// ============================================================================

function normalizeForMatching(name: string): string {
  return name
    .toLowerCase()
    .replace(/_female$/i, '')
    .replace(/_male$/i, '')
    .replace(/\s*\(female\)\s*/gi, '')
    .replace(/\s*\(male\)\s*/gi, '')
    .replace(/\s*\(version\s*\d+\)\s*/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

function getBaseExerciseName(filename: string): string {
  return filename
    .replace(/\.(mp4|mov|gif|webm)$/i, '')
    .replace(/_female$/i, '')
    .replace(/_male$/i, '')
    .replace(/_Female$/i, '')
    .replace(/_Male$/i, '')
    .replace(/\s*\(female\)\s*/gi, '')
    .replace(/\s*\(male\)\s*/gi, '')
    .trim()
}

function isFemaleVariant(filename: string): boolean {
  return /_female/i.test(filename) || /\(female\)/i.test(filename) || / female\./i.test(filename)
}

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(dp[i - 1][j - 1] + 1, dp[i - 1][j] + 1, dp[i][j - 1] + 1)
      }
    }
  }
  return dp[m][n]
}

function similarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length)
  if (maxLen === 0) return 1
  return (maxLen - levenshteinDistance(str1, str2)) / maxLen
}

// Map folder name to category
function folderToCategory(folder: string): string {
  const map: Record<string, string> = {
    'Abdominlaes': 'core',
    'Back': 'strength',
    'Biceps': 'strength',
    'cardio': 'cardio',
    'chest': 'strength',
    'forearms': 'strength',
    'legs': 'strength',
    'powerlifting': 'strength',
    'shoulders': 'strength',
    'stretching - mobility': 'flexibility',
    'triceps': 'strength',
    'yoga': 'flexibility',
  }
  return map[folder] || 'strength'
}

// Map folder to muscle groups
function folderToMuscleGroups(folder: string): string[] {
  const map: Record<string, string[]> = {
    'Abdominlaes': ['abs', 'obliques'],
    'Back': ['back', 'lower_back'],
    'Biceps': ['biceps'],
    'cardio': ['full_body'],
    'chest': ['chest'],
    'forearms': ['forearms'],
    'legs': ['quadriceps', 'hamstrings', 'glutes', 'calves'],
    'powerlifting': ['full_body'],
    'shoulders': ['shoulders'],
    'stretching - mobility': ['full_body'],
    'triceps': ['triceps'],
    'yoga': ['full_body'],
  }
  return map[folder] || []
}

// ============================================================================
// DATA LOADING
// ============================================================================

async function loadExercises(): Promise<Exercise[]> {
  console.log('📊 Loading exercises from database...')
  const { data, error } = await supabase.from('exercises').select('*').order('name')
  if (error) throw error
  console.log(`   Found ${data?.length || 0} exercises`)
  return data || []
}

function scanMediaFiles(): MediaFile[] {
  console.log('📁 Scanning media files...')
  const mediaFiles: MediaFile[] = []
  const validExtensions = ['.mp4', '.mov', '.gif', '.webm']

  function scanDir(dirPath: string) {
    try {
      const items = fs.readdirSync(dirPath)
      for (const item of items) {
        const fullPath = path.join(dirPath, item)
        const stat = fs.statSync(fullPath)
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'audit') {
          scanDir(fullPath)
        } else if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase()
          if (validExtensions.includes(ext)) {
            const folder = path.basename(path.dirname(fullPath))
            mediaFiles.push({
              path: fullPath,
              filename: item,
              folder,
              extension: ext,
              size: stat.size,
              normalizedName: normalizeForMatching(item.replace(ext, '')),
              isFemale: isFemaleVariant(item),
              baseExerciseName: getBaseExerciseName(item),
            })
          }
        }
      }
    } catch (err) {
      console.error(`Error scanning ${dirPath}:`, err)
    }
  }

  scanDir(RESOURCES_PATH)
  console.log(`   Found ${mediaFiles.length} media files`)
  return mediaFiles
}

// ============================================================================
// MAPPING LOGIC
// ============================================================================

function createMapping(dbExercises: Exercise[], mediaFiles: MediaFile[]): MappingResult[] {
  console.log('\n🔗 Creating exercise-media mapping...')

  // Group media by normalized name, prefer non-female
  const mediaByName = new Map<string, MediaFile>()

  for (const media of mediaFiles) {
    const key = media.normalizedName
    const existing = mediaByName.get(key)

    // Prefer: non-female, larger file size, mp4 format
    if (!existing) {
      mediaByName.set(key, media)
    } else if (existing.isFemale && !media.isFemale) {
      mediaByName.set(key, media)
    } else if (!existing.isFemale && !media.isFemale && media.size > existing.size) {
      mediaByName.set(key, media)
    }
  }

  console.log(`   Unique exercises after dedup: ${mediaByName.size}`)

  const results: MappingResult[] = []
  const processedDbIds = new Set<string>()

  // First pass: match media to existing DB exercises
  for (const [normalizedName, media] of mediaByName) {
    let bestMatch: Exercise | null = null
    let bestScore = 0

    for (const ex of dbExercises) {
      const names = [ex.name, ex.name_en, ex.name_es].filter(Boolean) as string[]
      for (const name of names) {
        const score = similarity(normalizedName, normalizeForMatching(name))
        if (score > bestScore && score > 0.75) {
          bestScore = score
          bestMatch = ex
        }
      }
    }

    if (bestMatch && bestScore > 0.85) {
      processedDbIds.add(bestMatch.id)
      results.push({
        action: 'UPDATE',
        exerciseId: bestMatch.id,
        exerciseName: media.baseExerciseName,
        nameEs: bestMatch.name_es || media.baseExerciseName,
        mediaFile: media,
        storageUrl: null,
        confidence: bestScore > 0.95 ? 'HIGH' : 'MEDIUM',
        reason: `Match DB: ${bestMatch.name} (${(bestScore * 100).toFixed(0)}%)`,
        folder: media.folder,
      })
    } else {
      // New exercise to create
      results.push({
        action: 'CREATE',
        exerciseId: null,
        exerciseName: media.baseExerciseName,
        nameEs: media.baseExerciseName, // Will need translation
        mediaFile: media,
        storageUrl: null,
        confidence: 'HIGH',
        reason: 'New exercise from media',
        folder: media.folder,
      })
    }
  }

  // Mark DB exercises without media as SKIP
  for (const ex of dbExercises) {
    if (!processedDbIds.has(ex.id)) {
      results.push({
        action: 'SKIP',
        exerciseId: ex.id,
        exerciseName: ex.name,
        nameEs: ex.name_es || ex.name,
        mediaFile: null,
        storageUrl: ex.video_url,
        confidence: 'LOW',
        reason: 'No matching media file found',
        folder: '',
      })
    }
  }

  const updates = results.filter(r => r.action === 'UPDATE').length
  const creates = results.filter(r => r.action === 'CREATE').length
  const skips = results.filter(r => r.action === 'SKIP').length

  console.log(`   UPDATE: ${updates} | CREATE: ${creates} | SKIP: ${skips}`)

  return results
}

// ============================================================================
// UPLOAD TO SUPABASE STORAGE
// ============================================================================

async function uploadMedia(media: MediaFile): Promise<string | null> {
  const slug = createSlug(media.baseExerciseName)
  const storagePath = `${slug}/${slug}${media.extension}`

  // Check if already exists
  const { data: existingFiles } = await supabase.storage
    .from(BUCKET_NAME)
    .list(slug)

  if (existingFiles && existingFiles.length > 0) {
    const existing = existingFiles.find(f => f.name === `${slug}${media.extension}`)
    if (existing) {
      console.log(`   ⏭️  Already exists: ${storagePath}`)
      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath)
      return urlData.publicUrl
    }
  }

  // Read file and upload
  const fileBuffer = fs.readFileSync(media.path)
  const contentType = media.extension === '.mp4' ? 'video/mp4'
    : media.extension === '.mov' ? 'video/quicktime'
    : media.extension === '.webm' ? 'video/webm'
    : 'image/gif'

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, fileBuffer, {
      contentType,
      cacheControl: '31536000', // 1 year
      upsert: true,
    })

  if (error) {
    console.error(`   ❌ Upload failed for ${media.filename}:`, error.message)
    return null
  }

  const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath)
  console.log(`   ✅ Uploaded: ${storagePath}`)
  return urlData.publicUrl
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

async function updateExercise(id: string, videoUrl: string): Promise<boolean> {
  const { error } = await supabase
    .from('exercises')
    .update({
      video_url: videoUrl,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error(`   ❌ Update failed for ${id}:`, error.message)
    return false
  }
  return true
}

async function createExercise(mapping: MappingResult, videoUrl: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('exercises')
    .insert({
      name: mapping.exerciseName,
      name_en: mapping.exerciseName,
      name_es: mapping.nameEs,
      category: folderToCategory(mapping.folder),
      muscle_groups: folderToMuscleGroups(mapping.folder),
      difficulty: 'intermediate',
      video_url: videoUrl,
      is_global: true,
      is_active: true,
      instructions: [],
      tips: [],
    })
    .select('id')
    .single()

  if (error) {
    console.error(`   ❌ Create failed for ${mapping.exerciseName}:`, error.message)
    return null
  }
  return data.id
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('\n🏋️ GYMGO EXERCISE SYNC\n')
  console.log('='.repeat(60))
  console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (preview only)' : doUpload ? '🚀 UPLOAD & UPDATE' : '📋 MAPPING ONLY'}`)
  if (limit) console.log(`Limit: ${limit} exercises`)
  console.log('='.repeat(60))

  // Ensure output dir exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  // Load data
  const dbExercises = await loadExercises()
  const mediaFiles = scanMediaFiles()

  // Create mapping
  let mappings = createMapping(dbExercises, mediaFiles)

  // Apply limit
  if (limit) {
    mappings = mappings.slice(0, limit)
  }

  // Filter to only actionable items (UPDATE and CREATE)
  const actionable = mappings.filter(m => m.action !== 'SKIP' && m.mediaFile)

  // Save mapping CSV
  const csvData = mappings.map(m => ({
    action: m.action,
    exercise_id: m.exerciseId || '',
    exercise_name: m.exerciseName,
    name_es: m.nameEs,
    media_file: m.mediaFile?.filename || '',
    media_path: m.mediaFile?.path || '',
    confidence: m.confidence,
    reason: m.reason,
    folder: m.folder,
  }))

  const headers = Object.keys(csvData[0] || {}).join(',')
  const rows = csvData.map(row => Object.values(row).map(v =>
    typeof v === 'string' && (v.includes(',') || v.includes('"'))
      ? `"${v.replace(/"/g, '""')}"`
      : v
  ).join(','))

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'exercise_media_mapping.csv'),
    [headers, ...rows].join('\n')
  )
  console.log(`\n✅ Saved: ${OUTPUT_DIR}/exercise_media_mapping.csv`)

  // If upload mode, process uploads and updates
  if (doUpload && !isDryRun) {
    console.log('\n📤 Starting upload process...\n')

    let uploaded = 0
    let updated = 0
    let created = 0
    let failed = 0

    for (let i = 0; i < actionable.length; i++) {
      const mapping = actionable[i]
      console.log(`[${i + 1}/${actionable.length}] ${mapping.exerciseName}`)

      if (!mapping.mediaFile) continue

      // Upload media
      const videoUrl = await uploadMedia(mapping.mediaFile)
      if (!videoUrl) {
        failed++
        continue
      }
      uploaded++

      // Update or create in DB
      if (mapping.action === 'UPDATE' && mapping.exerciseId) {
        const success = await updateExercise(mapping.exerciseId, videoUrl)
        if (success) updated++
        else failed++
      } else if (mapping.action === 'CREATE') {
        const newId = await createExercise(mapping, videoUrl)
        if (newId) created++
        else failed++
      }

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 100))
    }

    // Save upload report
    const report = {
      timestamp: new Date().toISOString(),
      total_processed: actionable.length,
      uploaded,
      updated,
      created,
      failed,
    }
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'upload_report.json'),
      JSON.stringify(report, null, 2)
    )

    console.log('\n' + '='.repeat(60))
    console.log('📊 FINAL REPORT')
    console.log('='.repeat(60))
    console.log(`Uploaded: ${uploaded}`)
    console.log(`Updated:  ${updated}`)
    console.log(`Created:  ${created}`)
    console.log(`Failed:   ${failed}`)
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 MAPPING SUMMARY')
  console.log('='.repeat(60))
  console.log(`Total mappings: ${mappings.length}`)
  console.log(`  UPDATE: ${mappings.filter(m => m.action === 'UPDATE').length}`)
  console.log(`  CREATE: ${mappings.filter(m => m.action === 'CREATE').length}`)
  console.log(`  SKIP:   ${mappings.filter(m => m.action === 'SKIP').length}`)

  if (!doUpload) {
    console.log('\n💡 To upload and update, run:')
    console.log('   npx tsx scripts/exercise-sync.ts --upload')
    console.log('   npx tsx scripts/exercise-sync.ts --upload --limit 10  # test with 10 first')
  }
}

main().catch(console.error)
