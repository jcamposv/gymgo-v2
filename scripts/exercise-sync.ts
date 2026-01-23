/**
 * Exercise Sync Script (with Thumbnails + Instructions/Tips)
 *
 * This script:
 * 1. Scans video files from /resources
 * 2. Scans thumbnail images from /resources/Ilustrations
 * 3. Reads exercise data from CSV (instructions, tips in Spanish)
 * 4. Matches videos with thumbnails and CSV data by normalized name
 * 5. Uploads both to Supabase Storage
 * 6. Creates exercises in the database with instructions/tips
 *
 * Usage:
 *   npx tsx scripts/exercise-sync.ts --dry-run        # Preview only
 *   npx tsx scripts/exercise-sync.ts --upload         # Upload media + create exercises
 *   npx tsx scripts/exercise-sync.ts --upload --limit 10   # Process only 10
 *   npx tsx scripts/exercise-sync.ts --delete-all     # Delete all exercises first
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'

// Load env
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Config
const VIDEOS_PATH = '/Users/jairocampos/Documents/projects/gymgo/resources'
const THUMBNAILS_PATH = '/Users/jairocampos/Documents/projects/gymgo/resources/Ilustrations'
const CSV_PATH = '/Users/jairocampos/Desktop/catalogo_ejercicios_1000.csv'
const OUTPUT_DIR = '/Users/jairocampos/Documents/projects/gymgo/resources/audit'
const BUCKET_NAME = 'exercises'

// Parse CLI args
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const doUpload = args.includes('--upload')
const doDeleteAll = args.includes('--delete-all')
const limitIndex = args.indexOf('--limit')
const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : undefined

// ============================================================================
// TYPES
// ============================================================================

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

interface CsvExercise {
  id: string
  categoria: string
  ejercicio: string
  instrucciones: string
  consejos: string
  pagina: string
  normalizedName: string
}

interface ExerciseData {
  name: string
  nameEs: string
  videoFile: MediaFile
  thumbnailFile: MediaFile | null
  csvData: CsvExercise | null
  videoUrl: string | null
  thumbnailUrl: string | null
  category: string
  muscleGroups: string[]
  folder: string
  instructions: string[]
  tips: string[]
}

// ============================================================================
// FOLDER MAPPING (Videos -> Thumbnails)
// ============================================================================

// Video folders have slight naming differences from thumbnail folders
const folderMapping: Record<string, string> = {
  'Abdominlaes': 'Abdominals',  // typo in video folder
  'Back': 'Back',
  'Biceps': 'Biceps',
  'cardio': 'Cardio',
  'chest': 'Chest',
  'forearms': 'Forearms',
  'legs': 'Legs',
  'powerlifting': 'Powerlifting',
  'shoulders': 'Shoulders',
  'stretching - mobility': 'Stretching - Mobility',
  'triceps': 'Triceps',
  'yoga': 'Yoga',
}

// Map folder to category
function folderToCategory(folder: string): string {
  const map: Record<string, string> = {
    'Abdominlaes': 'core',
    'Abdominals': 'core',
    'Back': 'strength',
    'Biceps': 'strength',
    'cardio': 'cardio',
    'Cardio': 'cardio',
    'chest': 'strength',
    'Chest': 'strength',
    'forearms': 'strength',
    'Forearms': 'strength',
    'legs': 'strength',
    'Legs': 'strength',
    'powerlifting': 'strength',
    'Powerlifting': 'strength',
    'shoulders': 'strength',
    'Shoulders': 'strength',
    'stretching - mobility': 'flexibility',
    'Stretching - Mobility': 'flexibility',
    'triceps': 'strength',
    'Triceps': 'strength',
    'yoga': 'flexibility',
    'Yoga': 'flexibility',
  }
  return map[folder] || 'strength'
}

// Map folder to muscle groups
function folderToMuscleGroups(folder: string): string[] {
  const normalized = folder.toLowerCase()
  const map: Record<string, string[]> = {
    'abdominlaes': ['abs', 'obliques'],
    'abdominals': ['abs', 'obliques'],
    'back': ['back', 'lower_back'],
    'biceps': ['biceps'],
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
  return map[normalized] || []
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
    .replace(/\d+$/, '')  // Remove trailing numbers like "1" from thumbnails
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

function getBaseExerciseName(filename: string): string {
  return filename
    .replace(/\.(mp4|mov|gif|webm|png|jpg|jpeg|webp)$/i, '')
    .replace(/_female$/i, '')
    .replace(/_male$/i, '')
    .replace(/_Female$/i, '')
    .replace(/_Male$/i, '')
    .replace(/\s*\(female\)\s*/gi, '')
    .replace(/\s*\(male\)\s*/gi, '')
    .replace(/\d+$/, '')  // Remove trailing numbers
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

