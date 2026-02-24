/**
 * Video Compression Script for GymGo Exercise Library
 *
 * Downloads videos from Supabase Storage, compresses with ffmpeg,
 * and re-uploads replacing the originals.
 *
 * Settings:
 *   - Resolution: 480p (720x480 or maintain aspect ratio)
 *   - Codec: H.264 (libx264)
 *   - CRF: 28 (good quality, small size)
 *   - Audio: removed (exercise demos don't need audio)
 *   - Target: ~0.5-1.5MB per video
 *
 * Usage:
 *   node scripts/compress-videos.mjs                    # Dry run (shows what would be compressed)
 *   node scripts/compress-videos.mjs --run              # Compress all videos
 *   node scripts/compress-videos.mjs --run --skip=500   # Start from video #500
 *   node scripts/compress-videos.mjs --run --limit=10   # Only compress 10 videos
 */

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import { mkdirSync, existsSync, unlinkSync, statSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

// ============================================================================
// CONFIG
// ============================================================================

const SUPABASE_URL = 'https://adwwvdpysxnubdfngqku.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkd3d2ZHB5c3hudWJkZm5ncWt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzI4NjUxMCwiZXhwIjoyMDgyODYyNTEwfQ.mFSvpA-ZIWrlumDYiWtaYuMhTbDayptwUbMoSvvikUQ';
const BUCKET = 'exercises';
const TEMP_DIR = '/tmp/gymgo-video-compress';
const LOG_FILE = join(TEMP_DIR, 'compress-log.json');

// FFmpeg settings
const FFMPEG_ARGS = [
  '-vf', 'scale=-2:480',       // 480p height, auto width (keep aspect ratio)
  '-c:v', 'libx264',            // H.264 codec
  '-crf', '26',                  // Quality (23=high, 26=good balance, 28=smaller)
  '-preset', 'medium',          // Encoding speed vs compression
  '-an',                         // Remove audio
  '-movflags', '+faststart',    // Enable progressive playback
  '-y',                          // Overwrite output
].join(' ');

// Skip videos smaller than this (already compressed)
const MIN_SIZE_BYTES = 1.5 * 1024 * 1024; // 1.5MB

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================================
// HELPERS
// ============================================================================

async function listAll(prefix) {
  let all = [];
  let offset = 0;
  while (true) {
    const { data } = await supabase.storage.from(BUCKET).list(prefix, {
      limit: 100, offset, sortBy: { column: 'name', order: 'asc' }
    });
    if (!data || data.length === 0) break;
    all = all.concat(data);
    offset += data.length;
    if (data.length < 100) break;
  }
  return all;
}

function loadLog() {
  try {
    return JSON.parse(readFileSync(LOG_FILE, 'utf8'));
  } catch {
    return { compressed: {}, errors: [], stats: { processed: 0, skipped: 0, errors: 0, savedBytes: 0 } };
  }
}

function saveLog(log) {
  writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
}

function formatMB(bytes) {
  return (bytes / 1024 / 1024).toFixed(2);
}

// ============================================================================
// MAIN
// ============================================================================

async function getAllVideoPaths() {
  console.log('Scanning storage for videos...');
  const folders = await listAll('');
  console.log(`Found ${folders.length} top-level folders`);

  const videos = [];
  let scanned = 0;

  for (const folder of folders) {
    if (folder.metadata) continue;

    const files = await listAll(folder.name);
    for (const file of files) {
      if (file.metadata) {
        if (/\.(mp4|webm|mov)$/i.test(file.name)) {
          videos.push({ path: `${folder.name}/${file.name}`, size: file.metadata.size });
        }
      } else {
        const subs = await listAll(`${folder.name}/${file.name}`);
        for (const sf of subs) {
          if (sf.metadata && /\.(mp4|webm|mov)$/i.test(sf.name)) {
            videos.push({ path: `${folder.name}/${file.name}/${sf.name}`, size: sf.metadata.size });
          }
        }
      }
    }

    scanned++;
    if (scanned % 200 === 0) {
      process.stdout.write(`  Scanned ${scanned}/${folders.length} folders, found ${videos.length} videos...\r`);
    }
  }

  console.log(`\nTotal videos found: ${videos.length}`);
  return videos;
}

async function compressVideo(videoInfo, log, index, total) {
  const { path, size } = videoInfo;
  const prefix = `[${index + 1}/${total}]`;

  // Skip if already compressed
  if (log.compressed[path]) {
    console.log(`${prefix} SKIP (already done): ${path}`);
    log.stats.skipped++;
    return;
  }

  // Skip if small enough
  if (size < MIN_SIZE_BYTES) {
    console.log(`${prefix} SKIP (${formatMB(size)}MB < ${formatMB(MIN_SIZE_BYTES)}MB): ${path}`);
    log.compressed[path] = { skipped: true, reason: 'small', originalSize: size };
    log.stats.skipped++;
    saveLog(log);
    return;
  }

  const inputFile = join(TEMP_DIR, 'input.mp4');
  const outputFile = join(TEMP_DIR, 'output.mp4');

  try {
    // Download
    console.log(`${prefix} Downloading ${path} (${formatMB(size)}MB)...`);
    const { data, error } = await supabase.storage.from(BUCKET).download(path);
    if (error) throw new Error(`Download failed: ${error.message}`);

    const buffer = Buffer.from(await data.arrayBuffer());
    writeFileSync(inputFile, buffer);

    // Compress
    console.log(`${prefix} Compressing...`);
    execSync(`ffmpeg -i "${inputFile}" ${FFMPEG_ARGS} "${outputFile}" 2>/dev/null`);

    const newSize = statSync(outputFile).size;
    const saved = size - newSize;
    const reduction = ((saved / size) * 100).toFixed(0);

    // Only upload if we actually saved space
    if (newSize >= size) {
      console.log(`${prefix} SKIP (no savings): ${formatMB(size)}MB -> ${formatMB(newSize)}MB`);
      log.compressed[path] = { skipped: true, reason: 'no-savings', originalSize: size, compressedSize: newSize };
      log.stats.skipped++;
    } else {
      // Upload compressed version
      console.log(`${prefix} Uploading ${formatMB(newSize)}MB (saved ${formatMB(saved)}MB, -${reduction}%)...`);
      const fileBuffer = readFileSync(outputFile);
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .update(path, fileBuffer, {
          contentType: 'video/mp4',
          cacheControl: '31536000', // 1 year cache
          upsert: true,
        });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      console.log(`${prefix} DONE: ${formatMB(size)}MB -> ${formatMB(newSize)}MB (-${reduction}%)`);
      log.compressed[path] = { originalSize: size, compressedSize: newSize, savedBytes: saved };
      log.stats.savedBytes += saved;
    }

    log.stats.processed++;
  } catch (err) {
    console.error(`${prefix} ERROR: ${path} - ${err.message}`);
    log.errors.push({ path, error: err.message, timestamp: new Date().toISOString() });
    log.stats.errors++;
  } finally {
    // Cleanup temp files
    try { unlinkSync(inputFile); } catch {}
    try { unlinkSync(outputFile); } catch {}
    saveLog(log);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--run');
  const skipArg = args.find(a => a.startsWith('--skip='));
  const limitArg = args.find(a => a.startsWith('--limit='));
  const skip = skipArg ? parseInt(skipArg.split('=')[1]) : 0;
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : Infinity;

  // Ensure temp dir
  if (!existsSync(TEMP_DIR)) mkdirSync(TEMP_DIR, { recursive: true });

  // Get all videos
  const videos = await getAllVideoPaths();

  // Sort by size descending (compress biggest first for max savings)
  videos.sort((a, b) => b.size - a.size);

  const toCompress = videos.filter(v => v.size >= MIN_SIZE_BYTES);
  const alreadySmall = videos.length - toCompress.length;
  const totalSize = videos.reduce((s, v) => s + v.size, 0);
  const compressSize = toCompress.reduce((s, v) => s + v.size, 0);

  console.log('\n=== COMPRESSION PLAN ===');
  console.log(`Total videos: ${videos.length} (${formatMB(totalSize)}MB)`);
  console.log(`Need compression (>${formatMB(MIN_SIZE_BYTES)}MB): ${toCompress.length} (${formatMB(compressSize)}MB)`);
  console.log(`Already small enough: ${alreadySmall}`);
  console.log(`Estimated after compression: ~${formatMB(toCompress.length * 1 * 1024 * 1024 + alreadySmall * 1 * 1024 * 1024)}MB`);
  console.log(`Estimated savings: ~${formatMB(compressSize - toCompress.length * 1 * 1024 * 1024)}MB`);

  if (dryRun) {
    console.log('\n--- DRY RUN ---');
    console.log('Top 20 largest videos:');
    toCompress.slice(0, 20).forEach((v, i) =>
      console.log(`  ${i + 1}. ${v.path} - ${formatMB(v.size)}MB`)
    );
    console.log(`\nRun with --run to start compression.`);
    console.log(`  node scripts/compress-videos.mjs --run`);
    console.log(`  node scripts/compress-videos.mjs --run --limit=10   # test with 10 first`);
    return;
  }

  // Load or create log
  const log = loadLog();

  // Apply skip/limit
  const batch = toCompress.slice(skip, skip + limit);
  console.log(`\nProcessing ${batch.length} videos (skip=${skip}, limit=${limit === Infinity ? 'all' : limit})...\n`);

  for (let i = 0; i < batch.length; i++) {
    await compressVideo(batch[i], log, skip + i, toCompress.length);
  }

  console.log('\n=== RESULTS ===');
  console.log(`Processed: ${log.stats.processed}`);
  console.log(`Skipped: ${log.stats.skipped}`);
  console.log(`Errors: ${log.stats.errors}`);
  console.log(`Total saved: ${formatMB(log.stats.savedBytes)}MB`);
  console.log(`Log file: ${LOG_FILE}`);
}

main().catch(console.error);
