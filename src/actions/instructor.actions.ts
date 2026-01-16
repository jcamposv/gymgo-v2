'use server'

import { createClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/auth/server-auth'
import type { Database } from '@/types/database.types'

// =============================================================================
// TYPES
// =============================================================================

type UserRole = Database['public']['Enums']['user_role']

export interface Instructor {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
}

// Roles that can be instructors
const INSTRUCTOR_ROLES: UserRole[] = ['admin', 'instructor', 'owner', 'super_admin']

// =============================================================================
// GET INSTRUCTORS
// =============================================================================

/**
 * Get all eligible instructors for the organization.
 * Includes users with roles: admin, assistant, trainer, owner, super_admin
 * Also fetches name from members table if not in profiles
 */
export async function getInstructors(): Promise<{
  data: Instructor[] | null
  error: string | null
}> {
  const { authorized, user, error } = await requireStaff()

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()

  // Get profiles with instructor roles
  const { data: profiles, error: dbError } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, role')
    .eq('organization_id', user.organizationId)
    .in('role', INSTRUCTOR_ROLES)
    .order('full_name', { ascending: true, nullsFirst: false })

  if (dbError) {
    return { data: null, error: dbError.message }
  }

  // Get members to fill in missing names
  const { data: members } = await supabase
    .from('members')
    .select('email, full_name, avatar_url')
    .eq('organization_id', user.organizationId)

  // Create a map of email -> member for quick lookup
  const membersByEmail = new Map(
    ((members || []) as Array<{ email: string; full_name: string | null; avatar_url: string | null }>)
      .filter(m => m.email)
      .map(m => [m.email.toLowerCase(), m])
  )

  // Merge data: prioritize member name/avatar over profile
  type ProfileData = { id: string; email: string; full_name: string | null; avatar_url: string | null; role: UserRole }
  const instructors = ((profiles || []) as ProfileData[]).map(profile => {
    const member = membersByEmail.get(profile.email.toLowerCase())
    return {
      ...profile,
      full_name: member?.full_name || profile.full_name?.trim() || null,
      avatar_url: member?.avatar_url || profile.avatar_url || null,
    }
  }) as Instructor[]

  return { data: instructors, error: null }
}

/**
 * Get a single instructor by ID
 * Also fetches name from members table if not in profiles
 */
export async function getInstructor(instructorId: string): Promise<{
  data: Instructor | null
  error: string | null
}> {
  const { authorized, user, error } = await requireStaff()

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()

  type ProfileData = { id: string; email: string; full_name: string | null; avatar_url: string | null; role: UserRole }
  const { data: profileData, error: dbError } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, role')
    .eq('id', instructorId)
    .eq('organization_id', user.organizationId)
    .single()

  if (dbError || !profileData) {
    return { data: null, error: dbError?.message || 'Instructor no encontrado' }
  }

  const profile = profileData as ProfileData

  // Try to get name from members (prioritize over profile)
  type MemberData = { full_name: string | null; avatar_url: string | null }
  const { data: memberData } = await supabase
    .from('members')
    .select('full_name, avatar_url')
    .eq('email', profile.email)
    .eq('organization_id', user.organizationId)
    .single()

  const member = memberData as MemberData | null

  return {
    data: {
      ...profile,
      full_name: member?.full_name || profile.full_name?.trim() || null,
      avatar_url: member?.avatar_url || profile.avatar_url || null,
    } as Instructor,
    error: null,
  }
}
