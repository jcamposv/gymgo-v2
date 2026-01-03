'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { MemberNote, NoteType } from '@/types/member.types'

// =============================================================================
// TYPES
// =============================================================================

export type ActionState = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
  data?: unknown
}

interface UserProfile {
  organization_id: string
  role: string
  userId: string
  full_name: string
}

export interface NoteFormData {
  type: NoteType
  title: string
  content: string
}

// =============================================================================
// HELPER: Get User Profile
// =============================================================================

async function getUserProfile(): Promise<{ profile: UserProfile | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { profile: null, error: 'No autenticado' }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('organization_id, role, full_name')
    .eq('id', user.id)
    .single()

  if (error || !data) {
    return { profile: null, error: 'No se encontró la organización' }
  }

  const profileData = data as { organization_id: string | null; role: string; full_name: string | null }
  if (!profileData.organization_id) {
    return { profile: null, error: 'No se encontró la organización' }
  }

  return {
    profile: {
      organization_id: profileData.organization_id,
      role: profileData.role,
      userId: user.id,
      full_name: profileData.full_name || 'Usuario'
    },
    error: null
  }
}

// =============================================================================
// GET MEMBER NOTES
// =============================================================================

export async function getMemberNotes(
  memberId: string
): Promise<{ data: MemberNote[] | null; error: string | null }> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { data: null, error: profileError ?? 'No se encontró el perfil' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('member_notes')
    .select('*')
    .eq('member_id', memberId)
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  if (error) {
    return { data: null, error: error.message }
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
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { data: null, error: profileError ?? 'No se encontró el perfil' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('member_notes')
    .select('*')
    .eq('member_id', memberId)
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return { data: null, error: error.message }
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
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No se encontró el perfil' }
  }

  // Validate required fields
  const errors: Record<string, string[]> = {}

  if (!formData.title || formData.title.trim().length === 0) {
    errors.title = ['El título es obligatorio']
  } else if (formData.title.length > 200) {
    errors.title = ['El título no puede exceder 200 caracteres']
  }

  if (!formData.content || formData.content.trim().length === 0) {
    errors.content = ['El contenido es obligatorio']
  } else if (formData.content.trim().length < 10) {
    errors.content = ['La nota es muy corta, agrega un poco más de detalle']
  }

  if (!formData.type) {
    errors.type = ['El tipo de nota es obligatorio']
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      message: 'Por favor corrige los errores del formulario',
      errors
    }
  }

  const supabase = await createClient()

  // Verify member belongs to organization
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id')
    .eq('id', memberId)
    .eq('organization_id', profile.organization_id)
    .single()

  if (memberError || !member) {
    return {
      success: false,
      message: 'Miembro no encontrado o acceso denegado'
    }
  }

  // Prepare insert data
  const insertData = {
    member_id: memberId,
    organization_id: profile.organization_id,
    type: formData.type,
    title: formData.title.trim(),
    content: formData.content.trim(),
    created_by_id: profile.userId,
    created_by_name: profile.full_name,
  }

  const { data, error } = await supabase
    .from('member_notes')
    .insert(insertData as never)
    .select()
    .single()

  if (error) {
    console.error('Error creating note:', error)
    return {
      success: false,
      message: 'Error al guardar la nota: ' + error.message
    }
  }

  revalidatePath(`/dashboard/members/${memberId}`)

  return {
    success: true,
    message: 'Nota guardada correctamente',
    data: data as MemberNote
  }
}

// =============================================================================
// UPDATE NOTE
// =============================================================================

export async function updateNote(
  noteId: string,
  formData: Partial<NoteFormData>
): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No se encontró el perfil' }
  }

  const supabase = await createClient()

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  }

  if (formData.type !== undefined) updateData.type = formData.type
  if (formData.title !== undefined) updateData.title = formData.title.trim()
  if (formData.content !== undefined) updateData.content = formData.content.trim()

  const { data, error } = await supabase
    .from('member_notes')
    .update(updateData as never)
    .eq('id', noteId)
    .eq('organization_id', profile.organization_id)
    .select()
    .single()

  if (error) {
    return {
      success: false,
      message: 'Error al actualizar la nota: ' + error.message
    }
  }

  const note = data as MemberNote
  revalidatePath(`/dashboard/members/${note.member_id}`)

  return {
    success: true,
    message: 'Nota actualizada correctamente',
    data: note
  }
}

// =============================================================================
// DELETE NOTE
// =============================================================================

export async function deleteNote(noteId: string): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No se encontró el perfil' }
  }

  const supabase = await createClient()

  // Get note to know member_id for revalidation
  const { data: noteData } = await supabase
    .from('member_notes')
    .select('member_id')
    .eq('id', noteId)
    .eq('organization_id', profile.organization_id)
    .single()

  const note = noteData as { member_id: string } | null

  const { error } = await supabase
    .from('member_notes')
    .delete()
    .eq('id', noteId)
    .eq('organization_id', profile.organization_id)

  if (error) {
    return {
      success: false,
      message: 'Error al eliminar la nota: ' + error.message
    }
  }

  if (note) {
    revalidatePath(`/dashboard/members/${note.member_id}`)
  }

  return {
    success: true,
    message: 'Nota eliminada correctamente'
  }
}
