'use server'

/**
 * Storage Server Actions
 *
 * Handles file uploads with plan-based storage limits
 */

import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/server-auth'
import { checkStorageLimit, updateStorageUsage } from '@/lib/plan-limits'

// =============================================================================
// TYPES
// =============================================================================

export type StorageBucket = 'exercises' | 'organizations' | 'avatars'

interface UploadResult {
  success: boolean
  message: string
  data?: {
    url: string
    path: string
  }
  errors?: Record<string, string[]>
}

// =============================================================================
// CHECK STORAGE LIMIT
// =============================================================================

export async function checkOrgStorageLimit(fileSize: number): Promise<{
  allowed: boolean
  usedGB: number
  limitGB: number
  message?: string
}> {
  const { authorized, user } = await requirePermission('manage_members')

  if (!authorized || !user) {
    return { allowed: false, usedGB: 0, limitGB: 0, message: 'No autorizado' }
  }

  const result = await checkStorageLimit(user.organizationId, fileSize)

  return {
    allowed: result.allowed,
    usedGB: Math.round(result.usedBytes / 1073741824 * 100) / 100,
    limitGB: Math.round(result.limitBytes / 1073741824),
    message: result.message,
  }
}

// =============================================================================
// GET STORAGE USAGE
// =============================================================================

export async function getStorageUsage(): Promise<{
  usedBytes: number
  limitBytes: number
  usedPercentage: number
  usedGB: string
  limitGB: string
}> {
  const { authorized, user } = await requirePermission('manage_members')

  if (!authorized || !user) {
    return {
      usedBytes: 0,
      limitBytes: 0,
      usedPercentage: 0,
      usedGB: '0',
      limitGB: '0',
    }
  }

  const result = await checkStorageLimit(user.organizationId)

  return {
    usedBytes: result.usedBytes,
    limitBytes: result.limitBytes,
    usedPercentage: result.current,
    usedGB: (result.usedBytes / 1073741824).toFixed(2),
    limitGB: (result.limitBytes / 1073741824).toFixed(0),
  }
}

// =============================================================================
// TRACK FILE UPLOAD
// Call this after a successful upload to track storage usage
// =============================================================================

export async function trackFileUpload(
  fileSize: number,
  fileType: 'image' | 'document' | 'other' = 'other'
): Promise<{ success: boolean }> {
  const { authorized, user } = await requirePermission('manage_members')

  if (!authorized || !user) {
    return { success: false }
  }

  const result = await updateStorageUsage(user.organizationId, fileSize, fileType)
  return { success: result.success }
}

// =============================================================================
// TRACK FILE DELETE
// Call this after deleting a file to update storage usage
// =============================================================================

export async function trackFileDelete(
  fileSize: number,
  fileType: 'image' | 'document' | 'other' = 'other'
): Promise<{ success: boolean }> {
  const { authorized, user } = await requirePermission('manage_members')

  if (!authorized || !user) {
    return { success: false }
  }

  // Negative bytes to decrease usage
  const result = await updateStorageUsage(user.organizationId, -fileSize, fileType)
  return { success: result.success }
}

// =============================================================================
// UPLOAD FILE WITH LIMIT CHECK (Server-side)
// Use this for critical uploads that need strict limit enforcement
// =============================================================================

export async function uploadFileWithLimitCheck(
  formData: FormData
): Promise<UploadResult> {
  const { authorized, user } = await requirePermission('manage_members')

  if (!authorized || !user) {
    return { success: false, message: 'No autorizado' }
  }

  const file = formData.get('file') as File | null
  const bucket = formData.get('bucket') as StorageBucket | null
  const folder = formData.get('folder') as string | null

  if (!file || !bucket) {
    return { success: false, message: 'Archivo y bucket son requeridos' }
  }

  // Check storage limit before upload
  const limitCheck = await checkStorageLimit(user.organizationId, file.size)
  if (!limitCheck.allowed) {
    return { success: false, message: limitCheck.message || 'Límite de almacenamiento alcanzado' }
  }

  const supabase = await createClient()

  // Generate file path
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const fileName = `${timestamp}-${random}.${extension}`

  const pathParts = [user.organizationId]
  if (folder) pathParts.push(folder)
  pathParts.push(fileName)
  const filePath = pathParts.join('/')

  // Convert File to ArrayBuffer for server-side upload
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType: file.type,
      cacheControl: '3600',
    })

  if (error) {
    console.error('Upload error:', error)
    return { success: false, message: `Error al subir archivo: ${error.message}` }
  }

  // Track storage usage
  const fileType = file.type.startsWith('image/') ? 'image' :
                   file.type.includes('pdf') || file.type.includes('document') ? 'document' : 'other'
  await updateStorageUsage(user.organizationId, file.size, fileType)

  // Get public URL
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)

  return {
    success: true,
    message: 'Archivo subido exitosamente',
    data: {
      url: urlData.publicUrl,
      path: data.path,
    },
  }
}