// ============================================================================
// SCANNING
// ============================================================================

function scanMediaFiles(basePath: string, validExtensions: string[]): MediaFile[] {
  const mediaFiles: MediaFile[] = []

  function scanDir(dirPath: string) {
    try {
      const items = fs.readdirSync(dirPath)
      for (const item of items) {
        const fullPath = path.join(dirPath, item)
        const stat = fs.statSync(fullPath)
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'audit' && item !== 'Ilustrations') {
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

  scanDir(basePath)
  return mediaFiles
}

function scanVideos(): MediaFile[] {
  console.log('📹 Scanning video files...')
  const videos = scanMediaFiles(VIDEOS_PATH, ['.mp4', '.mov', '.webm'])
  console.log(`   Found ${videos.length} video files`)
  return videos
}

function scanThumbnails(): MediaFile[] {
  console.log('🖼️  Scanning thumbnail files...')
  const thumbnails = scanMediaFiles(THUMBNAILS_PATH, ['.png', '.jpg', '.jpeg', '.webp'])
  console.log(`   Found ${thumbnails.length} thumbnail files`)
  return thumbnails
}

function loadCsvData(): CsvExercise[] {
  console.log('📄 Loading CSV data...')

  if (!fs.existsSync(CSV_PATH)) {
    console.log('   ⚠️  CSV file not found, skipping instructions/tips')
    return []
  }

  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8')
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  })

  const exercises: CsvExercise[] = []

  for (const record of records) {
    const ejercicio = record.ejercicio?.trim() || ''
    if (ejercicio && ejercicio.length > 3) {
      exercises.push({
        id: record.id || '',
        categoria: record.categoria || '',
        ejercicio,
        instrucciones: record.instrucciones || '',
        consejos: record.consejos || '',
        pagina: record.pagina || '',
        normalizedName: normalizeForMatching(ejercicio),
      })
    }
  }

  console.log(`   Found ${exercises.length} exercises in CSV`)
  return exercises
}

function parseInstructions(raw: string): string[] {
  if (!raw || raw.trim() === '') return []

  // Split by | and clean up each instruction
  return raw
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 5) // Filter out very short fragments
    .filter(s => !s.match(/^\d+\s*\./)) // Filter out numbered fragments like "3 ."
    .slice(0, 6) // Max 6 instructions
}

function parseTips(raw: string): string[] {
  if (!raw || raw.trim() === '') return []

  // Split by | and clean up each tip
  return raw
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 5) // Filter out very short fragments
    .slice(0, 5) // Max 5 tips
}

// ============================================================================
// MATCHING
// ============================================================================

function createExerciseList(videos: MediaFile[], thumbnails: MediaFile[], csvData: CsvExercise[]): ExerciseData[] {
  console.log('\n🔗 Matching videos with thumbnails and CSV data...')

  // Group videos by normalized name, prefer non-female
  const videoByName = new Map<string, MediaFile>()
  for (const video of videos) {
    const key = video.normalizedName
    const existing = videoByName.get(key)
    if (!existing) {
      videoByName.set(key, video)
    } else if (existing.isFemale && !video.isFemale) {
      videoByName.set(key, video)
    } else if (!existing.isFemale && !video.isFemale && video.size > existing.size) {
      videoByName.set(key, video)
    }
  }

  // Group thumbnails by normalized name, prefer non-female
  const thumbnailByName = new Map<string, MediaFile>()
  for (const thumb of thumbnails) {
    const key = thumb.normalizedName
    const existing = thumbnailByName.get(key)
    if (!existing) {
      thumbnailByName.set(key, thumb)
    } else if (existing.isFemale && !thumb.isFemale) {
      thumbnailByName.set(key, thumb)
    }
  }

  // Index CSV data by normalized name
  const csvByName = new Map<string, CsvExercise>()
  for (const csv of csvData) {
    const key = csv.normalizedName
    if (!csvByName.has(key)) {
      csvByName.set(key, csv)
    }
  }

  console.log(`   Unique videos: ${videoByName.size}`)
  console.log(`   Unique thumbnails: ${thumbnailByName.size}`)
  console.log(`   CSV entries: ${csvByName.size}`)

  // Create exercise list
  const exercises: ExerciseData[] = []
  let matchedThumbCount = 0
  let matchedCsvCount = 0

  for (const [normalizedName, video] of videoByName) {
    // Try to find matching thumbnail
    let thumbnail = thumbnailByName.get(normalizedName) || null

    // If not found, try mapping the folder name
    if (!thumbnail) {
      const mappedFolder = folderMapping[video.folder]
      if (mappedFolder) {
        // Search in thumbnails with similar name in the mapped folder
        for (const [thumbName, thumb] of thumbnailByName) {
          if (thumb.folder === mappedFolder && thumbName === normalizedName) {
            thumbnail = thumb
            break
          }
        }
      }
    }

    // Try to find matching CSV data
    const csv = csvByName.get(normalizedName) || null

    if (thumbnail) matchedThumbCount++
    if (csv) matchedCsvCount++

    // Parse instructions and tips from CSV
    const instructions = csv ? parseInstructions(csv.instrucciones) : []
    const tips = csv ? parseTips(csv.consejos) : []

    exercises.push({
      name: video.baseExerciseName,
      nameEs: video.baseExerciseName,
      videoFile: video,
      thumbnailFile: thumbnail,
      csvData: csv,
      videoUrl: null,
      thumbnailUrl: null,
      category: folderToCategory(video.folder),
      muscleGroups: folderToMuscleGroups(video.folder),
      folder: video.folder,
      instructions,
      tips,
    })
  }

  console.log(`   Matched with thumbnails: ${matchedThumbCount}`)
  console.log(`   Matched with CSV data: ${matchedCsvCount}`)
  console.log(`   Without thumbnails: ${exercises.length - matchedThumbCount}`)

  return exercises
}

