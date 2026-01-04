'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { MemberNote, NoteType } from '@/types/member.types'
import {
  getCurrentUser,
  requireAnyPermission,
  requirePermission,
  type ActionResult,
  successResult,
  errorResult,
  forbiddenResult,
  unauthorizedResult,
} from '@/lib/auth/server-auth'

// Legacy type export for backward compatibility
export type ActionState = ActionResult

export interface NoteFormData {
  type: NoteType
  title: string
  content: string
}

// =============================================================================
// GET MEMBER NOTES
// =============================================================================

export async function getMemberNotes(
  memberId: string
): Promise<{ data: MemberNote[] | null; error: string | null }> {
  const { authorized, user, error } = await requireAnyPermission(['view_members', 'manage_members'])

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()

  const { data, error: dbError } = await supabase
    .from('member_notes')
    .select('*')
    .eq('member_id', memberId)
    .eq('organization_id', user.organizationId)
    .order('created_at', { ascending: false })

  if (dbError) {
    return { data: null, error: dbError.message }
  }

  return { data: data as MemberNote[], error: null }
}

// =============================================================================
// GET RECENT NOTES (for card display)
// =============================================================================

export async function getRecentNotes(
  memberId: string,
  limit: number = 3
): Promise<{ data: MemberNote[] | null; error: string | null }> {
  const { authorized, user, error } = await requireAnyPermission(['view_members', 'manage_members'])

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()

  const { data, error: dbError } = await supabase
    .from('member_notes')
    .select('*')
    .eq('member_id', memberId)
    .eq('organization_id', user.organizationId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (dbError) {
    return { data: null, error: dbError.message }
  }

  return { data: data as MemberNote[], error: null }
}

// =============================================================================
// CREATE NOTE
// =============================================================================

export async function createNote(
  memberId: string,
  formData: NoteFormData
): Promise<ActionState> {
  const { authorized, user, error } = await requirePermission('manage_members')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  // Validate required fields
  const errors: Record<string, string[]> = {}

  if (!formData.title || formData.title.trim().length === 0) {
    errors.title = ['El titulo es obligatorio']
  } else if (formData.title.length > 200) {
    errors.title = ['El titulo no puede exceder 200 caracteres']
  }

  if (!formData.content || formData.content.trim().length === 0) {
    errors.content = ['El contenido es obligatorio']
  } else if (formData.content.trim().length < 10) {
    errors.content = ['La nota es muy corta, agrega un poco mas de detalle']
  }

  if (!formData.type) {
    errors.type = ['El tipo de nota es obligatorio']
  }

  if (Object.keys(errors).length > 0) {
    return errorResult('Por favor corrige los errores del formulario', errors)
  }

  const supabase = await createClient()

  // Verify member belongs to organization
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id')
    .eq('id', memberId)
    .eq('organization_id', user!.organizationId)
    .single()

  if (memberError || !member) {
    return errorResult('Miembro no encontrado o acceso denegado')
  }

  // Prepare insert data
  const insertData = {
    member_id: memberId,
    organization_id: user!.organizationId,
    type: formData.type,
    title: formData.title.trim(),
    content: formData.content.trim(),
    created_by_id: user!.id,
    created_by_name: user!.profile.full_name || 'Usuario',
  }

  const { data, error: dbError } = await supabase
    .from('member_notes')
    .insert(insertData as never)
    .select()
    .single()

  if (dbError) {
    console.error('Error creating note:', dbError)
    return errorResult('Error al guardar la nota: ' + dbError.message)
  }

  revalidatePath(`/dashboard/members/${memberId}`)
  return successResult('Nota guardada correctamente', data as MemberNote)
}

// =============================================================================
// UPDATE NOTE
// =============================================================================

export async function updateNote(
  noteId: string,
  formData: Partial<NoteFormData>
): Promise<ActionState> {
  const { authorized, user, error } = await requirePermission('manage_members')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  const supabase = await createClient()

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  }

  if (formData.type !== undefined) updateData.type = formData.type
  if (formData.title !== undefined) updateData.title = formData.title.trim()
  if (formData.content !== undefined) updateData.content = formData.content.trim()

  const { data, error: dbError } = await supabase
    .from('member_notes')
    .update(updateData as never)
    .eq('id', noteId)
    .eq('organization_id', user!.organizationId)
    .select()
    .single()

  if (dbError) {
    return errorResult('Error al actualizar la nota: ' + dbError.message)
  }

  const note = data as MemberNote
  revalidatePath(`/dashboard/members/${note.member_id}`)
  return successResult('Nota actualizada correctamente', note)
}

// =============================================================================
// DELETE NOTE
// =============================================================================

export async function deleteNote(noteId: string): Promise<ActionState> {
  const { authorized, user, error } = await requirePermission('manage_members')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  const supabase = await createClient()

  // Get note to know member_id for revalidation
  const { data: noteData } = await supabase
    .from('member_notes')
    .select('member_id')
    .eq('id', noteId)
    .eq('organization_id', user!.organizationId)
    .single()

  const note = noteData as { member_id: string } | null

  const { error: dbError } = await supabase
    .from('member_notes')
    .delete()
    .eq('id', noteId)
    .eq('organization_id', user!.organizationId)

  if (dbError) {
    return errorResult('Error al eliminar la nota: ' + dbError.message)
  }

  if (note) {
    revalidatePath(`/dashboard/members/${note.member_id}`)
  }

  return successResult('Nota eliminada correctamente')
}
