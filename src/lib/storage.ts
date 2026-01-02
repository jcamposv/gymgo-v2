import { createClient } from '@/lib/supabase/client'

export type StorageBucket = 'exercises' | 'organizations' | 'avatars'

export interface UploadOptions {
  bucket: StorageBucket
  folder?: string
  fileName?: string
  upsert?: boolean
}

export interface UploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

/**
 * Genera un nombre de archivo unico basado en timestamp y random string
 */
function generateFileName(originalName: string): string {
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${timestamp}-${random}.${extension}`
}

/**
 * Obtiene la URL publica de un archivo en Storage
 */
export function getPublicUrl(bucket: StorageBucket, path: string): string {
  const supabase = createClient()
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Sube un archivo a Supabase Storage
 */
export async function uploadFile(
  file: File,
  organizationId: string,
  options: UploadOptions
): Promise<UploadResult> {
  const supabase = createClient()

  const { bucket, folder = '', fileName, upsert = false } = options

  // Construir path: {org_id}/{folder?}/{filename}
  const generatedFileName = fileName || generateFileName(file.name)
  const pathParts = [organizationId]
  if (folder) pathParts.push(folder)
  pathParts.push(generatedFileName)
  const filePath = pathParts.join('/')

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert,
    })

  if (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error.message,
    }
  }

  const url = getPublicUrl(bucket, data.path)

  return {
    success: true,
    url,
    path: data.path,
  }
}

/**
 * Sube un archivo global (para ejercicios globales)
 */
export async function uploadGlobalFile(
  file: File,
  options: Omit<UploadOptions, 'folder'> & { folder?: string }
): Promise<UploadResult> {
  const supabase = createClient()

  const { bucket, folder = '', fileName, upsert = false } = options

  // Path para archivos globales: global/{folder?}/{filename}
  const generatedFileName = fileName || generateFileName(file.name)
  const pathParts = ['global']
  if (folder) pathParts.push(folder)
  pathParts.push(generatedFileName)
  const filePath = pathParts.join('/')

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert,
    })

  if (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error.message,
    }
  }

  const url = getPublicUrl(bucket, data.path)

  return {
    success: true,
    url,
    path: data.path,
  }
}

/**
 * Elimina un archivo de Storage
 */
export async function deleteFile(
  bucket: StorageBucket,
  path: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])

  if (error) {
    console.error('Delete error:', error)
    return {
      success: false,
      error: error.message,
    }
  }

  return { success: true }
}

/**
 * Extrae el path de una URL de Supabase Storage
 */
export function extractPathFromUrl(url: string, bucket: StorageBucket): string | null {
  try {
    const urlObj = new URL(url)
    const pathMatch = urlObj.pathname.match(new RegExp(`/storage/v1/object/public/${bucket}/(.+)`))
    return pathMatch ? pathMatch[1] : null
  } catch {
    return null
  }
}

/**
 * Reemplaza un archivo existente con uno nuevo
 */
export async function replaceFile(
  file: File,
  organizationId: string,
  oldUrl: string | null,
  options: UploadOptions
): Promise<UploadResult> {
  // Subir nuevo archivo
  const uploadResult = await uploadFile(file, organizationId, options)

  if (!uploadResult.success) {
    return uploadResult
  }

  // Si habia un archivo anterior, eliminarlo
  if (oldUrl) {
    const oldPath = extractPathFromUrl(oldUrl, options.bucket)
    if (oldPath) {
      await deleteFile(options.bucket, oldPath)
    }
  }

  return uploadResult
}

/**
 * Valida el tipo y tamano del archivo antes de subir
 */
export function validateFile(
  file: File,
  options: {
    maxSizeMB?: number
    allowedTypes?: string[]
  } = {}
): { valid: boolean; error?: string } {
  const { maxSizeMB = 10, allowedTypes } = options

  // Validar tamano
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `El archivo excede el tamano maximo de ${maxSizeMB}MB`,
    }
  }

  // Validar tipo
  if (allowedTypes && allowedTypes.length > 0) {
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Tipo de archivo no permitido. Tipos aceptados: ${allowedTypes.join(', ')}`,
      }
    }
  }

  return { valid: true }
}

// Tipos de archivo permitidos por bucket
export const ALLOWED_FILE_TYPES = {
  exercises: {
    images: ['image/gif', 'image/jpeg', 'image/png', 'image/webp'],
    videos: ['video/mp4', 'video/webm'],
    all: ['image/gif', 'image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'],
  },
  organizations: ['image/gif', 'image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  avatars: ['image/jpeg', 'image/png', 'image/webp'],
}

export const MAX_FILE_SIZES = {
  exercises: 50, // MB
  organizations: 5, // MB
  avatars: 2, // MB
}
