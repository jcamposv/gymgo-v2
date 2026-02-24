/**
 * Exercise Data Audit Script
 *
 * Exports current exercises from DB and creates media inventory
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load env
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const RESOURCES_PATH = '/Users/jairocampos/Documents/projects/gymgo/resources'
const OUTPUT_DIR = '/Users/jairocampos/Documents/projects/gymgo/resources/audit'

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
  common_mistakes: string[] | null
  video_url: string | null
  gif_url: string | null
  thumbnail_url: string | null
  movement_pattern: string | null
  is_active: boolean | null
  is_global: boolean | null
  organization_id: string | null
  created_at: string | null
  updated_at: string | null
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

// Normalize exercise name for matching
function normalizeExerciseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/_female$/i, '')
    .replace(/_male$/i, '')
    .replace(/\s*\(female\)\s*/gi, '')
    .replace(/\s*\(male\)\s*/gi, '')
    .replace(/\s*\(version\s*\d+\)\s*/gi, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Get base exercise name (without male/female suffix)
function getBaseExerciseName(filename: string): string {
  const name = filename
    .replace(/\.(mp4|mov|gif|webm)$/i, '')
    .replace(/_female$/i, '')
    .replace(/_male$/i, '')
    .replace(/\s*\(female\)\s*/gi, '')
    .replace(/\s*\(male\)\s*/gi, '')
    .trim()
  return name
}

// Check if file is female variant
function isFemaleVariant(filename: string): boolean {
  return /_female\./i.test(filename) ||
         /\(female\)/i.test(filename) ||
         /_female$/i.test(filename.replace(/\.[^.]+$/, ''))
}

async function exportExercises(): Promise<Exercise[]> {
  console.log('Fetching exercises from database...')

  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching exercises:', error)
    throw error
  }

  console.log(`Found ${data?.length || 0} exercises in database`)
  return data || []
}

function scanMediaFiles(): MediaFile[] {
  console.log('Scanning media files...')

  const mediaFiles: MediaFile[] = []
  const validExtensions = ['.mp4', '.mov', '.gif', '.webm']

  function scanDir(dirPath: string) {
    const items = fs.readdirSync(dirPath)

    for (const item of items) {
      const fullPath = path.join(dirPath, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory() && !item.startsWith('.')) {
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
            normalizedName: normalizeExerciseName(item.replace(ext, '')),
            isFemale: isFemaleVariant(item),
            baseExerciseName: getBaseExerciseName(item),
          })
        }
      }
    }
  }

  scanDir(RESOURCES_PATH)
  console.log(`Found ${mediaFiles.length} media files`)
  return mediaFiles
}

function analyzeMediaDuplicates(mediaFiles: MediaFile[]): Map<string, MediaFile[]> {
  const groups = new Map<string, MediaFile[]>()

  for (const file of mediaFiles) {
    const key = file.normalizedName
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(file)
  }

  return groups
}

function generateCSV(data: any[], filename: string): void {
  if (data.length === 0) {
    console.log(`No data for ${filename}`)
    return
  }

  const headers = Object.keys(data[0])
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h]
      if (val === null || val === undefined) return ''
      if (Array.isArray(val)) return `"${val.join('; ')}"`
      if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return val
    }).join(',')
  )

  const csv = [headers.join(','), ...rows].join('\n')
  const filepath = path.join(OUTPUT_DIR, filename)
  fs.writeFileSync(filepath, csv)
  console.log(`Saved: ${filepath}`)
}

async function main() {
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  // Step 1: Export existing exercises
  const exercises = await exportExercises()

  const exerciseData = exercises.map(e => ({
    id: e.id,
    name: e.name,
    name_en: e.name_en,
    name_es: e.name_es,
    category: e.category,
    difficulty: e.difficulty,
    equipment: e.equipment,
    muscle_groups: e.muscle_groups,
    video_url: e.video_url,
    gif_url: e.gif_url,
    is_active: e.is_active,
    is_global: e.is_global,
    has_video: !!e.video_url,
    has_gif: !!e.gif_url,
    instructions_count: e.instructions?.length || 0,
  }))

  generateCSV(exerciseData, 'existing_exercises.csv')

  // Step 2: Scan media files
  const mediaFiles = scanMediaFiles()

  const mediaData = mediaFiles.map(m => ({
    filename: m.filename,
    folder: m.folder,
    extension: m.extension,
    size_mb: (m.size / 1024 / 1024).toFixed(2),
    normalized_name: m.normalizedName,
    base_exercise_name: m.baseExerciseName,
    is_female: m.isFemale,
    path: m.path,
  }))

  generateCSV(mediaData, 'media_inventory.csv')

  // Step 3: Analyze duplicates
  const groups = analyzeMediaDuplicates(mediaFiles)

  const duplicateData: any[] = []
  for (const [name, files] of groups) {
    if (files.length > 1) {
      const maleFiles = files.filter(f => !f.isFemale)
      const femaleFiles = files.filter(f => f.isFemale)

      duplicateData.push({
        normalized_name: name,
        total_variants: files.length,
        male_variants: maleFiles.length,
        female_variants: femaleFiles.length,
        files: files.map(f => f.filename).join(' | '),
        recommended: maleFiles[0]?.filename || files[0]?.filename,
      })
    }
  }

  generateCSV(duplicateData, 'duplicate_analysis.csv')

  // Step 4: Summary stats
  const summary = {
    total_exercises_in_db: exercises.length,
    exercises_with_video: exercises.filter(e => e.video_url).length,
    exercises_without_video: exercises.filter(e => !e.video_url).length,
    exercises_with_gif: exercises.filter(e => e.gif_url).length,
    exercises_with_spanish_name: exercises.filter(e => e.name_es).length,
    total_media_files: mediaFiles.length,
    unique_exercises_in_media: groups.size,
    male_only_files: mediaFiles.filter(f => !f.isFemale).length,
    female_only_files: mediaFiles.filter(f => f.isFemale).length,
    duplicate_groups: duplicateData.length,
    folders: [...new Set(mediaFiles.map(f => f.folder))],
  }

  console.log('\n=== SUMMARY ===')
  console.log(JSON.stringify(summary, null, 2))

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'summary.json'),
    JSON.stringify(summary, null, 2)
  )

  console.log('\nAudit complete! Check:', OUTPUT_DIR)
}

main().catch(console.error)