// ============================================================================
// UPLOAD
// ============================================================================

async function uploadFile(file: MediaFile, subfolder: string): Promise<string | null> {
  const slug = createSlug(file.baseExerciseName)
  const storagePath = `${slug}/${subfolder}/${slug}${file.extension}`

  // Check if already exists
  const { data: existingFiles } = await supabase.storage
    .from(BUCKET_NAME)
    .list(`${slug}/${subfolder}`)

  if (existingFiles && existingFiles.length > 0) {
    const existing = existingFiles.find(f => f.name === `${slug}${file.extension}`)
    if (existing) {
      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath)
      return urlData.publicUrl
    }
  }

  // Read and upload
  const fileBuffer = fs.readFileSync(file.path)
  const contentType = file.extension === '.mp4' ? 'video/mp4'
    : file.extension === '.mov' ? 'video/quicktime'
    : file.extension === '.webm' ? 'video/webm'
    : file.extension === '.png' ? 'image/png'
    : file.extension === '.jpg' || file.extension === '.jpeg' ? 'image/jpeg'
    : 'image/webp'

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, fileBuffer, {
      contentType,
      cacheControl: '31536000',
      upsert: true,
    })

  if (error) {
    console.error(`   ❌ Upload failed: ${error.message}`)
    return null
  }

  const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath)
  return urlData.publicUrl
}

// ============================================================================
// DATABASE
// ============================================================================

async function deleteAllExercises(): Promise<void> {
  console.log('\n🗑️  Deleting all exercises from database...')

  // First delete non-global exercises
  const { error: error1 } = await supabase
    .from('exercises')
    .delete()
    .eq('is_global', false)

  if (error1) {
    console.error('   Error deleting non-global:', error1.message)
  }

  // Then delete global exercises
  const { error: error2 } = await supabase
    .from('exercises')
    .delete()
    .eq('is_global', true)

  if (error2) {
    console.error('   Error deleting global:', error2.message)
  }

  // Count remaining
  const { count } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true })

  console.log(`   Remaining exercises: ${count || 0}`)
}

async function createExercise(exercise: ExerciseData): Promise<string | null> {
  const { data, error } = await supabase
    .from('exercises')
    .insert({
      name: exercise.name,
      name_en: exercise.name,
      name_es: exercise.nameEs,
      category: exercise.category,
      muscle_groups: exercise.muscleGroups,
      difficulty: 'intermediate',
      video_url: exercise.videoUrl,
      thumbnail_url: exercise.thumbnailUrl,
      is_global: true,
      is_active: true,
      instructions: exercise.instructions,
      tips: exercise.tips,
    })
    .select('id')
    .single()

  if (error) {
    console.error(`   ❌ Create failed: ${error.message}`)
    return null
  }
  return data.id
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('\n🏋️ GYMGO EXERCISE SYNC (with Thumbnails)\n')
  console.log('='.repeat(60))
  console.log(`Mode: ${isDryRun ? '🔍 DRY RUN' : doUpload ? '🚀 UPLOAD & CREATE' : '📋 PREVIEW'}`)
  if (doDeleteAll) console.log('⚠️  Will delete all exercises first')
  if (limit) console.log(`Limit: ${limit} exercises`)
  console.log('='.repeat(60))

  // Ensure output dir exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  // Delete all exercises if requested
  if (doDeleteAll && doUpload && !isDryRun) {
    await deleteAllExercises()
  }

  // Scan media
  const videos = scanVideos()
  const thumbnails = scanThumbnails()

  // Load CSV data
  const csvData = loadCsvData()

  // Create exercise list
  let exercises = createExerciseList(videos, thumbnails, csvData)

  // Sort to prioritize exercises with CSV data (instructions/tips)
  exercises.sort((a, b) => {
    // First priority: has instructions
    const aHasData = a.instructions.length > 0 || a.tips.length > 0
    const bHasData = b.instructions.length > 0 || b.tips.length > 0
    if (aHasData && !bHasData) return -1
    if (!aHasData && bHasData) return 1

    // Second priority: has thumbnail
    if (a.thumbnailFile && !b.thumbnailFile) return -1
    if (!a.thumbnailFile && b.thumbnailFile) return 1

    // Third: alphabetical
    return a.name.localeCompare(b.name)
  })

  // Apply limit
  if (limit) {
    exercises = exercises.slice(0, limit)
  }

  // Save mapping preview
  const previewData = exercises.map(e => ({
    name: e.name,
    category: e.category,
    folder: e.folder,
    video: e.videoFile.filename,
    thumbnail: e.thumbnailFile?.filename || 'N/A',
    has_thumbnail: e.thumbnailFile ? 'YES' : 'NO',
    has_instructions: e.instructions.length > 0 ? 'YES' : 'NO',
    instructions_count: e.instructions.length,
    tips_count: e.tips.length,
  }))

  const headers = Object.keys(previewData[0] || {}).join(',')
  const rows = previewData.map(row => Object.values(row).join(','))
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'exercise_preview.csv'),
    [headers, ...rows].join('\n')
  )
  console.log(`\n✅ Preview saved: ${OUTPUT_DIR}/exercise_preview.csv`)

  // Upload if requested
  if (doUpload && !isDryRun) {
    console.log('\n📤 Starting upload process...\n')

    let uploaded = 0
    let created = 0
    let failed = 0

    for (let i = 0; i < exercises.length; i++) {
      const exercise = exercises[i]
      console.log(`[${i + 1}/${exercises.length}] ${exercise.name}`)

      // Upload video
      const videoUrl = await uploadFile(exercise.videoFile, 'video')
      if (!videoUrl) {
        failed++
        continue
      }
      exercise.videoUrl = videoUrl
      console.log(`   ✅ Video uploaded`)

      // Upload thumbnail if available
      if (exercise.thumbnailFile) {
        const thumbUrl = await uploadFile(exercise.thumbnailFile, 'thumbnail')
        if (thumbUrl) {
          exercise.thumbnailUrl = thumbUrl
          console.log(`   ✅ Thumbnail uploaded`)
        }
      }

      uploaded++

      // Create in DB
      const newId = await createExercise(exercise)
      if (newId) {
        created++
        const instrInfo = exercise.instructions.length > 0 ? ` (${exercise.instructions.length} instrucciones, ${exercise.tips.length} tips)` : ''
        console.log(`   ✅ Created in DB: ${newId}${instrInfo}`)
      } else {
        failed++
      }

      // Small delay
      await new Promise(r => setTimeout(r, 50))
    }

    // Save report
    const withInstructions = exercises.filter(e => e.instructions.length > 0).length
    const withTips = exercises.filter(e => e.tips.length > 0).length
    const report = {
      timestamp: new Date().toISOString(),
      total_processed: exercises.length,
      uploaded,
      created,
      failed,
      with_thumbnails: exercises.filter(e => e.thumbnailUrl).length,
      with_instructions: withInstructions,
      with_tips: withTips,
    }
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'upload_report.json'),
      JSON.stringify(report, null, 2)
    )

    console.log('\n' + '='.repeat(60))
    console.log('📊 FINAL REPORT')
    console.log('='.repeat(60))
    console.log(`Processed: ${exercises.length}`)
    console.log(`Uploaded:  ${uploaded}`)
    console.log(`Created:   ${created}`)
    console.log(`Failed:    ${failed}`)
    console.log(`With thumbnails: ${report.with_thumbnails}`)
    console.log(`With instructions: ${withInstructions}`)
    console.log(`With tips: ${withTips}`)
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 SUMMARY')
  console.log('='.repeat(60))
  console.log(`Total exercises to process: ${exercises.length}`)
  console.log(`With thumbnails: ${exercises.filter(e => e.thumbnailFile).length}`)
  console.log(`Without thumbnails: ${exercises.filter(e => !e.thumbnailFile).length}`)
  console.log(`With instructions: ${exercises.filter(e => e.instructions.length > 0).length}`)
  console.log(`With tips: ${exercises.filter(e => e.tips.length > 0).length}`)

  if (!doUpload) {
    console.log('\n💡 To upload and create, run:')
    console.log('   npx tsx scripts/exercise-sync.ts --upload --delete-all --limit 10')
  }
}

main().catch(console.error)
